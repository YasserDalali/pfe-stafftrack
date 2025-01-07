import React from 'react';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedComponent from './AnimatedComponent';
import AnimatedTableRow from './AnimatedTableRow';
import ModalButton from './Modal';
import ProfilePage from '../pages/ProfilePage';

const EmployeeTable = ({ employees }) => {
  const data = React.useMemo(() => employees, [employees]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value, row }) => (
          <ModalButton 
            value={value}
            title="Employee Profile"
            buttonStyle="text"
          >
            <ProfilePage employeeId={row.original.id} />
          </ModalButton>
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
        Header: 'Start Date',
        accessor: 'startDate',
      },
      {
        Header: 'Leave Balance',
        accessor: 'leaveBalance',
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <button className="text-red-600 hover:text-red-800">
            <Trash size={20} />
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
                {/* Search bar */}
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
                            className={`px-3 py-1 border rounded-md transition-colors ${
                              pageIndex === pageNum 
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
