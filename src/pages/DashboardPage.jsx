import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { motion } from 'framer-motion';
import AnimatedComponent from '../components/AnimatedComponent';
import AIReportModal from '../components/AIReportModal';
import AIReportConfirmModal from '../components/AIReportConfirmModal';
import { generateAIReport } from '../utils/ReportAIAnalyse';
import AttendanceRateOverTime from '../charts/AttendanceRateOverTime';
import AverageLatenessOverTime from '../charts/AverageLatenessOverTime';
import EmployeeSatisfactionByDepartement from '../charts/EmployeeSatisfactionByDepartement';
import LeaveRequestsByStatus from '../charts/LeaveRequestsByStatus';
import WeeklyWorkHoursVsSalary from '../charts/WeeklyWorkHoursVsSalary';
import LeavesTakenByType from '../charts/LeavesTakenByType';
import NewHiresOverTime from '../charts/NewHiresOverTime';
import LeaveBalanceDistribution from '../charts/LeaveBalanceDistribution';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import supabase from '../database/supabase-client';

const MAX_DAILY_REPORTS = 10;
const REPORTS_STORAGE_KEY = 'ai_reports_usage';

const DashboardPage = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportsLeft, setReportsLeft] = useState(MAX_DAILY_REPORTS);
  const [isCachedData, setIsCachedData] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [period, setPeriod] = useState('week');
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Load and check reports usage
    const checkReportsUsage = () => {
      const today = new Date().toDateString();
      const usage = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '{}');

      if (usage.date !== today) {
        // Reset for new day
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify({
          date: today,
          count: 0
        }));
        setReportsLeft(MAX_DAILY_REPORTS);
      } else {
        setReportsLeft(MAX_DAILY_REPORTS - usage.count);
      }
    };

    checkReportsUsage();
  }, []);

  const updateReportsUsage = () => {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem(REPORTS_STORAGE_KEY) || '{}');

    const newCount = (usage.count || 0) + 1;
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify({
      date: today,
      count: newCount
    }));

    setReportsLeft(MAX_DAILY_REPORTS - newCount);
  };

  const handleGenerateReport = async () => {
    setIsConfirmModalOpen(false);
    setIsReportModalOpen(true);
    setReportData(null);
    setIsCachedData(false);

    try {
      const startTime = Date.now();
      const report = await generateAIReport();
      const endTime = Date.now();

      // If response time is very quick, it's likely cached data
      setIsCachedData(endTime - startTime < 500);
      setReportData(report);

      // Only update usage if it's not cached data
      if (!isCachedData) {
        updateReportsUsage();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // You might want to show an error message to the user here
    }
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoadingStats(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('id, employee_id, status, checkdate, lateness');
      if (!error) setAttendance(data || []);
      setLoadingStats(false);
    };
    fetchAttendance();
  }, []);

  // Date range calculation
  const now = new Date();
  let range = { start: null, end: null };
  if (period === 'week') {
    range = { start: startOfWeek(now), end: endOfWeek(now) };
  } else if (period === 'month') {
    range = { start: startOfMonth(now), end: endOfMonth(now) };
  } else if (period === 'year') {
    range = { start: startOfYear(now), end: endOfYear(now) };
  }

  // Filtered attendance for the selected period
  const filteredAttendance = attendance.filter(record => {
    const date = typeof record.checkdate === 'string' ? parseISO(record.checkdate) : new Date(record.checkdate);
    return isWithinInterval(date, { start: range.start, end: range.end });
  });

  // Calculate stats
  const totalPresent = filteredAttendance.filter(record => record.status === 'present').length;
  const totalAbsent = filteredAttendance.filter(record => record.status === 'absent').length;
  const totalLate = filteredAttendance.filter(record => record.lateness).length;
  const averageLateness = filteredAttendance
    .filter(record => record.lateness)
    .reduce((acc, record) => {
      const [minutes] = String(record.lateness).split(':').map(Number);
      return acc + (minutes || 0);
    }, 0) / (totalLate || 1);

  // Time period selector
  const TimeSelector = () => (
    <div className="flex items-center mb-6 space-x-2">
      {['week', 'month', 'year'].map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 
            ${period === p
              ? 'bg-blue-500 text-white shadow-md' 
              : 'bg-white/80 dark:bg-neutral-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8"
    >
      <TimeSelector />
      
      {/* AI Report Card */}
      <AnimatedComponent delay={0.4}>
        <div
          onClick={() => setIsConfirmModalOpen(true)}
          className="bg-gradient-to-br from-purple-500/90 to-indigo-600/90 backdrop-blur-md rounded-2xl shadow-xl p-6 cursor-pointer transform transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl mb-8 border border-white/10"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-medium">
                AI Insights
              </h3>
              <p className="text-2xl font-semibold text-white mt-2">
                Generate Report
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-4">
            {reportsLeft} reports remaining today. Click to generate AI-powered insights.
          </p>
        </div>
      </AnimatedComponent>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-neutral-700/50 transition-all duration-200 hover:shadow-xl"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Attendance Rate
            </h3>
            <p className="text-3xl font-semibold text-gray-800 dark:text-white mt-2">
              {filteredAttendance.length ? Math.round((totalPresent / filteredAttendance.length) * 100) : 0}%
            </p>
            <div className="flex items-center mt-4">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {totalPresent} out of {filteredAttendance.length}
              </p>
            </div>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.2}>
          <div className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-neutral-700/50 transition-all duration-200 hover:shadow-xl"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Average Lateness
            </h3>
            <p className="text-3xl font-semibold text-yellow-500 dark:text-yellow-400 mt-2">
              {Math.round(averageLateness)}m
            </p>
            <div className="flex items-center mt-4">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                Per late arrival
              </p>
            </div>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.3}>
          <div className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-neutral-700/50 transition-all duration-200 hover:shadow-xl"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Absent ({period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'})
            </h3>
            <p className="text-3xl font-semibold text-red-500 dark:text-red-400 mt-2">
              {totalAbsent}
            </p>
            <div className="flex items-center mt-4">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              <p className="text-sm text-gray-500 dark:text-neutral-400">
                {filteredAttendance.length ? Math.round((totalAbsent / filteredAttendance.length) * 100) : 0}% of period
              </p>
            </div>
          </div>
        </AnimatedComponent>
      </div>

      {/* Custom Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {[
          { title: "Attendance Rate Over Time", component: <AttendanceRateOverTime /> },
          { title: "Average Lateness Over Time", component: <AverageLatenessOverTime /> },
          { title: "Employee Satisfaction by Department", component: <EmployeeSatisfactionByDepartement /> },
          { title: "Leave Requests by Status", component: <LeaveRequestsByStatus /> },
          { title: "Weekly Work Hours vs Salary", component: <WeeklyWorkHoursVsSalary /> },
          { title: "Leaves Taken by Type", component: <LeavesTakenByType /> },
          { title: "New Hires Over Time", component: <NewHiresOverTime /> },
          { title: "Leave Balance Distribution", component: <LeaveBalanceDistribution /> }
        ].map((chart, index) => (
          <AnimatedComponent key={index} delay={0.1 * (index + 1)} direction={index % 2 === 0 ? 'left' : 'right'}>
            <div className="bg-white/90 dark:bg-neutral-800/90 rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-neutral-700/50"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            >
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">{chart.title}</h3>
              {chart.component}
            </div>
          </AnimatedComponent>
        ))}
      </div>

      {/* Modals */}
      {isConfirmModalOpen && (
        <AIReportConfirmModal
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleGenerateReport}
          reportsLeft={reportsLeft}
        />
      )}

      {isReportModalOpen && (
        <AIReportModal
          onClose={() => setIsReportModalOpen(false)}
          reportData={reportData}
          loading={!reportData}
          isCachedData={isCachedData}
        />
      )}
    </motion.div>
  );
};

export default DashboardPage;