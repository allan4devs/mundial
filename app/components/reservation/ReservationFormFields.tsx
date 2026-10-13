"use client";

import { useState, useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { PHONE_COUNTRIES as ALL_PHONE_COUNTRIES } from "@/app/components/reservation/phoneCountries";
import type { ReservationFormState } from "@/lib/reservation/types";

export const FormError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
    {message}
  </p>
);

interface TravelerInputFieldProps {
  label: string;
  id: keyof ReservationFormState;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder: string;
  isValid: boolean;
  validationMessage: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "search" | "numeric" | "decimal" | "url" | "none";
}

export const TravelerInputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  onBlur,
  onKeyDown,
  inputRef,
  placeholder,
  isValid,
  validationMessage,
  required = false,
  className = "",
  autoComplete,
  inputMode,
}: TravelerInputFieldProps) => {
  const isTouched = value.trim() !== "";
  const showError = isTouched && !isValid;
  const showOk = isTouched && isValid;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
        {label}
        {required && <span className="ml-1 text-emerald-600">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          ref={inputRef}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={`w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold text-zinc-900 outline-none transition focus:ring-4 dark:bg-zinc-900 dark:text-zinc-50 ${
            showError
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : showOk
                ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/15"
                : "border-zinc-300 focus:border-teal-500 focus:ring-teal-500/15 dark:border-zinc-700"
          }`}
        placeholder={placeholder}
        maxLength={id === "name" ? 120 : id === "email" ? 254 : undefined}
        required={required}
        />
        {showOk && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
            <Check className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      {showError && <FormError message={validationMessage} />}
    </div>
  );
};

interface TravelerPhoneInputProps {
  phoneCode: string;
  phoneNumber: string;
  setPhoneCode: (code: string) => void;
  setPhoneNumber: (number: string) => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  isValid: boolean;
  label: string;
  placeholder: string;
  validationMessage: string;
}

const QUICK_CODES = ["+506", "+1", "+34", "+52"] as const;

export const TravelerPhoneInput = ({
  phoneCode,
  phoneNumber,
  setPhoneCode,
  setPhoneNumber,
  onBlur,
  onKeyDown,
  inputRef,
  isValid,
  label,
  placeholder,
  validationMessage,
}: TravelerPhoneInputProps) => {
  const isTouched = phoneNumber.trim() !== "";
  const showError = isTouched && !isValid;
  const showOk = isTouched && isValid;
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef<HTMLDivElement | null>(null);
  const selectedCountry = ALL_PHONE_COUNTRIES.find((country) => country.code === phoneCode) ?? ALL_PHONE_COUNTRIES[0];
  const normalizedCountrySearch = countrySearch.trim().toLowerCase();
  const filteredCountries = ALL_PHONE_COUNTRIES.filter((country) => {
    if (!normalizedCountrySearch) return true;

    return [country.name, country.code, country.flag]
      .some((value) => value.toLowerCase().includes(normalizedCountrySearch));
  });

  useEffect(() => {
    if (!isCountryOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!countryPickerRef.current?.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isCountryOpen]);

  const handleCountrySelect = (countryCode: string) => {
    setPhoneCode(countryCode);
    setCountrySearch("");
    setIsCountryOpen(false);
    window.setTimeout(() => inputRef?.current?.focus({ preventScroll: true }), 80);
  };

  return (
    <div className="md:col-span-2">
      <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
        {label}
        <span className="ml-1 text-emerald-600">*</span>
      </label>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {QUICK_CODES.map((code) => {
          const selected = phoneCode === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => handleCountrySelect(code)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition ${
                selected
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {code}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(190px,0.9fr)_minmax(0,1fr)]">
        <div ref={countryPickerRef} className="relative">
          <button
            id="phoneCode"
            type="button"
            onClick={() => setIsCountryOpen((prev) => !prev)}
            className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-left text-sm font-semibold text-zinc-900 transition hover:border-teal-500 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-haspopup="listbox"
            aria-expanded={isCountryOpen}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {selectedCountry.flag}
              </span>
              <span className="min-w-0 truncate">{selectedCountry.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-zinc-500">
              {selectedCountry.code}
              <ChevronDown className={`h-4 w-4 transition-transform ${isCountryOpen ? "rotate-180" : ""}`} aria-hidden />
            </span>
          </button>

          {isCountryOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-black/20 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                  <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                  <input
                    type="search"
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    placeholder="Search country or code"
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-1" role="listbox" aria-labelledby="phoneCode">
                {filteredCountries.map((country) => {
                  const isSelected = country.code === phoneCode;
                  return (
                    <button
                      key={`${country.code}-${country.flag}`}
                      type="button"
                      onClick={() => handleCountrySelect(country.code)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                          {country.flag}
                        </span>
                        <span className="min-w-0 truncate">{country.name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 font-bold">
                        {country.code}
                        {isSelected && <Check className="h-4 w-4" aria-hidden />}
                      </span>
                    </button>
                  );
                })}
                {filteredCountries.length === 0 && (
                  <p className="px-3 py-4 text-center text-sm text-zinc-500">No country found</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <input
            id="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            ref={inputRef}
            className={`w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold text-zinc-900 outline-none transition focus:ring-4 dark:bg-zinc-900 dark:text-zinc-50 ${
              showError
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                : showOk
                  ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/15"
                  : "border-zinc-300 focus:border-teal-500 focus:ring-teal-500/15 dark:border-zinc-700"
            }`}
          placeholder={placeholder}
          maxLength={20}
          required
          />
          {showOk && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
              <Check className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
      </div>
      {showError && <FormError message={validationMessage} />}
    </div>
  );
};
