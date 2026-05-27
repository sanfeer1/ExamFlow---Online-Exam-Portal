/**
 * ExamFlow Logo
 * A pencil inside a rounded square — represents writing/assessment.
 */
const Logo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ExamFlow logo"
  >
    {/* Background rounded square */}
    <rect width="40" height="40" rx="10" fill="#1a56db" />

    {/* Pencil body */}
    <rect
      x="18.5" y="8"
      width="7" height="16"
      rx="2"
      fill="white"
      transform="rotate(15 18.5 8)"
    />

    {/* Pencil tip triangle */}
    <polygon
      points="17,26 21,26 19,31"
      fill="#fbbf24"
    />

    {/* Pencil eraser cap */}
    <rect
      x="18.5" y="7"
      width="7" height="3"
      rx="1.5"
      fill="#93c5fd"
      transform="rotate(15 18.5 7)"
    />

    {/* Horizontal lines (answer lines) */}
    <line x1="8" y1="28" x2="15" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <line x1="8" y1="32" x2="15" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="25" y1="32" x2="32" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export default Logo;
