"use client";

import { create } from "zustand";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { defaultIcons, defaultApps } from "./defaultAppInfo";

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
  username?: string;       // legacy: for local-login compatibility
  avatar?: string;          // legacy
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

  // Auth
  isHydrated: boolean;
  isAuthenticated: boolean;
  user: User | null;
  loginLoading: boolean;
  loginError: string | null;

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
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<boolean>;
  logout: () => void;
  clearLoginError: () => void;

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

  // Auth — starts unauthenticated; hydrateAuth runs on client mount
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  loginLoading: false,
  loginError: null,

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
    // next-auth session is read via useSession() in the component layer.
    // This method is called from Desktop once the session is known.
    // For backward compatibility: check localStorage for legacy credentials.
    try {
      const saved = localStorage.getItem("infinity-auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username || parsed?.name) {
          set({
            isAuthenticated: true,
            user: {
              name: parsed.name ?? parsed.username,
              email: parsed.email ?? null,
              image: parsed.image ?? parsed.avatar ?? null,
              username: parsed.username,
              avatar: parsed.avatar,
            },
            isHydrated: true,
          });
          return;
        }
      }
    } catch {}
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

  login: async (_username, _password, rememberMe) => {
    // Google OAuth — redirect to Google sign-in
    set({ loginLoading: true, loginError: null });
    try {
      await nextAuthSignIn("google", {
        callbackUrl: "/",
        redirect: true,
      });
      // The page will redirect so we won't reach here, but mark as not loading
      // in case the redirect doesn't happen immediately
    } catch {
      set({
        loginLoading: false,
        loginError: "Failed to start Google sign-in. Please try again.",
      });
    }
    return false;
  },

  logout: async () => {
    try {
      localStorage.removeItem("infinity-auth");
    } catch {}
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

  clearLoginError: () => set({ loginError: null }),

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
