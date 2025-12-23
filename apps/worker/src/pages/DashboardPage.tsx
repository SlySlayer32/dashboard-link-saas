import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ScheduleWidget from '../components/widgets/ScheduleWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import { useDashboardData } from '../hooks/useDashboardData';

function DashboardPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboardData(token);
  
  // Handle different error types
  useEffect(() => {
    if (error) {
      if (error.message.includes('expired')) {
        const expiredAt = new Date().toISOString();
        navigate(`/error/expired-token?expiredAt=${expiredAt}`, { replace: true });
      } else if (error.message.includes('Invalid') || error.message.includes('401')) {
        navigate('/error/invalid-token', { replace: true });
      }
    }
  }, [error, navigate]);

  // Pull-to-refresh functionality
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const isPulling = useRef(false);
  
  const handleTouchStart = useCallback((e: globalThis.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);
  
  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    if (!isPulling.current || startY.current === null) return;
    
    currentY.current = e.touches[0].clientY;
    const pullDistance = (currentY.current - startY.current) / 2;
    
    if (pullDistance > 0 && pullDistance < 150) {
      document.body.style.transform = `translateY(${pullDistance}px)`;
    }
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current || startY.current === null || currentY.current === null) return;
    
    const pullDistance = (currentY.current - startY.current) / 2;
    
    if (pullDistance > 100) {
      refetch();
    }
    
    document.body.style.transform = '';
    startY.current = null;
    currentY.current = null;
    isPulling.current = false;
  }, [refetch]);
  
  // Add and clean up touch event listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            This link may have expired or is invalid.
          </p>
          <p className="text-sm text-gray-500">
            Please request a new link from your administrator.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {data.worker.name}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">{today}</p>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Schedule Widget */}
        <ScheduleWidget schedule={data.schedule} />

        {/* Tasks Widget */}
        <TasksWidget tasks={data.tasks} />

        {/* Empty State */}
        {data.schedule.length === 0 && data.tasks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">
              No schedule or tasks for today. Enjoy your day!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
