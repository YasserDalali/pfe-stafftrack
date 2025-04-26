import React from 'react';
import { motion } from 'framer-motion';

const WarningModal = ({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md w-full m-4"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <svg
              className="h-6 w-6 text-yellow-600 dark:text-yellow-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>

          <div className="mt-3">
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {message}
            </p>
            {children}
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 rounded-md"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 
                ${loading
                  ? 'bg-yellow-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'}`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-1 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WarningModal; 