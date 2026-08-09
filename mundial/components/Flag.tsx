import { useMemo, useState } from "react";
import { flagCdnUrl, resolveTeamFlag } from "../flags";

type FlagProps = {
  team: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
};

const sizeMap = {
  xs: "h-4 w-5",
  sm: "h-5 w-6",
  md: "h-7 w-8",
  lg: "h-9 w-11",
  xl: "h-12 w-14",
  "2xl": "h-16 w-20 sm:h-20 sm:w-24",
  "3xl": "h-24 w-28 sm:h-32 sm:w-36 lg:h-36 lg:w-44",
  "4xl": "h-28 w-32 sm:h-36 sm:w-44 lg:h-44 lg:w-56",
};

export function Flag({ team, size = "md", className }: FlagProps) {
  const flag = useMemo(() => resolveTeamFlag(team), [team]);
  const flagUrl = useMemo(() => (flag.code ? flagCdnUrl(flag.code) : null), [flag.code]);
  const [imageFailed, setImageFailed] = useState(false);

  const sizeClass = sizeMap[size];
  const classes = `${sizeClass} ${className || ""}`;

  if (!flagUrl || imageFailed) {
    return (
      <span
        className={`${classes} inline-grid place-items-center leading-none`}
        aria-label={`Bandera de ${team}`}
        role="img"
      >
        {flag.emoji}
      </span>
    );
  }

  return (
    <img
      key={flagUrl}
      src={flagUrl}
      alt={`Bandera de ${team}`}
      className={`${classes} object-contain`}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}
