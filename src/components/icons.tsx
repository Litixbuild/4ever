// Small line icons. They inherit the text color.
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 16, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function PlayIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M7 4.5l13 7.5-13 7.5z" />
    </svg>
  );
}

export function StarIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}

export function DiamondIcon({ size = 12, color, ...rest }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" {...rest}>
      <path d="M6 0L12 6L6 12L0 6Z" fill={color ?? "currentColor"} />
    </svg>
  );
}

export function DotIcon({ size = 8, color, ...rest }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" aria-hidden="true" {...rest}>
      <circle cx="4" cy="4" r="4" fill={color ?? "currentColor"} />
    </svg>
  );
}

export const UpIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Base>
);
export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);
export const ClockIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);
export const MusicIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="17" cy="16" r="3" />
  </Base>
);
export const SwordIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14.5 3.5l6 6-9 9-6-6z" />
    <path d="M3 21l3-3" />
  </Base>
);
export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Base>
);
export const PlusIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Base strokeWidth={2.4} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);
export const BellIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.5 21a1.8 1.8 0 0 0 3 0" />
  </Base>
);
export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M16 6l-4-4-4 4M12 2v13" />
  </Base>
);
export const BookmarkIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" fill={filled ? "currentColor" : "none"} />
  </Base>
);
export const CheckIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);
export const XIcon = (p: IconProps) => (
  <Base strokeWidth={2.6} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);
export const InfoIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v.5M12 11v5" />
  </Base>
);
export const LinkIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </Base>
);
export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
);
export const FlagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </Base>
);
export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Base>
);
export const GearIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Base>
);
export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
  </Base>
);
export const LogOutIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </Base>
);
export const TrophyIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M17 6h3a3 3 0 0 1-3 4M7 6H4a3 3 0 0 0 3 4" />
  </Base>
);
export const CommentIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z" />
  </Base>
);
export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Base>
);
export const ExternalIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </Base>
);
export const VideoIcon = (p: IconProps) => (
  <Base strokeWidth={2} {...p}>
    <rect x="3" y="6" width="18" height="12" rx="3" />
    <path d="M10 9.5v5l4-2.5z" fill="currentColor" />
  </Base>
);
export const StreamIcon = (p: IconProps) => (
  <Base strokeWidth={2} {...p}>
    <path d="M5 3h15v11l-4 4h-4l-3 3v-3H5z" />
    <path d="M11 8v4M15 8v4" />
  </Base>
);
