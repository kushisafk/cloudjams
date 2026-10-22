import { createFileRoute } from "@tanstack/react-router";
import { GlowMark, Hud, PixelCloud } from "@/components/jams/Pixel";
import { getRegistrationByQrToken } from "@/lib/registration.server";

export const Route = createFileRoute("/testing")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? search["ref"] : undefined,
  }),
  loaderDeps: ({ search: { ref } }) => ({ ref }),
  loader: async ({ deps: { ref } }) => {
    return await getRegistrationByQrToken({ data: ref });
  },
  head: () => ({
    meta: [
      { title: "Participant Pass · Google Cloud Study Jams · GDG on Campus IARE" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TestingPage,
});

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  some: "Some Experience",
  experienced: "Experienced",
};

function TestingPage() {
  const participant = Route.useLoaderData();

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
            <span className="font-pixel text-[0.6rem] leading-snug tracking-wide sm:text-[0.68rem]">
              Google Cloud Study Jams
              <span className="mt-0.5 block text-[0.52rem] text-muted-foreground sm:text-[0.58rem]">
                GDG · IARE
              </span>
            </span>
          </a>

          <Hud tone={participant.found ? "cyan" : "magenta"}>
            {participant.found ? "PASS VERIFIED" : "UNVERIFIED QR"}
          </Hud>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <section className="w-full max-w-xl bg-void-2/95 backdrop-blur-md box-glow p-6 sm:p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-36 items-center justify-center border border-cyan/40 bg-void/80">
            <PixelCloud className="w-20 text-cyan drop-shadow-[0_0_12px_var(--cyan)] animate-floaty" />
          </div>

          {participant.found ? (
            <>
              <Hud tone="cyan">★ VERIFIED PARTICIPANT</Hud>

              <h1 className="mt-4 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                {participant.fullName}
              </h1>

              {participant.rollNumber && participant.rollNumber !== "—" && (
                <p className="mt-1 font-mono text-sm sm:text-base text-cyan">
                  ROLL NO: {participant.rollNumber}
                </p>
              )}

              {/* Student Details Pass Card */}
              <div className="mx-auto mt-6 max-w-md border border-cyan/40 bg-void p-5 text-left text-sm space-y-3">
                <div className="flex items-center justify-between border-b border-cyan/20 pb-2.5 font-pixel text-[0.55rem] text-cyan">
                  <span>PLAYER PASS</span>
                  <span className="text-magenta">#{participant.playerCode}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-mono text-xs uppercase text-cyan font-semibold">
                    ● {participant.status}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-foreground text-right">
                    {participant.fullName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-mono text-cyan text-right font-semibold">
                    {participant.rollNumber}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground text-right break-all">
                    {participant.collegeEmail}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">College</span>
                  <span className="text-foreground text-right">
                    {participant.collegeName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Branch &amp; Year</span>
                  <span className="text-foreground text-right">
                    {participant.branch} · {participant.yearOfStudy}
                  </span>
                </div>

                {participant.experienceLevel && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cloud Track</span>
                    <span className="text-foreground text-right">
                      {EXPERIENCE_LABELS[participant.experienceLevel] ??
                        participant.experienceLevel}
                    </span>
                  </div>
                )}

                {participant.registeredAt && (
                  <div className="flex justify-between gap-4 border-t border-cyan/15 pt-2.5 text-xs">
                    <span className="text-muted-foreground">Registered On</span>
                    <span className="font-mono text-muted-foreground text-right">
                      {new Date(participant.registeredAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Hud tone="magenta">✕ PASS NOT FOUND</Hud>

              <h1 className="mt-5 font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                INVALID OR UNRECOGNIZED QR CODE
              </h1>

              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                No Google Cloud Study Jams registration matched this QR link. Please
                check the link from your confirmation email or register first.
              </p>
            </>
          )}

          <div className="mt-8 pt-5 border-t border-cyan/20 flex flex-wrap items-center justify-center gap-4">
            <a href="/" className="btn-arcade">
              ◀ BACK TO LOBBY
            </a>
            {!participant.found && (
              <a href="/register" className="btn-ghost-neon">
                REGISTER NOW
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-4 text-center font-pixel text-[0.52rem] uppercase tracking-widest text-muted-foreground/70">
        GOOGLE CLOUD STUDY JAMS · GDG ON CAMPUS IARE
      </footer>
    </div>
  );
}
