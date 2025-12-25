import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { Calendar, ChevronLeft, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ManualDataList } from '../components/ManualDataList'
import { ScheduleItemForm } from '../components/ScheduleItemForm'
import { TaskItemForm } from '../components/TaskItemForm'
import type { ScheduleItem } from '../hooks/useScheduleItems'
import {
  useCreateScheduleItem,
  useDeleteScheduleItem,
  useScheduleItems,
  useUpdateScheduleItem,
} from '../hooks/useScheduleItems'
import type { TaskItem } from '../hooks/useTaskItems'
import {
  useCreateTaskItem,
  useDeleteTaskItem,
  useTaskItems,
  useUpdateTaskItem,
} from '../hooks/useTaskItems'
import { useWorkers } from '../hooks/useWorkers'

type TabType = 'schedule' | 'tasks'
type DateRangeType = 'today' | 'week' | 'month' | 'custom'

export function ManualDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('schedule')
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRangeType>('week')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | TaskItem | null>(null)

  const { data: workersData } = useWorkers()

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'today':
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        }
      case 'week':
        return {
          start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        }
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        }
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate,
        }
      default:
        return { start: '', end: '' }
    }
  }

  const { start: startDate, end: endDate } = getDateRange()

  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    refetch: refetchSchedule,
  } = useScheduleItems(selectedWorkerId, startDate, endDate)

  const {
    data: taskData,
    isLoading: taskLoading,
    refetch: refetchTasks,
  } = useTaskItems(selectedWorkerId, startDate, endDate)

  const createScheduleMutation = useCreateScheduleItem(selectedWorkerId)
  const updateScheduleMutation = useUpdateScheduleItem()
  const deleteScheduleMutation = useDeleteScheduleItem()

  const createTaskMutation = useCreateTaskItem(selectedWorkerId)
  const updateTaskMutation = useUpdateTaskItem()
  const deleteTaskMutation = useDeleteTaskItem()

  const handleCreateSchedule = async (data: Record<string, unknown>) => {
    await createScheduleMutation.mutateAsync(data)
    setShowScheduleForm(false)
    refetchSchedule()
  }

  const handleUpdateSchedule = async (data: Record<string, unknown>) => {
    if (!editingItem) return
    await updateScheduleMutation.mutateAsync({ itemId: editingItem.id, data })
    setEditingItem(null)
    refetchSchedule()
  }

  const handleDeleteSchedule = async (item: ScheduleItem) => {
    if (window.confirm('Are you sure you want to delete this schedule item?')) {
      await deleteScheduleMutation.mutateAsync(item.id)
      refetchSchedule()
    }
  }

  const handleCreateTask = async (data: Record<string, unknown>) => {
    await createTaskMutation.mutateAsync(data)
    setShowTaskForm(false)
    refetchTasks()
  }

  const handleUpdateTask = async (data: Record<string, unknown>) => {
    if (!editingItem) return
    await updateTaskMutation.mutateAsync({ itemId: editingItem.id, data })
    setEditingItem(null)
    refetchTasks()
  }

  const handleDeleteTask = async (item: TaskItem) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(item.id)
      refetchTasks()
    }
  }

  const handleEditItem = (item: ScheduleItem | TaskItem) => {
    setEditingItem(item)
  }

  const tabs = [
    { id: 'schedule' as TabType, label: 'Schedule Items', icon: <Calendar className='h-4 w-4' /> },
    { id: 'tasks' as TabType, label: 'Tasks', icon: <Plus className='h-4 w-4' /> },
  ]

  const currentItems = activeTab === 'schedule' ? scheduleData?.data || [] : taskData?.data || []
  const isLoading = activeTab === 'schedule' ? scheduleLoading : taskLoading

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <Link
          to='/workers'
          className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4'
        >
          <ChevronLeft className='h-4 w-4 mr-1' />
          Back to Workers
        </Link>
        <h1 className='text-3xl font-bold text-gray-900'>Manual Data Entry</h1>
        <p className='mt-2 text-gray-600'>Add schedule items and tasks for your workers</p>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Worker Selector */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <Users className='inline h-4 w-4 mr-1' />
              Worker
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value=''>Select a worker</option>
              {workersData?.workers?.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              <Calendar className='inline h-4 w-4 mr-1' />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeType)}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='today'>Today</option>
              <option value='week'>This Week</option>
              <option value='month'>This Month</option>
              <option value='custom'>Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <div className='col-span-1 md:col-span-3 grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Start Date</label>
                <input
                  type='date'
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>End Date</label>
                <input
                  type='date'
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200 mb-8'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className='ml-2'>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {selectedWorkerId ? (
        <div>
          {/* Add Button */}
          <div className='mb-6'>
            <button
              onClick={() =>
                activeTab === 'schedule' ? setShowScheduleForm(true) : setShowTaskForm(true)
              }
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <Plus className='h-4 w-4 mr-2' />
              Add {activeTab === 'schedule' ? 'Schedule Item' : 'Task'}
            </button>
          </div>

          {/* List */}
          <ManualDataList
            type={activeTab}
            items={currentItems}
            isLoading={isLoading}
            onEdit={handleEditItem}
            onDelete={activeTab === 'schedule' ? handleDeleteSchedule : handleDeleteTask}
          />
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
          <Users className='h-12 w-12 text-gray-400 mx-auto mb-3' />
          <p className='text-gray-500'>Select a worker to manage their schedule and tasks</p>
        </div>
      )}

      {/* Forms */}
      {showScheduleForm && (
        <ScheduleItemForm
          workerId={selectedWorkerId}
          onSubmit={handleCreateSchedule}
          onCancel={() => setShowScheduleForm(false)}
          isLoading={createScheduleMutation.isPending}
        />
      )}

      {showTaskForm && (
        <TaskItemForm
          workerId={selectedWorkerId}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
          isLoading={createTaskMutation.isPending}
        />
      )}

      {editingItem && activeTab === 'schedule' && (
        <ScheduleItemForm
          workerId={selectedWorkerId}
          initialData={{
            title: (editingItem as ScheduleItem).title,
            startTime: (editingItem as ScheduleItem).start_time,
            endTime: (editingItem as ScheduleItem).end_time,
            location: (editingItem as ScheduleItem).location,
            description: (editingItem as ScheduleItem).description,
          }}
          onSubmit={handleUpdateSchedule}
          onCancel={() => setEditingItem(null)}
          isLoading={updateScheduleMutation.isPending}
        />
      )}

      {editingItem && activeTab === 'tasks' && (
        <TaskItemForm
          workerId={selectedWorkerId}
          initialData={{
            title: (editingItem as TaskItem).title,
            description: (editingItem as TaskItem).description,
            dueDate: (editingItem as TaskItem).due_date,
            priority: (editingItem as TaskItem).priority,
            status: (editingItem as TaskItem).status,
          }}
          onSubmit={handleUpdateTask}
          onCancel={() => setEditingItem(null)}
          isLoading={updateTaskMutation.isPending}
        />
      )}
    </div>
  )
}

export default ManualDataPage
