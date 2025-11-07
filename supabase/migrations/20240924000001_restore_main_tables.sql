-- Create the schedule_calls table for storing call scheduling requests
CREATE TABLE IF NOT EXISTS schedule_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) DEFAULT '',
    email VARCHAR(255) NOT NULL,
    yacht_length INTEGER,
    time VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    chat_queries_count INTEGER DEFAULT 0,
    faq_queries_count INTEGER DEFAULT 0,
    topics JSONB DEFAULT '[]'::jsonb,
    
    -- Additional useful fields for analytics
    phone VARCHAR(50),
    yacht_size VARCHAR(100),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timezone VARCHAR(100),
    session_id TEXT,
    source VARCHAR(100) DEFAULT 'schedule-call-modal',
    
    -- Indexes for common queries
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedule_calls_email ON schedule_calls(email);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_created_at ON schedule_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_date ON schedule_calls(date);
CREATE INDEX IF NOT EXISTS idx_schedule_calls_user_id ON schedule_calls(user_id);

-- Create a GIN index for JSONB topics column for efficient searching
CREATE INDEX IF NOT EXISTS idx_schedule_calls_topics_gin ON schedule_calls USING GIN (topics);

-- Enable Row Level Security
ALTER TABLE schedule_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow service accounts and admins to read/write all data
CREATE POLICY "Service accounts can manage schedule_calls" ON schedule_calls
    FOR ALL USING (
        current_setting('role') = 'service_role' OR
        current_setting('role') = 'postgres'
    );

-- Allow authenticated users to read only their own records
CREATE POLICY "Users can view own schedule_calls" ON schedule_calls
    FOR SELECT USING (
        auth.uid() = user_id OR
        current_setting('role') = 'service_role'
    );

-- Grant necessary permissions
GRANT ALL ON schedule_calls TO service_role;
GRANT SELECT ON schedule_calls TO authenticated;

-- Create a CORRECTED view for analytics
CREATE OR REPLACE VIEW schedule_calls_analytics AS
WITH monthly_aggregates AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_requests,
        AVG(chat_queries_count) as avg_chat_queries,
        AVG(faq_queries_count) as avg_faq_queries,
        COUNT(DISTINCT email) as unique_users,
        ARRAY_AGG(DISTINCT yacht_size) FILTER (WHERE yacht_size IS NOT NULL) as yacht_sizes
    FROM schedule_calls
    GROUP BY DATE_TRUNC('month', created_at)
),
monthly_topics AS (
    SELECT 
        DATE_TRUNC('month', sc.created_at) as month,
        ARRAY_AGG(DISTINCT topic->>'question' ORDER BY topic->>'question') as top_topics
    FROM schedule_calls sc
    CROSS JOIN LATERAL jsonb_array_elements(sc.topics) AS topic
    GROUP BY DATE_TRUNC('month', sc.created_at)
)
SELECT 
    ma.month,
    ma.total_requests,
    ma.avg_chat_queries,
    ma.avg_faq_queries,
    ma.unique_users,
    ma.yacht_sizes,
    COALESCE(mt.top_topics[1:10], ARRAY[]::text[]) as top_topics
FROM monthly_aggregates ma
LEFT JOIN monthly_topics mt ON ma.month = mt.month
ORDER BY ma.month DESC;

-- Grant access to the analytics view
GRANT SELECT ON schedule_calls_analytics TO authenticated;
GRANT ALL ON schedule_calls_analytics TO service_role;

-- Create a function to extract engagement insights
CREATE OR REPLACE FUNCTION get_user_engagement_insights(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_requests', COUNT(*),
        'avg_chat_queries', AVG(chat_queries_count),
        'avg_faq_queries', AVG(faq_queries_count),
        'total_topics', SUM(jsonb_array_length(topics)),
        'unique_topics', (
            SELECT COUNT(DISTINCT topic->>'question')
            FROM schedule_calls sc
            CROSS JOIN jsonb_array_elements(sc.topics) AS topic
            WHERE sc.email = user_email
        ),
        'preferred_times', ARRAY_AGG(DISTINCT time),
        'yacht_sizes', ARRAY_AGG(DISTINCT yacht_size) FILTER (WHERE yacht_size IS NOT NULL),
        'last_request', MAX(created_at)
    ) INTO result
    FROM schedule_calls 
    WHERE email = user_email;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_engagement_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_engagement_insights TO service_role;

-- Additional helpful views and functions

-- View to see recent schedule requests
CREATE OR REPLACE VIEW recent_schedule_requests AS
SELECT 
    id,
    created_at,
    firstName || ' ' || lastName as full_name,
    email,
    phone,
    yacht_size,
    date,
    time,
    timezone,
    chat_queries_count,
    faq_queries_count,
    jsonb_array_length(topics) as topics_count
FROM schedule_calls
ORDER BY created_at DESC
LIMIT 100;

GRANT SELECT ON recent_schedule_requests TO authenticated;
GRANT ALL ON recent_schedule_requests TO service_role;

-- View for today's schedules
CREATE OR REPLACE VIEW todays_schedules AS
SELECT 
    id,
    firstName || ' ' || lastName as full_name,
    email,
    phone,
    time,
    yacht_size,
    chat_queries_count + faq_queries_count as total_interactions
FROM schedule_calls
WHERE date = CURRENT_DATE
ORDER BY time;

GRANT SELECT ON todays_schedules TO authenticated;
GRANT ALL ON todays_schedules TO service_role;

-- Function to get top discussed topics
CREATE OR REPLACE FUNCTION get_top_topics(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(topic TEXT, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        topic->>'question' as topic,
        COUNT(*) as frequency
    FROM schedule_calls
    CROSS JOIN jsonb_array_elements(topics) AS topic
    WHERE topic->>'question' IS NOT NULL
    GROUP BY topic->>'question'
    ORDER BY COUNT(*) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_top_topics TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_topics TO service_role;

-- Function to get engagement metrics for a date range
CREATE OR REPLACE FUNCTION get_engagement_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start', start_date,
            'end', end_date
        ),
        'total_requests', COUNT(*),
        'unique_users', COUNT(DISTINCT email),
        'avg_chat_queries', ROUND(AVG(chat_queries_count)::numeric, 2),
        'avg_faq_queries', ROUND(AVG(faq_queries_count)::numeric, 2),
        'total_interactions', SUM(chat_queries_count + faq_queries_count),
        'most_common_time', (
            SELECT time 
            FROM schedule_calls 
            WHERE date BETWEEN start_date AND end_date
            GROUP BY time 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ),
        'yacht_size_distribution', (
            SELECT jsonb_object_agg(yacht_size, count)
            FROM (
                SELECT yacht_size, COUNT(*) as count
                FROM schedule_calls
                WHERE date BETWEEN start_date AND end_date
                AND yacht_size IS NOT NULL
                GROUP BY yacht_size
            ) yacht_stats
        ),
        'daily_average', ROUND(
            COUNT(*)::numeric / NULLIF((end_date - start_date + 1), 0), 
            2
        )
    ) INTO result
    FROM schedule_calls
    WHERE date BETWEEN start_date AND end_date;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_engagement_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_engagement_metrics TO service_role;

-- Sample test queries (commented out for safety)
/*
-- Test insert
INSERT INTO schedule_calls (
    firstName, lastName, email, yacht_length, time, date, 
    chat_queries_count, faq_queries_count, topics,
    phone, yacht_size, timezone, source
) VALUES (
    'John', 'Doe', 'john.doe@example.com', 85, '2:30 PM', '2024-02-15',
    5, 3, '[{"question": "How does CelesteOS work?", "timestamp": "2024-01-15T10:30:00Z"}]'::jsonb,
    '+1-555-123-4567', '80-120 ft', 'America/New_York', 'schedule-call-modal'
);

-- Test select
SELECT * FROM schedule_calls WHERE email = 'john.doe@example.com';

-- Test analytics view
SELECT * FROM schedule_calls_analytics;

-- Test recent requests view
SELECT * FROM recent_schedule_requests;

-- Test today's schedules
SELECT * FROM todays_schedules;

-- Test engagement insights function
SELECT get_user_engagement_insights('john.doe@example.com');

-- Test top topics function
SELECT * FROM get_top_topics(10);

-- Test engagement metrics function
SELECT get_engagement_metrics('2024-01-01'::date, '2024-01-31'::date);
*/