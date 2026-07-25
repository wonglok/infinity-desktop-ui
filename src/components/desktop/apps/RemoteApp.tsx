"use client";

import { type WindowInstance } from "../store";
import { RemoteAppLoader } from "../RemoteApp/RemoteAppLoader";

export function RemoteApp({ window: _win }: { window: WindowInstance }) {
  // console.log(_win);
  return (
    <div
      className="h-full w-full"
      style={{ background: "rgba(250,249,246,0.44)" }}
    >
      <RemoteAppLoader
        user={{
          id: "userID_u123456",
          username: "wonglok831",
          email: "lok@lok.com",
        }}
        app={{
          id: _win.id,
          name: "loklok cool widget",
          origin: `https://infinity-widget.vercel.app`,
        }}
      ></RemoteAppLoader>
    </div>
  );
}

//
