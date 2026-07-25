"use client";

/**
 * Shared atmospheric background — morning frost sky with soft radial light pools.
 * Used by both Desktop and LoginScreen for a consistent dreamy feel.
 */
export function Background() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: [
          // Warm light pools — soft peach, rose, and lavender radials
          `radial-gradient(ellipse 70% 45% at 30% 18%, rgba(220,200,230,0.22) 0%, transparent 55%)`,
          `radial-gradient(ellipse 55% 40% at 72% 50%, rgba(235,215,210,0.18) 0%, transparent 55%)`,
          `radial-gradient(ellipse 60% 35% at 40% 78%, rgba(210,195,220,0.16) 0%, transparent 50%)`,
          `radial-gradient(ellipse 45% 30% at 18% 65%, rgba(200,210,235,0.14) 0%, transparent 48%)`,
          // Subtle warmth near the bottom
          `radial-gradient(ellipse 80% 28% at 50% 94%, rgba(245,230,220,0.12) 0%, transparent 50%)`,
          // Base — soft pearl gradient
          `linear-gradient(180deg, #f7f5f8 0%, #faf8fa 35%, #f5f3f6 100%)`,
        ].join(", "),
      }}
    >
      {/* Ultra-subtle grain for texture */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
