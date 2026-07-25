"use client";

import { useEffect } from "react";
import { useDesktopStore } from "./store";
import { Background } from "./Background";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { DesktopIcon } from "./DesktopIcon";
import { Modal } from "./Modal";
import { LoginScreen } from "./LoginScreen";

export function Desktop() {
  const { windows, desktopIcons, closeStartMenu, isHydrated, isAuthenticated, hydrateAuth } =
    useDesktopStore();

  // Restore persisted session on client mount — avoids SSR hydration mismatch
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  // Wait until auth is hydrated before rendering anything
  if (!isHydrated) {
    return (
      <div className="fixed inset-0" style={{ background: "#f7f5f8" }} />
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <Background />

      <div className="absolute inset-0 bottom-14" onClick={() => closeStartMenu()}>
        {desktopIcons.map((icon) => (
          <DesktopIcon key={icon.id} icon={icon} />
        ))}
      </div>

      {windows.map((win) => (
        <Window key={win.id} window={win} />
      ))}

      <Taskbar />
      <Modal />
    </div>
  );
}
