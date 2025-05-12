import React from 'react';
import { motion } from 'framer-motion';

const AIReportConfirmModal = ({ isOpen, onClose, onConfirm, reportsLeft, reportType = 'standard', setReportType }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        Generate AI Report
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You have <span className="font-bold text-yellow-600">{reportsLeft}</span> reports remaining today.
                    Would you like to generate a new report?
                </p>
                
                {reportsLeft < 3 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-6">
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                            Warning: You're running low on available reports for today.
                        </p>
                    </div>
                )}
                
                <div className="mb-6">
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Report Type
                    </label>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => {
                                console.log('Setting report type to standard');
                                setReportType('standard');
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 
                                ${reportType === 'standard' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => {
                                console.log('Setting report type to enhanced');
                                setReportType('enhanced');
                            }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 
                                ${reportType === 'enhanced' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Enhanced
                        </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {reportType === 'enhanced' 
                            ? 'Enhanced report includes detailed HR analysis with downloadable PDF' 
                            : 'Standard report provides basic insights on attendance patterns'}
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={reportsLeft === 0}
                        className={`px-4 py-2 rounded-md text-white transition-colors 
                            ${reportsLeft === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : reportType === 'enhanced' 
                                    ? "bg-purple-600 hover:bg-purple-700" 
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        Generate Report
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AIReportConfirmModal; 