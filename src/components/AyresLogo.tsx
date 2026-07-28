export function AyresLogo({
  size = 42,
  showWord = false,
  className = '',
}: {
  size?: number
  showWord?: boolean
  className?: string
}) {
  const width = showWord ? size * 3.25 : size

  return (
    <svg
      className={className}
      width={width}
      height={size}
      viewBox={showWord ? '0 0 208 72' : '0 0 72 72'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AYRES"
    >
      <defs>
        <linearGradient id="ayres-main" x1="17" y1="10" x2="55" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35c4ff" />
          <stop offset=".48" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="ayres-deep" x1="16" y1="56" x2="48" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#061b5c" />
          <stop offset=".55" stopColor="#1647d9" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="ayres-purple" x1="43" y1="32" x2="61" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="ayres-arrow" x1="16" y1="47" x2="60" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset=".58" stopColor="#eaf6ff" />
          <stop offset="1" stopColor="#a7f3ff" />
        </linearGradient>
        <linearGradient id="ayres-word" x1="83" y1="22" x2="204" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset=".58" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path d="M34.8 6.5c2.15 0 4.08 1.22 5.02 3.15l24.56 50.2c1.25 2.55-.6 5.53-3.44 5.53H48.1L36.1 39.65 23.6 65.38H11.14c-2.84 0-4.7-2.98-3.44-5.53L29.78 9.65A5.57 5.57 0 0134.8 6.5z" fill="url(#ayres-main)" />
      <path d="M34.8 6.5c2.15 0 4.08 1.22 5.02 3.15l7.66 15.65-8.3 5.22-3.08-6.5L15.7 65.38h-4.56c-2.84 0-4.7-2.98-3.44-5.53L29.78 9.65A5.57 5.57 0 0134.8 6.5z" fill="url(#ayres-deep)" opacity=".96" />
      <path d="M43.55 32.1l20.83 27.75c1.25 2.55-.6 5.53-3.44 5.53H48.1L38.05 43.88l5.5-11.78z" fill="url(#ayres-purple)" />
      <path d="M15.4 50.55c10.82-10.8 24.9-18.46 42.22-22.98l-3.76 5.8C40.2 36.95 28.03 43.15 17.34 52.05l-1.94-1.5z" fill="url(#ayres-arrow)" />
      <path d="M49.18 25.05l13.1 5.28-11.64 8.72 1.82-5.72C41.9 35.3 32.22 39.35 23.4 45.5c7.96-8.9 17.2-15.18 27.82-18.84l-2.04-1.61z" fill="#fff" />
      {showWord && (
        <g fill="url(#ayres-word)">
          <path d="M86.5 52H77l18.7-40h9.9l18.6 40h-10l-3.5-8.1H90L86.5 52zm6.5-15.3h14.6l-7.3-16.8L93 36.7z" />
          <path d="M136.6 52V36.4L120.4 12h10.3l10.7 16.6L152.2 12h9.8l-16.4 24.4V52h-9z" />
          <path d="M166.7 52V12h20.5c5.1 0 9.05 1.15 11.83 3.44 2.78 2.3 4.17 5.52 4.17 9.66 0 3.05-.73 5.58-2.2 7.59-1.46 2-3.54 3.45-6.22 4.34L204.4 52h-10.1l-8.42-13.65h-10.25V52h-8.93zm8.93-21.2h10.55c2.5 0 4.38-.48 5.63-1.45 1.25-.97 1.88-2.4 1.88-4.29 0-1.86-.63-3.27-1.88-4.23-1.25-.96-3.13-1.43-5.63-1.43h-10.55v11.4z" />
        </g>
      )}
    </svg>
  )
}
