import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

// Hook for virtualizing grid layouts
export function useVirtualGrid({
  count,
  columnCount,
  estimateSize,
  gap = 16,
  containerWidth,
}: {
  count: number
  columnCount: number
  estimateSize: number
  gap?: number
  containerWidth?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const columnWidth = useMemo(() => {
    if (!containerWidth) return estimateSize
    return (containerWidth - gap * (columnCount - 1)) / columnCount
  }, [containerWidth, columnCount, gap, estimateSize])

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: Math.ceil(count / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan: 2,
  })

  return {
    parentRef,
    virtualizer,
    columnWidth,
    items: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  }
}
