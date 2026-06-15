"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SosCard from "@/components/SosCard";

type SosRequest = {
  id: string;
  sosType: string;
  description: string;
  city: string;
  contactNumber: string;
  createdAt: string;
  requester: { name: string };
};

const SOS_TYPES = [
  { value: "MEDICAL", label: "🏥 চিকিৎসা" },
  { value: "BLOOD", label: "🩸 রক্ত" },
  { value: "FINANCIAL", label: "💰 আর্থিক" },
  { value: "TRANSPORT", label: "🚗 পরিবহন" },
  { value: "LEGAL", label: "⚖️ আইনি" },
  { value: "OTHER", label: "📢 অন্যান্য" },
];

const CITIES = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Other"];

export default function SosPage() {
  const { data: session } = useSession();
  const [sosRequests, setSosRequests] = useState<SosRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    sosType: "MEDICAL",
    description: "",
    city: "Dhaka",
    contactNumber: "",
  });

  // Pre-populate phone when session loads
  useEffect(() => {
    const userPhone = (session?.user as any)?.phone;
    if (userPhone) {
      setForm((prev) => ({ ...prev, contactNumber: userPhone }));
    }
  }, [session]);

  const fetchSos = async () => {
    try {
      const res = await fetch("/api/sos?status=OPEN");
      if (!res.ok) throw new Error("জরুরি অনুরোধ তালিকা লোড করতে ব্যর্থ হয়েছে");
      const data = await res.json();
      setSosRequests(data);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "SOS সংকেত তৈরি করতে ব্যর্থ হয়েছে");
      }

      setIsModalOpen(false);
      setForm((prev) => ({
        ...prev,
        sosType: "MEDICAL",
        description: "",
      }));
      fetchSos(); // reload feed
    } catch (err: any) {
      setFormError(err.message || "সার্ভার এরর");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">SOS অ্যালার্টস</h1>
          <p className="text-xs text-red-100 mt-0.5">সব সক্রিয় ও জরুরি সাহায্য অনুরোধসমূহ</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white/20 hover:bg-white/35 border border-white/20 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95 animate-pulse"
        >
          🚨 সাহায্য চান
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* SOS list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : sosRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-805">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">কোনো সক্রিয় জরুরি অনুরোধ পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sosRequests.map((sos) => (
              <SosCard
                key={sos.id}
                id={sos.id}
                sosType={sos.sosType}
                description={sos.description}
                city={sos.city}
                contactNumber={sos.contactNumber}
                createdAt={sos.createdAt}
                requesterName={sos.requester?.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* SOS Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">🚨 জরুরি SOS সংকেত পাঠান</h3>
              <p className="text-xs text-red-100 mt-1">সবাইকে দ্রুত সতর্ক করতে নিচের বিবরণ পূরণ করুন</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* SOS Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">সাহায্যের ধরন</label>
                <select
                  value={form.sosType}
                  onChange={(e) => setForm({ ...form, sosType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                >
                  {SOS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  বিবরণ <span className="text-[10px] text-gray-400">({form.description.length}/280)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="আপনার কী ধরনের সাহায্য প্রয়োজন লিখুন..."
                  maxLength={280}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">শহর</label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">যোগাযোগ নম্বর</label>
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="যেমন: 01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submitting ? "পাঠানো হচ্ছে..." : "SOS পাঠান"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
