"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type User = {
  id: string;
  name: string;
  phone?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  bloodGroup: string;
  city: string;
  area?: string | null;
  profession: string;
  professionCustom?: string | null;
  workplace: string;
  helpSectors: string[];
  customHelpSectors?: string[] | null;
  lastDonationDate?: string | null;
  availableAfter?: string | null;
  createdAt?: string | null;
};

const BLOOD_GROUPS: Record<string, string> = {
  A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
  O_POS: "O+", O_NEG: "O-", AB_POS: "AB+", AB_NEG: "AB-",
};

const BLOOD_COLORS: Record<string, string> = {
  A_POS: "bg-[#185FA5]", A_NEG: "bg-blue-300", B_POS: "bg-[#0F6E56]", B_NEG: "bg-teal-300",
  O_POS: "bg-[#3B6D11]", O_NEG: "bg-green-300", AB_POS: "bg-[#534AB7]", AB_NEG: "bg-purple-300",
};

const PROFESSION_MAP: Record<string, string> = {
  DOCTOR: "ডাক্তার",
  ENGINEER: "ইঞ্জিনিয়ার",
  LAWYER: "আইনজীবী",
  TEACHER: "শিক্ষক",
  BUSINESS: "ব্যবসায়ী",
  STUDENT: "ছাত্র/ছাত্রী",
  GOVERNMENT: "সরকারি চাকরিজীবী",
  OTHER: "অন্যান্য",
};

const HELP_SECTOR_MAP: Record<string, string> = {
  MEDICAL: "চিকিৎসা",
  LEGAL: "আইনি",
  TECH: "প্রযুক্তি",
  FINANCE: "আর্থিক",
  TRANSPORT: "পরিবহন",
  EDUCATION: "শিক্ষা",
  CONSTRUCTION: "নির্মাণ",
  OTHER: "অন্যান্য",
};

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session } = useSession();

  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/members/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("সদস্য পাওয়া যায়নি");
          throw new Error("তথ্য লোড করতে ব্যর্থ হয়েছে");
        }
        const data = await res.json();
        setMember(data);
      } catch (err: any) {
        setError(err.message || "সার্ভার এরর");
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
        <div className="bg-gray-200 dark:bg-gray-800 h-44 animate-pulse" />
        <div className="px-6 -mt-10 space-y-4">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-900 animate-pulse mx-auto" />
          <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/3 mx-auto rounded animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/2 mx-auto rounded animate-pulse" />
          <div className="h-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/2 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 pb-24">
        <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-850 shadow-sm max-w-sm w-full">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{error || "সদস্য পাওয়া যায়নি"}</p>
          <button
            onClick={() => router.push("/members")}
            className="mt-4 px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
          >
            ডিরেক্টরিতে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = !member.availableAfter || new Date(member.availableAfter) < new Date();
  const rawPhone = member.phone || "";
  const formattedPhone = rawPhone.replace(/[^0-9]/g, ""); // keeps only digits for WhatsApp URL helper
  const showPhoneButtons = !!member.phone;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white pt-10 pb-16 px-6 relative rounded-b-[2rem] shadow-lg">
        <button
          onClick={() => router.back()}
          className="absolute top-8 left-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-white active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-center font-bold text-lg">সদস্য প্রোফাইল</h1>
      </div>

      {/* Main Profile Info Panel */}
      <div className="px-4 -mt-10 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-md p-6 relative flex flex-col items-center">
          {/* Avatar */}
          <div className="absolute -top-12 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center shadow-lg">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-500 dark:text-gray-300 font-extrabold uppercase">
                {member.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Name & Blood Group */}
          <div className="mt-14 text-center">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-2">
              {member.name}
              <span className={`${BLOOD_COLORS[member.bloodGroup] || "bg-red-500"} text-white text-xs font-black px-2 py-0.5 rounded shadow-sm`}>
                {BLOOD_GROUPS[member.bloodGroup] || member.bloodGroup}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              📍 {member.city}{member.area ? `, ${member.area}` : ""}
            </p>
          </div>

          {/* Bio Description */}
          {member.bio ? (
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center mt-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-2xl border border-gray-100/50 dark:border-gray-800 w-full italic">
              “{member.bio}”
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 w-full italic">
              কোনো বায়ো যোগ করা হয়নি
            </p>
          )}

          {/* Blood Donation Availability Indicator */}
          <div className="mt-4 w-full">
            <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-2xl text-xs font-semibold ${
              isAvailable
                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/40"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
              {isAvailable ? (
                "রক্তদানে উপলব্ধ প্রস্তুত ✅"
              ) : (
                `সাময়িকভাবে রক্তদানে অনুপলব্ধ (উপলব্ধ: ${new Date(member.availableAfter!).toLocaleDateString("bn-BD")})`
              )}
            </div>
          </div>
        </div>

        {/* Details Information Blocks */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <h3 className="font-black text-xs text-gray-400 uppercase tracking-wider mb-2">পরিচিতি তথ্য</h3>

          {/* Profession & Workplace */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm">
              💼
            </div>
            <div>
              <p className="text-[10px] text-gray-400">পেশা ও কর্মস্থল</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {member.professionCustom || PROFESSION_MAP[member.profession] || member.profession}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{member.workplace}</p>
            </div>
          </div>

          {/* Contact Details */}
          {showPhoneButtons && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm">
                📞
              </div>
              <div>
                <p className="text-[10px] text-gray-400">মোবাইল নম্বর</p>
                <p className="text-xs font-extrabold text-gray-800 dark:text-gray-250 select-all">{member.phone}</p>
              </div>
            </div>
          )}

          {/* Last Donation Date */}
          {member.lastDonationDate && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm">
                🗓️
              </div>
              <div>
                <p className="text-[10px] text-gray-400">শেষ রক্তদান</p>
                <p className="text-xs font-bold text-gray-850 dark:text-gray-200">
                  {new Date(member.lastDonationDate).toLocaleDateString("bn-BD")}
                </p>
              </div>
            </div>
          )}

          {/* Joining Date */}
          {member.createdAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm">
                📅
              </div>
              <div>
                <p className="text-[10px] text-gray-400">যোগদানের তারিখ</p>
                <p className="text-xs font-bold text-gray-850 dark:text-gray-205">
                  {new Date(member.createdAt).toLocaleDateString("bn-BD")}
                </p>
              </div>
            </div>
          )}

          {/* Help Sectors badges */}
          <div>
            <p className="text-[10px] text-gray-400 mb-1.5">সাহায্য করতে পারেন</p>
            {((member.helpSectors && member.helpSectors.length > 0) || (member.customHelpSectors && member.customHelpSectors.length > 0)) ? (
              <div className="flex flex-wrap gap-1.5">
                {member.helpSectors?.map((sector) => (
                  <span
                    key={sector}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                  >
                    {HELP_SECTOR_MAP[sector] || sector}
                  </span>
                ))}
                {member.customHelpSectors?.map((sector) => (
                  <span
                    key={sector}
                    className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-teal-100 dark:border-teal-900"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">কোনো সহায়তার ক্ষেত্র চিহ্নিত করা নেই</p>
            )}
          </div>
        </div>

        {/* Quick Contact Buttons */}
        {showPhoneButtons && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 grid grid-cols-3 gap-2">
            {/* Phone Call */}
            <a
              href={`tel:${member.phone}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 hover:bg-teal-100/50 transition-colors active:scale-95"
            >
              <span className="text-lg">📞</span>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-1">কল করুন</span>
            </a>

            {/* Send SMS */}
            <a
              href={`sms:${member.phone}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 hover:bg-blue-100/50 transition-colors active:scale-95"
            >
              <span className="text-lg">💬</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">এসএমএস</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${formattedPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 hover:bg-green-100/50 transition-colors active:scale-95"
            >
              <span className="text-lg">💬</span>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-1">হোয়াটসঅ্যাপ</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
