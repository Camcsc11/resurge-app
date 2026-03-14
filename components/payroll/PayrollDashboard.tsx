'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';
import { ChevronDown, ChevronRight, Plus, Save, X } from 'lucide-react';

interface PayPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  created_at: string;
}

interface FinishedClip {
  id: string;
  editor_id: string;
  finished_at: string;
}

interface EditorCommission {
  id: string;
  editor_id: string;
  pay_period_id: string;
  amount: number;
  note: string;
  created_at: string;
}

interface PayrollSnapshot {
  id: string;
  pay_period_id: string;
  editor_id: string;
  clips_finished: number;
  base_pay: number;
  commission: number;
  total_pay: number;
  created_at: string;
}

export function PayrollDashboard({ editors }: { editors: Profile[] }) {
  const supabase = createClient();
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<PayPeriod | null>(null);
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  const [finishedClips, setFinishedClips] = useState<FinishedClip[]>([]);
  const [commissions, setCommissions] = useState<EditorCommission[]>([]);
  const [snapshots, setSnapshots] = useState<PayrollSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<{
    editorId: string;
    amount: string;
    note: string;
  } | null>(null);

  const [newPeriodForm, setNewPeriodForm] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadPayPeriods();
  }, []);

  async function loadPayPeriods() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pay_periods')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPayPeriods(data || []);

      const openPeriod = (data || []).find((p) => p.status === 'open');
      if (openPeriod) {
        setCurrentPeriod(openPeriod);
        loadPeriodData(openPeriod.id);
      }
    } catch (error) {
      console.error('Failed to load pay periods:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPeriodData(periodId: string) {
    try {
      const period = payPeriods.find((p) => p.id === periodId);
      if (!period) return;

      const { data: clipsData, error: clipsError } = await supabase
        .from('finished_clips')
        .select('*')
        .gte('finished_at', period.start_date)
        .lt('finished_at', new Date(new Date(period.end_date).setDate(new Date(period.end_date).getDate() + 1)).toISOString());

      if (clipsError) throw clipsError;
      setFinishedClips(clipsData || []);

      const { data: commissionsData, error: commissionsError } = await supabase
        .from('editor_commissions')
        .select('*')
        .eq('pay_period_id', periodId);

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

      if (period.status === 'closed') {
        const { data: snapshotsData, error: snapshotsError } = await supabase
          .from('payroll_snapshots')
          .select('*')
          .eq('pay_period_id', periodId);

        if (snapshotsError) throw snapshotsError;
        setSnapshots(snapshotsData || []);
      }
    } catch (error) {
      console.error('Failed to load period data:', error);
    }
  }

  async function createPayPeriod() {
    if (!newPeriodForm.start_date || !newPeriodForm.end_date) return;

    try {
      const { error } = await supabase.from('pay_periods').insert([
        {
          start_date: newPeriodForm.start_date,
          end_date: newPeriodForm.end_date,
          status: 'open',
        },
      ]);

      if (error) throw error;
      setNewPeriodForm({ start_date: '', end_date: '' });
      setShowNewPeriodForm(false);
      loadPayPeriods();
    } catch (error) {
      console.error('Failed to create pay period:', error);
    }
  }

  async function closePeriod() {
    if (!currentPeriod) return;

    try {
      const { error: updateError } = await supabase
        .from('pay_periods')
        .update({ status: 'closed' })
        .eq('id', currentPeriod.id);

      if (updateError) throw updateError;

      for (const editor of editors) {
        const editorClips = finishedClips.filter((c) => c.editor_id === editor.id);
        const basePayAmount = editorClips.length * 1;
        const commission = commissions.find((c) => c.editor_id === editor.id);
        const commissionAmount = commission?.amount || 0;
        const totalPay = basePayAmount + commissionAmount;

        const { error: snapshotError } = await supabase.from('payroll_snapshots').insert([
          {
            pay_period_id: currentPeriod.id,
            editor_id: editor.id,
            clips_finished: editorClips.length,
            base_pay: basePayAmount,
            commission: commissionAmount,
            total_pay: totalPay,
          },
        ]);

        if (snapshotError) throw snapshotError;
      }

      loadPayPeriods();
    } catch (error) {
      console.error('Failed to close period:', error);
    }
  }

  async function updateCommission(editorId: string, amount: number, note: string) {
    if (!currentPeriod) return;

    try {
      const existing = commissions.find((c) => c.editor_id === editorId);

      if (existing) {
        const { error } = await supabase
          .from('editor_commissions')
          .update({ amount, note })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('editor_commissions').insert([
          {
            editor_id: editorId,
            pay_period_id: currentPeriod.id,
            amount,
            note,
          },
        ]);

        if (error) throw error;
      }

      setEditingCommission(null);
      loadPeriodData(currentPeriod.id);
    } catch (error) {
      console.error('Failed to update commission:', error);
    }
  }

  const clipsPerEditor = editors.map((editor) => ({
    editor,
    clips: finishedClips.filter((c) => c.editor_id === editor.id).length,
  }));

  const totalBasePay = clipsPerEditor.reduce((sum, item) => sum + item.clips * 1, 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const totalPay = totalBasePay + totalCommissions;

  const closedPeriods = payPeriods.filter((p) => p.status === 'closed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="text-xl font-semibold">Current Pay Period</h2>

        {currentPeriod ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold">
                  {new Date(currentPeriod.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-semibold">
                  {new Date(currentPeriod.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-green-600">Open</p>
              </div>
            </div>

            <button
              onClick={closePeriod}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close Pay Period & Create Snapshots
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No open pay period. Create one to get started.</p>
            <button
              onClick={() => setShowNewPeriodForm(!showNewPeriodForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Pay Period
            </button>

            {showNewPeriodForm && (
              <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newPeriodForm.start_date}
                      onChange={(e) => setNewPeriodForm({ ...newPeriodForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                      type="date"
                      value={newPeriodForm.end_date}
                      onChange={(e) => setNewPeriodForm({ ...newPeriodForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewPeriodForm(false)}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPayPeriod}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {currentPeriod && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Editor Name</th>
                  <th className="text-right px-4 py-3 font-semibold">Clips Finished</th>
                  <th className="text-right px-4 py-3 font-semibold">Base Pay</th>
                  <th className="text-right px-4 py-3 font-semibold">Commission</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Pay</th>
                </tr>
              </thead>
              <tbody>
                {clipsPerEditor.map(({ editor, clips }) => {
                  const basePay = clips * 1;
                  const commission = commissions.find((c) => c.editor_id === editor.id)?.amount || 0;
                  const totalPayForEditor = basePay + commission;

                  return (
                    <tr key={editor.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{editor.full_name || editor.id}</td>
                      <td className="text-right px-4 py-3">{clips}</td>
                      <td className="text-right px-4 py-3">${basePay.toFixed(2)}</td>
                      <td className="text-right px-4 py-3">
                        {editingCommission?.editorId === editor.id ? (
                          <div className="flex gap-1">
                            <input
                              type="number"
                              value={editingCommission.amount}
                              onChange={(e) =>
                                setEditingCommission({
                                  ...editingCommission,
                                  amount: e.target.value,
                                })
                              }
                              step="0.01"
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() =>
                                updateCommission(
                                  editor.id,
                                  parseFloat(editingCommission.amount),
                                  editingCommission.note
                                )
                              }
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingCommission(null)}
                              className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingCommission({
                                editorId: editor.id,
                                amount: commission.toString(),
                                note: commissions.find((c) => c.editor_id === editor.id)?.note || '',
                              })
                            }
                            className="text-blue-600 hover:underline"
                          >
                            ${commission.toFixed(2)}
                          </button>
                        )}
                      </td>
                      <td className="text-right px-4 py-3 font-semibold">
                        ${totalPayForEditor.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="text-right px-4 py-3">
                    {clipsPerEditor.reduce((sum, item) => sum + item.clips, 0)}
                  </td>
                  <td className="text-right px-4 py-3">${totalBasePay.toFixed(2)}</td>
                  <td className="text-right px-4 py-3">${totalCommissions.toFixed(2)}</td>
                  <td className="text-right px-4 py-3">${totalPay.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {closedPeriods.length > 0 && (
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Historical Pay Periods</h2>

          <div className="space-y-2">
            {closedPeriods.map((period) => {
              const periodSnapshots = snapshots.filter((s) => s.pay_period_id === period.id);
              const isExpanded = expandedPeriod === period.id;

              return (
                <div key={period.id} className="border rounded-lg">
                  <button
                    onClick={() => {
                      setExpandedPeriod(isExpanded ? null : period.id);
                      if (!isExpanded && periodSnapshots.length === 0) {
                        loadPeriodData(period.id);
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      <div className="text-left">
                        <p className="font-semibold">
                          {new Date(period.start_date).toLocaleDateString()} -{' '}
                          {new Date(period.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Closed</p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      ${periodSnapshots.reduce((sum, s) => sum + s.total_pay, 0).toFixed(2)}
                    </p>
                  </button>

                  {isExpanded && periodSnapshots.length > 0 && (
                    <div className="overflow-x-auto border-t">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold">Editor</th>
                            <th className="text-right px-4 py-2 font-semibold">Clips</th>
                            <th className="text-right px-4 py-2 font-semibold">Base Pay</th>
                            <th className="text-right px-4 py-2 font-semibold">Commission</th>
                            <th className="text-right px-4 py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodSnapshots.map((snapshot) => {
                            const editor = editors.find((e) => e.id === snapshot.editor_id);
                            return (
                              <tr key={snapshot.id} className="border-t">
                                <td className="px-4 py-2">{editor?.full_name || snapshot.editor_id}</td>
                                <td className="text-right px-4 py-2">{snapshot.clips_finished}</td>
                                <td className="text-right px-4 py-2">
                                  ${snapshot.base_pay.toFixed(2)}
                                </td>
                                <td className="text-right px-4 py-2">
                                  ${snapshot.commission.toFixed(2)}
                                </td>
                                <td className="text-right px-4 py-2 font-semibold">
                                  ${snapshot.total_pay.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
