import localforage from "localforage";
import type { WindowInstance, DesktopIconDef, AppDefinition } from "@/components/desktop/store";

// ── Instance ──────────────────────────────────────────────────────────────

const store = localforage.createInstance({
  name: "infinity-desktop",
  storeName: "desktop_state",
});

// ── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  windows: "windows",
  desktopIcons: "desktopIcons",
  appRegistry: "appRegistry",
  nextZIndex: "nextZIndex",
} as const;

// ── Persisted shape ───────────────────────────────────────────────────────

export interface PersistedDesktopState {
  windows: WindowInstance[];
  desktopIcons: DesktopIconDef[];
  appRegistry: AppDefinition[];
  nextZIndex: number;
}

// ── Persist ───────────────────────────────────────────────────────────────

export async function persistDesktopState(
  state: PersistedDesktopState,
): Promise<void> {
  try {
    await Promise.all([
      store.setItem(KEYS.windows, state.windows),
      store.setItem(KEYS.desktopIcons, state.desktopIcons),
      store.setItem(KEYS.appRegistry, state.appRegistry),
      store.setItem(KEYS.nextZIndex, state.nextZIndex),
    ]);
  } catch (err) {
    console.warn("localforage persist failed:", err);
  }
}

// ── Hydrate ───────────────────────────────────────────────────────────────

const EMPTY: PersistedDesktopState = {
  windows: [],
  desktopIcons: [],
  appRegistry: [],
  nextZIndex: 10,
};

export async function hydrateDesktopState(): Promise<PersistedDesktopState> {
  try {
    const [windows, desktopIcons, appRegistry, nextZIndex] = await Promise.all([
      store.getItem<WindowInstance[]>(KEYS.windows),
      store.getItem<DesktopIconDef[]>(KEYS.desktopIcons),
      store.getItem<AppDefinition[]>(KEYS.appRegistry),
      store.getItem<number>(KEYS.nextZIndex),
    ]);

    return {
      windows: windows ?? EMPTY.windows,
      desktopIcons: desktopIcons ?? EMPTY.desktopIcons,
      appRegistry: appRegistry ?? EMPTY.appRegistry,
      nextZIndex: nextZIndex ?? EMPTY.nextZIndex,
    };
  } catch (err) {
    console.warn("localforage hydrate failed:", err);
    return { ...EMPTY };
  }
}

// ── Clear (on logout) ─────────────────────────────────────────────────────

export async function clearDesktopState(): Promise<void> {
  try {
    await Promise.all(Object.values(KEYS).map((k) => store.removeItem(k)));
  } catch (err) {
    console.warn("localforage clear failed:", err);
  }
}
