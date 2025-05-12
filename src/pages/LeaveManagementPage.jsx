import React, { useState } from 'react';

import AnimatedComponent from '../components/AnimatedComponent';
import LeaveManagementTable from '../components/LeaveManagementTable';
import LeaveCalendarView from '../components/LeaveCalendarView';
import LeaveForm from '../components/LeaveForm';
import { useFetchLeaves } from '../hooks/useFetchLeaves';
import { useFetchEmployees } from '../hooks/useFetchEmployees';

const LeaveManagement = () => {
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const { leaves, loading: loadingLeaves, error: errorLeaves, refetchLeaves } = useFetchLeaves();
  const { employees, loading: loadingEmployees, error: errorEmployees } = useFetchEmployees();

  const handleLeaveSubmitted = async () => {
    await refetchLeaves();
  };

  if (loadingLeaves || loadingEmployees) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const combinedError = errorLeaves || errorEmployees;
  if (combinedError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
          <h3 className="text-lg font-semibold">Error Loading Data</h3>
          <p>{typeof combinedError === 'string' ? combinedError : combinedError.message}</p>
        </div>
      </div>
    );
  }

  const pendingRequests = leaves.filter(req => req.status === 'Pending').length;
  const approvedLeaves = leaves.filter(req => req.status === 'Approved').length;

  return (
    <div className="p-6">
      <AnimatedComponent>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Leave Management
          </h1>
          <button
            onClick={() => setIsLeaveFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Plan Leave
          </button>
        </div>
      </AnimatedComponent>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Total Requests
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {leaves.length}
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.2}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Pending Requests
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingRequests}
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Approved Leaves
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {approvedLeaves}
            </p>
          </div>
        </AnimatedComponent>
      </div>

      <LeaveForm
        isOpen={isLeaveFormOpen}
        onClose={() => setIsLeaveFormOpen(false)}
        employees={employees}
        onSuccess={handleLeaveSubmitted}
      />

      <LeaveManagementTable leaveData={leaves} employees={employees} />

      <div className="mt-6">
        <LeaveCalendarView />
      </div>
    </div>
  );
};

export default LeaveManagement; 