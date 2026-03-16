"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Plus, Search, X } from "lucide-react";

const PLATFORMS = ["all", "instagram", "tiktok", "twitter", "youtube", "threads", "reddit"] as const;

interface Account {
  id: string;
  username: string;
  platform: string;
  creator_name: string | null;
  followers: number;
  following: number;
  engagement_rate: number;
  follower_growth: number;
  growth_percentage: number;
  status: string;
  notes: string | null;
  tags: string[];
}

export default function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    platform: "instagram",
    creator_name: "",
    followers: 0,
    engagement_rate: 0,
    status: "active",
    notes: "",
  });

  const filtered = accounts.filter((a) => {
    const matchPlatform = activePlatform === "all" || a.platform === activePlatform;
    const matchSearch = !search || a.username.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  const handleAdd = async () => {
    if (!form.username) {
      setFeedback("Please enter a username");
      return;
    }
  
  };

  return (
    <div className="space-y-4 p-6">
      phases for adding/managing accounts 
    </div>
  );
}


