"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  profession: string;
  professionCustom?: string | null;
  city: string;
  role: string;
  verified: boolean;
  createdAt: string;
};

type Stats = {
  totalMembers: number;
  openBloodRequests: number;
  activeSosRequests: number;
  totalNotices: number;
};

const BLOOD_GROUPS_MAP: Record<string, string> = {
  A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
  O_POS: "O+", O_NEG: "O-", AB_POS: "AB+", AB_NEG: "AB-",
};

const ROLE_MAP: Record<string, string> = {
  ADMIN: "অ্যাডমিন",
  MODERATOR: "মডারেটর",
  MEMBER: "সদস্য",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "ADMIN") {
        router.push("/home");
        return;
      }
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resStats, resMembers] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/members"),
      ]);

      if (!resStats.ok || !resMembers.ok) {
        throw new Error("ডাটা লোড করতে ব্যর্থ হয়েছে");
      }

      const statsData = await resStats.json();
      const membersData = await resMembers.json();

      setStats(statsData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !currentStatus }),
      });

      if (!res.ok) throw new Error("স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে");

      const updated = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, verified: updated.verified } : m))
      );
      // Refresh stats
      const resStats = await fetch("/api/admin/stats");
      if (resStats.ok) setStats(await resStats.json());
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("রোল পরিবর্তন করতে ব্যর্থ হয়েছে");

      const updated = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: updated.role } : m))
      );
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই সদস্যকে অপসারণ করতে চান? এর সাথে সম্পর্কিত সকল ডাটা মুছে যাবে!")) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("অপসারণ করতে ব্যর্থ হয়েছে");

      setMembers((prev) => prev.filter((m) => m.id !== userId));
      // Refresh stats
      const resStats = await fetch("/api/admin/stats");
      if (resStats.ok) setStats(await resStats.json());
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">লোডিং...</p>
        </div>
      </div>
    );
  }

  const pendingMembers = members.filter((m) => !m.verified);
  const verifiedMembers = members.filter((m) => m.verified);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-950 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">অ্যাডমিন প্যানেল</h1>
            <p className="text-xs text-gray-400 mt-0.5">গ্রুপ ও সদস্য ম্যানেজমেন্ট ড্যাশবোর্ড</p>
          </div>
          <Link href="/home" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
            হোমে ফিরুন
          </Link>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">মোট সদস্য</span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{stats.totalMembers} জন</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">রক্তের অনুরোধ</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-450 mt-1">{stats.openBloodRequests} টি</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">জরুরি SOS</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-450 mt-1">{stats.activeSosRequests} টি</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">বিজ্ঞপ্তি বোর্ড</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.totalNotices} টি</span>
            </div>
          </div>
        )}

        {/* Pending Verification Section */}
        <div>
          <h2 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
            ⏳ ভেরিফিকেশন পেন্ডিং ({pendingMembers.length})
          </h2>
          {pendingMembers.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো পেন্ডিং ভেরিফিকেশন অনুরোধ নেই।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member) => (
                <div key={member.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</p>
                    </div>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      {BLOOD_GROUPS_MAP[member.bloodGroup] || member.bloodGroup}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[9px] text-gray-400 block">পেশা</span>
                      <span className="font-semibold">{member.professionCustom || member.profession}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block">শহর</span>
                      <span className="font-semibold">{member.city}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleVerify(member.id, member.verified)}
                      disabled={actionLoadingId === member.id}
                      className="flex-1 bg-teal-500 hover:bg-teal-650 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-60"
                    >
                      ভেরিফাই করুন
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={actionLoadingId === member.id}
                      className="bg-red-50 dark:bg-red-950/20 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-xl transition-all border border-red-200 dark:border-red-900/50"
                    >
                      অপসারণ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Members Management */}
        <div>
          <h2 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-3">
            👥 সদস্য তালিকা ও ম্যানেজমেন্ট ({verifiedMembers.length})
          </h2>
          {verifiedMembers.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো ভেরিফাইড সদস্য নেই।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifiedMembers.map((member) => (
                <div key={member.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{member.name}</h3>
                        <span className="text-green-500 text-[10px] font-bold">✓</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</p>
                    </div>
                    <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      {BLOOD_GROUPS_MAP[member.bloodGroup] || member.bloodGroup}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[9px] text-gray-400 block">পেশা</span>
                      <span className="font-semibold">{member.professionCustom || member.profession}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block">শহর</span>
                      <span className="font-semibold">{member.city}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col gap-2 pt-1.5 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">পদবী (Role):</span>
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        disabled={actionLoadingId === member.id}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-teal-500 text-gray-800 dark:text-white font-medium"
                      >
                        <option value="MEMBER">সদস্য</option>
                        <option value="MODERATOR">মডারেটর</option>
                        <option value="ADMIN">অ্যাডমিন</option>
                      </select>
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleToggleVerify(member.id, member.verified)}
                        disabled={actionLoadingId === member.id}
                        className="flex-grow border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        আনভেরিফাই করুন
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoadingId === member.id}
                        className="border border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10 text-red-600 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-all"
                      >
                        অপসারণ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
