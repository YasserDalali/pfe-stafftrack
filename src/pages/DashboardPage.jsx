import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { motion } from 'framer-motion';
import AnimatedComponent from '../components/AnimatedComponent';
import AIReportModal from '../components/AIReportModal';
import AIReportConfirmModal from '../components/AIReportConfirmModal';
import { generateAIReport } from '../utils/ReportAIAnalyse';

const MAX_DAILY_REPORTS = 10;
const REPORTS_STORAGE_KEY = 'ai_reports_usage';

const DashboardPage = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportsLeft, setReportsLeft] = useState(MAX_DAILY_REPORTS);
  const [isCachedData, setIsCachedData] = useState(false);
  const attendance = [];
  const employees = [];

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

  // Calculate attendance statistics
  const totalPresent = attendance.filter(record => record?.status === "Present").length;
  const totalAbsent = attendance.filter(record => record?.status === "Absent").length;
  const totalLate = attendance.filter(record => record?.lateness).length;

  // Calculate average lateness in minutes
  const averageLateness = attendance
    .filter(record => record?.lateness)
    .reduce((acc, record) => {
      const [minutes] = record?.lateness.split(':').map(Number);
      return acc + minutes;
    }, 0) / totalLate || 0;

  // Attendance trend chart options
  const attendanceChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#3b82f6', '#9333ea'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      axisBorder: {
        show: false
      }
    },
    grid: {
      show: true,
      strokeDashArray: 5,
      borderColor: '#e5e7eb'
    },
    legend: {
      show: false
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return value + '%';
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.2,
        stops: [0, 100]
      }
    }
  };

  const attendanceChartSeries = [
    {
      name: 'Present',
      data: [90, 85, 92, 88, 94]
    },
    {
      name: 'Late',
      data: [10, 15, 8, 12, 6]
    }
  ];

  // Lateness by time slot chart
  const latenessTimeChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#f59e0b'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: ['8:00-8:15', '8:16-8:30', '8:31-8:45', '8:46-9:00', 'After 9:00'],
      labels: {
        formatter: function (value) {
          return value + ' min';
        }
      }
    },
    grid: {
      strokeDashArray: 5,
      borderColor: '#e5e7eb'
    }
  };

  const latenessTimeChartSeries = [{
    name: 'Late Arrivals',
    data: [12, 8, 5, 7, 3]
  }];

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Attendance Rate
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {Math.round((totalPresent / attendance.length) * 100)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              {totalPresent} out of {attendance.length}
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

{/*         <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              On-Time Rate
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {Math.round(((totalPresent - totalLate) / totalPresent) * 100)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              Of present employees
            </p>
          </div>
        </AnimatedComponent> */}

        <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Absent Today
            </h3>
            <p className="text-3xl font-bold text-red-600">
              {totalAbsent}
            </p>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-2">
              {Math.round((totalAbsent / attendance.length) * 100)}% of workforce
            </p>
          </div>
        </AnimatedComponent>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedComponent delay={0.4}>
          {/* Attendance Trend Chart */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Weekly Attendance Trend
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-sm bg-blue-600 mr-2"></span>
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Present</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-sm bg-purple-600 mr-2"></span>
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Late</span>
                </div>
              </div>
            </div>
            <ReactApexChart
              options={attendanceChartOptions}
              series={attendanceChartSeries}
              type="area"
              height={350}
            />
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.5}>
          {/* Lateness Distribution Chart */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Lateness Distribution
            </h3>
            <ReactApexChart
              options={latenessTimeChartOptions}
              series={latenessTimeChartSeries}
              type="bar"
              height={350}
            />
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
                {attendance
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