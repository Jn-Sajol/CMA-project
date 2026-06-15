"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ProfessionAutocomplete from "@/components/ProfessionAutocomplete";

type Author = {
  id: string;
  name: string;
  photoUrl: string | null;
  profession: string;
  professionCustom: string | null;
};

type JobPost = {
  id: string;
  category: "JOB_REFERRAL" | "PROFESSIONAL_HELP" | "GENERAL";
  title: string;
  description: string;
  profession: string | null;
  createdAt: string;
  authorId: string;
  author: Author;
};

const CATEGORIES = [
  { value: "JOB_REFERRAL", label: "💼 চাকরির রেফারেল", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" },
  { value: "PROFESSIONAL_HELP", label: "🤝 পেশাদার সাহায্য", color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" },
  { value: "GENERAL", label: "🌟 সাধারণ সাহায্য", color: "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800" },
];

const getCategoryLabel = (cat: string) => {
  if (cat === "JOB_REFERRAL") return "চাকরির রেফারেল";
  if (cat === "PROFESSIONAL_HELP") return "পেশাদার সাহায্য";
  return "সাধারণ সাহায্য";
};

const getCategoryStyles = (cat: string) => {
  const match = CATEGORIES.find((c) => c.value === cat);
  return match ? match.color : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

export default function JobsPage() {
  const { data: session } = useSession();

  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtering
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    category: "JOB_REFERRAL",
    title: "",
    description: "",
    profession: "",
  });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError("পোস্টগুলো লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "পোস্ট তৈরি করা সম্ভব হয়নি");
      }

      // Success
      setIsModalOpen(false);
      setForm({
        category: "JOB_REFERRAL",
        title: "",
        description: "",
        profession: "",
      });
      setSuccess("পোস্টটি সফলভাবে পাবলিশ হয়েছে! 🎉");
      setTimeout(() => setSuccess(""), 4000);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে পোস্টটি ডিলিট করতে চান?")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/jobs/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ডিলিট ব্যর্থ হয়েছে");
      }

      setSuccess("পোস্টটি সফলভাবে ডিলিট হয়েছে 🗑️");
      setTimeout(() => setSuccess(""), 3000);
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "এইমাত্র";
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    if (diffDays < 30) return `${diffDays} দিন আগে`;
    return date.toLocaleDateString("bn-BD");
  };

  const filteredPosts = posts.filter((post) => {
    if (activeCategory === "ALL") return true;
    return post.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-12 pb-16 rounded-b-3xl relative overflow-hidden shadow-lg shadow-teal-500/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-center relative z-10">পেশাদার ও সাহায্য বোর্ড</h1>
        <p className="text-center text-teal-100 text-xs mt-1 relative z-10">
          চাকরির খোঁজ এবং যেকোনো সাহায্য চাইতে এখানে পোস্ট করুন
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8 relative z-10">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3.5 rounded-2xl mb-4 text-center text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 p-3.5 rounded-2xl mb-4 text-center text-xs font-semibold shadow-sm">
            {success}
          </div>
        )}

        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === "ALL"
                ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                : "bg-white dark:bg-gray-800 text-gray-650 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            📂 সব পোস্ট
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.value
                  ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                  : "bg-white dark:bg-gray-800 text-gray-650 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-150 dark:border-gray-800 shadow-sm">
            <span className="text-4xl block mb-2">📦</span>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">এখনো কোনো পোস্ট নেই</h3>
            <p className="text-xs text-gray-400 mt-1">এই ক্যাটাগরিতে কোনো সাহায্য বা চাকরির খোঁজ পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const currentUserId = (session?.user as any)?.id;
              const currentUserRole = (session?.user as any)?.role;
              const isAuthor = currentUserId === post.authorId;
              const isAdmin = currentUserRole === "ADMIN";

              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-900 transition-all duration-300 shadow-sm relative group"
                >
                  {/* Top user profile bar */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-emerald-50 dark:from-gray-700 dark:to-gray-850 overflow-hidden flex items-center justify-center border border-teal-50 dark:border-gray-750 flex-shrink-0">
                        {post.author.photoUrl ? (
                          <img
                            src={post.author.photoUrl}
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                            {post.author.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 dark:text-white leading-tight">
                          {post.author.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {post.author.professionCustom || "সদস্য"}
                        </p>
                      </div>
                    </div>

                    {/* Delete action */}
                    {(isAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
                        title="ডিলিট করুন"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Title & badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getCategoryStyles(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    {post.profession && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-150 dark:border-gray-700">
                        🏷️ {post.profession}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-gray-900 dark:text-white text-sm mb-1.5 leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed whitespace-pre-line break-words mb-3.5">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-750/30 pt-2.5">
                    <span>🕒 {timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) to post */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label="নতুন পোস্ট তৈরি করুন"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-750 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5">
              <h3 className="text-lg font-bold">📢 নতুন পোস্ট তৈরি করুন</h3>
              <p className="text-xs text-teal-100 mt-1">পেশাদার সাহায্য, চাকরি রেফারেল বা সাধারণ তথ্যের জন্য</p>
            </div>

            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">ক্যাটাগরি</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                >
                  <option value="JOB_REFERRAL">💼 চাকরির রেফারেল (Job Referral)</option>
                  <option value="PROFESSIONAL_HELP">🤝 পেশাদার সাহায্য (Professional Help)</option>
                  <option value="GENERAL">🌟 সাধারণ সাহায্য (General Help)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">শিরোনাম</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="সংক্ষিপ্ত ও স্পষ্ট শিরোনাম দিন..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">
                  বিবরণ <span className="text-[10px] text-gray-400 font-normal">({form.description.length}/500 অক্ষর)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="বিস্তারিত বিবরণ লিখুন (সর্বোচ্চ ৫০০ অক্ষর)..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                  required
                />
              </div>

              {/* Profession Tag (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">
                  পেশা ট্যাগ <span className="text-[10px] text-gray-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <ProfessionAutocomplete
                  value={form.profession}
                  onChange={(val) => setForm({ ...form, profession: val })}
                  placeholder="যেমন: Software Engineer"
                  inputClassName="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submitting ? "প্রকাশ হচ্ছে..." : "পোস্ট পাবলিশ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
