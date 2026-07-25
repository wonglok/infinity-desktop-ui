"use client";

import { create } from "zustand";

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
  username: string;
  avatar?: string;
}

interface DesktopState {
  // State
  windows: WindowInstance[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  desktopIcons: DesktopIconDef[];
  appRegistry: AppDefinition[];
  modal: ModalState;
  nextZIndex: number;

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
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  clearLoginError: () => void;

  // App registry
  registerApp: (app: AppDefinition) => void;
}

// ── Default desktop icons ──────────────────────────────────────────────────

const defaultIcons: DesktopIconDef[] = [
  { id: "icon-files", label: "Files", icon: "folder", appId: "files", x: 28, y: 28 },
  { id: "icon-terminal", label: "Terminal", icon: "terminal", appId: "terminal", x: 28, y: 140 },
  { id: "icon-browser", label: "Browser", icon: "globe", appId: "browser", x: 28, y: 252 },
  { id: "icon-settings", label: "Settings", icon: "gear", appId: "settings", x: 28, y: 364 },
];

// ── Default app registry ───────────────────────────────────────────────────

const defaultApps: AppDefinition[] = [
  { id: "files", name: "Files", icon: "folder", defaultWidth: 760, defaultHeight: 500, minWidth: 440, minHeight: 320 },
  { id: "terminal", name: "Terminal", icon: "terminal", defaultWidth: 680, defaultHeight: 460, minWidth: 400, minHeight: 260 },
  { id: "browser", name: "Browser", icon: "globe", defaultWidth: 960, defaultHeight: 600, minWidth: 540, minHeight: 380 },
  { id: "settings", name: "Settings", icon: "gear", defaultWidth: 660, defaultHeight: 480, minWidth: 460, minHeight: 340 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function centerWindow(app: AppDefinition, overrides?: Partial<WindowInstance>) {
  const w = overrides?.width ?? app.defaultWidth;
  const h = overrides?.height ?? app.defaultHeight;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const taskbarH = 56;
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
  desktopIcons: defaultIcons,
  appRegistry: defaultApps,
  modal: { open: false, title: "", message: "", type: "alert" },
  nextZIndex: 10,

  // Auth — starts unauthenticated; hydrateAuth runs on client mount
  isHydrated: false,
  isAuthenticated: false,
  user: null,
  loginLoading: false,
  loginError: null,

  // ── Window actions ─────────────────────────────────────────────────────

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
          ? wins
              .filter((w) => !w.minimized)
              .reduce(
                (a, b) => (a && a.zIndex > b.zIndex ? a : b),
                null as WindowInstance | null,
              )?.id ?? null
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
        w.id === id
          ? { ...w, width, height, x, y, maximized: false }
          : w,
      ),
    }));
  },

  // ── Start menu ─────────────────────────────────────────────────────────

  toggleStartMenu: () => set((s) => ({ startMenuOpen: !s.startMenuOpen })),
  closeStartMenu: () => set({ startMenuOpen: false }),

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

  hydrateAuth: () => {
    try {
      const saved = localStorage.getItem("infinity-auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username) {
          set({ isAuthenticated: true, user: { username: parsed.username }, isHydrated: true });
          return;
        }
      }
    } catch {}
    set({ isHydrated: true });
  },

  login: async (username, password, rememberMe = false) => {
    set({ loginLoading: true, loginError: null });

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    if (username.trim().length < 2 || password.trim().length < 2) {
      set({
        loginLoading: false,
        loginError: "Invalid username or password. Minimum 2 characters each.",
      });
      return false;
    }

    const user = { username: username.trim() };

    // Persist session if "remember me" is checked
    if (rememberMe) {
      try {
        localStorage.setItem("infinity-auth", JSON.stringify(user));
      } catch {}
    } else {
      try {
        localStorage.removeItem("infinity-auth");
      } catch {}
    }

    set({
      isAuthenticated: true,
      user,
      loginLoading: false,
      loginError: null,
    });
    return true;
  },

  logout: () => {
    try { localStorage.removeItem("infinity-auth"); } catch {}
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
          appRegistry: s.appRegistry.map((a) =>
            a.id === app.id ? app : a,
          ),
        };
      }
      return { appRegistry: [...s.appRegistry, app] };
    });
  },
}));
