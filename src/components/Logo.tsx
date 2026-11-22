
interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      {/* Outer subtle shield geometry */}
      <path
        d="M16 2.5L27 6.5V14.5C27 21.8 22.3 28.2 16 30C9.7 28.2 5 21.8 5 14.5V6.5L16 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#38bdf8]/60"
      />

      {/* Inner vision aperture / protective lenses */}
      <path
        d="M9.5 15C11.5 11 13.6 9 16 9C18.4 9 20.5 11 22.5 15C20.5 19 18.4 21 16 21C13.6 21 11.5 19 9.5 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[#f5f5f5]"
      />

      {/* Iris focal point */}
      <circle
        cx="16"
        cy="15"
        r="2.5"
        fill="currentColor"
        className="text-[#38bdf8]"
      />

      {/* Micro indicator dot */}
      <circle
        cx="16"
        cy="15"
        r="1"
        fill="#ffffff"
      />
    </svg>
  );
}
