import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useMemo, useRef } from 'react'

interface VirtualListProps<T> {
  items: T[]
  estimateSize?: number
  height?: string
  className?: string
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export function VirtualList<T>({
  items,
  estimateSize = 60,
  height = '400px',
  className = '',
  overscan = 5,
  renderItem,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const itemsToRender = useMemo(() => virtualizer.getVirtualItems(), [virtualizer])

  return (
    <div ref={parentRef} className={`overflow-auto ${className}`} style={{ height }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {itemsToRender.map((virtualItem) => (
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
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
