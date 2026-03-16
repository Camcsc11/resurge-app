"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, X } from "lucide-react";

const PLATFORM_OPTIONS = ["instagram", "tiktok", "twitter", "youtube", "threads", "reddit"];

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
  password_protected: boolean;
  notes: string | null;
}

export default function CreatorsClient({ initialCreators }: { initialCreators: Creator[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    platforms: [] as string[],
    password_protected: false,
    notes: "",
  });

  const togglePlatform = (p: string) => {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
    }));
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data, error } = await supabase.from("ofm_creators").insert({
      user_id: user.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      platforms: form.platforms,
      password_protected: form.password_protected,
      notes: form.notes.trim() || null,
    }).select().single();

    if (error) {
      setFeedback("Error: " + error.message);
    } else if (data) {
      setCreators(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", platforms: [], password_protected: false, notes: "" });
      setFeedback("Creator added!");
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ofm_creators").delete().eq("id", id);
    if (!error) {
      setCreators(prev => prev.filter(c => c.id !== id));
      setFeedback("Creator removed.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Creator Portal</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Creator
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${feedback.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {feedback}
        </div>
      )}

      {/* Creator Cards Grid */}
      {creators.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No creators yet. Add your first creator!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map(creator => (
            <div key={creator.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/ofm-pro/creators/${creator.id}`)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{getInitials(creator.name)}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{creator.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      creator.status === "active" ? "bg-green-500/20 text-green-400" :
                      creator.status === "paused" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{creator.status}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(creator.id); }}
                  className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>

              {/* Platforms */}
              {creator.platforms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {creator.platforms.map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">{p}</span>
                  ))}
                </div>
              )}

              {/* Request Stats */}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="text-yellow-400">{creator.pending_requests} pending</span>
                <span className="text-green-400">{creator.completed_requests} completed</span>
                <span>{creator.total_requests} total</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Creator</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="Creator name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                        form.platforms.includes(p) ? "bg-brand-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pwd-protect" checked={form.password_protected}
                  onChange={(e) => setForm({ ...form, password_protected: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-900 border-gray-700" />
                <label htmlFor="pwd-protect" className="text-xs text-gray-400">Password Protected</label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" rows={2} />
              </div>
              <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {saving ? "Adding..." : "Add Creator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
