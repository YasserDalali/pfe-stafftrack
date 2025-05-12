import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { generateReportPDF, downloadReportPDF } from '../utils/enhancedReportGenerator';

const EnhancedReportModal = ({ isOpen, onClose, reportData, loading }) => {
  const reportRef = useRef(null);
  
  if (!isOpen) return null;
  
  const handleDownloadPDF = async () => {
    if (!reportData) return;
    
    try {
      const doc = await generateReportPDF(reportData);
      downloadReportPDF(doc, `hr-attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4"
        ref={reportRef}
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-800 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              HR Attendance Analysis Report
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {reportData?.reportMetadata?.generatedDate ? 
                `Generated on ${new Date(reportData.reportMetadata.generatedDate).toLocaleString()}` : 
                'Generating report...'}
            </p>
          </div>
          <div className="flex space-x-3">
            {reportData && (
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
            <p className="mt-6 text-gray-600 dark:text-gray-300">Generating your comprehensive HR report...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This may take up to 30 seconds</p>
          </div>
        ) : reportData ? (
          <div className="space-y-8 mt-6">
            {/* Executive Summary */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
              <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-4">Executive Summary</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {reportData.executiveSummary}
              </p>
            </section>
            
            {/* Attendance Summary */}
            <section className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Attendance Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Employees</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {reportData.attendanceSummary.totalEmployees}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Avg. Daily Attendance</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {reportData.attendanceSummary.averageDailyAttendance}
                  </p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Attendance Rate</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {reportData.attendanceSummary.attendanceRate}%
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Lateness Rate</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {reportData.attendanceSummary.latenessRate}%
                  </p>
                </div>
              </div>
            </section>
            
            {/* Time Analysis */}
            <section className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Time Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Arrival Time Insights</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Average Arrival Time:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{reportData.timeAnalysis.averageArrivalTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Most Common Arrival Range:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{reportData.timeAnalysis.mostCommonArrivalTimeRange}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Peak Attendance Days</h4>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    {reportData.timeAnalysis.peakAttendanceDays.map((day, index) => (
                      <li key={index}>{day}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            
            {/* Employee Insights */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-100 dark:border-green-800">
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-3">Most Punctual Employees</h3>
                <ul className="list-disc list-inside text-green-700 dark:text-green-400 space-y-1">
                  {reportData.employeeInsights.mostPunctual.map((employee, index) => (
                    <li key={index}>{employee}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-100 dark:border-red-800">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-3">Frequently Late Employees</h3>
                <ul className="list-disc list-inside text-red-700 dark:text-red-400 space-y-1">
                  {reportData.employeeInsights.frequentlyLate.map((employee, index) => (
                    <li key={index}>{employee}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">Perfect Attendance</h3>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                  {reportData.employeeInsights.perfectAttendance.map((employee, index) => (
                    <li key={index}>{employee}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-100 dark:border-yellow-800">
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3">Irregular Patterns</h3>
                <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-400 space-y-1">
                  {reportData.employeeInsights.irregularPatterns.map((pattern, index) => (
                    <li key={index}>{pattern}</li>
                  ))}
                </ul>
              </div>
            </section>
            
            {/* Risk Assessment */}
            <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-100 dark:border-red-800">
              <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-4">Risk Assessment</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-semibold text-red-700 dark:text-red-400 mb-2">High Risk Employees</h4>
                  <ul className="list-disc list-inside text-red-700 dark:text-red-400 space-y-1">
                    {reportData.riskAssessment.highRiskEmployees.map((employee, index) => (
                      <li key={index}>{employee}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-red-700 dark:text-red-400 mb-2">Early Warning Indications</h4>
                  <ul className="list-disc list-inside text-red-700 dark:text-red-400 space-y-1">
                    {reportData.riskAssessment.earlyWarningIndications.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-red-700 dark:text-red-400 mb-2">Attrition Risk Factors</h4>
                  <p className="text-red-700 dark:text-red-400">{reportData.riskAssessment.attritionRiskFactors}</p>
                </div>
              </div>
            </section>
            
            {/* Actionable Recommendations */}
            <section className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mb-4">Actionable Recommendations</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Policy Adjustments</h4>
                  <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-400 space-y-1">
                    {reportData.actionableRecommendations.policyAdjustments.map((policy, index) => (
                      <li key={index}>{policy}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Employee Specific Interventions</h4>
                  <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-400 space-y-1">
                    {reportData.actionableRecommendations.employeeSpecificInterventions.map((intervention, index) => (
                      <li key={index}>{intervention}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Workforce Management Tips</h4>
                  <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-400 space-y-1">
                    {reportData.actionableRecommendations.workforceManagementTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Recognition Opportunities</h4>
                  <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-400 space-y-1">
                    {reportData.actionableRecommendations.recognitionOpportunities.map((opportunity, index) => (
                      <li key={index}>{opportunity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            
            {/* Report Metadata */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-8">
              <div className="flex flex-col md:flex-row justify-between text-sm text-gray-500 dark:text-gray-400">
                <p>Data Coverage: {reportData.reportMetadata.dataCoverage}</p>
                <p>Confidence Score: {reportData.reportMetadata.confidenceScore}/10</p>
                <p>Generated: {new Date(reportData.reportMetadata.generatedDate).toLocaleString()}</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-300">No report data available.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedReportModal; 