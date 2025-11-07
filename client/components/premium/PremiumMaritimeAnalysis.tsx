import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import PremiumSolutionCard from './PremiumSolutionCard';
import { 
  Anchor,
  Activity,
  Compass,
  Waves,
  Wind,
  Gauge,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown
} from 'lucide-react';

interface MaritimeResponse {
  query_id: string;
  session_id: string;
  conversation_id: string;
  yacht_id: string;
  user_id: string;
  message: string;
  confidence_score: number;
  solutions: any[];
  documents_used: string[];
  sources?: string[];
  awaiting_feedback: boolean;
}

interface PremiumMaritimeAnalysisProps {
  maritimeData: MaritimeResponse;
  onFeedback?: (solutionId: string, worked: boolean) => void;
}

const PremiumMaritimeAnalysis: React.FC<PremiumMaritimeAnalysisProps> = ({
  maritimeData,
  onFeedback
}) => {
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  // System status based on confidence
  const getSystemStatus = () => {
    if (maritimeData.confidence_score >= 0.8) {
      return { 
        icon: CheckCircle, 
        label: 'All Systems Operational', 
        color: 'from-emerald-500 to-green-600',
        bgColor: 'from-emerald-500/10 to-green-600/10'
      };
    } else if (maritimeData.confidence_score >= 0.6) {
      return { 
        icon: Activity, 
        label: 'Systems Check Required', 
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'from-blue-500/10 to-indigo-600/10'
      };
    } else {
      return { 
        icon: AlertTriangle, 
        label: 'Critical Analysis Needed', 
        color: 'from-amber-500 to-orange-600',
        bgColor: 'from-amber-500/10 to-orange-600/10'
      };
    }
  };

  const status = getSystemStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6"
    >
      {/* Premium Header Card */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="premium-card p-8 relative overflow-hidden"
      >
        {/* Animated background waves */}
        <div className="absolute inset-0 opacity-5">
          <Waves className="absolute top-10 right-10 h-32 w-32 text-blue-500 animate-pulse" />
          <Wind className="absolute bottom-10 left-10 h-24 w-24 text-indigo-500 animate-pulse" />
          <Compass className="absolute top-20 left-1/2 h-20 w-20 text-purple-500 animate-spin-slow" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
                  <div className="h-full w-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center">
                    <Anchor className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse opacity-20" />
              </motion.div>

              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Celeste AI Maritime Analysis
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mt-1">
                  Yacht Engineering Intelligence System
                </p>
              </div>
            </div>

            {/* System Status */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className={cn(
                "px-6 py-3 rounded-2xl font-bold text-white shadow-xl bg-gradient-to-r flex items-center gap-3",
                status.color
              )}
            >
              <StatusIcon className="h-5 w-5" />
              <span>{status.label}</span>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Navigation, label: 'Query ID', value: maritimeData.query_id.slice(0, 8) + '...' },
              { icon: Gauge, label: 'Confidence', value: `${Math.round(maritimeData.confidence_score * 100)}%` },
              { icon: Activity, label: 'Solutions', value: maritimeData.solutions.length },
              { icon: Info, label: 'Documents', value: maritimeData.documents_used.length }
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Solutions Section */}
      <div className="space-y-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommended Solutions
          </h3>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
            {maritimeData.solutions.length} Available
          </span>
        </motion.div>

        {/* Solution Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {maritimeData.solutions.slice(0, showAllSolutions ? undefined : 3).map((solution, idx) => (
            <PremiumSolutionCard
              key={solution.solution_id}
              solution={solution}
              index={idx}
              onFeedback={onFeedback}
            />
          ))}
        </div>

        {/* Show More Button */}
        {maritimeData.solutions.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-4"
          >
            <button
              onClick={() => setShowAllSolutions(!showAllSolutions)}
              className="premium-button px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:shadow-lg"
            >
              {showAllSolutions ? 'Show Less' : `Show ${maritimeData.solutions.length - 3} More Solutions`}
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform",
                showAllSolutions && "rotate-180"
              )} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Documents Section */}
      {maritimeData.documents_used.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="premium-card p-6"
        >
          <button
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Info className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Reference Documents
              </h3>
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                {maritimeData.documents_used.length} Used
              </span>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-gray-400 transition-transform",
              showDocuments && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {showDocuments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 space-y-2 overflow-hidden"
              >
                {maritimeData.documents_used.map((doc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {idx + 1}.
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
                      {doc}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Feedback Request */}
      {maritimeData.awaiting_feedback && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="premium-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                Feedback Requested
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Your feedback on these solutions helps improve future recommendations for yacht system diagnostics.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PremiumMaritimeAnalysis;