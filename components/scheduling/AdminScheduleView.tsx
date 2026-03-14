'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

interface ScheduleBlock {
  id: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
  label: string;
  is_break: boolean;
}

interface Schedule {
  id: string;
  employee_id: string;
  week_start_date: string;
  created_at: string;
}

const PRESETS = {
  '9-5 Standard': [
    { start_time: '09:00', end_time: '12:30', label: 'Work', is_break: false },
    { start_time: '12:30', end_time: '13:30', label: 'Lunch', is_break: true },
    { start_time: '13:30', end_time: '17:00', label: 'Work', is_break: false },
  ],
  'Morning Shift': [
    { start_time: '06:00', end_time: '09:00', label: 'Work', is_break: false },
    { start_time: '09:00', end_time: '10:00', label: 'Break', is_break: true },
    { start_time: '10:00', end_time: '14:00', label: 'Work', is_break: false },
  ],
  'Evening Shift': [
    { start_time: '14:00', end_time: '18:00', label: 'Work', is_break: false },
    { start_time: '18:00', end_time: '19:00', label: 'Break', is_break: true },
    { start_time: '19:00', end_time: '22:00', label: 'Work', is_break: false },
  ],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AdminScheduleView({ employees }: { employees: Profile[] }) {
  const supabase = createClient();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Partial<ScheduleBlock> | null>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadSchedule();
    }
  }, [selectedEmployeeId, currentWeekStart]);

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
        .eq('employee_id', selectedEmployeeId)
        .gte('date', weekStartStr)
        .lt('date', weekEndStr);

      if (error) throw error;
      setScheduleBlocks(data || []);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveBlock() {
    if (!editingBlock || !selectedEmployeeId) return;

    try {
      const blockDate = new Date(currentWeekStart);
      blockDate.setDate(blockDate.getDate() + selectedDay);
      const dateStr = blockDate.toISOString().split('T')[0];

      if (editingBlock.id) {
        const { error } = await supabase
          .from('schedule_blocks')
          .update({
            start_time: editingBlock.start_time,
            end_time: editingBlock.end_time,
            label: editingBlock.label,
            is_break: editingBlock.is_break,
          })
          .eq('id', editingBlock.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedule_blocks').insert([
          {
            employee_id: selectedEmployeeId,
            date: dateStr,
            start_time: editingBlock.start_time,
            end_time: editingBlock.end_time,
            label: editingBlock.label,
            is_break: editingBlock.is_break,
          },
        ]);

        if (error) throw error;
      }

      setEditingBlock(null);
      setShowBlockForm(false);
      loadSchedule();
    } catch (error) {
      console.error('Failed to save block:', error);
    }
  }

  async function deleteBlock(blockId: string) {
    try {
      const { error } = await supabase.from('schedule_blocks').delete().eq('id', blockId);

      if (error) throw error;
      loadSchedule();
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  }

  async function applyPreset(dayIndex: number, presetName: keyof typeof PRESETS) {
    const preset = PRESETS[presetName];
    const blockDate = new Date(currentWeekStart);
    blockDate.setDate(blockDate.getDate() + dayIndex);
    const dateStr = blockDate.toISOString().split('T')[0];

    try {
      await supabase.from('schedule_blocks').delete().eq('employee_id', selectedEmployeeId).eq('date', dateStr);

      const blocks = preset.map((block) => ({
        employee_id: selectedEmployeeId,
        date: dateStr,
        ...block,
      }));

      const { error } = await supabase.from('schedule_blocks').insert(blocks);

      if (error) throw error;
      loadSchedule();
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  }

  async function copyDayToDay(fromDay: number, toDay: number) {
    const fromDate = new Date(currentWeekStart);
    fromDate.setDate(fromDate.getDate() + fromDay);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const toDate = new Date(currentWeekStart);
    toDate.setDate(toDate.getDate() + toDay);
    const toDateStr = toDate.toISOString().split('T')[0];

    try {
      const { data: fromBlocks, error: fetchError } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .eq('date', fromDateStr);

      if (fetchError) throw fetchError;

      await supabase.from('schedule_blocks').delete().eq('employee_id', selectedEmployeeId).eq('date', toDateStr);

      if (fromBlocks && fromBlocks.length > 0) {
        const newBlocks = fromBlocks.map(({ id, schedule_id, created_at, ...block }) => ({
          ...block,
          date: toDateStr,
        }));

        const { error: insertError } = await supabase.from('schedule_blocks').insert(newBlocks);
        if (insertError) throw insertError;
      }

      loadSchedule();
    } catch (error) {
      console.error('Failed to copy day:', error);
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
        <h1 className="text-3xl font-bold">Admin Schedule Manager</h1>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <button onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() - 7)))} className="p-2 hover:bg-gray-100 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold min-w-[200px]">
          {weekStart} - {weekEnd}
        </span>
        <button onClick={() => setCurrentWeekStart(new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 7)))} className="p-2 hover:bg-gray-100 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="ml-auto flex gap-2">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name || emp.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 bg-white p-4 rounded-lg border">
        {DAYS.map((day, dayIndex) => (
          <div key={dayIndex} className="space-y-2">
            <h3 className="font-semibold text-center text-sm">{day}</h3>

            <div className="space-y-1 min-h-[300px] bg-gray-50 p-2 rounded">
              {getBlocksForDay(dayIndex).map((block) => (
                <div
                  key={block.id}
                  className={`text-xs p-2 rounded cursor-pointer relative group ${
                    block.is_break ? 'bg-gray-100' : 'bg-brand-50'
                  }`}
                  onClick={() => {
                    setEditingBlock(block);
                    setSelectedDay(dayIndex);
                    setShowBlockForm(true);
                  }}
                >
                  <div className="font-semibold">{block.label}</div>
                  <div className="text-gray-600">
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBlock(block.id);
                    }}
                    className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  setEditingBlock({});
                  setSelectedDay(dayIndex);
                  setShowBlockForm(true);
                }}
                className="w-full py-2 text-xs text-gray-600 hover:bg-gray-200 rounded flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Block
              </button>
            </div>

            <div className="flex gap-1">
              <select
                onChange={(e) => applyPreset(dayIndex, e.target.value as keyof typeof PRESETS)}
                className="flex-1 text-xs px-2 py-1 border rounded"
                defaultValue=""
              >
                <option value="">Preset...</option>
                {Object.keys(PRESETS).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h2 className="text-xl font-bold">
              {editingBlock?.id ? 'Edit Block' : 'Add Block'} - {DAYS[selectedDay]}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={editingBlock?.label || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, label: e.target.value })}
                  placeholder="e.g., Work, Break"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editingBlock?.start_time || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={editingBlock?.end_time || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingBlock?.is_break || false}
                  onChange={(e) => setEditingBlock({ ...editingBlock, is_break: e.target.checked })}
                />
                <span className="text-sm">Is Break</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBlockForm(false);
                  setEditingBlock(null);
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBlock}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
