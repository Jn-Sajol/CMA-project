"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import BloodRequestCard from "@/components/BloodRequestCard";

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

export default function BloodFeedPage() {
  const { data: session } = useSession();
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("");
  const [selectedBloodRequest, setSelectedBloodRequest] = useState<BloodRequest | null>(null);

  // Blood request creation modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submittingBlood, setSubmittingBlood] = useState(false);
  const [createError, setCreateError] = useState("");
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
      setBloodForm((prev) => ({ ...prev, contactNumber: userPhone }));
    }
  }, [session]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blood?status=OPEN");
      if (!res.ok) throw new Error("রক্তের অনুরোধগুলো লোড করতে ব্যর্থ হয়েছে");
      const data = await res.json();
      setBloodRequests(data);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleBloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
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
      setIsCreateModalOpen(false);
      setBloodForm((prev) => ({
        ...prev,
        bloodGroup: "A_POS",
        hospital: "",
        urgency: "NORMAL",
        patientGender: "পুরুষ",
        patientAge: "",
        note: "",
      }));
      fetchRequests();
    } catch (err: any) {
      setCreateError(err.message || "সার্ভার এরর");
    } finally {
      setSubmittingBlood(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!selectedBloodGroup) return bloodRequests;
    return bloodRequests.filter((r) => r.bloodGroup === selectedBloodGroup);
  }, [bloodRequests, selectedBloodGroup]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">রক্তের সন্ধান feed 🩸</h1>
          <p className="text-xs text-teal-100 mt-0.5">রক্তের জন্য সক্রিয় ও জরুরি আহ্বানসমূহ</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-white text-teal-600 hover:bg-teal-50 font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
        >
          <span>+ অনুরোধ</span>
        </button>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Blood Group Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedBloodGroup("")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              !selectedBloodGroup
                ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/25"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-250 dark:border-gray-700"
            }`}
          >
            সব রক্তের গ্রুপ
          </button>
          {BLOOD_GROUPS.map((g) => {
            const isSelected = selectedBloodGroup === g.value;
            const count = bloodRequests.filter((r) => r.bloodGroup === g.value).length;
            return (
              <button
                key={g.value}
                onClick={() => setSelectedBloodGroup(g.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1 ${
                  isSelected
                    ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/25"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-250 dark:border-gray-700"
                }`}
              >
                {g.label} {count > 0 && <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>মোট আহ্বান: {bloodRequests.length} টি</span>
          {selectedBloodGroup && (
            <span>ফলাফল: {filteredRequests.length} টি</span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Feed List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">কোনো রক্তের অনুরোধ পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mt-1">সবাই নিরাপদে ও সুস্থ থাকুন</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((blood) => (
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
                  <span className="text-sm font-semibold text-gray-855 dark:text-gray-205 select-all">📞 {selectedBloodRequest.contactNumber}</span>
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
                    <span className="text-xs text-gray-655 dark:text-gray-300 italic">“{selectedBloodRequest.note}”</span>
                  </div>
                )}
              </div>

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
                        
                        setSelectedBloodRequest(null);
                        fetchRequests();
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

      {/* Blood Request Creation Form Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">🩸 রক্তের জন্য অনুরোধ করুন</h3>
              <p className="text-xs text-teal-100 mt-1">জরুরি রক্তের প্রয়োজনীয়তা সবার সামনে তুলে ধরুন</p>
            </div>
            
            <form onSubmit={handleBloodSubmit} className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {createError}
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
                  onClick={() => setIsCreateModalOpen(false)}
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
    </div>
  );
}
