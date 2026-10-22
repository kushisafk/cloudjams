import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EVENT, FAQS, REGISTRATION_URL, SOCIALS, STEPS, TRACKS } from "@/config/event";
import { GlowMark, Hud, Panel, PixelCloud, Reveal } from "@/components/jams/Pixel";
import { ScrollStory } from "@/components/jams/ScrollStory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cloud Quest · Google Cloud Study Jams · GDG on Campus IARE" },
      { name: "description", content: "Insert coin to learn. Join Google Cloud Study Jams by GDG on Campus at IARE — guided hands-on cloud labs for students." },
      { property: "og:title", content: "Cloud Quest · Google Cloud Study Jams · GDG on Campus IARE" },
      { property: "og:description", content: "Insert coin to learn. Guided hands-on Google Cloud labs with GDG on Campus at IARE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAV = [
  { href: "#story", label: "Story" },
  { href: "#missions", label: "Missions" },
  { href: "#status", label: "Info" },
  { href: "#faq", label: "FAQ" },
];

const isPlaceholder = (v: string) => v.startsWith("[");
const regProps = REGISTRATION_URL === "#" ? { href: "#register" } : { href: REGISTRATION_URL, target: "_blank", rel: "noopener noreferrer" };

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${scrolled || open ? "border-b border-cyan/20 bg-void/80 backdrop-blur-md" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-3" aria-label="Cloud Quest home">
          <GlowMark />
          <span className="font-pixel text-[0.6rem] leading-tight">
            STUDY JAMS<span className="block text-[0.5rem] text-muted-foreground">GDG · IARE</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="font-pixel text-[0.55rem] uppercase text-muted-foreground transition-colors hover:text-cyan">{n.label}</a>
          ))}
          <a {...regProps} className="border border-magenta px-3 py-2 font-pixel text-[0.55rem] text-magenta shadow-[0_0_14px_-4px_var(--magenta)] transition-colors hover:bg-magenta hover:text-void">INSERT COIN</a>
        </nav>
        <button className="border border-cyan/60 px-3 py-2 font-pixel text-[0.55rem] text-cyan md:hidden" aria-expanded={open} aria-controls="mnav" onClick={() => setOpen(!open)}>
          {open ? "CLOSE" : "MENU"}
        </button>
      </div>
      {open && (
        <nav id="mnav" className="border-t border-cyan/20 px-5 pb-5 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b border-cyan/10 py-3 font-pixel text-[0.65rem] uppercase">▶ {n.label}</a>
          ))}
          <a {...regProps} onClick={() => setOpen(false)} className="btn-arcade mt-4">START YOUR QUEST ↗</a>
        </nav>
      )}
    </header>
  );
}

const TERM = ["$ gcloud auth login --player 01", "✓ session established", "$ quest start --path cloud", "> loading labs ...", "> compute.engine ....... online", "> storage.bucket ....... online", "> network.vpc .......... online", "$ deploy --hands-on", "✓ level 01 unlocked", "> xp +250", "$ share --with community", "✓ squad synced"];

function Monitor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const move = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `perspective(1400px) rotateY(${-12 + x * 8}deg) rotateX(${4 - y * 6}deg)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={ref} className="relative transition-transform duration-300 ease-out" style={{ transform: "perspective(1400px) rotateY(-12deg) rotateX(4deg)" }}>
      {/* cabinet */}
      <div className="relative border-2 border-violet/80 bg-void-2 p-4 shadow-[0_0_80px_-10px_var(--violet)] sm:p-6">
        <div className="mb-3 flex items-center justify-between font-pixel text-[0.5rem]">
          <span className="text-cyan">● SYSTEM ONLINE</span>
          <span className="text-magenta">PLAYER 01</span>
          <span className="hidden text-violet sm:inline">CLOUD QUEST</span>
        </div>
        <div className="crt scanlines relative aspect-[4/3] overflow-hidden border border-cyan/50 bg-void">
          <div className="absolute inset-0 starfield opacity-70" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-[45%] overflow-hidden" aria-hidden="true">
            <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
          </div>
          <div className="absolute inset-x-0 top-[52%] h-px bg-magenta shadow-[0_0_12px_var(--magenta)]" aria-hidden="true" />
          {/* sun */}
          <div className="absolute left-1/2 top-[18%] size-36 -translate-x-1/2 rounded-full bg-gradient-to-b from-magenta via-violet to-transparent opacity-70 [mask-image:repeating-linear-gradient(0deg,black_0_6px,transparent_6px_9px)]" aria-hidden="true" />
          <div className="absolute left-1/2 top-[20%] w-[46%] -translate-x-1/2 animate-floaty" aria-hidden="true">
            <PixelCloud className="w-full text-cyan drop-shadow-[0_0_18px_var(--cyan)]" />
          </div>
          {/* orbit */}
          <div className="absolute left-1/2 top-[34%] size-0" aria-hidden="true">
            <div className="absolute -left-28 -top-16 h-32 w-56 animate-orbit">
              <span className="absolute left-0 top-1/2 size-2 bg-magenta shadow-[0_0_8px_var(--magenta)]" />
              <span className="absolute right-0 top-1/3 size-1.5 bg-cyan" />
              <span className="absolute bottom-0 left-1/2 size-2 bg-violet" />
            </div>
          </div>
          {/* terminal */}
          <div className="absolute bottom-3 left-3 h-24 w-[55%] overflow-hidden border border-cyan/40 bg-void/85 p-2 font-mono text-[0.6rem] leading-relaxed text-cyan" aria-hidden="true">
            <div className="animate-scroll-up">
              {[...TERM, ...TERM].map((l, i) => <p key={i} className={l.startsWith("✓") ? "text-magenta" : ""}>{l}</p>)}
            </div>
          </div>
          <div className="absolute bottom-3 right-3 font-pixel text-[0.5rem] text-cyan">HI-SCORE<br /><span className="text-foreground">000000</span><span className="animate-blink">▌</span></div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 animate-scanpass bg-gradient-to-b from-transparent via-cyan/10 to-transparent" aria-hidden="true" />
        </div>
        <div className="mt-4 flex items-center justify-between" aria-hidden="true">
          <div className="flex gap-3">
            <span className="size-6 rounded-full bg-magenta shadow-[0_0_14px_var(--magenta)]" />
            <span className="size-6 rounded-full bg-cyan shadow-[0_0_14px_var(--cyan)]" />
          </div>
          <span className="font-pixel text-[0.5rem] text-muted-foreground">CREDIT 01</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const f = () => setY(window.scrollY);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <section id="top" className="relative min-h-screen overflow-hidden pt-24">
      <div className="absolute inset-0 starfield" style={{ transform: `translateY(${y * 0.3}px)` }} aria-hidden="true" />
      <div className="absolute -left-40 top-20 size-[560px] rounded-full bg-violet/25 blur-[120px]" aria-hidden="true" />
      <div className="absolute -right-20 top-1/3 size-[420px] rounded-full bg-cyan/15 blur-[120px]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-[38vh] overflow-hidden" aria-hidden="true" style={{ transform: `translateY(${y * 0.1}px)` }}>
        <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%] opacity-70" />
      </div>
      <PixelCloud className="absolute left-[6%] top-[18%] w-20 text-violet/40" />
      <PixelCloud className="absolute right-[40%] bottom-[34%] w-14 text-cyan/30" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 lg:grid-cols-12">
        <div className="relative z-10 lg:col-span-7">
          <div className="flex flex-wrap gap-2">
            <Hud>{EVENT.organizer}</Hud>
            <Hud tone="magenta">Insert coin to learn</Hud>
          </div>
          <h1 className="mt-8 font-display font-black uppercase leading-[0.88] tracking-tight">
            <span className="block text-[clamp(2.8rem,8.5vw,7.2rem)] text-foreground">Enter the</span>
            <span className="block text-[clamp(2.8rem,8.5vw,7.2rem)] text-cyan glow-cyan">Cloud.</span>
            <span className="mt-2 block text-[clamp(1.6rem,4.6vw,3.8rem)] text-stroke">Level up</span>
            <span className="block text-[clamp(1.6rem,4.6vw,3.8rem)] text-violet glow-violet">your skills.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted-foreground">
            <strong className="text-foreground">{EVENT.name}</strong> — a guided quest through hands-on cloud labs, hosted by {EVENT.organizer}. No prior experience required.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a {...regProps} className="btn-arcade">START YOUR QUEST ↗</a>
            <a href="#missions" className="btn-ghost-neon">VIEW MISSIONS</a>
          </div>
        </div>
        <div className="relative lg:col-span-5 lg:-mr-16 lg:mt-16">
          <Monitor />
        </div>
      </div>
    </section>
  );
}

/** Pixelated wipe + portal ring between hero and story */
function PortalWipe() {
  return (
    <div className="relative h-40 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 grid grid-cols-[repeat(24,1fr)]">
        {Array.from({ length: 72 }).map((_, i) => (
          <span key={i} className="aspect-square bg-void-2" style={{ opacity: ((i * 53) % 100) / 100 > Math.floor(i / 24) * 0.35 ? 1 : 0 }} />
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 h-24 w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-cyan/60 shadow-[0_0_40px_var(--cyan)] animate-pulse-glow" />
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 overflow-hidden whitespace-nowrap border-y border-violet/40 bg-void/80 py-2 font-pixel text-[0.55rem] text-violet">
        <div className="flex animate-marquee gap-10 pr-10">
          {Array.from({ length: 12 }).map((_, i) => <span key={i}>★ LOADING CLOUD QUEST ★ PRESS START ★ PLAYER 01 READY</span>)}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ tag, title, sub }: { tag: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mb-14 max-w-3xl">
      <p className="font-pixel text-[0.6rem] text-magenta">{tag}</p>
      <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">{title}</h2>
      {sub && <p className="mt-5 text-lg text-muted-foreground">{sub}</p>}
    </Reveal>
  );
}

function MissionIcon({ kind }: { kind: string }) {
  const maps: Record<string, string[]> = {
    cloud: ["..XXX...", ".XXXXXX.", "XXXXXXXX", "XXXXXXXX", ".XXXXXX."],
    chip: ["X.X.X.X.", "XXXXXXX.", ".X...X.X", "XX.X.XX.", ".X...X.X", "XXXXXXX.", "X.X.X.X."],
    star: ["...X....", "...X....", "XXXXXXX.", ".XXXXX..", ".XX.XX..", "X.....X."],
  };
  const m = maps[kind] ?? maps["cloud"]!;
  return (
    <svg viewBox={`0 0 8 ${m.length}`} className="pixelated h-14 w-16" aria-hidden="true">
      {m.flatMap((r, y) => [...r].map((c, x) => (c === "X" ? <rect key={`${x}${y}`} x={x} y={y} width="1.02" height="1.02" fill="currentColor" /> : null)))}
    </svg>
  );
}

function Missions() {
  const tones = ["text-cyan border-cyan", "text-violet border-violet", "text-magenta border-magenta"];
  return (
    <section id="missions" className="relative px-5 py-28">
      <div className="absolute inset-0 dither opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHead tag="// SELECT YOUR LEVEL" title={<>Mission <span className="text-cyan glow-cyan">select</span></>} sub="Example learning tracks shown below — the actual curriculum will be confirmed by organizers." />
        <div className="grid gap-6 md:grid-cols-3">
          {TRACKS.map((t, i) => (
            <Reveal key={t.id} delay={i * 120}>
              <article className={`tilt-card group relative h-full border-2 bg-void-2/80 p-6 ${tones[i]} hover:shadow-[0_0_40px_-6px_currentColor]`}>
                <div className="flex items-start justify-between">
                  <span className="font-pixel text-[0.6rem]">{t.id}</span>
                  <span className="border border-current px-2 py-1 font-pixel text-[0.5rem]">{t.level}</span>
                </div>
                <div className="my-8 transition-transform group-hover:scale-110"><MissionIcon kind={t.icon} /></div>
                <h3 className="font-display text-2xl font-black uppercase text-foreground">{t.title}</h3>
                <p className="mt-3 text-muted-foreground">{t.body}</p>
                <p className="mt-6 font-pixel text-[0.5rem] text-muted-foreground">EXAMPLE TRACK · EDITABLE</p>
                <p className="mt-2 font-pixel text-[0.55rem] opacity-0 transition-opacity group-hover:opacity-100">▶ PRESS START</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Status() {
  const rows = [
    ["DATE", EVENT.date],
    ["MODE / VENUE", EVENT.venue],
    ["REG. DEADLINE", EVENT.deadline],
    ["HOST", EVENT.organizer],
  ];
  return (
    <section id="status" className="px-5 py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <SectionHead tag="// SYSTEM STATUS" title={<>Event <span className="text-violet glow-violet">info</span></>} sub="Details marked pending will light up once organizers confirm them." />
        <Reveal>
          <Panel title="status_panel.sys">
            <dl className="divide-y divide-cyan/15 font-mono">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
                  <dt className="font-pixel text-[0.55rem] text-cyan">{k}</dt>
                  <dd className="flex items-center gap-3">
                    <span className={isPlaceholder(v!) ? "text-muted-foreground" : "text-foreground"}>{v}</span>
                    <span className={`font-pixel text-[0.5rem] ${isPlaceholder(v!) ? "text-magenta animate-blink" : "text-cyan"}`}>{isPlaceholder(v!) ? "PENDING" : "OK"}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}

function Checkpoints() {
  return (
    <section id="how" className="relative px-5 py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHead tag="// CHECKPOINTS" title={<>How it <span className="text-cyan glow-cyan">works</span></>} />
        <ol className="relative grid gap-10 md:grid-cols-4">
          <span className="absolute left-4 top-0 h-full w-[3px] bg-gradient-to-b from-cyan via-violet to-magenta shadow-[0_0_14px_var(--violet)] md:left-0 md:top-4 md:h-[3px] md:w-full md:bg-gradient-to-r" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <li className="relative pl-14 md:pl-0 md:pt-14">
                <span className="absolute left-0 top-0 grid size-9 place-items-center border-2 border-cyan bg-void font-pixel text-[0.6rem] text-cyan shadow-[0_0_16px_var(--cyan)]">{i + 1}</span>
                <p className="font-pixel text-[0.5rem] text-magenta">CHECKPOINT 0{i + 1}</p>
                <h3 className="mt-2 font-display text-xl font-black uppercase">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-5 py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHead tag="// DIALOGUE" title={<>Ask the <span className="text-magenta glow-magenta">machine</span></>} />
        <Panel title="help_menu.txt" tone="violet">
          <ul>
            {FAQS.map((f, i) => {
              const on = open === i;
              return (
                <li key={f.q} className="border-b border-violet/20 last:border-0">
                  <h3>
                    <button
                      id={`faq-b-${i}`}
                      aria-expanded={on}
                      aria-controls={`faq-p-${i}`}
                      onClick={() => setOpen(on ? null : i)}
                      className={`flex w-full items-center gap-4 px-5 py-5 text-left font-mono transition-colors hover:bg-violet/10 ${on ? "text-cyan" : ""}`}
                    >
                      <span className="font-pixel text-[0.6rem]">{on ? "▼" : "▶"}</span>
                      <span className="flex-1">{f.q}</span>
                    </button>
                  </h3>
                  <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} hidden={!on} className="px-5 pb-6 pl-14 font-mono text-sm text-muted-foreground">
                    <span className="text-magenta">SYS&gt;</span> {f.a}
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="register" className="relative overflow-hidden px-5 py-36 text-center">
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden" aria-hidden="true">
        <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border-2 border-dashed border-violet/60 shadow-[0_0_80px_-10px_var(--violet)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/50 bg-[radial-gradient(circle,color-mix(in_oklab,var(--violet)_35%,transparent),transparent_70%)]" aria-hidden="true" />
      <Reveal className="relative">
        <PixelCloud className="mx-auto w-28 animate-floaty text-cyan drop-shadow-[0_0_20px_var(--cyan)]" />
        <p className="mt-8 font-pixel text-[0.6rem] text-magenta">STAGE COMPLETE · CONTINUE?</p>
        <h2 className="mt-5 font-display text-[clamp(2.4rem,8vw,6.5rem)] font-black uppercase leading-[0.9]">
          Ready <span className="text-cyan glow-cyan">player</span><br /><span className="text-violet glow-violet">one?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-muted-foreground">Your next level starts here. Registration deadline: <span className="text-foreground">{EVENT.deadline}</span></p>
        <a {...regProps} className="btn-arcade mt-10">START YOUR QUEST ↗</a>
        {REGISTRATION_URL === "#" && <p className="mt-4 font-pixel text-[0.5rem] text-muted-foreground">REGISTRATION LINK COMING SOON</p>}
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-cyan/30 bg-void-2 px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-pixel text-[0.5rem] text-muted-foreground">
        <span className="flex items-center gap-3"><GlowMark /> {EVENT.organizer.toUpperCase()}</span>
        <span className="text-cyan">1UP · {EVENT.name.toUpperCase()}</span>
        <nav className="flex gap-4" aria-label="Social">
          {SOCIALS.map((s) => <a key={s.label} href={s.href} className="hover:text-magenta">{s.label.toUpperCase()}</a>)}
        </nav>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="relative">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-cyan focus:p-2 focus:text-void">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <PortalWipe />
        <ScrollStory />
        <Missions />
        <Status />
        <Checkpoints />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <div className="pointer-events-none fixed inset-0 z-[70] bg-[repeating-linear-gradient(0deg,color-mix(in_oklab,black_18%,transparent)_0_1px,transparent_1px_3px)] opacity-40" aria-hidden="true" />
    </div>
  );
}
