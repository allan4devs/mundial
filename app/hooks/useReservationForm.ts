import { useState, useMemo, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import type { ReservationFormState } from "@/lib/reservation/types";
import { EMAIL_REGEX, PHONE_NUMBER_REGEX } from "@/lib/reservation/constants";

interface UseReservationFormReturn {
  formState: ReservationFormState;
  isHydrated: boolean;
  setFormState: Dispatch<SetStateAction<ReservationFormState>>;
  handleChange: (key: keyof ReservationFormState, value: string | boolean) => void;
  validation: { isNameValid: boolean; isEmailValid: boolean; isPhoneNumberValid: boolean; isAgreeTermsValid: boolean };
}

export default function useReservationForm(initialState: ReservationFormState, options: { storageKey?: string } = {}): UseReservationFormReturn {
  const [formState, setFormState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const { storageKey } = options;
  useEffect(() => {
    if (!storageKey) { setIsHydrated(true); return; }
    try { const parsed = JSON.parse(sessionStorage.getItem(storageKey) || "null") as Partial<ReservationFormState> | null;
      if (parsed) setFormState(current => ({ ...current, ...parsed, agreeTerms: false }));
    } catch { /* unavailable storage */ } finally { setIsHydrated(true); }
  }, [storageKey]);
  useEffect(() => { if (storageKey) try { sessionStorage.setItem(storageKey, JSON.stringify({ ...formState, agreeTerms: false })); } catch { /* unavailable storage */ } }, [formState, storageKey]);
  const handleChange = useCallback((key: keyof ReservationFormState, value: string | boolean) => setFormState(prev => ({ ...prev, [key]: value })), []);
  const validation = useMemo(() => ({
    isNameValid: formState.name.trim().length >= 2 && formState.name.trim().length <= 120,
    isEmailValid: formState.email.trim().length <= 254 && EMAIL_REGEX.test(formState.email.trim()),
    isPhoneNumberValid: PHONE_NUMBER_REGEX.test(formState.phoneNumber.trim()) && formState.phoneNumber.replace(/\D/g, "").length >= 6,
    isAgreeTermsValid: formState.agreeTerms,
  }), [formState]);
  return { formState, isHydrated, setFormState, handleChange, validation };
}
