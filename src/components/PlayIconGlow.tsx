/** The 32px white circular play affordance inside the CTA. */
export default function PlayIconGlow() {
  return (
    <svg
      aria-hidden
      className="block size-[32px] shrink-0"
      fill="none"
      viewBox="0 0 32 32"
      width="32"
      height="32"
    >
      <rect fill="currentColor" height="32" rx="16" width="32" />
      <path
        className="fill-play-glyph"
        d="M22.375 14.8751L12.8751 9.17596C12.0417 8.676 11 9.30095 11 10.3009V21.6991C11 22.699 12.0417 23.324 12.8751 22.824L22.375 17.1249C23.2083 16.625 23.2083 15.375 22.375 14.8751Z"
      />
    </svg>
  )
}
