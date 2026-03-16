"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, X } from "lucide-react";

interface Request {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Creator {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  platforms: string[];
  status: string;
  total_requests: number;
  completed_requests: number;
  pending_requests: number;
}

export default function CreatorDetailClient({
  creator,
  initialRequests,
  userId,
}: {
  creator: Creator;
  initialRequests: Request[];
  userId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "normal",
    due_date: "",
    notes: "",
  });

  const filtered = requests.filter((r) => {
    if (activeTab === "pending") return r.status === "pending" || r.status === "in_progress";
    if (activeTab === "completed") return r.status === "completed" || r.status === "rejected";
    return true;
  });

  const handleAddRequest = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase.from("ofm_requests").insert({
      user_id: userId,
      creator_id: creator.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
    }).select().single();

    if (error) {
      setFeedback("Error: " + error.message);
    } else if (data) {
      setRequests(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ title: "", description: "", priority: "normal", due_date: "", notes: "" });
      setFeedback("Request created!");

      // Update creator request counts
      await supabase.from("ofm_creators").update({
        total_requests: creator.total_requests + 1,
        pending_requests: creator.pending_requests + 1,
      }).eq("id", creator.id);
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateStatus = async (reqId: string, newStatus: string) => {
    const { error } = await supabase.from("ofm_requests").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", reqId);

    if (!error) {
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
      setFeedback(`Request marked as ${newStatus.replace("_", " ")}`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteRequest = async (reqId: string) => {
    const { error } = await supabase.from("ofm_requests").delete().eq("id", reqId);
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setFeedback("Request deleted.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-gray-500/20 text-gray-400",
    normal: "bg-blue-500/20 text-blue-400",
    high: "bg-orange-500/20 text-orange-400",
    urgent: "bg-red-500/20 text-red-400",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.push("/dashboard/ofm-pro/creators")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Creators
      </button>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {creator.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{creator.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {creator.email && <span className="text-xs text-gray-400">{creator.email}</span>}
                {creator.phone && <span className="text-xs text-gray-400">{creator.phone}</span>}
              </div>
              {creator.platforms.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {creator.platforms.map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">{p}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            creator.status === "active" ? "bg-green-500/20 text-green-400" :
            creator.status === "paused" ? "bg-yellow-500/20 text-yellow-400" :
            "bg-red-500/20 text-red-400"
          }`}>{creator.status}</span>
        </div>
      </div>

      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${feedback.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {feedback}
        </div>
      )}

      {/* Tabs + New Request */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "pending", "completed"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${activeTab === tab ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Requests */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No requests found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">{req.title}</h3>
                  {req.description && <p className="text-xs text-gray-400">{req.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[req.priority] || priorityColors.normal}`}>
                      {req.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[req.status] || statusColors.pending}`}>
                      {req.status.replace("_", " ")}
                    </span>
                    {req.due_date && (
                      <span className="text-xs text-gray-500">Due: {new Date(req.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "pending" && (
                    <button onClick={() => updateStatus(req.id, "in_progress")}
                      className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md hover:bg-blue-500/30">Start</button>
                  )}
                  {req.status === "in_progress" && (
                    <>
                      <button onClick={() => updateStatus(req.id, "completed")}
                        className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-md hover:bg-green-500/30">Complete</button>
                      <button onClick={() => updateStatus(req.id, "rejected")}
                        className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-md hover:bg-red-500/30">Reject</button>
                    </>
                  )}
                  <button onClick={() => handleDeleteRequest(req.id)}
                    className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Request for {creator.name}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="Request title" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" rows={2} />
              </div>
              <button onClick={handleAddRequest} disabled={saving || !form.title.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {saving ? "Creating..." : "Create Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
