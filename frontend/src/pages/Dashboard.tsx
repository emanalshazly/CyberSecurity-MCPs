import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Users, 
  Database,
  Zap,
  Brain,
  Eye,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';

// Components
import { SecurityMetrics } from '../components/dashboard/SecurityMetrics';
import { ThreatMap } from '../components/dashboard/ThreatMap';
import { RecentScans } from '../components/dashboard/RecentScans';
import { AIInsights } from '../components/dashboard/AIInsights';
import { QuickActions } from '../components/dashboard/QuickActions';
import { SystemStatus } from '../components/dashboard/SystemStatus';

// API
import { dashboardApi } from '../api/dashboard';

// Types
import { DashboardData, SecurityAlert, ScanResult } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [isRealTimeMode, setIsRealTimeMode] = useState(true);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['dashboard', selectedTimeRange],
    () => dashboardApi.getDashboardData(selectedTimeRange),
    {
      refetchInterval: isRealTimeMode ? 30000 : false, // 30 seconds in real-time mode
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load dashboard data');
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const data = dashboardData || {
    securityMetrics: {
      totalThreats: 0,
      criticalVulnerabilities: 0,
      securityScore: 95,
      riskLevel: 'low'
    },
    recentAlerts: [],
    recentScans: [],
    aiInsights: [],
    systemStatus: {
      mcpServers: 'healthy',
      aiServices: 'active',
      database: 'connected',
      redis: 'connected'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Security Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                AI-Powered Cybersecurity Intelligence & Monitoring
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Real-time</span>
                <button
                  onClick={() => setIsRealTimeMode(!isRealTimeMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRealTimeMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRealTimeMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Zap className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <SecurityMetrics data={data.securityMetrics} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AIInsights insights={data.aiInsights} />
            </motion.div>

            {/* Threat Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ThreatMap />
            </motion.div>

            {/* Recent Scans */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <RecentScans scans={data.recentScans} />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <QuickActions />
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SystemStatus status={data.systemStatus} />
            </motion.div>

            {/* Recent Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Recent Alerts
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data.recentAlerts.length} alerts
                </span>
              </div>

              <div className="space-y-3">
                {data.recentAlerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border-l-4 ${
                      alert.severity === 'critical'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : alert.severity === 'high'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {alert.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {data.recentAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No active alerts</p>
                  <p className="text-sm">Your system is secure</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Section - Advanced Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                Advanced Security Analytics
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Updated {isRealTimeMode ? 'in real-time' : 'every 5 minutes'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* AI Processing Status */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">AI Processing</p>
                <p className="text-2xl font-bold text-blue-600">Active</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {data.aiInsights.length} insights generated
                </p>
              </div>

              {/* Threat Detection */}
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
                <Target className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Threat Detection</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.securityMetrics.totalThreats}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Threats detected
                </p>
              </div>

              {/* MCP Servers */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">MCP Servers</p>
                <p className="text-2xl font-bold text-green-600">3/3</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  All operational
                </p>
              </div>

              {/* Security Score */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Security Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.securityMetrics.securityScore}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Excellent
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;