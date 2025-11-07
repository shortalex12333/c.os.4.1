/**
 * Test Page for Chat Database Debugging
 * Visit /test-chats to see detailed chat loading diagnostics
 */

import React, { useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { supabase } from '../config/supabaseConfig';

export default function TestChatsPage() {
  const [status, setStatus] = useState<any>({
    loading: true,
    authUser: null,
    chatSessions: [],
    rawChatSessions: [],
    error: null,
    logs: []
  });

  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    setStatus((prev: any) => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, data }]
    }));
    console.log(`[${timestamp}]`, message, data);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      addLog('🔍 Starting chat diagnostics...');

      // Step 1: Check auth
      addLog('1️⃣ Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        addLog('❌ Auth error', authError);
        setStatus((prev: any) => ({ ...prev, error: authError, loading: false }));
        return;
      }

      if (!user) {
        addLog('⚠️ No authenticated user');
        setStatus((prev: any) => ({ ...prev, error: 'Not authenticated', loading: false }));
        return;
      }

      addLog('✅ User authenticated', { id: user.id, email: user.email });
      setStatus((prev: any) => ({ ...prev, authUser: user }));

      // Step 2: Query chat_sessions directly
      addLog('2️⃣ Querying chat_sessions table directly...');
      const { data: rawSessions, error: rawError } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawError) {
        addLog('❌ Error querying chat_sessions', rawError);
      } else {
        addLog(`✅ Found ${rawSessions?.length || 0} total sessions in chat_sessions`, rawSessions);
        setStatus((prev: any) => ({ ...prev, rawChatSessions: rawSessions }));
      }

      // Step 3: Query chat_session_summaries view
      addLog('3️⃣ Querying chat_session_summaries view...');
      const { data: viewSessions, error: viewError } = await supabase
        .from('chat_session_summaries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (viewError) {
        addLog('❌ Error querying view', viewError);
      } else {
        addLog(`✅ Found ${viewSessions?.length || 0} sessions in view`, viewSessions);
      }

      // Step 4: Use chatService
      addLog('4️⃣ Using chatService.getChatSessions()...');
      const sessions = await chatService.getChatSessions();
      addLog(`✅ chatService returned ${sessions.length} sessions`, sessions);
      setStatus((prev: any) => ({ ...prev, chatSessions: sessions }));

      // Step 5: Create a test chat
      addLog('5️⃣ Creating test chat session...');
      const newSession = await chatService.createChatSession('Test Chat - Debug', 'yacht');
      if (newSession) {
        addLog('✅ Test chat created', newSession);
        // Reload
        const updatedSessions = await chatService.getChatSessions();
        addLog(`✅ After creation: ${updatedSessions.length} sessions`, updatedSessions);
        setStatus((prev: any) => ({ ...prev, chatSessions: updatedSessions }));
      } else {
        addLog('❌ Failed to create test chat');
      }

      setStatus((prev: any) => ({ ...prev, loading: false }));
    } catch (error) {
      addLog('❌ Diagnostic error', error);
      setStatus((prev: any) => ({ ...prev, error, loading: false }));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🧪 Chat Database Diagnostics</h1>

      {status.loading && <p>Running diagnostics...</p>}

      {status.authUser && (
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>✅ Authenticated User</h2>
          <pre>{JSON.stringify(status.authUser, null, 2)}</pre>
        </div>
      )}

      {status.error && (
        <div style={{ background: '#ffebee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>❌ Error</h2>
          <pre>{JSON.stringify(status.error, null, 2)}</pre>
        </div>
      )}

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📊 Chat Sessions (from chatService)</h2>
        <p>Count: {status.chatSessions.length}</p>
        <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(status.chatSessions, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📊 Raw Chat Sessions (from database)</h2>
        <p>Count: {status.rawChatSessions.length}</p>
        <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(status.rawChatSessions, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>📝 Diagnostic Logs</h2>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {status.logs.map((log: any, idx: number) => (
            <div key={idx} style={{ marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>{log.timestamp}</div>
              <div style={{ fontWeight: 'bold' }}>{log.message}</div>
              {log.data && (
                <pre style={{ fontSize: '11px', background: '#fff', padding: '5px', borderRadius: '4px' }}>
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={runDiagnostics}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          background: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔄 Re-run Diagnostics
      </button>
    </div>
  );
}
