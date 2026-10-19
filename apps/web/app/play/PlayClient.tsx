"use client";

import dynamic from "next/dynamic";

// Phaser needs the browser, so the canvas is never rendered on the server.
const GameCanvas = dynamic(() => import("./GameCanvas"), { ssr: false });

export function PlayClient() {
  return <GameCanvas />;
}
