import { createFileRoute } from "@tanstack/react-router";
import { GlowMark, Hud, PixelCloud } from "@/components/jams/Pixel";

export const Route = createFileRoute("/testing")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "QR Verification · Google Cloud Study Jams · GDG on Campus IARE" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TestingPage,
});

function TestingPage() {
  const { ref } = Route.useSearch();
  const hasValidTokenFormat = Boolean(ref && /^[A-Za-z0-9_-]{16,64}$/.test(ref));

  return (
    <div className="relative min-h-screen bg-void text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Synthwave Arcade Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 starfield opacity-70" />
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-[36vh] overflow-hidden opacity-45">
          <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
        </div>
        <div className="absolute inset-x-0 bottom-[36vh] h-px bg-magenta/60 shadow-[0_0_16px_var(--magenta)]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-20 border-b border-cyan/20 bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center justify-between px-5">
          <a href="/" className="flex items-center gap-3.5" aria-label="Cloud Quest home">
            <GlowMark className="size-10 sm:size-11" />
            <span className="font-pixel text-[0.65rem] leading-snug tracking-wide sm:text-[0.72rem]">
              STUDY JAMS
              <span className="mt-0.5 block text-[0.52rem] text-muted-foreground sm:text-[0.58rem]">
                GDG · IARE
              </span>
            </span>
          </a>

          <Hud tone="cyan">QR CHECKPOINT</Hud>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <section className="w-full max-w-xl bg-void-2/95 backdrop-blur-md box-glow p-6 sm:p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-36 items-center justify-center border border-cyan/40 bg-void/80">
            <PixelCloud className="w-20 text-cyan drop-shadow-[0_0_12px_var(--cyan)] animate-floaty" />
          </div>

          <Hud tone="cyan">★ SCAN VERIFIED</Hud>

          <h1 className="mt-5 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            TESTING — QR code successfully scanned.
          </h1>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your Google Cloud Study Jams participant pass QR link is active and
            working properly.
          </p>

          {hasValidTokenFormat && (
            <div className="mt-5 inline-flex items-center gap-2 border border-cyan/30 bg-void px-3.5 py-2 font-mono text-xs text-cyan">
              <span>TOKEN STATUS:</span>
              <span className="text-magenta">RECOGNIZED</span>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-cyan/20 flex flex-wrap items-center justify-center gap-4">
            <a href="/" className="btn-arcade">
              ◀ BACK TO LOBBY
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-4 text-center font-pixel text-[0.52rem] uppercase tracking-widest text-muted-foreground/70">
        GOOGLE CLOUD STUDY JAMS · GDG ON CAMPUS IARE
      </footer>
    </div>
  );
}
