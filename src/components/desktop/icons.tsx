"use client";

/* ── SVG Icon library for Infinity Cloud OS ────────────────────────────────
   All icons: 24×24 viewBox, strokeWidth 1.8, round caps/joins, currentColor.
   Sized via the className on the wrapper — use text-lg (18px), text-xl (20px),
   text-2xl (24px), etc. */

type IconProps = { className?: string };

function i(paths: React.ReactNode, className = "w-5 h-5") {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}

/* ── App icons ───────────────────────────────────────────────────────── */

export function FolderIcon(p: IconProps) {
  return i(
    <>
      <path d="M3 7.5C3 6.672 3.672 6 4.5 6h4.8c.398 0 .78.158 1.06.44L11.5 7.5H19.5c.828 0 1.5.672 1.5 1.5V19.5c0 .828-.672 1.5-1.5 1.5H4.5C3.672 21 3 20.328 3 19.5V7.5Z" />
    </>,
    p.className,
  );
}

export function TerminalIcon(p: IconProps) {
  return i(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 9 2.5 2.5L7 14" />
      <path d="M12 14h4" />
    </>,
    p.className,
  );
}

export function GlobeIcon(p: IconProps) {
  return i(
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>,
    p.className,
  );
}

export function GearIcon(p: IconProps) {
  return i(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2M12 19.5v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2.5 12h2M19.5 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>,
    p.className,
  );
}

/* ── Taskbar / system tray ──────────────────────────────────────────── */

export function StartIcon(p: IconProps) {
  // A clean 4-pane grid — modern take on the Start button
  return i(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>,
    p.className,
  );
}

export function WifiIcon(p: IconProps) {
  return i(
    <>
      <path d="M5 9.5c3.866-3.333 10.134-3.333 14 0" />
      <path d="M8 12.5c2.21-1.667 5.79-1.667 8 0" />
      <path d="M11 15.5c1.105-.667 1.895-.667 2 0" />
    </>,
    p.className,
  );
}

export function SpeakerIcon(p: IconProps) {
  return i(
    <>
      <path d="M6 9H3v6h3l5 4V5L6 9Z" />
      <path d="M16 8.5a4.5 4.5 0 0 1 0 7" />
    </>,
    p.className,
  );
}

export function BellIcon(p: IconProps) {
  return i(
    <>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M18 8.5A6 6 0 1 0 6 8.5c0 3.5-1.5 5-1.5 5h15S18 12 18 8.5Z" />
    </>,
    p.className,
  );
}

/* ── Files sidebar ──────────────────────────────────────────────────── */

export function HomeIcon(p: IconProps) {
  return i(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9v9.5a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V9" />
    </>,
    p.className,
  );
}

export function DocumentIcon(p: IconProps) {
  return i(
    <>
      <path d="M14.5 2H7a1.5 1.5 0 0 0-1.5 1.5v17A1.5 1.5 0 0 0 7 22h10a1.5 1.5 0 0 0 1.5-1.5V8Z" />
      <path d="M14.5 2v5.5H20" />
    </>,
    p.className,
  );
}

export function ImageIcon(p: IconProps) {
  return i(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15.5 16 10l-5 5-3-3-5 5" />
    </>,
    p.className,
  );
}

export function MusicIcon(p: IconProps) {
  return i(
    <>
      <circle cx="8" cy="18" r="3.5" />
      <path d="M11.5 18V6.5l9-2.5v11" />
      <circle cx="17" cy="16" r="3.5" />
    </>,
    p.className,
  );
}

export function VideoIcon(p: IconProps) {
  return i(
    <>
      <rect x="2" y="4" width="15" height="16" rx="2" />
      <path d="m22 7-5 3.5v3L22 17Z" />
    </>,
    p.className,
  );
}

export function DownloadIcon(p: IconProps) {
  return i(
    <>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 19h16" />
    </>,
    p.className,
  );
}

/* ── Settings sidebar ───────────────────────────────────────────────── */

export function MonitorIcon(p: IconProps) {
  return i(
    <>
      <rect x="2" y="3" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 16v5" />
    </>,
    p.className,
  );
}

export function LockIcon(p: IconProps) {
  return i(
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </>,
    p.className,
  );
}

export function PaletteIcon(p: IconProps) {
  return i(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18c3.5 0 5-2.5 4-5-.3-.8-1.2-1-2-1H12" />
      <circle cx="8.5" cy="9" r=".8" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="7.5" r=".8" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="12" r=".8" fill="currentColor" stroke="none" />
    </>,
    p.className,
  );
}

export function StorageIcon(p: IconProps) {
  return i(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v5c0 1.657 3.582 3 8 3s8-1.343 8-3V6" />
      <path d="M4 11v5c0 1.657 3.582 3 8 3s8-1.343 8-3v-5" />
    </>,
    p.className,
  );
}

/* ── Browser ────────────────────────────────────────────────────────── */

export function ArrowLeftIcon(p: IconProps) {
  return i(<path d="M16 4 7 12l9 8" />, p.className);
}

export function ArrowRightIcon(p: IconProps) {
  return i(<path d="m8 4 9 8-9 8" />, p.className);
}

export function RefreshIcon(p: IconProps) {
  return i(
    <>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
    </>,
    p.className,
  );
}

/* ── Login ──────────────────────────────────────────────────────────── */

export function EyeIcon(p: IconProps) {
  return i(
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    p.className,
  );
}

export function EyeOffIcon(p: IconProps) {
  return i(
    <>
      <path d="M10.73 5.07A10.2 10.2 0 0 1 12 5c7 0 10 7 10 7a13.5 13.5 0 0 1-1.93 2.73" />
      <path d="M6.22 17.78A9.86 9.86 0 0 1 2 12s3-7 10-7c1.08 0 2.05.2 3 .5" />
      <path d="m2 2 20 20" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    </>,
    p.className,
  );
}

export function UserIcon(p: IconProps) {
  return i(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    </>,
    p.className,
  );
}

export function GoogleIcon(p: IconProps) {
  return i(
    <>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </>,
    p.className,
  );
}

/* ── General ────────────────────────────────────────────────────────── */

export function PowerIcon(p: IconProps) {
  return i(
    <>
      <path d="M12 2v10" />
      <path d="M6.5 5.5a8 8 0 1 0 11 0" />
    </>,
    p.className,
  );
}

export function CloseIcon(p: IconProps) {
  return i(
    <>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </>,
    p.className,
  );
}

/* ── AppStore ────────────────────────────────────────────────────────── */

export function StoreIcon(p: IconProps) {
  return i(
    <>
      <path d="M3 9.5 5 21h14l2-11.5" />
      <path d="M3 9.5h18" />
      <path d="M8.5 9.5V7a3.5 3.5 0 1 1 7 0v2.5" />
      <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </>,
    p.className,
  );
}

export function TrashIcon(p: IconProps) {
  return i(
    <>
      <path d="M4 7h16" />
      <path d="M6.5 7v11.5a1.5 1.5 0 0 0 1.5 1.5h8a1.5 1.5 0 0 0 1.5-1.5V7" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M10 10.5v5" />
      <path d="M14 10.5v5" />
    </>,
    p.className,
  );
}

export function SearchIcon(p: IconProps) {
  return i(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </>,
    p.className,
  );
}

export function ExternalLinkIcon(p: IconProps) {
  return i(
    <>
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      <path d="M21 3 10 14" />
      <path d="M21 8V3h-5" />
    </>,
    p.className,
  );
}

/* ── Icon resolver — maps store icon keys to SVG components ─────────── */

const iconMap: Record<string, React.ComponentType<IconProps>> = {
  folder: FolderIcon,
  terminal: TerminalIcon,
  globe: GlobeIcon,
  gear: GearIcon,
  start: StartIcon,
  wifi: WifiIcon,
  speaker: SpeakerIcon,
  bell: BellIcon,
  home: HomeIcon,
  document: DocumentIcon,
  image: ImageIcon,
  music: MusicIcon,
  video: VideoIcon,
  download: DownloadIcon,
  monitor: MonitorIcon,
  lock: LockIcon,
  palette: PaletteIcon,
  storage: StorageIcon,
  power: PowerIcon,
  eye: EyeIcon,
  "eye-off": EyeOffIcon,
  google: GoogleIcon,
  user: UserIcon,
  "arrow-left": ArrowLeftIcon,
  "arrow-right": ArrowRightIcon,
  refresh: RefreshIcon,
  close: CloseIcon,
  store: StoreIcon,
  trash: TrashIcon,
  search: SearchIcon,
  "external-link": ExternalLinkIcon,
  globe2: GlobeIcon,
  lock2: LockIcon,
};

export function getIcon(
  key: string,
  fallback?: React.ComponentType<IconProps>,
): React.ComponentType<IconProps> {
  return iconMap[key] ?? fallback ?? FolderIcon;
}
