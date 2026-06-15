"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import NoticeCard from "@/components/NoticeCard";

type Notice = {
  id: string;
  title: string;
  body: string;
  postType: string;
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  imageUrl?: string | null;
  author: { name: string };
};

const POST_TYPES = [
  { value: "INFO", label: "ℹ️ তথ্য (Info)" },
  { value: "NOTICE", label: "📢 নোটিশ (Notice)" },
  { value: "EVENT", label: "📅 ইভেন্ট (Event)" },
  { value: "IMPORTANT", label: "🚨 গুরুত্বপূর্ণ (Important)" },
];

const POST_TYPE_MAP: Record<string, { label: string; color: string }> = {
  NOTICE: { label: "নোটিশ", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  EVENT: { label: "ইভেন্ট", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  IMPORTANT: { label: "গুরুত্বপূর্ণ", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  INFO: { label: "তথ্য", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
};

export default function NoticesPage() {
  const { data: session } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    title: "",
    body: "",
    postType: "INFO",
    imageUrl: "",
    pinned: false,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "ADMIN" || userRole === "MODERATOR";

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices");
      if (!res.ok) throw new Error("নোটিশ তালিকা লোড করতে ব্যর্থ হয়েছে");
      const data = await res.json();
      setNotices(data);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("ছবি আপলোড করতে সমস্যা হয়েছে");
      }

      const data = await res.json();
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      setFormError(err.message || "ছবি আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploadingImage(false);
    }
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      setForm((prev) => ({ ...prev, body: editorRef.current?.innerHTML || "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.body || form.body.trim() === "<br>" || form.body.trim() === "") {
      setFormError("নোটিশের বিবরণ আবশ্যক");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "নোটিশ তৈরি করতে ব্যর্থ হয়েছে");
      }

      setIsModalOpen(false);
      setForm({
        title: "",
        body: "",
        postType: "INFO",
        imageUrl: "",
        pinned: false,
      });
      if (editorRef.current) editorRef.current.innerHTML = "";
      fetchNotices(); // reload feed
    } catch (err: any) {
      setFormError(err.message || "সার্ভার এরর");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    // Live increment local state
    setNotices((prev) =>
      prev.map((n) => (n.id === notice.id ? { ...n, viewCount: n.viewCount + 1 } : n))
    );

    // Call API to increment view count
    try {
      await fetch(`/api/notices/${notice.id}/view`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to increment view count:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">নোটিশ বোর্ড</h1>
          <p className="text-xs text-teal-100 mt-0.5">কমিউনিটির সব নোটিশ ও খবরাখবর</p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white/20 hover:bg-white/35 border border-white/20 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95"
          >
            ➕ নতুন বিজ্ঞপ্তি
          </button>
        )}
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Notices list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">কোনো নোটিশ পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-3.5">
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
                imageUrl={notice.imageUrl}
                onClick={() => handleViewNotice(notice)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Notice Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">📢 নতুন নোটিশ তৈরি করুন</h3>
              <p className="text-xs text-teal-100 mt-1">সব সদস্যের সাথে প্রয়োজনীয় তথ্য শেয়ার করুন</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">নোটিশের শিরোনাম</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="যেমন: রক্তের প্রয়োজন বা সভা সংক্রান্ত বিষয়"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Notice Type */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">নোটিশের ধরন</label>
                <select
                  value={form.postType}
                  onChange={(e) => setForm({ ...form, postType: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {POST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Body (Rich Text Editor) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">নোটিশের বিস্তারিত বিবরণ</label>
                
                {/* Rich Text Toolbar */}
                <div className="flex gap-1 mb-1 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-t-xl border border-gray-200 dark:border-gray-600 border-b-0">
                  <button type="button" onClick={() => execCommand("bold")} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white shadow-sm" title="Bold">B</button>
                  <button type="button" onClick={() => execCommand("italic")} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs italic rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white shadow-sm" title="Italic">I</button>
                  <button type="button" onClick={() => execCommand("underline")} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs underline rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white shadow-sm" title="Underline">U</button>
                  <button type="button" onClick={() => execCommand("insertUnorderedList")} className="w-12 h-8 flex items-center justify-center bg-white dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white shadow-sm" title="List">• List</button>
                </div>

                {/* contentEditable div wrapper */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={() => {
                    setForm((prev) => ({ ...prev, body: editorRef.current?.innerHTML || "" }));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-b-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all min-h-[140px] max-h-[200px] overflow-y-auto"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">ছবি যুক্ত করুন (ঐচ্ছিক)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 dark:file:bg-teal-900/40 file:text-teal-700 dark:file:text-teal-350 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {uploadingImage && <span className="text-[10px] text-teal-650 animate-pulse">ছবি আপলোড হচ্ছে...</span>}
                  
                  {form.imageUrl && (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden mt-1 border border-gray-200 dark:border-gray-700 shadow-inner group">
                      <img src={form.imageUrl} className="w-full h-full object-cover" alt="Uploaded preview" />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/85 text-white rounded-full p-1.5 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pin Toggle */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-650 dark:text-gray-400 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-gray-650"
                  />
                  পিন করে উপরে রাখুন (Pin notice to top)
                </label>
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
                  disabled={submitting || uploadingImage}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submitting ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Detail View Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5 relative">
              <button
                onClick={() => setSelectedNotice(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/20 uppercase tracking-wider ${POST_TYPE_MAP[selectedNotice.postType]?.color || ""}`}>
                  {POST_TYPE_MAP[selectedNotice.postType]?.label || "তথ্য"}
                </span>
                {selectedNotice.pinned && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    📌 পিন করা
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold break-words">{selectedNotice.title}</h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Image if available */}
              {selectedNotice.imageUrl && (
                <div className="w-full max-h-56 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm">
                  <img src={selectedNotice.imageUrl} alt={selectedNotice.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Body Text */}
              <div 
                className="text-sm text-gray-700 dark:text-gray-250 leading-relaxed break-words whitespace-pre-wrap select-text prose dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: selectedNotice.body }}
              />

              {/* Metadata */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-850">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-650 dark:text-gray-300">👤 {selectedNotice.author?.name}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{new Date(selectedNotice.createdAt).toLocaleString("bn-BD")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{selectedNotice.viewCount} বার পঠিত</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="w-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
