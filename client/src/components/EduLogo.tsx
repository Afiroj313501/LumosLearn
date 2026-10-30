interface EduLogoProps {
  size?: number;
  className?: string;
}

const EduLogo = ({ size = 24, className = '' }: EduLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`edu-logo-svg ${className}`}
    >
      <defs>
        <linearGradient id="eduGrad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f2b84b" />
          <stop offset="100%" stopColor="#8c7cf0" />
        </linearGradient>
        <linearGradient id="eduGlowGrad" x1="6" y1="6" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe299" />
          <stop offset="100%" stopColor="#b4a7ff" />
        </linearGradient>
      </defs>

      {/* Academic Cap / Mortarboard */}
      <path
        d="M14 3.5L2.5 9L14 14.5L25.5 9L14 3.5Z"
        fill="url(#eduGrad)"
      />
      {/* Center cap accent pin */}
      <circle cx="14" cy="9" r="1.5" fill="#ffffff" />
      {/* Tassel line & tassel fringe */}
      <path
        d="M22.5 10.5V16.5C22.5 17.2 21.8 17.8 21 17.8"
        stroke="url(#eduGlowGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Open Book Pages / Wings */}
      <path
        d="M5.5 14.5V19.8C5.5 19.8 9 18.2 14 21C19 18.2 22.5 19.8 22.5 19.8V14.5"
        stroke="url(#eduGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central Book Spine */}
      <path
        d="M14 15V24.5"
        stroke="url(#eduGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Bottom Page Arc Highlight */}
      <path
        d="M5.5 19.8C9 18.2 14 21 14 21C14 21 19 18.2 22.5 19.8"
        stroke="url(#eduGlowGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default EduLogo;
