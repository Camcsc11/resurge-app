"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

interface Trend {
  id: string;
  title: string;
  description: string;
  platform: string;
  virality_score: number;
  category: string;
  is_saved: boolean;
  saved_count: number;
  notes: string | null;
}

export default function TrendsClient({ initialTrends }: { initialTrends: Trend[] }) {
  const supabase = createClient();
  const [trends, setTrends] = useState<Trend[]>(initialTrends);
  const [sortBy, setSortBy] = useState<string>("virality_score");
  const [sortOrder, setSortOrder] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);

  const sorted = [...trends].sort((a, b) => {
    let comp = 0;
    if (sortBy === "virality_score") {
      comp = a.virality_score - b.virality_score;
    } else if (sortBy === "saved_count") {
      comp = a.saved_count - b.saved_count;
    }
    return sortOrder ? comp : -comp;
  });

  const filtered = sorted.filter((t) => {
    const matchesSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSaved = !savedOnly || t.is_saved;
    return matchesSearch && matchesSaved;
  });

  return (
    <div className="p-6 space-y-4" >
      heading and filters for trends management
    </div>
  );
}
