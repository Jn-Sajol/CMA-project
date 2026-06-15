"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location: string;
  authorName: string;
  goingCount: number;
  notGoingCount: number;
  maybeCount: number;
  currentUserStatus?: "GOING" | "NOT_GOING" | "MAYBE" | null;
};

export default function EventsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAuthorized = userRole === "ADMIN" || userRole === "MODERATOR";

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("ইভেন্ট তালিকা লোড করতে ব্যর্থ হয়েছে");
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRsvp = async (eventId: string, newStatus: "GOING" | "NOT_GOING" | "MAYBE") => {
    // Optimistic UI updates
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        const currentStatus = event.currentUserStatus;
        if (currentStatus === newStatus) return event; // No change

        // Calculate new counts
        let goingDelta = 0;
        let notGoingDelta = 0;
        let maybeDelta = 0;

        // Decrement old choice
        if (currentStatus === "GOING") goingDelta--;
        if (currentStatus === "NOT_GOING") notGoingDelta--;
        if (currentStatus === "MAYBE") maybeDelta--;

        // Increment new choice
        if (newStatus === "GOING") goingDelta++;
        if (newStatus === "NOT_GOING") notGoingDelta++;
        if (newStatus === "MAYBE") maybeDelta++;

        return {
          ...event,
          currentUserStatus: newStatus,
          goingCount: event.goingCount + goingDelta,
          notGoingCount: event.notGoingCount + notGoingDelta,
          maybeCount: event.maybeCount + maybeDelta,
        };
      })
    );

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("RSVP আপডেট করতে ব্যর্থ হয়েছে");
    } catch (err: any) {
      alert(err.message || "সার্ভার এরর");
      fetchEvents(); // rollback to DB state on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.title || !form.date || !form.time || !form.location) {
      setFormError("সবগুলো আবশ্যক ক্ষেত্র পূরণ করুন");
      return;
    }

    setSubmitting(true);

    const eventDateTime = new Date(`${form.date}T${form.time}`);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          date: eventDateTime.toISOString(),
          location: form.location,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ইভেন্ট তৈরি করতে ব্যর্থ হয়েছে");
      }

      setIsModalOpen(false);
      setForm({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
      fetchEvents(); // reload list
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ইভেন্ট ও সভা</h1>
          <p className="text-xs text-teal-100 mt-0.5">সব ইভেন্ট ও আপনার উপস্থিতি নিশ্চিতকরণ</p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white/20 hover:bg-white/35 border border-white/20 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white transition-all active:scale-95"
          >
            ➕ নতুন ইভেন্ট
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

        {/* Events list */}
        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">কোনো নতুন ইভেন্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const monthStr = eventDate.toLocaleString("bn-BD", { month: "short" });

              return (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm p-4 space-y-3.5">
                  <div className="flex gap-3 items-start">
                    {/* Calendar Badge */}
                    <div className="w-12 h-14 bg-teal-50 dark:bg-teal-950/45 rounded-xl border border-teal-100 dark:border-teal-900 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-lg font-black text-teal-600 dark:text-teal-400 leading-none">{day}</span>
                      <span className="text-[10px] font-bold text-teal-500 dark:text-teal-400 mt-1">{monthStr}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight break-words">{event.title}</h2>
                      <p className="text-[10px] text-gray-400 dark:text-gray-550 mt-1">
                        আইডি: {event.authorName} • {eventDate.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-xs text-gray-650 dark:text-gray-300 leading-relaxed break-words whitespace-pre-line bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-50 dark:border-gray-850">
                      {event.description}
                    </p>
                  )}

                  {/* Location Info */}
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">স্থান: <b>{event.location}</b></span>
                  </div>

                  {/* RSVP stats */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-50 dark:border-gray-850 text-center">
                    <div className="text-[11px]">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">যাবো</span>
                      <span className="font-extrabold text-green-600 dark:text-green-400">{event.goingCount} জন</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">হতে পারে</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">{event.maybeCount} জন</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-gray-400 block text-[9px] uppercase font-bold">যাবো না</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-450">{event.notGoingCount} জন</span>
                    </div>
                  </div>

                  {/* RSVP Interactive Actions */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1">আপনার উপস্থিতি নিশ্চিত করুন:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRsvp(event.id, "GOING")}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border active:scale-95 ${
                          event.currentUserStatus === "GOING"
                            ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/25"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        ✓ যাবো
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, "MAYBE")}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border active:scale-95 ${
                          event.currentUserStatus === "MAYBE"
                            ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/25"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        ? হতে পারে
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, "NOT_GOING")}
                        className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all border active:scale-95 ${
                          event.currentUserStatus === "NOT_GOING"
                            ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        × যাবো না
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-5">
              <h3 className="text-lg font-bold flex items-center gap-2">📅 নতুন ইভেন্ট তৈরি করুন</h3>
              <p className="text-xs text-teal-100 mt-1">নতুন কোনো সভা বা কার্যক্রমের তথ্য দিন</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 dark:bg-red-955/30 text-red-600 dark:text-red-400 p-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">ইভেন্টের শিরোনাম</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="যেমন: গ্রুপ পুনর্মিলনী বা জরুরি সভা"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">বিস্তারিত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="বিস্তারিত আলোচনা এখানে লিখুন..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">সময়</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">স্থান</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="যেমন: কনফারেন্স রুম বা জুম মিটিং লিংক"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-650 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
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
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {submitting ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
