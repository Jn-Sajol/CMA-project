"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [customSectorInput, setCustomSectorInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    photoUrl: "",
    bloodGroup: "A_POS",
    city: "Dhaka",
    area: "",
    profession: "",
    workplace: "",
    bio: "",
    helpSectors: [] as string[],
    customHelpSectors: [] as string[],
    lastDonationDate: "",
    birthdate: "",
    whatsappLink: "",
  });

  const [availableAfter, setAvailableAfter] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/members/me");
      if (!res.ok) {
        // Fallback to /api/profile if /api/members/me isn't ready
        const resFallback = await fetch("/api/profile");
        if (!resFallback.ok) throw new Error("Failed to fetch");
        const data = await resFallback.json();
        populateForm(data);
      } else {
        const data = await res.json();
        populateForm(data);
      }
    } catch (err) {
      setError("প্রোফাইল লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: any) => {
    setFormData({
      name: data.name || "",
      phone: data.phone || "",
      photoUrl: data.photoUrl || "",
      bloodGroup: data.bloodGroup || "A_POS",
      city: data.city || "Dhaka",
      area: data.area || "",
      profession: data.professionCustom || data.profession || "",
      workplace: data.workplace || "",
      bio: data.bio || "",
      helpSectors: data.helpSectors || [],
      customHelpSectors: data.customHelpSectors || [],
      lastDonationDate: data.lastDonationDate
        ? new Date(data.lastDonationDate).toISOString().split("T")[0]
        : "",
      birthdate: data.birthdate
        ? new Date(data.birthdate).toISOString().split("T")[0]
        : "",
      whatsappLink: data.whatsappLink || "",
    });
    setAvailableAfter(data.availableAfter || null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ছবি আপলোড ব্যর্থ হয়েছে");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, photoUrl: data.url }));
      setSuccess("ছবি সফলভাবে আপলোড হয়েছে 📸");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "ছবি আপলোডে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
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
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lastDonationDate: formData.lastDonationDate || null,
          birthdate: formData.birthdate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "আপডেটে সমস্যা হয়েছে");
        setSaving(false);
        return;
      }

      const data = await res.json();
      populateForm(data);
      setSuccess("প্রোফাইল সফলভাবে আপডেট হয়েছে ✅");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const isAvailable = !availableAfter || new Date(availableAfter) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md px-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-6 pt-12 pb-20 rounded-b-3xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-center relative z-10">আমার প্রোফাইল</h1>
        <p className="text-center text-teal-100 text-sm mt-1 relative z-10">
          {formData.phone || (session?.user as any)?.phone}
        </p>

        {/* Birthday List Link Button inside Header */}
        <div className="absolute top-4 right-4 z-20">
          <Link
            href="/birthdays"
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all border border-white/10 active:scale-95"
          >
            🎂 জন্মদিনের তালিকা
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto -mt-12 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6 relative">
          
          {/* Hidden Photo Upload Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Photo Avatar Upload */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
            <div
              onClick={handleAvatarClick}
              className="w-20 h-20 bg-gray-200 dark:bg-gray-650 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center shadow-lg cursor-pointer group relative"
            >
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt={formData.name || "Profile"}
                  className="w-full h-full object-cover transition-opacity duration-200"
                />
              ) : (
                <span className="text-2xl text-gray-500 dark:text-gray-300 font-bold group-hover:opacity-50 transition-opacity">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-5 h-5 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white text-[8px] mt-0.5 block leading-none">পরিবর্তন করুন</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blood Availability Alert */}
          <div className="mt-12 mb-4">
            <div
              className={`text-center py-2 px-4 rounded-xl text-sm font-medium ${
                isAvailable
                  ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {isAvailable
                ? "রಕ್ತদানে উপলব্ধ ✅"
                : `উপলব্ধ নয় — ${new Date(availableAfter!).toLocaleDateString("bn-BD")} থেকে পারবেন`}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-center text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-xl mb-4 text-center text-sm font-medium shadow-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">নাম</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* Phone (Read Only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1.5">মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                readOnly
                className="w-full px-4 py-3 border border-gray-150 dark:border-gray-650 bg-gray-50 dark:bg-gray-750 text-gray-400 dark:text-gray-500 rounded-xl outline-none cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                বায়ো <span className="text-gray-400 text-xs">({(formData.bio || "").length}/300)</span>
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength={300}
                rows={3}
                placeholder="আপনার সম্পর্কে কিছু লিখুন..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none resize-none"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">রক্তের গ্রুপ</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg.value} value={bg.value}>{bg.label}</option>
                ))}
              </select>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">পেশা</label>
              <ProfessionAutocomplete
                value={formData.profession}
                onChange={(val) => setFormData((prev) => ({ ...prev, profession: val }))}
                required
              />
            </div>

            {/* Workplace */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">কর্মস্থল</label>
              <input
                type="text"
                name="workplace"
                value={formData.workplace}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">শহর</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
                required
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">এলাকা</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="যেমন: মিরপুর ১০"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
              />
            </div>

            {/* Help Sectors */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">সাহায্যের ক্ষেত্র (একাধিক নির্বাচন করা সম্ভব)</label>
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
                          : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-teal-400"
                      }`}
                    >
                      {isSelected && "✓ "}{sector.label}
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
                        e.preventDefault();
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
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

            {/* Birthdate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
                জন্মদিন <span className="text-gray-400 text-xs">(ঐচ্ছিক)</span>
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
              />
            </div>

            {/* WhatsApp Link */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
                হোয়াটসঅ্যাপ লিঙ্ক (WhatsApp Link)
              </label>
              <input
                type="url"
                name="whatsappLink"
                value={formData.whatsappLink}
                onChange={handleChange}
                placeholder="যেমন: https://wa.me/8801XXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  সংরক্ষণ হচ্ছে...
                </span>
              ) : (
                "সংরক্ষণ করুন"
              )}
            </button>
          </form>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold py-3.5 px-4 rounded-xl transition-all duration-200"
          >
            লগআউট
          </button>
        </div>
      </div>
    </div>
  );
}
