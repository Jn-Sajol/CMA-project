"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import NoticeCard from "@/components/NoticeCard";
import BloodRequestCard from "@/components/BloodRequestCard";
import SosCard from "@/components/SosCard";

type Notice = {
  id: string;
  title: string;
  body: string;
  postType: string;
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  author: { name: string };
};

type BloodRequest = {
  id: string;
  bloodGroup: string;
  hospital: string;
  contactNumber: string;
  urgency: string;
  patientGender?: string | null;
  patientAge?: number | null;
  note?: string | null;
  createdAt: string;
  requesterId: string;
  requester: { name: string };
};

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

const BLOOD_GROUPS = [
  { value: "A_POS", label: "A+" },
  { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" },
  { value: "B_NEG", label: "B-" },
  { value: "O_POS", label: "O+" },
  { value: "O_NEG", label: "O-" },
  { value: "AB_POS", label: "AB+" },
  { value: "AB_NEG", label: "AB-" },
];

const CITIES = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Other"];

const formatBloodGroup = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    O_POS: "O+", O_NEG: "O-", AB_POS: "AB+", AB_NEG: "AB-",
  };
  return map[bg] || bg;
};

const getBloodGroupColor = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "bg-[#185FA5]", A_NEG: "bg-blue-300", B_POS: "bg-[#0F6E56]", B_NEG: "bg-teal-300",
    O_POS: "bg-[#3B6D11]", O_NEG: "bg-green-300", AB_POS: "bg-[#534AB7]", AB_NEG: "bg-purple-300",
  };
  return map[bg] || "bg-gray-500";
};

export default function HomePage() {
  const { data: session } = useSession();

  // Feeds data state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [sosRequests, setSosRequests] = useState<SosRequest[]>([]);

  // Loading states
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingBlood, setLoadingBlood] = useState(true);
  const [loadingSos, setLoadingSos] = useState(true);

  // Modal open/close states
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isBloodModalOpen, setIsBloodModalOpen] = useState(false);
  const [selectedBloodRequest, setSelectedBloodRequest] = useState<BloodRequest | null>(null);

  // Form submission states
  const [submittingSos, setSubmittingSos] = useState(false);
  const [submittingBlood, setSubmittingBlood] = useState(false);
  const [formError, setFormError] = useState("");

  // SOS Form data
  const [sosForm, setSosForm] = useState({
    sosType: "MEDICAL",
    description: "",
    city: "Dhaka",
    contactNumber: "",
  });

  // Blood request Form data
  const [bloodForm, setBloodForm] = useState({
    bloodGroup: "A_POS",
    hospital: "",
    contactNumber: "",
    urgency: "NORMAL",
    patientGender: "পুরুষ",
    patientAge: "",
    note: "",
  });

  // Pre-populate phone when session loads
  useEffect(() => {
    const userPhone = (session?.user as any)?.phone;
    if (userPhone) {
      setSosForm((prev) => ({ ...prev, contactNumber: userPhone }));
      setBloodForm((prev) => ({ ...prev, contactNumber: userPhone }));
    }
  }, [session]);

  const fetchData = async () => {
    setLoadingNotices(true);
    setLoadingBlood(true);
    setLoadingSos(true);

    try {
      const resNotices = await fetch("/api/notices?pinned=true");
      if (resNotices.ok) {
        const data = await resNotices.json();
        setNotices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotices(false);
    }

    try {
      const resBlood = await fetch("/api/blood?status=OPEN");
      if (resBlood.ok) {
        const data = await resBlood.json();
        setBloodRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlood(false);
    }

    try {
      const resSos = await fetch("/api/sos?status=OPEN");
      if (resSos.ok) {
        const data = await resSos.json();
        setSosRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSos(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmittingSos(true);

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sosForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "SOS তৈরি করতে ব্যর্থ হয়েছে");
      }

      // Success
      setIsSosModalOpen(false);
      setSosForm((prev) => ({
        ...prev,
        sosType: "MEDICAL",
        description: "",
      }));
      // Refresh SOS Feed
      const resSos = await fetch("/api/sos?status=OPEN");
      if (resSos.ok) {
        const data = await resSos.json();
        setSosRequests(data);
      }
    } catch (err: any) {
      setFormError(err.message || "সার্ভার এরর");
    } finally {
      setSubmittingSos(false);
    }
  };

  const handleBloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmittingBlood(true);

    try {
      const res = await fetch("/api/blood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bloodForm,
          patientAge: bloodForm.patientAge ? Number(bloodForm.patientAge) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "রক্তের অনুরোধ তৈরি করতে ব্যর্থ হয়েছে");
      }

      // Success
      setIsBloodModalOpen(false);
      setBloodForm((prev) => ({
        ...prev,
        bloodGroup: "A_POS",
        hospital: "",
        urgency: "NORMAL",
        patientGender: "পুরুষ",
        patientAge: "",
        note: "",
      }));
      // Refresh Blood Feed
      const resBlood = await fetch("/api/blood?status=OPEN");
      if (resBlood.ok) {
        const data = await resBlood.json();
        setBloodRequests(data);
      }
    } catch (err: any) {
      setFormError(err.message || "সার্ভার এরর");
    } finally {
      setSubmittingBlood(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Upper Premium Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl relative overflow-hidden shadow-lg shadow-teal-500/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl font-bold">স্বাগতম, {session?.user?.name || "সদস্য"}! 👋</h1>
            <p className="text-xs text-teal-100 mt-0.5">সবাই মিলে গড়ি মানবিক সোসাইটি</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-100/20 flex items-center justify-center border border-white/25">
            <span className="text-base font-bold text-white">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
        </div>

        {/* Quick actions inside header */}
        <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
          <button
            onClick={() => setIsBloodModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-2xl py-3 px-4 transition-all active:scale-[0.98] text-sm font-semibold text-white shadow-sm"
          >
            🩸 রক্তের অনুরোধ
          </button>
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/35 border border-red-400/30 rounded-2xl py-3 px-4 transition-all active:scale-[0.98] text-sm font-semibold text-red-100 shadow-sm"
          >
            🚨 জরুরি SOS
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Jobs & Help Board Shortcut Card */}
        <Link href="/jobs" className="block">
          <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-100 dark:border-teal-900/40 rounded-2xl p-4 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-teal-50 dark:border-teal-950/20">💼</span>
              <div>
                <h3 className="text-xs font-bold text-gray-800 dark:text-white">পেশাদার সাহায্য ও চাকরি বোর্ড</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">গ্রুপের অন্য সদস্যদের থেকে রেফারেল বা সাহায্য নিন</p>
              </div>
            </div>
            <span className="text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center gap-0.5">
              দেখুন <span className="text-sm font-normal">→</span>
            </span>
          </div>
        </Link>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              📌 পিন করা নোটিশ
            </h2>
          </div>
          {loadingNotices ? (
            <div className="space-y-3">
              <div className="h-28 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো গুরুত্বপূর্ণ পিন করা নোটিশ পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  id={notice.id}
                  title={notice.title}
                  body={notice.body}
                  postType={notice.postType}
                  pinned={notice.pinned}
                  viewCount={notice.viewCount}
                  createdAt={notice.createdAt}
                  authorName={notice.author?.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* SOS Alerts Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              🚨 সক্রিয় SOS সিগন্যাল
            </h2>
          </div>
          {loadingSos ? (
            <div className="grid grid-cols-1 gap-3">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            </div>
          ) : sosRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো সক্রিয় জরুরি অনুরোধ পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
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

        {/* Blood Requests Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              🩸 রক্তের জন্য উন্মুক্ত আহ্বান
            </h2>
            <Link href="/blood" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
              সবগুলো দেখুন →
            </Link>
          </div>
          {loadingBlood ? (
            <div className="space-y-3">
              <div className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            </div>
          ) : bloodRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">কোনো রক্তের অনুরোধ পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bloodRequests.map((blood) => (
                <BloodRequestCard
                  key={blood.id}
                  id={blood.id}
                  bloodGroup={blood.bloodGroup}
                  hospital={blood.hospital}
                  contactNumber={blood.contactNumber}
                  urgency={blood.urgency}
                  patientGender={blood.patientGender}
                  patientAge={blood.patientAge}
                  note={blood.note}
                  createdAt={blood.createdAt}
                  requesterName={blood.requester?.name}
                  onClick={() => setSelectedBloodRequest(blood)}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Red SOS Button (FAB) */}
      <button
        onClick={() => setIsSosModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-bounce"
        aria-label="SOS Signal"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>

      {/* SOS Form Modal */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">🚨 জরুরি SOS সংকেত পাঠান</h3>
              <p className="text-xs text-red-100 mt-1">সবাইকে দ্রুত সতর্ক করতে নিচের বিবরণ পূরণ করুন</p>
            </div>
            
            <form onSubmit={handleSosSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* SOS Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">সাহায্যের ধরন</label>
                <select
                  value={sosForm.sosType}
                  onChange={(e) => setSosForm({ ...sosForm, sosType: e.target.value })}
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
                  বিবরণ <span className="text-[10px] text-gray-400">({sosForm.description.length}/280)</span>
                </label>
                <textarea
                  value={sosForm.description}
                  onChange={(e) => setSosForm({ ...sosForm, description: e.target.value })}
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
                  value={sosForm.city}
                  onChange={(e) => setSosForm({ ...sosForm, city: e.target.value })}
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
                  value={sosForm.contactNumber}
                  onChange={(e) => setSosForm({ ...sosForm, contactNumber: e.target.value })}
                  placeholder="যেমন: 01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSosModalOpen(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submittingSos}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submittingSos ? "পাঠানো হচ্ছে..." : "SOS পাঠান"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blood Request Modal */}
      {isBloodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">🩸 রক্তের জন্য অনুরোধ করুন</h3>
              <p className="text-xs text-teal-100 mt-1">জরুরি রক্তের প্রয়োজনীয়তা সবার সামনে তুলে ধরুন</p>
            </div>
            
            <form onSubmit={handleBloodSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">রক্তের গ্রুপ</label>
                <select
                  value={bloodForm.bloodGroup}
                  onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">হাসপাতাল ও ঠিকানা</label>
                <input
                  type="text"
                  value={bloodForm.hospital}
                  onChange={(e) => setBloodForm({ ...bloodForm, hospital: e.target.value })}
                  placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">যোগাযোগ নম্বর</label>
                <input
                  type="tel"
                  value={bloodForm.contactNumber}
                  onChange={(e) => setBloodForm({ ...bloodForm, contactNumber: e.target.value })}
                  placeholder="যেমন: 01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">জরুরিতা</label>
                <select
                  value={bloodForm.urgency}
                  onChange={(e) => setBloodForm({ ...bloodForm, urgency: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  <option value="NORMAL">সাধারণ (Normal)</option>
                  <option value="CRITICAL">জরুরি (🚨 Critical)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Patient Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">রোগীর লিঙ্গ</label>
                  <select
                    value={bloodForm.patientGender}
                    onChange={(e) => setBloodForm({ ...bloodForm, patientGender: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  >
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                {/* Patient Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">রোগীর বয়স</label>
                  <input
                    type="number"
                    value={bloodForm.patientAge}
                    onChange={(e) => setBloodForm({ ...bloodForm, patientAge: e.target.value })}
                    placeholder="যেমন: ৪৫"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">বিশেষ দ্রষ্টব্য (ঐচ্ছিক)</label>
                <textarea
                  value={bloodForm.note}
                  onChange={(e) => setBloodForm({ ...bloodForm, note: e.target.value })}
                  placeholder="যেমন: হিমোগ্লোবিন কম, ২ ব্যাগ প্রয়োজন..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBloodModalOpen(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submittingBlood}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submittingBlood ? "অনুরোধ করা হচ্ছে..." : "অনুরোধ নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Blood Request Detail Modal */}
      {selectedBloodRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5 relative">
              <button
                onClick={() => setSelectedBloodRequest(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-bold flex items-center gap-2">🩸 রক্তের অনুরোধের বিবরণ</h3>
              <p className="text-xs text-teal-100 mt-1">রক্ত দিয়ে জীবন বাঁচান</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Blood Group and Urgency */}
              <div className="flex items-center gap-2.5">
                <span className={`${getBloodGroupColor(selectedBloodRequest.bloodGroup)} text-white text-base font-bold px-3 py-1.5 rounded-xl shadow-sm`}>
                  {formatBloodGroup(selectedBloodRequest.bloodGroup)}
                </span>
                {selectedBloodRequest.urgency === "CRITICAL" && (
                  <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1.5 rounded-xl animate-pulse">
                    🚨 অতি জরুরি
                  </span>
                )}
              </div>

              {/* Detail fields */}
              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                <div>
                  <span className="text-[10px] text-gray-400 block">হাসপাতাল ও ঠিকানা</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">🏥 {selectedBloodRequest.hospital}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block">রোগীর লিঙ্গ</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{selectedBloodRequest.patientGender || "উল্লেখ নেই"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">রোগীর বয়স</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{selectedBloodRequest.patientAge ? `${selectedBloodRequest.patientAge} বছর` : "উল্লেখ নেই"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">যোগাযোগের নম্বর</span>
                  <span className="text-sm font-semibold text-gray-850 dark:text-gray-205 select-all">📞 {selectedBloodRequest.contactNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">অনুরোধকারী</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">👤 {selectedBloodRequest.requester?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">অনুরোধের সময়</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(selectedBloodRequest.createdAt).toLocaleString("bn-BD")}</span>
                </div>
                {selectedBloodRequest.note && (
                  <div>
                    <span className="text-[10px] text-gray-400 block">বিশেষ দ্রষ্টব্য</span>
                    <span className="text-xs text-gray-650 dark:text-gray-300 italic">“{selectedBloodRequest.note}”</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`tel:${selectedBloodRequest.contactNumber}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-teal-500/25 hover:shadow-teal-500/40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  কল করুন
                </a>

                {/* If the current user is the requester, show the "Mark as Fulfilled" button */}
                {(session?.user as any)?.id === selectedBloodRequest.requesterId && (
                  <button
                    onClick={async () => {
                      if (!confirm("আপনি কি নিশ্চিত যে এই রক্তের অনুরোধটি পূরণ হয়েছে?")) return;
                      try {
                        const res = await fetch(`/api/blood/${selectedBloodRequest.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "FULFILLED" }),
                        });
                        if (!res.ok) throw new Error("স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে");
                        
                        // Close modal and refresh feed
                        setSelectedBloodRequest(null);
                        fetchData();
                      } catch (err: any) {
                        alert(err.message || "সার্ভার এরর");
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md"
                  >
                    ✓ পূরণ হয়েছে (Mark Fulfilled)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedBloodRequest(null)}
                  className="w-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
