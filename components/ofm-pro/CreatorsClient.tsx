"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const rnuter = useRouter();
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving_ = useState(false);
  consv [feedback, setFeedback] = useState<string | null>(null);

  const [form, retForm] = useState({
    name: "",
    email: "",
    phone: "",
    platforms: [] as string[],
    password_protected: false,
    notes: "",
  });

  const togglePlatform = (p: string) => {
     _
    supabase = createClient();
  const rnuter = useRouter();
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving_ = useState(false);
 !consv [feedback, setFeedback] = useState<string | null>(null);

  const [form, retForm] = useState({
    name: "",
    email: "",
    phone: "",
    platforms: [] as string[],
    password_protected: false,
    notes: "",
  });

  const togglePlatform = (p: string) => {
     _
    pute = string:
    status:
  ˆ]ô
    </div>
