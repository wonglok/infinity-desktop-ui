"use client";

import { useState } from "react";
import { type WindowInstance } from "../store";

export function TerminalApp({ window: _win }: { window: WindowInstance }) {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<string[]>([
    "InfinityOS Terminal v1.0",
    'Type "help" for available commands.',
    "",
  ]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    setLines((prev) => [...prev, `$ ${trimmed}`]);
    if (trimmed === "help")
      setLines((prev) => [...prev, "  help     Show this help", "  clear    Clear terminal", "  date     Show current date", "  whoami   Show user", "  echo     Print text"]);
    else if (trimmed === "clear") setLines([]);
    else if (trimmed === "date")
      setLines((prev) => [...prev, `  ${new Date().toString()}`]);
    else if (trimmed === "whoami")
      setLines((prev) => [...prev, "  user@infinity-os"]);
    else if (trimmed.startsWith("echo "))
      setLines((prev) => [...prev, `  ${trimmed.slice(5)}`]);
    else if (trimmed.length > 0)
      setLines((prev) => [...prev, `  command not found: ${trimmed}`]);
    setInput("");
  };

  return (
    <div
      className="flex h-full flex-col p-4 font-mono text-[13px] leading-relaxed"
      style={{ background: "rgba(248,247,244,0.88)", color: "#3a5c2f" }}
      onClick={() => document.getElementById("term-inp")?.focus()}
    >
      <div className="flex-1 overflow-auto whitespace-pre-wrap">
        {lines.map((line, i) => (<div key={i}>{line}</div>))}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span style={{ color: "#3a5a8a" }}>$</span>
        <input
          id="term-inp" type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCommand(input); }}
          className="flex-1 bg-transparent outline-none" style={{ color: "#3a5c2f" }} autoFocus
        />
      </div>
    </div>
  );
}
