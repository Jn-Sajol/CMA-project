import React from 'react';

type MemberCardProps = {
  name: string;
  photoUrl?: string | null;
  bloodGroup: string;
  profession: string;
  workplace: string;
  city: string;
  helpSectors?: string[];
  isAvailable?: boolean;
};

const getBloodGroupColor = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "bg-[#185FA5]",
    A_NEG: "bg-blue-300",
    B_POS: "bg-[#0F6E56]",
    B_NEG: "bg-teal-300",
    O_POS: "bg-[#3B6D11]",
    O_NEG: "bg-green-300",
    AB_POS: "bg-[#534AB7]",
    AB_NEG: "bg-purple-300",
  };
  return map[bg] || "bg-gray-500";
};

const formatBloodGroup = (bg: string) => {
  const map: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    O_POS: "O+",
    O_NEG: "O-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
  };
  return map[bg] || bg;
};

export default function MemberCard({
  name,
  photoUrl,
  bloodGroup,
  profession,
  workplace,
  city,
  helpSectors = [],
  isAvailable = false,
}: MemberCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex gap-4 items-start relative border border-gray-100 dark:border-gray-700">
      {/* Photo Placeholder */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500 dark:text-gray-400 text-2xl font-bold">
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
            {name}
          </h3>
          <span
            className={`${getBloodGroupColor(
              bloodGroup
            )} text-white text-xs font-bold px-2 py-1 rounded shadow-sm`}
          >
            {formatBloodGroup(bloodGroup)}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {profession} • {workplace}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          📍 {city}
        </p>

        {helpSectors && helpSectors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {helpSectors.map((sector) => (
              <span
                key={sector}
                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider"
              >
                {sector}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Availability Dot */}
      {isAvailable && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" title="Available to donate"></div>
      )}
    </div>
  );
}
