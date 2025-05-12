import React, { useState } from 'react';
import { useFetchEmployees } from '../hooks/useFetchEmployees';
import EmployeeTable from '../components/EmployeeTable';
import AddEmployeeModal from '../components/AddEmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import supabase from '../database/supabase-client';

const EmployeePage = () => {
  const { employees, loading, error: fetchError, refetch } = useFetchEmployees();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [operationLoading, setOperationLoading] = useState(null);
  const [operationError, setOperationError] = useState(null);

  const handleEmployeeAdded = () => {
    refetch();
    setIsAddModalOpen(false);
  };

  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setOperationError(null);
    setIsEditModalOpen(true);
  };

  const handleEmployeeUpdated = async (updatedEmployeeData) => {
    console.log('Employee update successful in modal, refetching...', updatedEmployeeData);
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setOperationError(null);
    await refetch();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
    setOperationError(null);
  };

  const handleDeleteClick = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    setOperationLoading(employeeId);
    setOperationError(null);

    try {
      const employeeToDelete = employees.find(emp => emp.id === employeeId);
      let avatarPathToDelete = null;
      if (employeeToDelete?.avatar_url) {
          try {
             const urlParts = employeeToDelete.avatar_url.split('/');
             avatarPathToDelete = urlParts[urlParts.length - 1];
          } catch (e) {
             console.warn("Could not parse avatar path for deletion:", employeeToDelete.avatar_url);
          }
      }

      const { error: deleteDbError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (deleteDbError) {
        throw deleteDbError;
      }

       if (avatarPathToDelete) {
         console.log(`Attempting to delete avatar: ${avatarPathToDelete}`);
         const { error: deleteStorageError } = await supabase.storage
           .from('employee-avatars')
           .remove([avatarPathToDelete]);

         if (deleteStorageError) {
           console.warn(`Failed to delete avatar (${avatarPathToDelete}) for deleted employee (${employeeId}):`, deleteStorageError.message);
           setOperationError(`Employee deleted, but failed to remove avatar: ${deleteStorageError.message}`);
         } else {
           console.log(`Successfully deleted avatar: ${avatarPathToDelete}`);
         }
       }

      await refetch();

    } catch (err) {
      console.error("Delete error:", err);
      setOperationError(`Failed to delete employee: ${err.message}`);
    } finally {
      setOperationLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
          <h3 className="text-lg font-semibold">Error Loading Employees</h3>
          <p>{typeof fetchError === 'string' ? fetchError : fetchError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Employees
        </h1>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setOperationError(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Add Employee
        </button>
      </div>

      {operationError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 rounded-md text-sm">
           {operationError}
        </div>
      )}

      <EmployeeTable
        employees={employees}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        isDeleting={operationLoading}
        isEditing={isEditModalOpen ? editingEmployee?.id : null}
      />

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={handleEmployeeAdded}
      />

      {editingEmployee && (
          <EditEmployeeModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            employee={editingEmployee}
            onEmployeeUpdated={handleEmployeeUpdated}
          />
      )}
    </div>
  );
};

export default EmployeePage;
