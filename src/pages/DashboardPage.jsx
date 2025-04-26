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
import TopAbsentees from '../charts/TopAbsentees';
import WeeklyWorkHoursVsSalary from '../charts/WeeklyWorkHoursVsSalary';
import LeavesTakenByType from '../charts/LeavesTakenByType';
import NewHiresOverTime from '../charts/NewHiresOverTime';
import LeaveBalanceDistribution from '../charts/LeaveBalanceDistribution';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import  supabase  from '../database/supabase-client';

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



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      
        {/* AI Report Card */}
        <AnimatedComponent delay={0.4}>
          <div
            onClick={() => setIsConfirmModalOpen(true)}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 cursor-pointer transform transition-all hover:from-purple-600 hover:to-indigo-700 transition-all mb-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">
                  AI Insights
                </h3>
                <p className="text-2xl font-bold text-white mt-2">
                  Generate Report
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
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
      {/* Stats Cards Toggle */}
      <div className="flex gap-2 mb-4">
        {['week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-neutral-700'}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Attendance Rate
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {filteredAttendance.length ? Math.round((totalPresent / filteredAttendance.length) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              {totalPresent} out of {filteredAttendance.length}
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.2}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Average Lateness
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {Math.round(averageLateness)}m
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              Per late arrival
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Absent ({period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'})
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {totalAbsent}
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              {filteredAttendance.length ? Math.round((totalAbsent / filteredAttendance.length) * 100) : 0}% of period
            </p>
          </div>
        </AnimatedComponent>
      </div>


      <AnimatedComponent delay={0.6}>
        {/* Recent Late Arrivals */}
        <div className="mt-6 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Recent Late Arrivals
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    Minutes Late
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                {filteredAttendance
                  .filter(record => record.lateness)
                  .slice(0, 5)
                  .map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.employee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400">
                        {record.details.split('at ')[1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        {record.lateness.split(':')[1]}m
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedComponent>

      {/* Custom Chart Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div>
          <h3 className="text-lg font-semibold mb-2">Attendance Rate Over Time</h3>
          <AttendanceRateOverTime />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Average Lateness Over Time</h3>
          <AverageLatenessOverTime />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Employee Satisfaction by Department</h3>
          <EmployeeSatisfactionByDepartement />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Leave Requests by Status</h3>
          <LeaveRequestsByStatus />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Top Absentees</h3>
          <TopAbsentees />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Weekly Work Hours vs Salary</h3>
          <WeeklyWorkHoursVsSalary />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Leaves Taken by Type</h3>
          <LeavesTakenByType />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">New Hires Over Time</h3>
          <NewHiresOverTime />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Leave Balance Distribution</h3>
          <LeaveBalanceDistribution />
        </div>
      </div>

      {/* Confirmation Modal */}
      <AIReportConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleGenerateReport}
        reportsLeft={reportsLeft}
      />

      {/* Report Modal */}
      <AIReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={reportData}
        isCachedData={isCachedData}
      />
    </motion.div>
  );
};

export default DashboardPage; 