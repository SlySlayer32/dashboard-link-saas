import React, { Profiler, ProfilerOnRenderCallback } from 'react'

interface PerformanceProfilerProps {
  id: string
  children: React.ReactNode
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({ id, children }) => {
  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    _startTime,
    _commitTime
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${id} ${phase} - Actual: ${actualDuration.toFixed(2)}ms, Base: ${baseDuration.toFixed(2)}ms`
      )
    }
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
