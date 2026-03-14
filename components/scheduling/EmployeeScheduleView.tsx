'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleBlock {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  label: string;
  is_break: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function EmployeeScheduleView({ userId }: { userId: string }) {
  const supabase = createClient();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [userId, currentWeekStart]);

  async function loadSchedule() {
    setLoading(true);
    try {
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];
      const weekEndStr = new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 7))
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('employee_id', userId)
        .gte('date', weekStartStr)
        .lt('date', weekEndStr)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setScheduleBlocks(data || []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  function getBlocksForDay(dayIndex: number): ScheduleBlock[] {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIndex);
    const dateStr = date.toISOString().split('T')[0];

    return scheduleBlocks.filter((b) => b.date === dateStr);
  }

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  const weekStart = currentWeekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const weekEnd = new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6)).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Schedule</h1>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <button
          onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() - 7)))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold min-w-[200px]">
          {weekStart} - {weekEnd}
        </span>
        <button
          onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 7)))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-lg border">
          {DAYS.map((day, dayIndex) => (
            <div key={dayIndex} className="space-y-2">
              <h3 className="font-semibold text-center text-sm">{day}</h3>

              <div className="space-y-1 min-h-[300px] bg-gray-50 p-2 rounded">
                {getBlocksForDay(dayIndex).length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">No schedule</div>
                ) : (
                  getBlocksForDay(dayIndex).map((block) => (
                    <div
                      key={block.id}
                      className={`text-xs p-2 rounded ${
                        block.is_break ? 'bg-gray-100 text-gray-700' : 'bg-brand-50 text-gray-900'
                      }`}
                    >
                      <div className="font-semibold">{block.label}</div>
                      <div className="text-gray-600 text-xs">
                        {formatTime(block.start_time)} - {formatTime(block.end_time)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
