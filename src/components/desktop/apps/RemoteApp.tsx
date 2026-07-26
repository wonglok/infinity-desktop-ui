"use client";

import { type WindowInstance } from "../store";
import { AppLoader } from "../RemoteApp/AppLoader";

export function RemoteApp({ window: _win }: { window: WindowInstance }) {
  // console.log(_win);
  //

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
          name: "loklok cool widget",
          origin: `https://infinity-widget.vercel.app`,
        }}
      ></AppLoader>
    </div>
  );
}

//
