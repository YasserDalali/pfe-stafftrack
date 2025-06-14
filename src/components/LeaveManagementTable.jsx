import React, { useState } from 'react';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Calendar, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedTableRow from './AnimatedTableRow';
import WarningModal from './WarningModal';
import EditModal from './EditModal';
import supabase from '../database/supabase-client';

const LeaveManagementTable = ({ leaveData: initialLeaveData = [], employees = [] }) => {
  const [tableData, setTableData] = useState(initialLeaveData);
  const [warningModal, setWarningModal] = useState({ open: false, leave: null });
  const [viewModal, setViewModal] = useState({ open: false, leave: null });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [editModal, setEditModal] = useState({ open: false, leave: null });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const handleDelete = async (id) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const { error } = await supabase.from('leaves').delete().eq('id', id);
      if (error) throw error;
      setTableData((prev) => prev.filter((leave) => leave.id !== id));
    } catch (err) {
      setDeleteError('Failed to delete leave request. ' + (err.message || ''));
    } finally {
      setDeletingId(null);
      setWarningModal({ open: false, leave: null });
    }
  };

  // Filter data based on date range and global filter
  const filteredData = React.useMemo(() => {
    let filtered = tableData;
    
    // Apply date range filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter((leave) => {
        const leaveStartDate = new Date(leave.start_date);
        const leaveEndDate = new Date(leave.end_date);
        const filterStartDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const filterEndDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        // Check if leave period overlaps with filter range
        if (filterStartDate && filterEndDate) {
          return (leaveStartDate <= filterEndDate && leaveEndDate >= filterStartDate);
        } else if (filterStartDate) {
          return leaveEndDate >= filterStartDate;
        } else if (filterEndDate) {
          return leaveStartDate <= filterEndDate;
        }
        return true;
      });
    }
    
    return filtered;
  }, [tableData, dateFilter]);

  const data = React.useMemo(() => filteredData, [filteredData]);

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'Employee',
        accessor: 'employee_id',
        Cell: ({ value }) => {
          const employee = employees.find(emp => emp.id === value);
          return (
            <Link
              to={`/admin/employees/${employee?.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {employee?.name || 'Unknown'}
            </Link>
          );
        },
      },
      {
        Header: 'Leave Type',
        accessor: 'type',
        Cell: ({ value }) => (
          <span className={`px-2 py-1 rounded-full text-sm font-medium
            ${value === 'Sick Leave' || value === 'sick' ? 'bg-red-100 text-red-700' :
              value === 'Vacation' || value === 'vacation' ? 'bg-blue-100 text-blue-700' :
                value === 'Personal' || value === 'personal' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'}`
          }>
            {value === 'sick' ? 'Sick Leave' : 
             value === 'vacation' ? 'Vacation' :
             value === 'personal' ? 'Personal' :
             value}
          </span>
        ),
      },
      {
        Header: 'Start Date',
        accessor: 'start_date',
      },
      {
        Header: 'End Date',
        accessor: 'end_date',
      },
      {
        Header: 'Duration',
        accessor: 'duration',
        Cell: ({ value }) => `${value} days`,
      },
      {
        Header: 'Medical Doc',
        accessor: 'medical_document_url',
        Cell: ({ value, row }) => {
          const leaveType = row.original.type;
          if ((leaveType === 'sick' || leaveType === 'Sick Leave') && value) {
            return (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                title="View Medical Document"
              >
                <FileText size={12} className="mr-1" />
                View
              </a>
            );
          } else if (leaveType === 'sick' || leaveType === 'Sick Leave') {
            return (
              <span className="text-xs text-red-500 font-medium">
                Missing
              </span>
            );
          }
          return (
            <span className="text-xs text-gray-400">
              N/A
            </span>
          );
        },
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value, row }) => (
          <select
            value={value}
            onChange={async (e) => {
              const newStatus = e.target.value;
              const leaveId = row.original.id;
              const prevStatus = value;
              
              setStatusUpdatingId(leaveId);
              setDeleteError(null);
              
              // Optimistically update UI
              setTableData((prev) => prev.map(l => l.id === leaveId ? { ...l, status: newStatus } : l));
              
              try {
                // Update leave status - the database trigger will handle balance updates automatically
                const { error } = await supabase
                  .from('leaves')
                  .update({ status: newStatus })
                  .eq('id', leaveId);
                
                if (error) throw error;
                
              } catch (err) {
                // Revert UI and show error
                setTableData((prev) => prev.map(l => l.id === leaveId ? { ...l, status: prevStatus } : l));
                setDeleteError('Failed to update status. ' + (err.message || ''));
              } finally {
                setStatusUpdatingId(null);
              }
            }}
            disabled={statusUpdatingId === row.original.id}
            className={`px-3 py-1 rounded-md text-sm font-medium border-2 cursor-pointer
              ${value === 'Approved' || value === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                value === 'Pending' || value === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  value === 'Rejected' || value === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'}
              ${statusUpdatingId === row.original.id ? 'opacity-50' : ''}`
            }
          >
            <option value="pending" className="bg-white text-yellow-700">Pending</option>
            <option value="approved" className="bg-white text-green-700">Approved</option>
            <option value="rejected" className="bg-white text-red-700">Rejected</option>
          </select>
        ),
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
              onClick={() => setViewModal({ open: true, leave: row.original })}
            >
              View
            </button>
            <button
              className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 focus:outline-none"
              onClick={() => setEditModal({ open: true, leave: row.original })}
            >
              Edit
            </button>
            <button
              className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none"
              onClick={() => setWarningModal({ open: true, leave: row.original })}
              disabled={deletingId === row.original.id}
            >
              {deletingId === row.original.id ? (
                <svg className="animate-spin h-5 w-5 mr-1 text-red-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : 'Delete'}
            </button>
          </div>
        ),
      },
    ],
    [tableData, employees, deletingId, statusUpdatingId]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    canNextPage,
    canPreviousPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 5 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Leave Requests
        </h3>
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-600 dark:text-red-400 text-sm">{deleteError}</p>
          </div>
        )}
        <WarningModal
          isOpen={warningModal.open}
          title="Delete Leave Request"
          message={warningModal.leave ? `Are you sure you want to delete this leave request for employee ID ${warningModal.leave.employee_id}? This action cannot be undone.` : ''}
          confirmLabel={deletingId === (warningModal.leave && warningModal.leave.id) ? 'Deleting...' : 'Delete'}
          cancelLabel="Cancel"
          loading={deletingId === (warningModal.leave && warningModal.leave.id)}
          onConfirm={() => warningModal.leave && handleDelete(warningModal.leave.id)}
          onCancel={() => setWarningModal({ open: false, leave: null })}
        />
        <EditModal
          isOpen={editModal.open}
          title="Edit Leave Request"
          fields={[
            { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: employees.map(e => ({ value: e.id, label: e.name })) },
            { name: 'type', label: 'Type', type: 'text', required: true },
            { name: 'start_date', label: 'Start Date', type: 'date', required: true },
            { name: 'end_date', label: 'End Date', type: 'date', required: true },
            { name: 'duration', label: 'Duration (days)', type: 'number', min: 1, required: true },
            { name: 'status', label: 'Status', type: 'select', required: true, options: [
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ] },
            { name: 'reason', label: 'Reason', type: 'textarea' },
          ]}
          initialValues={editModal.leave || {}}
          loading={editLoading}
          error={editError}
          onClose={() => setEditModal({ open: false, leave: null })}
          onSubmit={async (values) => {
            setEditLoading(true);
            setEditError(null);
            try {
              const { error } = await supabase
                .from('leaves')
                .update(values)
                .eq('id', editModal.leave.id);
              if (error) throw error;
              setTableData((prev) => prev.map(l => l.id === editModal.leave.id ? { ...l, ...values } : l));
              setEditModal({ open: false, leave: null });
            } catch (err) {
              setEditError('Failed to update leave. ' + (err.message || ''));
            } finally {
              setEditLoading(false);
            }
          }}
        />
        {/* View Modal */}
        {viewModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md w-full m-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave Details</h3>
              <div className="text-left space-y-2">
                <div><b>Employee:</b> {(() => {
                  const emp = employees.find(e => e.id === viewModal.leave.employee_id);
                  return emp ? emp.name : viewModal.leave.employee_id;
                })()}</div>
                <div><b>Type:</b> {viewModal.leave.type === 'sick' ? 'Sick Leave' : 
                                   viewModal.leave.type === 'vacation' ? 'Vacation' :
                                   viewModal.leave.type === 'personal' ? 'Personal' :
                                   viewModal.leave.type}</div>
                <div><b>Status:</b> {viewModal.leave.status}</div>
                <div><b>Start Date:</b> {viewModal.leave.start_date}</div>
                <div><b>End Date:</b> {viewModal.leave.end_date}</div>
                <div><b>Duration:</b> {viewModal.leave.duration} days</div>
                <div><b>Reason:</b> {viewModal.leave.reason}</div>
                {(viewModal.leave.type === 'sick' || viewModal.leave.type === 'Sick Leave') && (
                  <div>
                    <b>Medical Document:</b> {viewModal.leave.medical_document_url ? (
                      <a
                        href={viewModal.leave.medical_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                      >
                        <Download size={12} className="mr-1" />
                        Download
                      </a>
                    ) : (
                      <span className="text-red-500 ml-2 text-sm">Not provided</span>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewModal({ open: false, leave: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          <div className="-m-1.5 overflow-x-auto">
            <div className="p-1.5 min-w-full inline-block align-middle">
              {/* Search and Date Filter bar */}
              <div className="mb-4 space-y-4">
                {/* Global Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={globalFilter || ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search leave requests..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white"
                  />
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                {/* Date Range Filter */}
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                      Filter by Date Range
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white text-sm"
                          placeholder="Start Date"
                        />
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                      </div>
                      <span className="text-gray-500 dark:text-neutral-400">to</span>
                      <div className="relative flex-1">
                        <input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white text-sm"
                          placeholder="End Date"
                        />
                        <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear Date Filter Button */}
                  {(dateFilter.startDate || dateFilter.endDate) && (
                    <button
                      onClick={clearDateFilter}
                      className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 border border-gray-300 dark:border-neutral-600 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors duration-200"
                    >
                      Clear Filter
                    </button>
                  )}
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
                              <span>
                                {column.isSorted
                                  ? column.isSortedDesc
                                    ? <ArrowDown size={12} />
                                    : <ArrowUp size={12} />
                                  : <ArrowUpDown size={12} />}
                              </span>
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
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="px-3 py-1 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    {[5, 10, 20].map(size => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className="px-3 py-1 border rounded-md disabled:opacity-50 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => gotoPage(i)}
                      className={`px-3 py-1 border rounded-md ${pageIndex === i ? 'bg-blue-500 text-white' : ''
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementTable;
