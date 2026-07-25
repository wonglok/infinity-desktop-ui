"use client";

import { type WindowInstance } from "../store";
import { WidgetLoader } from "../WidgetLoader/WidgetLoader";

export function RemoteApp({ window: _win }: { window: WindowInstance }) {
  return (
    <div
      className="h-full w-full"
      style={{ background: "rgba(250,249,246,0.44)" }}
    >
      <WidgetLoader
        origin={`https://infinity-widget.vercel.app`}
      ></WidgetLoader>
    </div>
  );
}
