"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProfessionAutocomplete from "@/components/ProfessionAutocomplete";

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

const PROFESSIONS = [
  { value: "DOCTOR", label: "ডাক্তার" },
  { value: "ENGINEER", label: "ইঞ্জিনিয়ার" },
  { value: "LAWYER", label: "আইনজীবী" },
  { value: "TEACHER", label: "শিক্ষক" },
  { value: "BUSINESS", label: "ব্যবসায়ী" },
  { value: "STUDENT", label: "ছাত্র/ছাত্রী" },
  { value: "GOVERNMENT", label: "সরকারি চাকরিজীবী" },
  { value: "OTHER", label: "অন্যান্য" },
];

const CITIES = ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Other"];

const HELP_SECTORS = [
  { value: "MEDICAL", label: "চিকিৎসা" },
  { value: "LEGAL", label: "আইনি" },
  { value: "TECH", label: "প্রযুক্তি" },
  { value: "FINANCE", label: "আর্থিক" },
  { value: "TRANSPORT", label: "পরিবহন" },
  { value: "EDUCATION", label: "শিক্ষা" },
  { value: "CONSTRUCTION", label: "নির্মাণ" },
  { value: "OTHER", label: "অন্যান্য" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customSectorInput, setCustomSectorInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    bloodGroup: "",
    profession: "",
    workplace: "",
    city: "",
    area: "",
    bio: "",
    helpSectors: [] as string[],
    customHelpSectors: [] as string[],
    lastDonationDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleHelpSector = (sector: string) => {
    setFormData((prev) => ({
      ...prev,
      helpSectors: prev.helpSectors.includes(sector)
        ? prev.helpSectors.filter((s) => s !== sector)
        : [...prev.helpSectors, sector],
    }));
  };

  const addCustomHelpSector = () => {
    const value = customSectorInput.trim();
    if (value && !formData.customHelpSectors.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        customHelpSectors: [...prev.customHelpSectors, value],
      }));
      setCustomSectorInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lastDonationDate: formData.lastDonationDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "নিবন্ধনে সমস্যা হয়েছে");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const loginRes = await signIn("credentials", {
        phone: formData.phone,
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("নিবন্ধন সফল, কিন্তু লগইনে সমস্যা হয়েছে। লগইন পেজে যান।");
        setLoading(false);
        return;
      }

      router.push("/home");
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">নিবন্ধন করুন</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">কমিউনিটিতে যোগ দিন</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-center text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="আপনার পুরো নাম"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                ফোন নম্বর <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                পাসওয়ার্ড <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="ন্যূনতম ৬ অক্ষর"
                minLength={6}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                রক্তের গ্রুপ <span className="text-red-500">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              >
                <option value="">নির্বাচন করুন</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg.value} value={bg.value}>
                    {bg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                পেশা <span className="text-red-500">*</span>
              </label>
              <ProfessionAutocomplete
                value={formData.profession}
                onChange={(val) => setFormData((prev) => ({ ...prev, profession: val }))}
                required
              />
            </div>

            {/* Workplace */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                কর্মস্থল <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="workplace"
                value={formData.workplace}
                onChange={handleChange}
                placeholder="কর্মস্থল বা প্রতিষ্ঠানের নাম"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                শহর <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              >
                <option value="">নির্বাচন করুন</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                এলাকা
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="যেমন: মিরপুর ১০"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                নিজের সম্পর্কে লিখুন <span className="text-gray-400 text-xs">({(formData.bio || "").length}/300)</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="যেমন: আমি সফটওয়্যার ইঞ্জিনিয়ার, বর্তমানে ঢাকায় কর্মরত। আইনি ও প্রযুক্তি বিষয়ে সাহায্য করতে পারি।"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none resize-none"
              />
            </div>

            {/* Help Sectors - Multi-select chips */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                সাহায্যের ক্ষেত্র <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {HELP_SECTORS.map((sector) => {
                  const isSelected = formData.helpSectors.includes(sector.value);
                  return (
                    <button
                      key={sector.value}
                      type="button"
                      onClick={() => toggleHelpSector(sector.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                        isSelected
                          ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/25"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400"
                      }`}
                    >
                      {isSelected && "✓ "}
                      {sector.label}
                    </button>
                  );
                })}
              </div>

              {/* Render customHelpSectors as selected chips */}
              {formData.customHelpSectors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.customHelpSectors.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          customHelpSectors: prev.customHelpSectors.filter((s) => s !== sector),
                        }));
                      }}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-teal-500 text-white border border-teal-500 shadow-md shadow-teal-500/25 transition-all duration-200 hover:bg-red-500 hover:border-red-500 flex items-center gap-1 group"
                    >
                      <span>✓ {sector}</span>
                      <span className="text-teal-100 group-hover:text-white font-bold text-xs ml-1">×</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Help Sector Input (only visible when "অন্যান্য" (OTHER) is selected) */}
              {formData.helpSectors.includes("OTHER") && (
                <div className="flex gap-2 items-center mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="text"
                    value={customSectorInput}
                    onChange={(e) => setCustomSectorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Prevent register form submit
                        addCustomHelpSector();
                      }
                    }}
                    placeholder="আপনার সাহায্যের ক্ষেত্র লিখুন"
                    className="flex-grow px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCustomHelpSector}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    + যোগ করুন
                  </button>
                </div>
              )}
            </div>

            {/* Last Donation Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                শেষ রক্তদানের তারিখ <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span>
              </label>
              <input
                type="date"
                name="lastDonationDate"
                value={formData.lastDonationDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  নিবন্ধন হচ্ছে...
                </span>
              ) : (
                "নিবন্ধন করুন"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ইতোমধ্যে অ্যাকাউন্ট আছে?{" "}
              <Link href="/login" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                লগইন করুন
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
