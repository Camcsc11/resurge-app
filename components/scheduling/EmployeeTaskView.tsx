'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  active: boolean;
  created_at: string;
}

interface OneTimeTask {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  completed: boolean;
  created_at: string;
}

interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
}

export function EmployeeTaskView({ userId }: { userId: string }) {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [oneTimeTasks, setOneTimeTasks] = useState<OneTimeTask[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    loadCompletions();
  }, [userId, currentDate]);

  async function loadTasks() {
    setLoading(true);
    try {
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('active', true)
        .or(`assigned_to.eq.Everyone,assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (dailyError) throw dailyError;
      setDailyTasks(dailyData || []);

      const { data: oneTimeData, error: oneTimeError } = await supabase
        .from('one_time_tasks')
        .select('*')
        .eq('assigned_to', userId)
        .eq('completed', false)
        .gte('due_date', currentDate)
        .order('due_date', { ascending: true });

      if (oneTimeError) throw oneTimeError;
      setOneTimeTasks(oneTimeData || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompletions() {
    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('completion_date', currentDate);

      if (error) throw error;
      setCompletions(data || []);
    } catch (error) {
      console.error('Failed to load completions:', error);
    }
  }

  async function toggleDailyTaskCompletion(taskId: string) {
    const existing = completions.find((c) => c.task_id === taskId);

    try {
      if (existing) {
        const { error } = await supabase.from('task_completions').delete().eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_completions').insert([
          {
            task_id: taskId,
            user_id: userId,
            completion_date: currentDate,
            completed_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      loadCompletions();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  }

  async function completeOneTimeTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('one_time_tasks')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }

  const activeDailyTasks = dailyTasks.filter((t) => t.assigned_to === 'Everyone' || t.assigned_to === userId);
  const completedCount = completions.length;
  const totalCount = activeDailyTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const displayDate = new Date(currentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Tasks</h1>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <button
          onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() - 1)).toISOString().split('T')[0])}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold min-w-[250px]">{displayDate}</span>
        <button
          onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() + 1)).toISOString().split('T')[0])}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
          className="ml-auto px-4 py-2 text-sm border rounded hover:bg-gray-50"
        >
          Today
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Daily Task Progress</span>
            <span className="text-sm text-gray-600">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{completionPercentage}% Complete</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : (
        <>
          {activeDailyTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Daily Tasks</h2>
              {activeDailyTasks.map((task) => {
                const isCompleted = completions.some((c) => c.task_id === task.id);
                return (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-lg border flex items-start gap-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleDailyTaskCompletion(task.id)}
                  >
                    <button className="mt-1 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-1 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {oneTimeTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">One-Time Tasks</h2>
              {oneTimeTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      {task.description && <p className="text-sm text-gray-600 mt-2">{task.description}</p>}
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => completeOneTimeTask(task.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap text-sm"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeDailyTasks.length === 0 && oneTimeTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No tasks for today. Great job!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
