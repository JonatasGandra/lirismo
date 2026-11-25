type IconProps = { className?: string };

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="M8.5 5.8v12.4c0 .62.68 1 1.21.68l9.8-6.2a.8.8 0 0 0 0-1.36l-9.8-6.2a.8.8 0 0 0-1.21.68Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="6.75" y="5.5" width="3.75" height="13" rx="1.2" fill="currentColor" />
      <rect x="13.5" y="5.5" width="3.75" height="13" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function VolumeIcon({ className, muted = false }: IconProps & { muted?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Seta longa e fina, no estilo dos catálogos impressos. */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 12" className={className} aria-hidden="true" focusable="false">
      <path
        d="M1 6h27M23 1.5 28.5 6 23 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
