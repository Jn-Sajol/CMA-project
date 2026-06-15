import React from "react";

type SosCardProps = {
  id: string;
  sosType: string;
  description: string;
  city: string;
  contactNumber: string;
  createdAt: string;
  requesterName?: string;
};

const SOS_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  MEDICAL: { label: "চিকিৎসা", icon: "🏥", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  BLOOD: { label: "রক্ত", icon: "🩸", color: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" },
  FINANCIAL: { label: "আর্থিক", icon: "💰", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
  TRANSPORT: { label: "পরিবহন", icon: "🚗", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  LEGAL: { label: "আইনি", icon: "⚖️", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  OTHER: { label: "অন্যান্য", icon: "📢", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
};

export default function SosCard({ sosType, description, city, contactNumber, createdAt, requesterName }: SosCardProps) {
  const typeInfo = SOS_TYPE_MAP[sosType] || SOS_TYPE_MAP.OTHER;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border-2 border-orange-200 dark:border-orange-800">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${typeInfo.color}`}>
          {typeInfo.icon} {typeInfo.label}
        </span>
        <span className="text-xs text-gray-400">{getTimeAgo(createdAt)}</span>
      </div>

      <p className="text-sm text-gray-800 dark:text-gray-200 mt-2 leading-relaxed">{description}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">📍 {city}</p>
      {requesterName && <p className="text-xs text-gray-400 mt-1">অনুরোধকারী: {requesterName}</p>}

      <a
        href={`tel:${contactNumber}`}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-2 px-4 rounded-xl text-sm shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        জরুরি যোগাযোগ
      </a>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
}
