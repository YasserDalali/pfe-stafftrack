import React, { useState } from 'react';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedTableRow from './AnimatedTableRow';
import WarningModal from './WarningModal';
import supabase from '../database/supabase-client';

const LeaveManagementTable = ({ leaveData: initialLeaveData = [], employees = [] }) => {
  const [tableData, setTableData] = useState(initialLeaveData);
  const [warningModal, setWarningModal] = useState({ open: false, leave: null });
  const [viewModal, setViewModal] = useState({ open: false, leave: null });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

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

  const data = React.useMemo(() => tableData, [tableData]);

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
            ${value === 'Sick Leave' ? 'bg-red-100 text-red-700' :
              value === 'Vacation' ? 'bg-blue-100 text-blue-700' :
                value === 'Personal' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'}`
          }>
            {value}
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
              const { error } = await supabase.from('leaves').update({ status: newStatus }).eq('id', leaveId);
              if (error) {
                // Revert UI and show error
                setTableData((prev) => prev.map(l => l.id === leaveId ? { ...l, status: prevStatus } : l));
                setDeleteError('Failed to update status. ' + (error.message || ''));
              }
              setStatusUpdatingId(null);
            }}
            disabled={statusUpdatingId === row.original.id}
            className={`px-3 py-1 rounded-md text-sm font-medium border-2 cursor-pointer
              ${value === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                value === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  value === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'}
              ${statusUpdatingId === row.original.id ? 'opacity-50' : ''}`
            }
          >
            <option value="Pending" className="bg-white text-yellow-700">Pending</option>
            <option value="Approved" className="bg-white text-green-700">Approved</option>
            <option value="Rejected" className="bg-white text-red-700">Rejected</option>
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
                <div><b>Type:</b> {viewModal.leave.type}</div>
                <div><b>Status:</b> {viewModal.leave.status}</div>
                <div><b>Start Date:</b> {viewModal.leave.start_date}</div>
                <div><b>End Date:</b> {viewModal.leave.end_date}</div>
                <div><b>Duration:</b> {viewModal.leave.duration} days</div>
                <div><b>Reason:</b> {viewModal.leave.reason}</div>
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
              {/* Search bar */}
              <div className="mb-4">
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
