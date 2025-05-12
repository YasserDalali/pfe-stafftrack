import React from 'react';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Edit, Trash, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedComponent from './AnimatedComponent';
import AnimatedTableRow from './AnimatedTableRow';
import supabase from '../database/supabase-client';

const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';

const EmployeeTable = ({ employees, onEdit, onDelete, isDeleting, isEditing }) => {
  const data = React.useMemo(() => employees, [employees]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value, row }) => (
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={row.original.avatar_url || defaultAvatar}
                alt={value}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultAvatar;
                }}
              />
            </div>
            <Link
              to={`/admin/employees/${row.original.id}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {value}
            </Link>
          </div>
        ),
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'Position',
        accessor: 'position',
      },
      {
        Header: 'Hire Date',
        accessor: 'hire_date',
      },
      {
        Header: 'Leave Balance',
        accessor: 'leave_balance',
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => {
          const employeeId = row.original.id;
          const currentlyDeleting = isDeleting === employeeId;
          const currentlyEditing = isEditing === employeeId;

          return (
            <div className="flex space-x-2">
              <button
                className={`p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-wait`}
                onClick={() => !currentlyEditing && onEdit(row.original)}
                disabled={currentlyEditing || currentlyDeleting}
                title="Edit employee"
              >
                {currentlyEditing ? (
                  <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Edit size={16} />
                )}
              </button>
              <button
                className={`p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-wait`}
                onClick={() => !currentlyDeleting && onDelete(employeeId)}
                disabled={currentlyDeleting || currentlyEditing}
                title="Delete employee"
              >
                {currentlyDeleting ? (
                  <svg className="animate-spin h-5 w-5 text-red-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <Trash size={16} />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, isDeleting, isEditing]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    setPageSize,
    canNextPage,
    canPreviousPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <AnimatedComponent>
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Employee List
          </h3>
          <div className="flex flex-col">
            <div className="-m-1.5 overflow-x-auto">
              <div className="p-1.5 min-w-full inline-block align-middle">
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={globalFilter || ''}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      placeholder="Search employees..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-neutral-600 rounded-md dark:bg-neutral-700 dark:text-white"
                    />
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>

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

                <div className="flex items-center justify-between py-3 mt-4">
                  <div className="flex items-center space-x-2">
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(Number(e.target.value))}
                      className="px-3 py-1 border rounded-md dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                    >
                      {[20, 50, 150].map(size => (
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
        </div>
      </div>
    </AnimatedComponent>
  );
};

export default EmployeeTable;
