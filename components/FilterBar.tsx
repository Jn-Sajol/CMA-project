"use client";

import React from "react";
import ProfessionAutocomplete from "@/components/ProfessionAutocomplete";

type FilterBarProps = {
  filters: {
    bloodGroup: string;
    profession: string;
    city: string;
    helpSector: string;
    search: string;
    availableOnly: boolean;
  };
  onChange: (filters: FilterBarProps["filters"]) => void;
};

const BLOOD_GROUPS = [
  { value: "", label: "সব গ্রুপ" },
  { value: "A_POS", label: "A+" }, { value: "A_NEG", label: "A-" },
  { value: "B_POS", label: "B+" }, { value: "B_NEG", label: "B-" },
  { value: "O_POS", label: "O+" }, { value: "O_NEG", label: "O-" },
  { value: "AB_POS", label: "AB+" }, { value: "AB_NEG", label: "AB-" },
];

const PROFESSIONS = [
  { value: "", label: "সব পেশা" },
  { value: "DOCTOR", label: "ডাক্তার" }, { value: "ENGINEER", label: "ইঞ্জিনিয়ার" },
  { value: "LAWYER", label: "আইনজীবী" }, { value: "TEACHER", label: "শিক্ষক" },
  { value: "BUSINESS", label: "ব্যবসায়ী" }, { value: "STUDENT", label: "ছাত্র/ছাত্রী" },
  { value: "GOVERNMENT", label: "সরকারি" }, { value: "OTHER", label: "অন্যান্য" },
];

const CITIES = [
  { value: "", label: "সব শহর" },
  { value: "Dhaka", label: "Dhaka" }, { value: "Chittagong", label: "Chittagong" },
  { value: "Sylhet", label: "Sylhet" }, { value: "Rajshahi", label: "Rajshahi" },
  { value: "Khulna", label: "Khulna" }, { value: "Other", label: "Other" },
];

const HELP_SECTORS = [
  { value: "", label: "সব সেক্টর" },
  { value: "MEDICAL", label: "চিকিৎসা" }, { value: "LEGAL", label: "আইনি" },
  { value: "TECH", label: "প্রযুক্তি" }, { value: "FINANCE", label: "আর্থিক" },
  { value: "TRANSPORT", label: "পরিবহন" }, { value: "EDUCATION", label: "শিক্ষা" },
  { value: "CONSTRUCTION", label: "নির্মাণ" }, { value: "OTHER", label: "অন্যান্য" },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const handleChange = (key: string, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const selectClass = "px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          placeholder="নাম বা কর্মস্থল খুঁজুন..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="grid grid-cols-2 gap-2">
        <select value={filters.bloodGroup} onChange={(e) => handleChange("bloodGroup", e.target.value)} className={selectClass}>
          {BLOOD_GROUPS.map((bg) => <option key={bg.value} value={bg.value}>{bg.label}</option>)}
        </select>
        <ProfessionAutocomplete
          value={filters.profession}
          onChange={(val) => handleChange("profession", val)}
          placeholder="পেশা খুঁজুন..."
          inputClassName={selectClass}
        />
        <select value={filters.city} onChange={(e) => handleChange("city", e.target.value)} className={selectClass}>
          {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filters.helpSector} onChange={(e) => handleChange("helpSector", e.target.value)} className={selectClass}>
          {HELP_SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Available toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={filters.availableOnly}
            onChange={(e) => handleChange("availableOnly", e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-teal-500 transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          শুধু উপলব্ধ রক্তদাতা
        </span>
      </label>
    </div>
  );
}
