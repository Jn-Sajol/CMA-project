"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Transaction = {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  note?: string | null;
  createdAt: string;
  member?: { name: string } | null;
  creator: { name: string };
};

type FundData = {
  totalCollected: number;
  totalSpent: number;
  balance: number;
  transactions: Transaction[];
};

type Member = {
  id: string;
  name: string;
};

export default function FundPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "ADMIN";

  const [fundData, setFundData] = useState<FundData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    type: "CREDIT" as "CREDIT" | "DEBIT",
    amount: "",
    note: "",
    memberId: "",
  });

  const fetchFundData = async () => {
    try {
      const res = await fetch("/api/fund");
      if (!res.ok) throw new Error("চাঁদা ফান্ড ডাটা লোড করতে ব্যর্থ হয়েছে");
      const data = await res.json();
      setFundData(data);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error("Failed to fetch members for dropdown:", e);
    }
  };

  useEffect(() => {
    fetchFundData();
    fetchMembers();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setFormError("সঠিক অ্যামাউন্ট লিখুন");
      return;
    }

    if (form.type === "CREDIT" && !form.memberId) {
      setFormError("সদস্য নির্বাচন করুন");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "লেনদেন যোগ করতে ব্যর্থ হয়েছে");
      }

      setForm({
        type: "CREDIT",
        amount: "",
        note: "",
        memberId: "",
      });
      fetchFundData(); // refresh ledger
    } catch (err: any) {
      setFormError(err.message || "সার্ভার এরর");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-955 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">লোডিং...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold">চাঁদা ও ফান্ড ট্র্যাকার</h1>
        <p className="text-xs text-teal-100 mt-0.5">গ্রুপের আর্থিক হিসাব ও স্বচ্ছ বিবরণী</p>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Ledger Summary */}
        {fundData && (
          <div className="space-y-3">
            {/* Net Balance Large Card */}
            <div className="bg-gradient-to-r from-teal-500 to-indigo-650 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white" />
              </div>
              <span className="text-[10px] font-bold text-teal-100 uppercase tracking-widest block">বর্তমান ব্যালেন্স</span>
              <span className="text-3xl font-black mt-1 block">৳ {fundData.balance.toLocaleString("bn-BD")}</span>
            </div>

            {/* Collected and Spent Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">মোট সংগৃহীত</span>
                <span className="text-lg font-black text-green-600 dark:text-green-400 mt-1">৳ {fundData.totalCollected.toLocaleString("bn-BD")}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">মোট খরচ</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">৳ {fundData.totalSpent.toLocaleString("bn-BD")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Add Transaction Form */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-teal-100 dark:border-gray-700 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-800 dark:text-white flex items-center gap-1.5">
              💰 নতুন লেনদেন যোগ করুন
            </h2>

            {formError && (
              <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">লেনদেনের ধরন</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "CREDIT" })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      form.type === "CREDIT"
                        ? "bg-green-500 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    📈 চাঁদা পেয়েছি (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "DEBIT" })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      form.type === "DEBIT"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    📉 খরচ হয়েছে (Debit)
                  </button>
                </div>
              </div>

              {/* Member Dropdown (Only for Credit) */}
              {form.type === "CREDIT" && (
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">প্রদানকারী সদস্য</label>
                  <select
                    value={form.memberId}
                    onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    required
                  >
                    <option value="">সদস্য নির্বাচন করুন</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="যেমন: ৫০০"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">মন্তব্য / বিবরণ</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="যেমন: জুন মাসের চাঁদা বা পানির বিল"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
              >
                {submitting ? "যোগ করা হচ্ছে..." : "নিশ্চিত করুন"}
              </button>
            </form>
          </div>
        )}

        {/* Ledger Transactions List */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-gray-850 dark:text-gray-200">
            📑 লেনদেনের বিবরণী
          </h2>

          {fundData?.transactions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-750">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো লেনদেন এখনো করা হয়নি।</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fundData?.transactions.map((tx) => (
                <div key={tx.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon indicator */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                      tx.type === "CREDIT"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-500"
                        : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                    }`}>
                      <span className="text-sm font-bold">
                        {tx.type === "CREDIT" ? "📈" : "📉"}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {tx.type === "CREDIT" ? `${tx.member?.name || "সদস্য"} এর চাঁদা` : tx.note || "খরচ"}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {tx.type === "CREDIT" && tx.note ? `${tx.note} • ` : ""}
                        বাই: {tx.creator.name} • {new Date(tx.createdAt).toLocaleDateString("bn-BD")}
                      </p>
                    </div>
                  </div>

                  <span className={`text-sm font-black whitespace-nowrap ${
                    tx.type === "CREDIT" ? "text-green-600 dark:text-green-400" : "text-rose-600 dark:text-rose-450"
                  }`}>
                    {tx.type === "CREDIT" ? "+" : "-"} ৳ {tx.amount.toLocaleString("bn-BD")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
