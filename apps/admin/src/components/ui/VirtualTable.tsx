import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useMemo, useRef } from 'react'
import { StatusBadge } from './Table'

interface Column<T> {
  key: keyof T
  title: string
  render?: (value: T[keyof T], record: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface VirtualTableProps<T> {
  columns: Column<T>[]
  data: T[]
  height?: number | string
  estimateRowHeight?: number
  emptyMessage?: string
  onRowClick?: (record: T, index: number) => void
  rowClassName?: (record: T, index: number) => string
  className?: string
}

export function VirtualTable<T extends Record<string, unknown>>({
  columns,
  data,
  height = 400,
  estimateRowHeight = 60,
  emptyMessage = 'No data available',
  onRowClick,
  rowClassName,
  className = '',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 5,
  })

  const totalWidth = useMemo(() => {
    return columns.reduce((total, col) => {
      if (col.width) {
        return total + parseInt(col.width)
      }
      return total + 150 // Default width
    }, 0)
  }, [columns])

  if (!data || data.length === 0) {
    return <div className={`text-center py-12 text-gray-500 ${className}`}>{emptyMessage}</div>
  }

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Fixed header */}
      <div className='bg-gray-50 border-b border-gray-200'>
        <div style={{ minWidth: `${totalWidth}px` }}>
          <div className='flex'>
            {columns.map((column) => (
              <div
                key={String(column.key)}
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex-shrink-0 ${
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                }`}
                style={{ width: column.width || '150px' }}
              >
                {column.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Virtualized body */}
      <div ref={parentRef} className='overflow-auto' style={{ height }}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            minWidth: `${totalWidth}px`,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const record = data[virtualItem.index]
            return (
              <div
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={`
                  bg-white border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                  ${rowClassName ? rowClassName(record, virtualItem.index) : ''}
                `}
                onClick={() => onRowClick?.(record, virtualItem.index)}
              >
                <div className='flex h-full items-center'>
                  {columns.map((column) => {
                    const value = record[column.key]
                    const content = column.render
                      ? column.render(value, record, virtualItem.index)
                      : value

                    return (
                      <div
                        key={String(column.key)}
                        className={`px-6 py-4 text-sm flex-shrink-0 ${
                          column.align === 'center'
                            ? 'text-center justify-center'
                            : column.align === 'right'
                              ? 'text-right justify-end'
                              : 'text-left'
                        }`}
                        style={{ width: column.width || '150px' }}
                      >
                        {content}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Export StatusBadge for convenience
export { StatusBadge }
