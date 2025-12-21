import { useState } from 'react';
import { WorkerList } from '../components/WorkerList';
import { WorkerForm } from '../components/WorkerForm';
import { useWorkers, useDebouncedSearch } from '../hooks/useWorkers';
import { useDeleteWorker } from '../hooks/useWorkerMutation';
import type { Worker } from '@dashboard-link/shared';

export function WorkersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { searchValue, setSearchValue } = useDebouncedSearch(300);
  const deleteWorker = useDeleteWorker();

  const { workers, pagination, isLoading, error, refetch } = useWorkers({
    search: searchValue,
    status: statusFilter,
    page: currentPage,
    limit: 20,
  });

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setIsFormOpen(true);
  };

  const handleDelete = (worker: Worker) => {
    deleteWorker.mutate(worker.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleAddWorker = () => {
    setEditingWorker(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingWorker(undefined);
  };

  const handleFormSuccess = async () => {
    setIsFormOpen(false);
    setEditingWorker(undefined);
    refetch();
  };

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading workers
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's workers and their access to dashboards
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleAddWorker}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-2 -ml-1 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Worker
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Workers
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Workers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Worker Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {workers.length} of {pagination?.total || 0} workers
        </p>
      </div>

      {/* Worker List */}
      <WorkerList
        workers={workers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm border rounded-md ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Worker Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingWorker ? 'Edit Worker' : 'Add New Worker'}
              </h3>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <WorkerForm
              worker={editingWorker}
              onSubmit={handleFormSuccess}
              onCancel={handleFormClose}
              isLoading={deleteWorker.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
