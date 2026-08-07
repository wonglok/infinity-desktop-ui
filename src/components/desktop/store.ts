"use client";

import { create } from "zustand";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { defaultIcons, defaultApps } from "./defaultAppInfo";
import {
  persistDesktopState,
  hydrateDesktopState,
  clearDesktopState,
} from "@/lib/storage";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DesktopIconDef {
  id: string;
  label: string;
  icon: string; // emoji or icon identifier
  appId: string; // which app this icon opens
  x: number;
  y: number;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  origin?: string; // remote app URL — renders via AppLoader when set
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
}

export interface ModalState {
  open: boolean;
  title: string;
  message: string;
  type: "confirm" | "prompt" | "alert";
  placeholder?: string;
  defaultValue?: string;
  resolve?: (value: boolean | string | null) => void;
}

export interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DesktopState {
  // State
  windows: WindowInstance[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  addAppModalOpen: boolean;
  desktopIcons: DesktopIconDef[];
  appRegistry: AppDefinition[];
  modal: ModalState;
  nextZIndex: number;
  isMobile: boolean;

  // Responsive
  setIsMobile: (v: boolean) => void;

  // Drag state (shared across windows)
  dragEntryId: string | null;
  dragOverFolderId: string | null;
  setDragEntryId: (id: string | null) => void;
  setDragOverFolderId: (id: string | null) => void;

  // Files refresh — bump this to refresh all open FilesApp windows
  filesRefreshKey: number;
  triggerFilesRefresh: () => void;

  // Auth
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: User | null;

  // Window actions
  openWindow: (appId: string, overrides?: Partial<WindowInstance>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number,
  ) => void;

  // Start menu
  toggleStartMenu: () => void;
  closeStartMenu: () => void;

  // Add app modal
  openAddAppModal: () => void;
  closeAddAppModal: () => void;

  // Modal
  showModal: (
    title: string,
    message: string,
    type?: "confirm" | "prompt" | "alert",
    options?: { placeholder?: string; defaultValue?: string },
  ) => Promise<boolean | string | null>;
  closeModal: (value?: boolean | string | null) => void;

  // Auth
  hydrateAuth: () => void;
  setSession: (
    session: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null,
  ) => void;
  logout: () => void;

  // App registry
  registerApp: (app: AppDefinition) => void;
  addRemoteApp: (app: {
    name: string;
    icon: string;
    origin: string;
    baseId?: string;
  }) => void;
  addDesktopIcon: (icon: DesktopIconDef) => void;
  removeDesktopIcon: (id: string) => void;

  // Persistence
  hydrateDesktop: () => Promise<void>;

  // App management
  removeApp: (appId: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function centerWindow(app: AppDefinition, overrides?: Partial<WindowInstance>) {
  const w = overrides?.width ?? app.defaultWidth;
  const h = overrides?.height ?? app.defaultHeight;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const taskbarH = vw < 768 ? 64 : 56; // taller dock on mobile
  // On mobile, windows fill the screen
  if (vw < 768) {
    return {
      x: 0,
      y: 0,
      width: vw,
      height: vh - taskbarH,
    };
  }
  return {
    x: Math.max(0, (vw - w) / 2),
    y: Math.max(0, (vh - taskbarH - h) / 2),
    width: w,
    height: h,
  };
}

let windowCounter = 0;
function nextWindowId(): string {
  windowCounter += 1;
  return `win-${Date.now()}-${windowCounter}`;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  startMenuOpen: false,
  addAppModalOpen: false,
  desktopIcons: defaultIcons,
  appRegistry: defaultApps,
  modal: { open: false, title: "", message: "", type: "alert" },
  nextZIndex: 10,
  isMobile: false,

  // Drag state — shared across windows for cross-window drag-and-drop
  dragEntryId: null,
  dragOverFolderId: null,
  setDragEntryId: (id) => set({ dragEntryId: id }),
  setDragOverFolderId: (id) => set({ dragOverFolderId: id }),

  // Files refresh — bump to refresh all open FilesApp windows
  filesRefreshKey: 0,
  triggerFilesRefresh: () => set((s) => ({ filesRefreshKey: s.filesRefreshKey + 1 })),

  // Auth — starts unauthenticated; hydrateAuth runs on client mount
  isHydrated: false,
  isAuthenticated: false,
  user: null,

  // ── Window actions ─────────────────────────────────────────────────────

  setIsMobile: (v) => set({ isMobile: v }),

  openWindow: (appId, overrides) => {
    const app = get().appRegistry.find((a) => a.id === appId);
    if (!app) return;

    const { x, y, width, height } = centerWindow(app, overrides);
    const zIndex = get().nextZIndex;

    const win: WindowInstance = {
      id: nextWindowId(),
      appId,
      title: app.name,
      icon: app.icon,
      x,
      y,
      width,
      height,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
      minimized: false,
      maximized: false,
      zIndex,
      ...overrides,
    };

    set((s) => ({
      windows: [...s.windows, win],
      activeWindowId: win.id,
      nextZIndex: s.nextZIndex + 1,
      startMenuOpen: false,
    }));
  },

  closeWindow: (id) => {
    set((s) => {
      const remaining = s.windows.filter((w) => w.id !== id);
      const nextActive =
        s.activeWindowId === id
          ? remaining.length > 0
            ? remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
            : null
          : s.activeWindowId;
      return { windows: remaining, activeWindowId: nextActive };
    });
  },

  minimizeWindow: (id) => {
    set((s) => {
      const wins = s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      );
      const nextActive =
        s.activeWindowId === id
          ? (wins
              .filter((w) => !w.minimized)
              .reduce(
                (a, b) => (a && a.zIndex > b.zIndex ? a : b),
                null as WindowInstance | null,
              )?.id ?? null)
          : s.activeWindowId;
      return { windows: wins, activeWindowId: nextActive };
    });
  },

  toggleMaximizeWindow: (id) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w,
      ),
    }));
  },

  focusWindow: (id) => {
    set((s) => {
      const zIndex = s.nextZIndex;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, zIndex, minimized: false } : w,
        ),
        activeWindowId: id,
        nextZIndex: zIndex + 1,
      };
    });
  },

  moveWindow: (id, x, y) => {
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },

  resizeWindow: (id, width, height, x, y) => {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, width, height, x, y, maximized: false } : w,
      ),
    }));
  },

  // ── Start menu ─────────────────────────────────────────────────────────

  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),

  // ── Add app modal ───────────────────────────────────────────────────────

  openAddAppModal: () => set({ addAppModalOpen: true, startMenuOpen: false }),
  closeAddAppModal: () => set({ addAppModalOpen: false }),

  // ── Modal ──────────────────────────────────────────────────────────────

  showModal: (title, message, type = "alert", options) => {
    return new Promise((resolve) => {
      set({
        modal: {
          open: true,
          title,
          message,
          type,
          placeholder: options?.placeholder,
          defaultValue: options?.defaultValue,
          resolve,
        },
      });
    });
  },

  closeModal: (value) => {
    const { modal } = get();
    modal.resolve?.(value ?? null);
    set({
      modal: {
        open: false,
        title: "",
        message: "",
        type: "alert",
        resolve: undefined,
      },
    });
  },

  // ── Auth ────────────────────────────────────────────────────────────────

  // Hydrate auth from next-auth session (call once on mount, after session loads)
  hydrateAuth: () => {
    // Auth is driven entirely by next-auth's useSession() — this just marks
    // the store as hydrated so we stop showing the loading screen.
    set({ isHydrated: true });
  },

  // Set session from next-auth (called when useSession provides data)
  setSession: (session: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null) => {
    if (session) {
      set({
        isAuthenticated: true,
        isHydrated: true,
        user: {
          name: session.name ?? null,
          email: session.email ?? null,
          image: session.image ?? null,
        },
      });
    }
  },

  logout: async () => {
    // Clear persisted desktop state
    clearDesktopState();
    // Sign out from next-auth and redirect to home
    await nextAuthSignOut({ callbackUrl: "/", redirect: true });
    set({
      isAuthenticated: false,
      user: null,
      windows: [],
      activeWindowId: null,
      startMenuOpen: false,
    });
  },

  // ── Persistence ──────────────────────────────────────────────────────────

  hydrateDesktop: async () => {
    try {
      const saved = await hydrateDesktopState();
      const mergedApps = defaultApps.slice();
      // Merge persisted user apps into defaults (avoid duplicates)
      for (const app of saved.appRegistry) {
        if (!mergedApps.find((a) => a.id === app.id)) {
          mergedApps.push(app);
        }
      }
      set({
        windows: saved.windows,
        desktopIcons:
          saved.desktopIcons.length > 0
            ? saved.desktopIcons
            : defaultIcons,
        appRegistry: mergedApps,
        nextZIndex: saved.nextZIndex,
      });
    } catch {
      // Keep defaults
    }
  },

  // ── App registry ───────────────────────────────────────────────────────

  registerApp: (app) => {
    set((s) => {
      const exists = s.appRegistry.find((a) => a.id === app.id);
      if (exists) {
        return {
          appRegistry: s.appRegistry.map((a) => (a.id === app.id ? app : a)),
        };
      }
      return { appRegistry: [...s.appRegistry, app] };
    });
  },

  // Register a remote app AND create a desktop icon in one call.
  // baseId is optional — defaults to a sanitised version of name.
  addRemoteApp: ({ name, icon, origin, baseId }) => {
    const appId =
      baseId ??
      `remote-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now()}`;
    const iconId = `icon-${appId}`;

    const appDef: AppDefinition = {
      id: appId,
      name,
      icon,
      origin,
      defaultWidth: 800,
      defaultHeight: 540,
      minWidth: 500,
      minHeight: 340,
    };

    // Find the next available icon position on the desktop
    const existingIcons = get().desktopIcons;
    const colX = 28;
    const startY = 28;
    const rowHeight = 112;
    const maxIconsPerCol = 7;
    const colWidth = 140;

    // Place in the next available column (right-most icons)
    let col = 0;
    if (existingIcons.length > 0) {
      // Place new icon after the last one
      const nextIndex = existingIcons.length;
      col = Math.floor(nextIndex / maxIconsPerCol);
      const row = nextIndex % maxIconsPerCol;
      const x = colX + col * colWidth;
      const y = startY + row * rowHeight;

      const iconDef: DesktopIconDef = {
        id: iconId,
        label: name,
        icon,
        appId,
        x,
        y,
      };

      set((s) => ({
        appRegistry: [...s.appRegistry, appDef],
        desktopIcons: [...s.desktopIcons, iconDef],
      }));
      return;
    }

    const iconDef: DesktopIconDef = {
      id: iconId,
      label: name,
      icon,
      appId,
      x: colX,
      y: startY,
    };

    set((s) => ({
      appRegistry: [...s.appRegistry, appDef],
      desktopIcons: [...s.desktopIcons, iconDef],
    }));
  },

  // ── App management ───────────────────────────────────────────────────────

  // Remove an app from the registry, its desktop icons, and any open windows.
  // Refuses to remove system apps (files, terminal, browser, settings, widgets,
  // remote, appstore).
  removeApp: (appId) => {
    const SYSTEM_APPS = new Set([
      "files",
      "terminal",
      "browser",
      "settings",
      "appstore",
    ]);
    if (SYSTEM_APPS.has(appId)) return;

    set((s) => ({
      appRegistry: s.appRegistry.filter((a) => a.id !== appId),
      desktopIcons: s.desktopIcons.filter((i) => i.appId !== appId),
      windows: s.windows.filter((w) => w.appId !== appId),
    }));
  },

  addDesktopIcon: (icon) => {
    set((s) => ({
      desktopIcons: [...s.desktopIcons, icon],
    }));
  },

  removeDesktopIcon: (id) => {
    set((s) => ({
      desktopIcons: s.desktopIcons.filter((i) => i.id !== id),
    }));
  },
}));

// ── Auto-persist desktop state on changes ─────────────────────────────────
//
// Debounce is handled inside persistDesktopState itself, so every mutation
// that touches windows / icons / registry / zIndex is saved to localForage.

let _persistTimer: ReturnType<typeof setTimeout> | null = null;

useDesktopStore.subscribe((state) => {
  // Skip persistence during initial load (not hydrated yet)
  if (!state.isHydrated) return;

  // Clear any pending write and re-schedule
  if (_persistTimer) clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    persistDesktopState({
      windows: state.windows,
      desktopIcons: state.desktopIcons,
      appRegistry: state.appRegistry.filter(
        // Only persist user-added (remote) apps — defaults are recreated
        (a) => !defaultApps.find((d) => d.id === a.id),
      ),
      nextZIndex: state.nextZIndex,
    });
  }, 300);
});
