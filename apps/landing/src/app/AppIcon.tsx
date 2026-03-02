// AppIcon — the apphouse pentagon/house icon
// White/light version — visible on both dark and light backgrounds

interface AppIconProps {
  size?: number;
  className?: string;
}

export default function AppIcon({ size = 32, className = '' }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pentagon/house shape — white fill with subtle light stroke */}
      <path
        d="M256 38L462 186C470 192 475 201 475 211V430C475 452 457 470 435 470H77C55 470 37 452 37 430V211C37 201 42 192 50 186L256 38Z"
        fill="rgba(255,255,255,0.9)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      {/* Horizontal bar — slightly darker */}
      <rect x="196" y="234" width="120" height="44" rx="14" fill="rgba(180,180,180,0.6)" />
    </svg>
  );
}
