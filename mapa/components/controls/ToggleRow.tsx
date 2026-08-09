import { cn } from '../../lib/cn';
import type { ToggleRowProps } from '../../types';

export default function ToggleRow({ active, icon, label, onClick }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs font-bold text-stone-700 transition hover:bg-stone-100"
    >
      <span className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center text-stone-600">{icon}</span>
        {label}
      </span>
      <span className={cn('h-5 w-10 rounded-full p-0.5 transition', active ? 'bg-sky-500' : 'bg-stone-300')} aria-hidden="true">
        <span className={cn('block h-4 w-4 rounded-full bg-white transition', active && 'translate-x-5')} />
      </span>
    </button>
  );
}
