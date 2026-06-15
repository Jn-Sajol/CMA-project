import React from "react";

type NoticeCardProps = {
  id: string;
  title: string;
  body: string;
  postType: string;
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  authorName?: string;
  imageUrl?: string | null;
  onClick?: () => void;
};

const POST_TYPE_MAP: Record<string, { label: string; color: string }> = {
  NOTICE: { label: "নোটিশ", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  EVENT: { label: "ইভেন্ট", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  IMPORTANT: { label: "গুরুত্বপূর্ণ", color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  INFO: { label: "তথ্য", color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
};

export default function NoticeCard({ title, body, postType, pinned, viewCount, createdAt, authorName, imageUrl, onClick }: NoticeCardProps) {
  const typeInfo = POST_TYPE_MAP[postType] || POST_TYPE_MAP.INFO;

  // Clean HTML from body if it has HTML tags (since we will render safely)
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
        pinned ? "border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10" : "border-gray-100 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {pinned && (
            <span className="text-amber-500 text-xs font-bold flex items-center gap-1">
              📌 পিন করা
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {viewCount}
        </span>
      </div>

      <div className="flex gap-3">
        {imageUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight break-words">{title}</h3>
          <p className="text-xs text-gray-650 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-2 break-words">
            {stripHtml(body)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400">
        {authorName && <span>✍️ {authorName}</span>}
        <span>{new Date(createdAt).toLocaleDateString("bn-BD")}</span>
      </div>
    </div>
  );
}
