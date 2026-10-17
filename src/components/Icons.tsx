import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>
);
export const SearchIcon = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></Base>
);
export const CloseIcon = (p: IconProps) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
);
export const SunIcon = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></Base>
);
export const MoonIcon = (p: IconProps) => (
  <Base {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></Base>
);
export const SettingsIcon = (p: IconProps) => (
  <Base {...p}><path d="M5 7h9M18 7h1M5 17h1M10 17h9" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Base>
);
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4.2 4.2 0 0 1 7-3.1A4.2 4.2 0 0 1 19 10c0 5.600-7 10-7 10Z" />
  </Base>
);
export const FeedIcon = (p: IconProps) => (
  <Base {...p}><rect x="4" y="4" width="16" height="7" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /></Base>
);
export const TrendingIcon = (p: IconProps) => (
  <Base {...p}><path d="m3 17 6-6 4 4 7-8" /><path d="M15 7h5v5" /></Base>
);
export const GripIcon = (p: IconProps) => (
  <Base {...p} fill="currentColor" stroke="none">
    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
  </Base>
);
export const ChevronUpIcon = (p: IconProps) => (
  <Base {...p}><path d="m6 15 6-6 6 6" /></Base>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}><path d="m6 9 6 6 6-6" /></Base>
);
export const ExternalIcon = (p: IconProps) => (
  <Base {...p} width="14" height="14"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Base>
);
