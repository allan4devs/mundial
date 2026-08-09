import type { ReactNode } from 'react';
import type { TourGroup } from '../../types';

interface ActiveGroupBadgeProps {
  group: TourGroup;
  leadingIcon: ReactNode;
  trailingIcon: ReactNode;
}

export default function ActiveGroupBadge({ group, leadingIcon, trailingIcon }: ActiveGroupBadgeProps) {
  return (
    <div className="absolute left-1/2 top-[5.1rem] z-40 hidden -translate-x-1/2 items-center gap-2 rounded-lg border border-stone-200 bg-white/88 px-3 py-2 text-xs font-black text-stone-700 shadow-lg backdrop-blur lg:flex">
      {leadingIcon}
      {group.name}: {group.people} personas en ruta desde {group.startTime}
      {trailingIcon}
    </div>
  );
}
