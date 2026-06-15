"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  photoUrl: string | null;
  birthdate: string;
  phone: string;
  whatsappLink: string | null;
  profession: string;
  professionCustom: string | null;
};

export default function BirthdaysPage() {
  const { data: session } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBirthdays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/birthdays");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError("জন্মদিনের তালিকা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  // Time calculations in BD timezone (UTC+6)
  const getBdDateInfo = () => {
    const bdTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    return {
      day: bdTime.getUTCDate(),
      month: bdTime.getUTCMonth(),
    };
  };

  const { day: todayDay, month: todayMonth } = getBdDateInfo();

  // Categorize birthdays
  const todayBirthdays: Member[] = [];
  const upcomingWeekBirthdays: Member[] = [];
  const otherMonthBirthdays: Member[] = [];

  members.forEach((m) => {
    const bDate = new Date(m.birthdate);
    const bDay = bDate.getUTCDate();
    const bMonth = bDate.getUTCMonth();

    const isToday = bDay === todayDay && bMonth === todayMonth;
    const isUpcomingWeek = bDay > todayDay && bDay <= todayDay + 7;

    if (isToday) {
      todayBirthdays.push(m);
    } else if (isUpcomingWeek) {
      upcomingWeekBirthdays.push(m);
    } else {
      otherMonthBirthdays.push(m);
    }
  });

  const getWhatsAppUrl = (phone: string, customLink?: string | null, name?: string) => {
    if (customLink && customLink.trim().startsWith("http")) {
      try {
        const url = new URL(customLink);
        if (!url.searchParams.has("text")) {
          url.searchParams.set("text", `শুভ জন্মদিন ${name || "ভাই"}! 🎉 আপনার জীবন সুন্দর ও আনন্দময় হোক।`);
        }
        return url.toString();
      } catch {
        return customLink;
      }
    }

    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "88" + cleaned;
    }
    const text = encodeURIComponent(`শুভ জন্মদিন ${name || "ভাই"}! 🎉 আপনার জীবন সুন্দর ও আনন্দময় হোক।`);
    return `https://wa.me/${cleaned}?text=${text}`;
  };

  const formatBirthdate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = [
      "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    ];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-12 pb-16 rounded-b-3xl relative overflow-hidden shadow-lg shadow-teal-500/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        </div>
        
        {/* Back navigation */}
        <Link href="/profile" className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-1 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all">
          ← প্রোফাইল
        </Link>

        <h1 className="text-2xl font-bold text-center relative z-10">🎉 জন্মদিনের তালিকা</h1>
        <p className="text-center text-teal-100 text-xs mt-1 relative z-10">
          চলতি মাসের সকল জন্মদিনের তালিকা এবং শুভেচ্ছা বার্তা
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-150 dark:border-gray-800 shadow-sm">
            <span className="text-4xl block mb-2">🎈</span>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">এই মাসে কোনো জন্মদিন নেই</h3>
            <p className="text-xs text-gray-400 mt-1">আমাদের এই মাসে জন্ম এমন কোনো সদস্য তালিকাভুক্ত নেই।</p>
          </div>
        ) : (
          <>
            {/* 1. Today's Birthday Section */}
            {todayBirthdays.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 pl-1">
                  🎂 আজ যাদের জন্মদিন
                </h3>
                <div className="space-y-3">
                  {todayBirthdays.map((m) => (
                    <div
                      key={m.id}
                      className="bg-gradient-to-r from-emerald-50/80 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 rounded-2xl p-4 border-2 border-emerald-400 dark:border-emerald-600 shadow-md shadow-emerald-400/5 dark:shadow-none flex items-center justify-between transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center border-2 border-emerald-300 dark:border-emerald-500 flex-shrink-0 relative">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="absolute -bottom-1 -right-1 text-sm animate-bounce">🎂</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1">
                            {m.name}
                          </h4>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            আজকের দিনে! ({formatBirthdate(m.birthdate)})
                          </p>
                        </div>
                      </div>

                      <a
                        href={getWhatsAppUrl(m.phone, m.whatsappLink, m.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        💬 শুভেচ্ছা জানান
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Upcoming This Week Section */}
            {upcomingWeekBirthdays.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 pl-1">
                  📅 এই সপ্তাহে (পরবর্তী ৭ দিন)
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-750/30 overflow-hidden shadow-sm">
                  {upcomingWeekBirthdays.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 dark:hover:bg-gray-750/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-gray-600 dark:text-gray-400">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white leading-tight">
                            {m.name}
                          </h4>
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                            📅 {formatBirthdate(m.birthdate)}
                          </p>
                        </div>
                      </div>

                      <a
                        href={getWhatsAppUrl(m.phone, m.whatsappLink, m.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-600 dark:text-teal-400 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-teal-100 dark:border-teal-900/50"
                      >
                        শুভেচ্ছা জানান
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Other Month Birthdays Section */}
            {otherMonthBirthdays.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 pl-1">
                  🗓️ চলতি মাসের অন্যান্য দিন
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-750/30 overflow-hidden shadow-sm">
                  {otherMonthBirthdays.map((m) => (
                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/30 dark:hover:bg-gray-750/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-gray-600 dark:text-gray-400">
                              {m.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 dark:text-white leading-tight">
                            {m.name}
                          </h4>
                          <p className="text-[10px] text-gray-450 dark:text-gray-405 mt-0.5">
                            🗓️ {formatBirthdate(m.birthdate)}
                          </p>
                        </div>
                      </div>

                      <a
                        href={getWhatsAppUrl(m.phone, m.whatsappLink, m.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-650"
                      >
                        শুভেচ্ছা জানান
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
