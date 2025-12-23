import React from 'react';

interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (record: T, index: number) => void;
  rowClassName?: (record: T, index: number) => string;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  className = '',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.align === 'center' ? 'text-center' : 
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record, index) => (
            <tr
              key={record.id || index}
              className={`
                ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${rowClassName ? rowClassName(record, index) : ''}
              `}
              onClick={() => onRowClick?.(record, index)}
            >
              {columns.map((column) => {
                const value = record[column.key];
                const content = column.render ? column.render(value, record, index) : value;
                
                return (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status badge component for table cells
interface StatusBadgeProps {
  active: boolean;
  label?: string;
}

export function StatusBadge({ active, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        active
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {label || (active ? 'Active' : 'Inactive')}
    </span>
  );
}

// Loading skeleton for table
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={i}
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
