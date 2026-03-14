'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';
import { Trash2, Plus, Calendar } from 'lucide-react';

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

export function AdminTaskManagement({ employees }: { employees: Profile[] }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'daily' | 'onetime' | 'dashboard'>('daily');
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [oneTineTasks, setOneTimeTasks] = useState<OneTimeTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [dashboardDate, setDashboardDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [dailyFormData, setDailyFormData] = useState({
    title: '',
    description: '',
    assigned_to: 'Everyone',
  });

  const [oneTimeFormData, setOneTimeFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as const,
    due_date: '',
  });

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  async function loadTasks() {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const { data, error } = await supabase
          .from('daily_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDailyTasks(data || []);
      } else if (activeTab === 'onetime') {
        const { data, error } = await supabase
          .from('one_time_tasks')
          .select('*')
          .order('due_date', { ascending: true });

        if (error) throw error;
        setOneTimeTasks(data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addDailyTask() {
    if (!dailyFormData.title.trim()) return;

    try {
      const { error } = await supabase.from('daily_tasks').insert([
        {
          title: dailyFormData.title,
          description: dailyFormData.description,
          assigned_to: dailyFormData.assigned_to,
          active: true,
        },
      ]);

      if (error) throw error;
      setDailyFormData({ title: '', description: '', assigned_to: 'Everyone' });
      setShowDailyForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  async function addOneTimeTask() {
    if (!oneTimeFormData.title.trim() || !oneTimeFormData.assigned_to || !oneTimeFormData.due_date) return;

    try {
      const { error } = await supabase.from('one_time_tasks').insert([
        {
          title: oneTimeFormData.title,
          description: oneTimeFormData.description,
          assigned_to: oneTimeFormData.assigned_to,
          priority: oneTimeFormData.priority,
          due_date: oneTimeFormData.due_date,
          completed: false,
        },
      ]);

      if (error) throw error;
      setOneTimeFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      setShowOneTimeForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  async function toggleDailyTask(taskId: string, active: boolean) {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ active: !active })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  async function deleteDailyTask(taskId: string) {
    try {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  async function toggleOneTimeTask(taskId: string, completed: boolean) {
    try {
      const { error } = await supabase
        .from('one_time_tasks')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  async function deleteOneTimeTask(taskId: string) {
    try {
      const { error } = await supabase.from('one_time_tasks').delete().eq('id', taskId);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Task Management</h1>

      <div className="flex gap-2 border-b">
        {(['daily', 'onetime', 'dashboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'daily' && 'Daily Tasks'}
            {tab === 'onetime' && 'One-Time Tasks'}
            {tab === 'dashboard' && 'Completion Dashboard'}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowDailyForm(!showDailyForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Daily Task
          </button>

          {showDailyForm && (
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={dailyFormData.title}
                  onChange={(e) => setDailyFormData({ ...dailyFormData, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={dailyFormData.description}
                  onChange={(e) => setDailyFormData({ ...dailyFormData, description: e.target.value })}
                  placeholder="Task description"
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign To</label>
                <select
                  value={dailyFormData.assigned_to}
                  onChange={(e) => setDailyFormData({ ...dailyFormData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Everyone">Everyone</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDailyForm(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addDailyTask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {dailyTasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-lg border flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.active}
                      onChange={() => toggleDailyTask(task.id, task.active)}
                      className="w-4 h-4"
                    />
                    <h3 className="font-semibold">{task.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Assigned to: {task.assigned_to === 'Everyone' ? 'Everyone' : `Employee ${task.assigned_to}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteDailyTask(task.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'onetime' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowOneTimeForm(!showOneTimeForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add One-Time Task
          </button>

          {showOneTimeForm && (
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={oneTimeFormData.title}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={oneTimeFormData.description}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, description: e.target.value })}
                  placeholder="Task description"
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign To</label>
                <select
                  value={oneTimeFormData.assigned_to}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={oneTimeFormData.priority}
                    onChange={(e) =>
                      setOneTimeFormData({
                        ...oneTimeFormData,
                        priority: e.target.value as 'low' | 'medium' | 'high',
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={oneTimeFormData.due_date}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowOneTimeForm(false)}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addOneTimeTask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Task
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {oneTineTasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-lg border flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleOneTimeTask(task.id, task.completed)}
                      className="w-4 h-4"
                    />
                    <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteOneTimeTask(task.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg border">
            <Calendar className="w-5 h-5 text-gray-600" />
            <input
              type="date"
              value={dashboardDate}
              onChange={(e) => setDashboardDate(e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <span className="text-sm text-gray-600">
              {new Date(dashboardDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold">Tasks Completed</th>
                  <th className="text-left px-4 py-3 font-semibold">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const totalTasks = dailyTasks.filter((t) => t.assigned_to === 'Everyone' || t.assigned_to === emp.id).length;
                  const completedCount = dailyTasks.filter(
                    (t) => (t.assigned_to === 'Everyone' || t.assigned_to === emp.id) && t.active
                  ).length;
                  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

                  return (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{emp.full_name || emp.id}</td>
                      <td className="px-4 py-3">
                        {completedCount} / {totalTasks}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
