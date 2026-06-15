"use client";

import React, { useState, useEffect, useRef } from "react";

const PREDEFINED_PROFESSIONS = [
  "Software Engineer", "Web Developer", "Mobile Developer", "DevOps Engineer", "Data Scientist", 
  "UI/UX Designer", "Network Engineer", "Cybersecurity Specialist", "Database Administrator", "IT Manager", 
  "Doctor", "Surgeon", "Dentist", "Pharmacist", "Nurse", 
  "Medical Officer", "Cardiologist", "Dermatologist", "Psychiatrist", "Radiologist", 
  "Lawyer", "Judge", "Legal Advisor", "Barrister", "Advocate", 
  "Teacher", "Professor", "Lecturer", "School Principal", "Tutor", 
  "Businessman", "Entrepreneur", "Shop Owner", "Trader", "Importer/Exporter", 
  "Student", 
  "Government Officer", "Civil Servant", "Police Officer", "Army Officer", "Bank Officer", 
  "Accountant", "Auditor", "Finance Manager", "Journalist", "Photographer", 
  "Videographer", "Architect", "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", 
  "Chemical Engineer", "Farmer", "NGO Worker", "Social Worker", "Pilot", 
  "Driver", "Other"
];

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
};

export default function ProfessionAutocomplete({
  value,
  onChange,
  placeholder = "যেমন: Software Engineer",
  required = false,
  className = "",
  inputClassName = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 outline-none",
}: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions
  const filtered = PREDEFINED_PROFESSIONS.filter((p) =>
    p.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 8);

  const showCustomAdd =
    inputValue.trim().length > 0 &&
    !PREDEFINED_PROFESSIONS.some(
      (p) => p.toLowerCase() === inputValue.trim().toLowerCase()
    );

  const selectSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isOpen) {
      if (filtered.length > 0) {
        e.preventDefault();
        selectSuggestion(filtered[0]);
      } else if (showCustomAdd) {
        e.preventDefault();
        selectSuggestion(inputValue.trim());
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
      />
      {isOpen && (filtered.length > 0 || showCustomAdd) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl"
            >
              {suggestion}
            </button>
          ))}
          {showCustomAdd && (
            <button
              type="button"
              onClick={() => selectSuggestion(inputValue.trim())}
              className="w-full px-4 py-2.5 text-left text-sm text-teal-600 dark:text-teal-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700 rounded-b-xl"
            >
              + "{inputValue.trim()}" যোগ করুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}
