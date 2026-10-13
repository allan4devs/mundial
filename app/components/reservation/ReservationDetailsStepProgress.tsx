import type { BookingStepId } from "@/lib/reservation/types";

interface ReservationDetailsStepProgressProps {
  steps: Array<{ id: BookingStepId; label: string }>;
  currentStep: BookingStepId;
  onStepSelect?: (step: BookingStepId) => void;
  maxReachableStep?: BookingStepId;
}

export default function ReservationDetailsStepProgress({
  steps,
  currentStep,
  onStepSelect,
  maxReachableStep = currentStep,
}: ReservationDetailsStepProgressProps) {
  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/35" aria-label="Booking progress">
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{currentStep} / {steps.length}</p>
          <p className="min-w-0 truncate text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {steps.find((step) => step.id === currentStep)?.label}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {steps.map((step) => {
            const canJump = step.id <= maxReachableStep && step.id !== currentStep;
            return (
              <button
                key={step.id}
                type="button"
                disabled={!canJump}
                onClick={() => onStepSelect?.(step.id)}
                aria-label={step.label}
                aria-current={currentStep === step.id ? "step" : undefined}
                className={`h-1.5 rounded-full transition ${
                  currentStep >= step.id ? "bg-[#00C4B0]" : "bg-zinc-200 dark:bg-zinc-700"
                } ${canJump ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
              />
            );
          })}
        </div>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {steps.map((step) => {
          const isCurrent = currentStep === step.id;
          const isDone = currentStep > step.id;
          const canJump = step.id <= maxReachableStep && !isCurrent;

          return (
            <div key={step.id} className="flex flex-1 items-center gap-2" aria-current={isCurrent ? "step" : undefined}>
              <button
                type="button"
                disabled={!canJump}
                onClick={() => onStepSelect?.(step.id)}
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                  isCurrent
                    ? "border-[#00C4B0] bg-[#00C4B0] text-[#18312f]"
                    : isDone
                    ? "border-teal-400 bg-teal-400/20 text-teal-700 dark:text-teal-300"
                    : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                } ${canJump ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
              >
                {step.id}
              </button>
              <button
                type="button"
                disabled={!canJump}
                onClick={() => onStepSelect?.(step.id)}
                className={`min-w-0 truncate text-left text-xs font-semibold ${
                  isCurrent
                    ? "text-[#087d72] dark:text-[#66ddcf]"
                    : isDone
                      ? "text-teal-700 dark:text-teal-300"
                      : "text-zinc-500"
                } ${canJump ? "cursor-pointer hover:underline" : "cursor-default"}`}
              >
                {step.label}
              </button>
              {step.id < steps.length && (
                <span className={`h-px flex-1 ${isDone ? "bg-teal-500/60" : "bg-zinc-300 dark:bg-zinc-800"}`} aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
