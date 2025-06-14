import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedComponent from '../components/AnimatedComponent';
import sb from '../database/supabase-client';

const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const ProfilePage = () => {
  const { id } = useParams();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        console.log('Fetching employee data for ID:', id);
        setLoading(true);

        // Convert id to integer since it comes as string from URL params
        const employeeId = parseInt(id);
        if (isNaN(employeeId)) {
          throw new Error('Invalid employee ID');
        }

        const { data: employee, error: employeeError } = await sb
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();

        console.log('Supabase response:', { employee, employeeError });

        if (employeeError) throw employeeError;
        if (!employee) throw new Error('Employee not found');

        setEmployeeData(employee);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeData();
    } else {
      setLoading(false);
      setError('No employee ID provided');
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-neutral-300">Loading employee data...</p>
        </div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Employee Not Found</h2>
          <p className="text-gray-600 dark:text-neutral-300">
            {error || 'The requested employee profile could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Profile Header */}
      <AnimatedComponent>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={employeeData.avatar_url || defaultAvatar}
                alt={employeeData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {employeeData.name}
              </h1>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 dark:text-neutral-300">
                    {employeeData.position}
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    {employeeData.departement}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-neutral-300">
                    Employee ID: {employeeData.id}
                  </p>
                  <p className="text-gray-600 dark:text-neutral-300">
                    {employeeData.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedComponent>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Leave Balance
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {employeeData.leave_balance} days
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.2}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Weekly Hours
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {employeeData.weekly_work_hours}h
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Satisfaction Rate
            </h3>
            <div className="flex items-center">
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {employeeData.satisfaction_rate*10}%
              </p>
              <div className="ml-3 flex-1 bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${employeeData.satisfaction_rate*10}%` }}
                />
              </div>
            </div>
          </div>
        </AnimatedComponent>
      </div>

      {/* Employee Details */}
      <AnimatedComponent delay={0.4}>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Employee Details
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">Hire Date</p>
              <p className="text-gray-900 dark:text-white">
                {new Date(employeeData.hire_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">Monthly Salary</p>
              <p className="text-gray-900 dark:text-white">
                ${employeeData.monthly_salary}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">Department</p>
              <p className="text-gray-900 dark:text-white">
                {employeeData.departement}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">Weekly Hours</p>
              <p className="text-gray-900 dark:text-white">
                {employeeData.weekly_work_hours} hours
              </p>
            </div>
          </div>
          {employeeData.notes && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">Notes</p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {employeeData.notes}
              </p>
            </div>
          )}
        </div>
      </AnimatedComponent>

      {/* Performance Metrics */}
      {/* <AnimatedComponent delay={0.5}>
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Satisfaction Rate</span>
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{employeeData.satisfaction_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${employeeData.satisfaction_rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Attendance Rate</span>
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">95%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Task Completion</span>
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">88%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </div>
      </AnimatedComponent> */}
    </motion.div>
  );
};

export default ProfilePage;