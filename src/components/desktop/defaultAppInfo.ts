import type { DesktopIconDef, AppDefinition } from "./store";

// ── Default desktop icons ──────────────────────────────────────────────────

export const defaultIcons: DesktopIconDef[] = [
  {
    id: "icon-files",
    label: "Files",
    icon: "folder",
    appId: "files",
    x: 28,
    y: 28,
  },
  {
    id: "icon-appstore",
    label: "AppStore",
    icon: "store",
    appId: "appstore",
    x: 28,
    y: 140,
  },
  ...(process.env.NODE_ENV === "development"
    ? ([
        {
          id: "icon-devapp",
          label: "DevelopmentApp",
          icon: "globe",
          appId: "devapp",
          x: 28,
          y: 252,
        },
      ] as DesktopIconDef[])
    : []),
];

// ── Default app registry ───────────────────────────────────────────────────

export const defaultApps: AppDefinition[] = [
  {
    id: "files",
    name: "Files",
    icon: "folder",
    defaultWidth: 760,
    defaultHeight: 500,
    minWidth: 440,
    minHeight: 320,
  },
  {
    id: "appstore",
    name: "AppStore",
    icon: "store",
    defaultWidth: 820,
    defaultHeight: 580,
    minWidth: 560,
    minHeight: 400,
  },
  ...(process.env.NODE_ENV === "development"
    ? ([
        {
          id: "devapp",
          name: "Developer",
          icon: "globe",
          origin: "http://localhost:3001",
          defaultWidth: 800,
          defaultHeight: 540,
          minWidth: 500,
          minHeight: 340,
        },
      ] as AppDefinition[])
    : []),
];
