import React from "react";

type BloodRequestCardProps = {
  id: string;
  bloodGroup: string;
  hospital: string;
  contactNumber: string;
  urgency: string;
  patientGender?: string | null;
  patientAge?: number | null;
  note?: string | null;
  createdAt: string;
  requesterName?: string;
  onClick?: () => void;
};

const formatBloodGroup = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-",
    O_POS: "O+", O_NEG: "O-", AB_POS: "AB+", AB_NEG: "AB-",
  };
  return map[bg] || bg;
};

const getBloodGroupColor = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "bg-[#185FA5]", A_NEG: "bg-blue-300", B_POS: "bg-[#0F6E56]", B_NEG: "bg-teal-300",
    O_POS: "bg-[#3B6D11]", O_NEG: "bg-green-300", AB_POS: "bg-[#534AB7]", AB_NEG: "bg-purple-300",
  };
  return map[bg] || "bg-gray-500";
};

export default function BloodRequestCard({
  bloodGroup, hospital, contactNumber, urgency, patientGender,
  patientAge, note, createdAt, requesterName, onClick,
}: BloodRequestCardProps) {
  const isCritical = urgency === "CRITICAL";
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
      isCritical
        ? "border-red-400 dark:border-red-500 shadow-red-100 dark:shadow-none"
        : "border-gray-100 dark:border-gray-700"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`${getBloodGroupColor(bloodGroup)} text-white text-sm font-bold px-2.5 py-1 rounded-lg shadow-sm`}>
            {formatBloodGroup(bloodGroup)}
          </span>
          {isCritical && (
            <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
              🚨 জরুরি
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>

      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">🏥 {hospital}</h3>
      
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        {patientGender && <span>রোগী: {patientGender}</span>}
        {patientAge && <span>• বয়স: {patientAge}</span>}
      </div>
      
      {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{note}</p>}
      
      {requesterName && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">অনুরোধকারী: {requesterName}</p>
      )}

      <a
        href={`tel:${contactNumber}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-sm shadow-md shadow-teal-500/20 hover:shadow-teal-500/40 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        যোগাযোগ করুন
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
