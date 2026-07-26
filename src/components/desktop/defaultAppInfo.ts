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
    id: "icon-terminal",
    label: "Terminal",
    icon: "terminal",
    appId: "terminal",
    x: 28,
    y: 140,
  },
  {
    id: "icon-browser",
    label: "Browser",
    icon: "globe",
    appId: "browser",
    x: 28,
    y: 252,
  },
  {
    id: "icon-settings",
    label: "Settings",
    icon: "gear",
    appId: "settings",
    x: 28,
    y: 364,
  },
  {
    id: "icon-appstore",
    label: "AppStore",
    icon: "store",
    appId: "appstore",
    x: 150,
    y: 28,
  },
  ...(process.env.NODE_ENV === "development"
    ? ([
        {
          id: "icon-devapp",
          label: "DevelopmentApp",
          icon: "globe",
          appId: "devapp",
          x: 150,
          y: 140,
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
    id: "terminal",
    name: "Terminal",
    icon: "terminal",
    defaultWidth: 680,
    defaultHeight: 460,
    minWidth: 400,
    minHeight: 260,
  },
  {
    id: "browser",
    name: "Browser",
    icon: "globe",
    defaultWidth: 960,
    defaultHeight: 600,
    minWidth: 540,
    minHeight: 380,
  },
  {
    id: "settings",
    name: "Settings",
    icon: "gear",
    defaultWidth: 660,
    defaultHeight: 480,
    minWidth: 460,
    minHeight: 340,
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
          name: "DevelopmentApp",
          icon: "globe",
          origin: "http://localhost:3002",
          defaultWidth: 800,
          defaultHeight: 540,
          minWidth: 500,
          minHeight: 340,
        },
      ] as AppDefinition[])
    : []),
];
