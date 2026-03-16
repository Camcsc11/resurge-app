"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link as LinkIcon, Plus, Copy, ChevronDown, ChevronUp, X } from "lucide-react";

interface DeepLink {
  id: string;
  name: string;
  original_url: string;
  short_code: string;
  total_clicks: number;
  unique_clicks: number;
  is_active: boolean;
  country_breakdown: Record<string, number>;
  device_breakdown: Record<string, number>;
  tags: string[];
  created_at: string;
}

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export default function LinksClient({ initialLinks }: { initialLinks: DeepLink[] }) {
  const supabase = createClient();
  const [links, setLinks] = useState<DeepLink[]>(initialLinks);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const [form, setForm] = useState({
    name: "",
    original_url: "",
    tags: "",
  });

  const filtered = links.filter(l => {
    if (filter === "active") return l.is_active;
    if (filter === "inactive") return !l.is_active;
    return true;
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !form.original_url.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const short_code = generateShortCode();
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

    const { data, error } = await supabase.from("ofm_links").insert({
      user_id: user.id,
      name: form.name.trim(),
      original_url: form.original_url.trim(),
      short_code,
      tags,
    }).select().single();

    if (error) {
      setFeedback("Error: " + error.message);
    } else if (data) {
      setLinks(prev => [data, ...prev]);
      setShowModal(false);
      setForm({ name: "", original_url: "", tags: "" });
      setFeedback("Link created!");
    }
    setSaving(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("ofm_links").update({ is_active: !current }).eq("id", id);
    if (!error) {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ofm_links").delete().eq("id", id);
    if (!error) {
      setLinks(prev => prev.filter(l => l.id !== id));
      setFeedback("Link deleted.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(`https://resurge.link/${code}`);
    setFeedback("Copied to clipboard!");
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Deep Links</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Create Link
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${feedback.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {feedback}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Links Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Short URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Original</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Clicks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Unique</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">No links found.</td></tr>
            ) : (
              filtered.map(link => (
                <>
                  <tr key={link.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === link.id ? null : link.id)}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{link.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-400 font-mono">/{link.short_code}</span>
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(link.short_code); }}
                          className="text-gray-500 hover:text-white"><Copy className="w-3 h-3" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate">{link.original_url}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{link.total_clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{link.unique_clicks.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); toggleActive(link.id, link.is_active); }}
                        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${link.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {link.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(link.id); }}
                        className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      {expandedId === link.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </td>
                  </tr>
                  {expandedId === link.id && (
                    <tr key={link.id + "-detail"}>
                      <td colSpan={7} className="px-4 py-4 bg-gray-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Country Breakdown */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-white mb-3">Top Countries</h4>
                            {Object.keys(link.country_breakdown || {}).length === 0 ? (
                              <p className="text-xs text-gray-500">No geo data yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {Object.entries(link.country_breakdown)
                                  .sort(([,a], [,b]) => (b as number) - (a as number))
                                  .slice(0, 5)
                                  .map(([country, visits]) => {
                                    const total = Object.values(link.country_breakdown).reduce((s: number, v: any) => s + (v as number), 0);
                                    const pct = total > 0 ? ((visits as number) / total * 100).toFixed(1) : "0";
                                    return (
                                      <div key={country} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-300 w-16">{country}</span>
                                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                                          <div className="bg-blue-500 rounded-full h-2" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                          {/* Device Breakdown */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-white mb-3">Device Breakdown</h4>
                            {Object.keys(link.device_breakdown || {}).length === 0 ? (
                              <p className="text-xs text-gray-500">No device data yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {Object.entries(link.device_breakdown).map(([device, count]) => {
                                  const total = Object.values(link.device_breakdown).reduce((s: number, v: any) => s + (v as number), 0);
                                  const pct = total > 0 ? ((count as number) / total * 100).toFixed(1) : "0";
                                  return (
                                    <div key={device} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-300 w-16 capitalize">{device}</span>
                                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                                        <div className="bg-purple-500 rounded-full h-2" style={{ width: `${pct}%` }} />
                                      </div>
                                      <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Tags */}
                        {link.tags && link.tags.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tags:</span>
                            {link.tags.map((t, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Create Deep Link</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Link Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="Campaign name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Original URL *</label>
                <input type="url" value={form.original_url} onChange={(e) => setForm({ ...form, original_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500" placeholder="campaign, q1, social" />
              </div>
              <p className="text-xs text-gray-500">A unique short code will be auto-generated.</p>
              <button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.original_url.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {saving ? "Creating..." : "Create Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
