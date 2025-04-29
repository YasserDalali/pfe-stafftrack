import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import AnimatedComponent from '../components/AnimatedComponent';
import AttendanceForm from '../components/AttendanceForm';
import LeaveForm from '../components/LeaveForm';
import { useFetchEmployees } from '../hooks/useFetchEmployees';
import supabase from '../database/supabase-client';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { Search } from 'lucide-react';
import AnimatedTableRow from '../components/AnimatedTableRow';
import EditModal from '../components/EditModal';
import CONFIG from '../utils/CONFIG';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

// Function to determine if check-in time is late
const isLate = (checkdate) => {
  const date = new Date(checkdate);
  const checkInHour = date.getHours();
  const checkInMinute = date.getMinutes();
  
  // Compare with threshold from CONFIG
  return (checkInHour > CONFIG.LATE_THRESHOLD_HOUR || 
         (checkInHour === CONFIG.LATE_THRESHOLD_HOUR && 
          checkInMinute > CONFIG.LATE_THRESHOLD_MINUTE));
};

const AttendancePage = () => {
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { employees, loading: loadingEmployees } = useFetchEmployees();
  const [editModal, setEditModal] = useState({ open: false, record: null });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // Fetch attendance with employee name using Supabase join
      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(name)')
        .order('checkdate', { ascending: false })
        .limit(100);

      if (error) throw error;
      // Map to add employee_name for compatibility with the rest of the code
      const mapped = (data || []).map(row => ({
        ...row,
        employee_name: row.employees?.name || ''
      }));
      setAttendanceRecords(mapped);
      setError(null);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const data = useMemo(() => attendanceRecords, [attendanceRecords]);
  const columns = useMemo(
    () => [
      {
        Header: 'Employee',
        accessor: 'employee_name',
      },
      {
        Header: 'Check-in Time',
        accessor: 'checkdate',
        Cell: ({ value }) => formatDate(value),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value, row }) => {
          // Determine attendance status: late or on time
          const checkInStatus = isLate(row.original.checkdate) ? 'Late' : 'On Time';
          return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              checkInStatus === 'On Time'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {checkInStatus}
            </span>
          );
        },
      },
      {
        Header: 'Lateness',
        accessor: 'lateness',
        Cell: ({ value }) => value || '-',
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <button
            className="text-blue-600 hover:text-blue-800 mr-2"
            onClick={() => setEditModal({ open: true, record: row.original })}
          >
            Edit
          </button>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize, globalFilter },
    setPageSize,
    canNextPage,
    canPreviousPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (loading || loadingEmployees) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <AnimatedComponent>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Attendance Management
          </h1>
          <div className="flex space-x-3">
           
            <button
              onClick={() => setIsAttendanceFormOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Record Attendance
            </button>
          </div>
        </div>
      </AnimatedComponent>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AnimatedComponent delay={0.1}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Total Records
            </h3>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {attendanceRecords.length}
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.2}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              On Time
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {attendanceRecords.filter(record => !isLate(record.checkdate)).length}
            </p>
          </div>
        </AnimatedComponent>

        <AnimatedComponent delay={0.3}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
            <h3 className="text-gray-500 dark:text-neutral-400 text-sm font-medium">
              Late
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {attendanceRecords.filter(record => isLate(record.checkdate)).length}
            </p>
          </div>
        </AnimatedComponent>
      </div>

      {/* Forms */}
      <AttendanceForm
        isOpen={isAttendanceFormOpen}
        onClose={() => setIsAttendanceFormOpen(false)}
        employees={employees}
      />

      <LeaveForm
        isOpen={isLeaveFormOpen}
        onClose={() => setIsLeaveFormOpen(false)}
        employees={employees}
      />

      <EditModal
        isOpen={editModal.open}
        title="Edit Attendance Record"
        fields={[
          { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employees.map(e => ({ value: e.id, label: e.name })) },
          { name: 'checkdate', label: 'Check-in Time', type: 'datetime-local', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'present', label: 'Present' },
            { value: 'absent', label: 'Absent' },
          ] },
          { name: 'lateness', label: 'Lateness (e.g. 00:10:00)', type: 'text' },
        ]}
        initialValues={editModal.record || {}}
        loading={editLoading}
        error={editError}
        onClose={() => setEditModal({ open: false, record: null })}
        onSubmit={async (values) => {
          setEditLoading(true);
          setEditError(null);
          try {
            // Only include fields that exist in the database schema
            const updateValues = {
              employee_id: values.employee_id,
              checkdate: values.checkdate,
              status: values.status,
              lateness: values.lateness
            };
            
            const { error } = await supabase
              .from('attendance')
              .update(updateValues)
              .eq('id', editModal.record.id);
              
            if (error) throw error;
            
            // Update the local state for UI
            setAttendanceRecords((prev) => prev.map(r => {
              if (r.id === editModal.record.id) {
                return { 
                  ...r, 
                  ...updateValues,
                  employee_name: employees.find(e => e.id.toString() === values.employee_id.toString())?.name || r.employee_name 
                };
              }
              return r;
            }));
            
            setEditModal({ open: false, record: null });
          } catch (err) {
            setEditError('Failed to update attendance. ' + (err.message || ''));
          } finally {
            setEditLoading(false);
          }
        }}
      />

      {/* Attendance Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search records..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white"
              />
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-gray-200 dark:border-neutral-700 rounded-lg">
            <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
              <thead>
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-neutral-500"
                      >
                        <div className="flex items-center gap-x-2">
                          {column.render('Header')}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()} className="divide-y divide-gray-200 dark:divide-neutral-700">
                {page.map((row, index) => {
                  prepareRow(row);
                  return (
                    <AnimatedTableRow key={row.id} index={index}>
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-neutral-200"
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </AnimatedTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-3 mt-4">
            <div className="flex items-center space-x-2">
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="px-3 py-1 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              >
                {[5, 10, 20].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500 dark:text-neutral-400">
                Page {pageIndex + 1} of {pageCount}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 dark:border-neutral-600 dark:text-white transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  let pageNum;
                  if (pageCount <= 5) {
                    pageNum = i;
                  } else if (pageIndex < 3) {
                    pageNum = i;
                  } else if (pageIndex > pageCount - 4) {
                    pageNum = pageCount - 5 + i;
                  } else {
                    pageNum = pageIndex - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => gotoPage(pageNum)}
                      className={`px-3 py-1 border rounded-md transition-colors ${pageIndex === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700 dark:border-neutral-600 dark:text-white'
                        }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700 dark:border-neutral-600 dark:text-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
