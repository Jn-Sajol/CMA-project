"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import MemberCard from "@/components/MemberCard";

type User = {
  id: string;
  name: string;
  photoUrl?: string | null;
  bloodGroup: string;
  profession: string;
  professionCustom?: string | null;
  workplace: string;
  city: string;
  helpSectors: string[];
  customHelpSectors?: string[] | null;
  availableAfter?: string | null;
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

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    bloodGroup: "",
    profession: "",
    city: "",
    helpSector: "",
    search: "",
    availableOnly: false,
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("সদস্য তালিকা লোড করতে ব্যর্থ হয়েছে");
        const data = await res.json();
        setMembers(data);
      } catch (err: any) {
        setError(err.message || "সার্ভার এরর");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // 1. Text Search (name or workplace)
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const nameMatch = member.name?.toLowerCase().includes(query);
        const workplaceMatch = member.workplace?.toLowerCase().includes(query);
        if (!nameMatch && !workplaceMatch) return false;
      }

      // 2. Blood Group
      if (filters.bloodGroup && member.bloodGroup !== filters.bloodGroup) {
        return false;
      }

      // 3. Profession
      if (filters.profession) {
        const filterVal = filters.profession.toLowerCase();
        const customVal = member.professionCustom?.toLowerCase() || "";
        const enumVal = member.profession?.toLowerCase() || "";
        if (!customVal.includes(filterVal) && !enumVal.includes(filterVal)) {
          return false;
        }
      }

      // 4. City
      if (filters.city && member.city !== filters.city) {
        return false;
      }

      // 5. Help Sector
      if (filters.helpSector && !member.helpSectors?.includes(filters.helpSector)) {
        return false;
      }

      // 6. Availability Check
      if (filters.availableOnly) {
        const isAvailable =
          !member.availableAfter || new Date(member.availableAfter) < new Date();
        if (!isAvailable) return false;
      }

      return true;
    });
  }, [members, filters]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-bold">সদস্য ডিরেক্টরি</h1>
        <p className="text-xs text-teal-100 mt-0.5">সব সদস্যদের তালিকা ও যোগাযোগের মাধ্যম</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Filters */}
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>মোট সদস্য: {members.length} জন</span>
          {members.length > 0 && (
            <span>ফলাফল: {filteredMembers.length} জন</span>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-200 dark:border-red-900 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Members Grid / List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">কোনো সদস্য পাওয়া যায়নি</p>
            <p className="text-xs text-gray-400 mt-1">ভিন্ন ফিল্টার ব্যবহার করে চেষ্টা করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredMembers.map((member) => {
              const isAvailable =
                !member.availableAfter || new Date(member.availableAfter) < new Date();
              const displayProfession =
                member.professionCustom || PROFESSION_MAP[member.profession] || member.profession;
              const displayHelpSectors = [
                ...(member.helpSectors?.map((s) => HELP_SECTOR_MAP[s] || s) || []),
                ...(member.customHelpSectors || []),
              ];

              return (
                <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="block transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <MemberCard
                    name={member.name}
                    photoUrl={member.photoUrl}
                    bloodGroup={member.bloodGroup}
                    profession={displayProfession}
                    workplace={member.workplace}
                    city={member.city}
                    helpSectors={displayHelpSectors}
                    isAvailable={isAvailable}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
