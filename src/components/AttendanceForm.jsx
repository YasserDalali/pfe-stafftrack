import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../database/supabase-client';

const AttendanceForm = ({ isOpen, onClose, employees }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    checkdate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
    status: 'on_time'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if attendance already exists for this employee today
      const today = new Date(formData.checkdate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use Supabase to check for existing attendance
      const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', formData.employee_id)
        .gte('checkdate', today.toISOString())
        .lt('checkdate', tomorrow.toISOString())
        .limit(1);

      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        setError('Attendance already recorded for this employee today');
        setLoading(false);
        return;
      }

      // Calculate lateness
      const checkTime = new Date(formData.checkdate);
      const startTime = new Date(checkTime);
      startTime.setHours(9, 0, 0, 0); // Assuming work starts at 9 AM
      const lateness = checkTime > startTime ? Math.floor((checkTime - startTime) / (1000 * 60)) : 0;
      // Use 'present' if on time, 'absent' if late (schema only allows these two)
      const status = lateness > 0 ? 'absent' : 'present';
      // Insert new attendance record
      const { data: insertData, error: insertError } = await supabase
        .from('attendance')
        .insert([
          {
            employee_id: formData.employee_id,
            checkdate: formData.checkdate,
            status,
            lateness: lateness > 0 ? `${lateness} minutes` : null
          }
        ])
        .select('id');

      if (insertError) throw insertError;
      if (insertData && insertData[0]?.id) {
        onClose();
        setFormData({
          employee_id: '',
          checkdate: new Date().toISOString().slice(0, 16),
          status: 'on_time'
        });
      } else {
        setError('Failed to record attendance. Please try again.');
      }
    } catch (err) {
      console.error('Error recording attendance:', err);
      setError(err.message || 'Failed to record attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Record Attendance
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee
              </label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700"
              >
                <option value="">Select Employee</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check-in Time
              </label>
              <input
                type="datetime-local"
                name="checkdate"
                value={formData.checkdate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-neutral-700"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Recording...' : 'Record Attendance'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AttendanceForm; 