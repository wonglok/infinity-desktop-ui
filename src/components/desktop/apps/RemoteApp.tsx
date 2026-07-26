"use client";

import { type WindowInstance, useDesktopStore } from "../store";
import { AppLoader } from "../AppLoader/AppLoader";

export function RemoteApp({ window: _win }: { window: WindowInstance }) {
  const appRegistry = useDesktopStore((s) => s.appRegistry);
  const appDef = appRegistry.find((a) => a.id === _win.appId);

  const origin = appDef?.origin ?? "https://infinity-widget.vercel.app";
  const appName = appDef?.name ?? _win.title;

  return (
    <div
      className="h-full w-full overflow-hidden relative"
      style={{ background: "rgba(250,249,246,0.44)" }}
    >
      <AppLoader
        user={{
          id: "userID_u123456",
          username: "wonglok831",
          email: "lok@lok.com",
        }}
        app={{
          id: _win.id,
          name: appName,
          origin,
        }}
      ></AppLoader>
    </div>
  );
}

//
