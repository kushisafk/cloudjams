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
const regProps =
  REGISTRATION_URL === "#"
    ? { href: "#register" }
    : REGISTRATION_URL.startsWith("http")
      ? { href: REGISTRATION_URL, target: "_blank", rel: "noopener noreferrer" }
      : { href: REGISTRATION_URL };

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let last = window.scrollY > 40;
    setScrolled(last);
    const f = () => {
      const next = window.scrollY > 40;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors ${scrolled || open ? "border-b border-cyan/20 bg-void/85 backdrop-blur-md" : ""}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5">
        <a href="#top" className="flex items-center gap-3.5" aria-label="Cloud Quest home">
          <GlowMark className="size-11 sm:size-12" />
          <span className="font-pixel text-[0.72rem] leading-snug tracking-wide sm:text-[0.78rem]">
            STUDY JAMS<span className="mt-0.5 block text-[0.58rem] text-muted-foreground sm:text-[0.62rem]">GDG · IARE</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="font-pixel text-[0.6rem] uppercase text-muted-foreground transition-colors hover:text-cyan">{n.label}</a>
          ))}
          <a {...regProps} className="border border-magenta px-3.5 py-2 font-pixel text-[0.6rem] text-magenta shadow-[0_0_14px_-4px_var(--magenta)] transition-colors hover:bg-magenta hover:text-void">INSERT COIN</a>
        </nav>
        <button className="border border-cyan/60 px-3 py-2 font-pixel text-[0.58rem] text-cyan md:hidden" aria-expanded={open} aria-controls="mnav" onClick={() => setOpen(!open)}>
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
    let raf = 0;
    let latestX = 0;
    let latestY = 0;

    const applyTilt = () => {
      raf = 0;
      el.style.transform = `perspective(1400px) rotateY(${-12 + latestX * 8}deg) rotateX(${4 - latestY * 6}deg)`;
    };

    const move = (e: PointerEvent) => {
      if (window.scrollY > window.innerHeight) return;
      latestX = e.clientX / window.innerWidth - 0.5;
      latestY = e.clientY / window.innerHeight - 0.5;
      if (!raf) {
        raf = requestAnimationFrame(applyTilt);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <div ref={ref} className="relative will-change-transform" style={{ transform: "perspective(1400px) rotateY(-12deg) rotateX(4deg)" }}>
      {/* cabinet */}
      <div className="relative border-2 border-violet/80 bg-void-2 p-4 shadow-[0_0_60px_-12px_var(--violet)] sm:p-6">
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

interface CheckpointDef {
  id: string;
  code: string;
  label: string;
  hash: string;
  selector: string;
}

const CHECKPOINTS: CheckpointDef[] = [
  { id: "cp-hero", code: "01", label: "START", hash: "#top", selector: "#top" },
  { id: "cp-story", code: "02", label: "STORY", hash: "#story", selector: "#story" },
  { id: "cp-missions", code: "03", label: "MISSIONS", hash: "#missions", selector: "#missions" },
  { id: "cp-status", code: "04", label: "EVENT INFO", hash: "#status", selector: "#status" },
  { id: "cp-how", code: "05", label: "CHECKPOINTS", hash: "#how", selector: "#how" },
  { id: "cp-faq", code: "06", label: "FAQ", hash: "#faq", selector: "#faq" },
  { id: "cp-register", code: "07", label: "READY PLAYER ONE", hash: "#register", selector: "#register" },
];

function useCheckpointScroll() {
  const [activeIdx, setActiveIdx] = useState(0);
  const goToRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;

    let rafId = 0;
    let isAnimating = false;
    let lockUntil = 0;
    let lastWheelTime = 0;
    let lastAbsDelta = 0;
    let currentIdx = 0;

    // Cached layout metrics (recalculated on resize, NOT on every scroll frame!)
    let cachedTops: number[] = CHECKPOINTS.map(() => 0);
    let storyTop = 0;
    let storyEnd = 0;
    let maxScroll = 0;

    const measureOffsets = () => {
      const scrollY = window.scrollY;
      maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      cachedTops = CHECKPOINTS.map((cp, idx) => {
        if (idx === 0) return 0;
        const el = document.querySelector<HTMLElement>(cp.selector);
        if (!el) return 0;
        const top = el.getBoundingClientRect().top + scrollY;
        return idx === CHECKPOINTS.length - 1 ? Math.min(maxScroll, top) : top;
      });

      const storyEl = document.querySelector<HTMLElement>("#story");
      if (storyEl) {
        storyTop = storyEl.getBoundingClientRect().top + scrollY;
        storyEnd = storyTop + Math.max(0, storyEl.offsetHeight - window.innerHeight);
      }
    };

    const findNearestIndex = (y: number) => {
      if (y >= storyTop - 20 && y <= storyEnd + 20) {
        return 1; // Inside #story
      }
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < cachedTops.length; i++) {
        const d = Math.abs((cachedTops[i] ?? 0) - y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      return bestIdx;
    };

    const animateToY = (targetY: number, duration = 620) => {
      cancelAnimationFrame(rafId);
      const startY = window.scrollY;
      const clampedTarget = Math.min(maxScroll, Math.max(0, targetY));
      const change = clampedTarget - startY;

      if (Math.abs(change) < 2) {
        window.scrollTo({ top: clampedTarget, behavior: "instant" as ScrollBehavior });
        isAnimating = false;
        return;
      }

      isAnimating = true;
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const nextY = startY + change * eased;
        window.scrollTo({ top: nextY, behavior: "instant" as ScrollBehavior });

        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          window.scrollTo({ top: clampedTarget, behavior: "instant" as ScrollBehavior });
          isAnimating = false;
        }
      };

      rafId = requestAnimationFrame(step);
    };

    const goToIndex = (idx: number, customY?: number) => {
      measureOffsets();
      const clamped = Math.max(0, Math.min(CHECKPOINTS.length - 1, idx));
      currentIdx = clamped;
      setActiveIdx(clamped);
      lockUntil = performance.now() + 660;
      animateToY(customY ?? (cachedTops[clamped] ?? 0), 620);
    };

    goToRef.current = (idx: number) => goToIndex(idx);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 36;
      else if (e.deltaMode === 2) delta *= window.innerHeight;

      const absDelta = Math.abs(delta);
      if (absDelta < 5) return;

      const now = performance.now();
      const y = window.scrollY;
      const inStoryZone = y >= storyTop - 16 && y <= storyEnd + 16;

      // While inside #story, let the browser's hardware-accelerated native scroll handle it!
      if (inStoryZone && !isAnimating && now >= lockUntil) {
        const atStoryBottom = y >= storyEnd - 8;
        const atStoryTop = y <= storyTop + 8;

        if ((delta > 0 && !atStoryBottom) || (delta < 0 && !atStoryTop)) {
          if (currentIdx !== 1) {
            currentIdx = 1;
            setActiveIdx(1);
          }
          lastWheelTime = now;
          lastAbsDelta = absDelta;
          return; // Do NOT call e.preventDefault() — native compositor scrolls #story smoothly
        }
      }

      e.preventDefault();

      const timeSinceLast = now - lastWheelTime;
      const isMomentumTail = timeSinceLast < 130 && absDelta <= lastAbsDelta * 1.2;

      lastWheelTime = now;
      lastAbsDelta = absDelta;

      if (isAnimating || now < lockUntil || isMomentumTail) {
        return;
      }

      const nearest = findNearestIndex(y);
      const dir = delta > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(CHECKPOINTS.length - 1, nearest + dir));

      if (nearest === 2 && next === 1 && dir === -1) {
        goToIndex(1, storyEnd);
        return;
      }

      if (next !== nearest || Math.abs((cachedTops[nearest] ?? 0) - y) > 24) {
        goToIndex(next);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (!isAnimating) goToIndex(findNearestIndex(window.scrollY) + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (!isAnimating) goToIndex(findNearestIndex(window.scrollY) - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToIndex(CHECKPOINTS.length - 1);
      }
    };

    const onScroll = () => {
      if (!isAnimating) {
        const nearest = findNearestIndex(window.scrollY);
        if (nearest !== currentIdx) {
          currentIdx = nearest;
          setActiveIdx(nearest);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const matchIdx = CHECKPOINTS.findIndex((c) => c.hash === hash);
      if (matchIdx === -1) return;

      e.preventDefault();
      goToIndex(matchIdx);
      history.pushState(null, "", hash);
    };

    measureOffsets();
    currentIdx = findNearestIndex(window.scrollY);
    setActiveIdx(currentIdx);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureOffsets, { passive: true });
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureOffsets);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return {
    activeIdx,
    goToCheckpoint: (idx: number) => goToRef.current(idx),
  };
}

function CheckpointRail({ activeIdx, onSelect }: { activeIdx: number; onSelect: (idx: number) => void }) {
  return (
    <aside
      aria-label="Page checkpoints"
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
    >
      <div className="mb-1 border border-cyan/30 bg-void/85 px-2 py-1 font-pixel text-[0.45rem] text-cyan/80 backdrop-blur-sm">
        CHK {CHECKPOINTS[activeIdx]?.code}/07
      </div>
      {CHECKPOINTS.map((cp, i) => {
        const active = i === activeIdx;
        return (
          <button
            key={cp.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Jump to checkpoint ${cp.code}: ${cp.label}`}
            aria-current={active ? "step" : undefined}
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <span
              className={`border px-2 py-0.5 font-pixel text-[0.45rem] tracking-wider transition-all duration-300 ${
                active
                  ? "translate-x-0 border-magenta/70 bg-void/90 text-magenta opacity-100 shadow-[0_0_12px_-3px_var(--magenta)]"
                  : "translate-x-2 border-cyan/30 bg-void/80 text-cyan opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
              }`}
            >
              {cp.code} · {cp.label}
            </span>
            <span
              className={`block transition-all duration-300 ${
                active
                  ? "h-5 w-2.5 border border-magenta bg-magenta shadow-[0_0_12px_var(--magenta)]"
                  : i < activeIdx
                    ? "size-2 border border-cyan bg-cyan/70 shadow-[0_0_6px_var(--cyan)] group-hover:scale-125"
                    : "size-2 border border-cyan/40 bg-void group-hover:border-cyan group-hover:bg-cyan/40"
              }`}
            />
          </button>
        );
      })}
      {activeIdx < CHECKPOINTS.length - 1 && (
        <button
          type="button"
          onClick={() => onSelect(activeIdx + 1)}
          className="mt-1 border border-cyan/40 bg-void/85 px-2 py-1 font-pixel text-[0.42rem] text-cyan transition-colors hover:border-magenta hover:text-magenta"
          title="Next checkpoint"
        >
          NEXT ▼
        </button>
      )}
    </aside>
  );
}

function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-between overflow-hidden pt-20">
      <div className="absolute inset-0 starfield" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-40 top-20 size-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--violet)_28%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 top-1/3 size-[460px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--cyan)_18%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-[38vh] overflow-hidden" aria-hidden="true">
        <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%] opacity-70" />
      </div>
      <PixelCloud className="absolute left-[6%] top-[18%] w-20 text-violet/40" />
      <PixelCloud className="absolute right-[40%] bottom-[34%] w-14 text-cyan/30" />

      <div className="relative my-auto mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-8 lg:grid-cols-12">
        <div className="relative z-10 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <GlowMark className="size-8" />
            <Hud>{EVENT.organizer}</Hud>
            <Hud tone="magenta">Insert coin to learn</Hud>
          </div>
          <h1 className="mt-6 font-display font-black uppercase leading-[0.88] tracking-tight">
            <span className="block text-[clamp(2.6rem,7.8vw,6.6rem)] text-foreground">Enter the</span>
            <span className="block text-[clamp(2.6rem,7.8vw,6.6rem)] text-cyan glow-cyan">Cloud.</span>
            <span className="mt-2 block text-[clamp(1.5rem,4.2vw,3.5rem)] text-stroke">Level up</span>
            <span className="block text-[clamp(1.5rem,4.2vw,3.5rem)] text-violet glow-violet">your skills.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            <strong className="text-foreground">{EVENT.name}</strong> — a guided quest through hands-on cloud labs, hosted by {EVENT.organizer}. No prior experience required.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a {...regProps} className="btn-arcade">START YOUR QUEST ↗</a>
            <a href="#missions" className="btn-ghost-neon">VIEW MISSIONS</a>
          </div>
        </div>
        <div className="relative lg:col-span-5 lg:-mr-12">
          <Monitor />
        </div>
      </div>

      {/* Integrated Portal Marquee Footer at bottom of Hero viewport */}
      <div className="relative z-10 overflow-hidden whitespace-nowrap border-y border-violet/40 bg-void/85 py-2 font-pixel text-[0.52rem] text-violet" aria-hidden="true">
        <div className="flex animate-marquee gap-10 pr-10">
          {Array.from({ length: 12 }).map((_, i) => <span key={i}>★ SCROLL ONCE TO ADVANCE CHECKPOINT ★ CLOUD QUEST ★ PLAYER 01 READY</span>)}
        </div>
      </div>
    </section>
  );
}

/** Cyber transition bridge integrated at the top of the Overworld */
function OverworldBridge() {
  return (
    <div className="relative w-full overflow-hidden py-4" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan/70 to-transparent shadow-[0_0_16px_var(--cyan)]" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 font-pixel text-[0.46rem] tracking-widest text-cyan/75">
        <span className="border border-cyan/30 bg-void px-3 py-1">▼ OVERWORLD UNLOCKED</span>
        <span className="hidden border border-violet/30 bg-void px-3 py-1 text-violet sm:inline">GRID_COORDS // 17.5990° N, 78.4176° E</span>
        <span className="border border-magenta/30 bg-void px-3 py-1 text-magenta">SECTOR 02–05 ONLINE</span>
      </div>
    </div>
  );
}

function SectionHead({ tag, title, sub }: { tag: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mb-10 max-w-3xl">
      <p className="font-pixel text-[0.6rem] text-magenta">{tag}</p>
      <h2 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] sm:text-6xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted-foreground">{sub}</p>}
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
    <section id="missions" className="relative flex min-h-screen flex-col justify-between overflow-hidden pt-16 pb-16">
      <OverworldBridge />
      {/* Section atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 dither opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--cyan)_14%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden opacity-35" aria-hidden="true">
        <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
      </div>
      <PixelCloud className="pointer-events-none absolute right-[7%] top-20 w-24 animate-floaty text-cyan/25 drop-shadow-[0_0_16px_var(--cyan)]" />
      <PixelCloud className="pointer-events-none absolute left-[4%] bottom-16 w-16 animate-floaty-slow text-violet/30" />

      <div className="relative my-auto mx-auto w-full max-w-7xl px-5">
        <SectionHead tag="// CHECKPOINT 03 · SELECT YOUR LEVEL" title={<>Mission <span className="text-cyan glow-cyan">select</span></>} sub="Example learning tracks shown below — the actual curriculum will be confirmed by organizers." />
        <div className="grid gap-6 md:grid-cols-3">
          {TRACKS.map((t, i) => (
            <Reveal key={t.id} delay={i * 120}>
              <article className={`tilt-card group relative h-full border-2 bg-void-2/90 p-6 ${tones[i]} hover:shadow-[0_0_40px_-6px_currentColor]`}>
                <div className="flex items-start justify-between">
                  <span className="font-pixel text-[0.6rem]">{t.id}</span>
                  <span className="border border-current px-2 py-1 font-pixel text-[0.5rem]">{t.level}</span>
                </div>
                <div className="my-6 transition-transform group-hover:scale-110"><MissionIcon kind={t.icon} /></div>
                <h3 className="font-display text-2xl font-black uppercase text-foreground">{t.title}</h3>
                <p className="mt-3 text-muted-foreground">{t.body}</p>
                <p className="mt-5 font-pixel text-[0.5rem] text-muted-foreground">EXAMPLE TRACK · EDITABLE</p>
                <a {...regProps} className="mt-2 inline-block font-pixel text-[0.55rem] opacity-0 transition-opacity group-hover:opacity-100 hover:underline">▶ PRESS START</a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
      <div />
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
    <section id="status" className="relative flex min-h-screen items-center overflow-hidden px-5 py-24">
      {/* Telemetry radar & ambient glow behind Event Info */}
      <div className="pointer-events-none absolute -right-24 top-1/2 size-[560px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--violet)_18%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-[420px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--magenta)_14%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[8%] top-1/2 hidden size-[440px] -translate-y-1/2 opacity-30 lg:block" aria-hidden="true">
        <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-cyan/60" />
        <div className="absolute inset-12 rounded-full border border-violet/50" />
        <div className="absolute inset-24 animate-spin-slow rounded-full border border-dashed border-magenta/50" style={{ animationDirection: "reverse" }} />
        <div className="absolute inset-x-0 top-1/2 h-px bg-cyan/40" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyan/40" />
        <img
          src="/logo.png"
          alt=""
          className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 object-contain opacity-80"
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <SectionHead tag="// CHECKPOINT 04 · SYSTEM STATUS" title={<>Event <span className="text-violet glow-violet">info</span></>} sub="Details marked pending will light up once organizers confirm them." />
        <Reveal>
          <Panel title="status_panel.sys">
            <dl className="divide-y divide-cyan/15 font-mono">
              {rows.map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
                  <dt className="font-pixel text-[0.55rem] text-cyan">{k}</dt>
                  <dd className="flex items-center gap-3">
                    {k === "HOST" && <GlowMark className="size-7" />}
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
    <section id="how" className="relative flex min-h-screen items-center overflow-hidden px-5 py-24">
      {/* Isometric network & circuit traces behind Checkpoints */}
      <div className="pointer-events-none absolute inset-0 iso-grid opacity-45 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 size-[540px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--cyan)_14%,transparent),transparent_70%)]" aria-hidden="true" />
      <PixelCloud className="pointer-events-none absolute right-[12%] top-14 w-20 animate-floaty-slow text-magenta/25" />
      <PixelCloud className="pointer-events-none absolute left-[8%] bottom-10 w-24 animate-floaty text-cyan/20" />

      <div className="relative mx-auto w-full max-w-7xl">
        <SectionHead tag="// CHECKPOINT 05 · QUEST PIPELINE" title={<>How it <span className="text-cyan glow-cyan">works</span></>} />
        <ol className="relative grid gap-10 md:grid-cols-4">
          <span className="absolute left-4 top-0 h-full w-[3px] bg-gradient-to-b from-cyan via-violet to-magenta shadow-[0_0_14px_var(--violet)] md:left-0 md:top-4 md:h-[3px] md:w-full md:bg-gradient-to-r" aria-hidden="true" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <li className="relative pl-14 md:pl-0 md:pt-14">
                <span className="absolute left-0 top-0 grid size-9 place-items-center border-2 border-cyan bg-void font-pixel text-[0.6rem] text-cyan shadow-[0_0_16px_var(--cyan)]">{i + 1}</span>
                <div className="border border-cyan/20 bg-void-2/85 p-5 transition-colors hover:border-cyan/50">
                  <p className="font-pixel text-[0.5rem] text-magenta">STEP 0{i + 1}</p>
                  <h3 className="mt-2 font-display text-xl font-black uppercase">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </div>
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
    <section id="faq" className="relative flex min-h-screen items-center overflow-hidden px-5 py-24">
      {/* Synthwave signal rings & dither field behind FAQ */}
      <div className="pointer-events-none absolute inset-0 dither opacity-25 [mask-image:radial-gradient(circle_at_center,black_20%,transparent_75%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--magenta)_14%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet/20 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan/15 opacity-50" aria-hidden="true" />
      <PixelCloud className="pointer-events-none absolute left-[6%] top-20 w-20 animate-floaty text-violet/30" />
      <PixelCloud className="pointer-events-none absolute right-[6%] bottom-20 w-24 animate-floaty-slow text-cyan/25" />

      <div className="relative mx-auto w-full max-w-4xl">
        <SectionHead tag="// CHECKPOINT 06 · DIALOGUE" title={<>Ask the <span className="text-magenta glow-magenta">machine</span></>} />
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
                      className={`flex w-full items-center gap-4 px-5 py-4 text-left font-mono transition-colors hover:bg-violet/10 ${on ? "text-cyan" : ""}`}
                    >
                      <span className="font-pixel text-[0.6rem]">{on ? "▼" : "▶"}</span>
                      <span className="flex-1">{f.q}</span>
                    </button>
                  </h3>
                  <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} hidden={!on} className="px-5 pb-5 pl-14 font-mono text-sm text-muted-foreground">
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

/** Continuous cyber-arcade backdrop wrapping all sections after ScrollStory (zero JS scroll listeners) */
function PostStoryBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 starfield opacity-55"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 cyber-grid opacity-45 [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]"
        aria-hidden="true"
      />
      {/* Left & Right glowing arcade data conduit rails */}
      <div className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-gradient-to-b from-transparent via-cyan/35 to-transparent xl:block" aria-hidden="true">
        <div className="h-32 w-[3px] -translate-x-[1px] bg-gradient-to-b from-transparent via-cyan to-transparent shadow-[0_0_12px_var(--cyan)] animate-data-stream" />
        <span className="sticky top-1/3 -ml-1.5 block size-3 rotate-45 border border-cyan bg-void shadow-[0_0_10px_var(--cyan)]" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-6 hidden w-px bg-gradient-to-b from-transparent via-violet/40 to-transparent xl:block" aria-hidden="true">
        <div className="h-32 w-[3px] -translate-x-[1px] bg-gradient-to-b from-transparent via-magenta to-transparent shadow-[0_0_12px_var(--magenta)] animate-data-stream" style={{ animationDelay: "4.5s" }} />
        <span className="sticky top-2/3 -ml-1.5 block size-3 rotate-45 border border-magenta bg-void shadow-[0_0_10px_var(--magenta)]" />
      </div>
      {/* Subtle coordinate crosshairs */}
      <div className="pointer-events-none absolute inset-x-12 top-1/4 hidden justify-between font-mono text-xs text-cyan/30 lg:flex" aria-hidden="true">
        <span>+ SYS.GRID.01</span>
        <span>+ SYS.GRID.02</span>
      </div>
      <div className="pointer-events-none absolute inset-x-12 top-2/4 hidden justify-between font-mono text-xs text-violet/30 lg:flex" aria-hidden="true">
        <span>+ TELEMETRY.NODE</span>
        <span>+ CLOUD.MESH</span>
      </div>
      <div className="pointer-events-none absolute inset-x-12 top-3/4 hidden justify-between font-mono text-xs text-magenta/30 lg:flex" aria-hidden="true">
        <span>+ CHECKPOINT.BUS</span>
        <span>+ DIALOGUE.IO</span>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function FinalCta() {
  return (
    <section id="register" className="relative flex min-h-screen flex-col justify-between overflow-hidden pt-24 text-center">
      <div className="absolute inset-0 starfield opacity-50" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden" aria-hidden="true">
        <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
      </div>
      <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border-2 border-dashed border-violet/60" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 size-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/50 bg-[radial-gradient(circle,color-mix(in_oklab,var(--violet)_35%,transparent),transparent_70%)]" aria-hidden="true" />
      <div />
      <Reveal className="relative my-auto px-5">
        <div className="mx-auto flex items-center justify-center gap-6">
          <GlowMark className="size-24 animate-floaty" />
          <PixelCloud className="w-28 animate-floaty text-cyan drop-shadow-[0_0_20px_var(--cyan)]" />
        </div>
        <p className="mt-8 font-pixel text-[0.6rem] text-magenta">CHECKPOINT 07 · STAGE COMPLETE · CONTINUE?</p>
        <h2 className="mt-5 font-display text-[clamp(2.4rem,8vw,6.5rem)] font-black uppercase leading-[0.9]">
          Ready <span className="text-cyan glow-cyan">player</span><br /><span className="text-violet glow-violet">one?</span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-muted-foreground">Your next level starts here. Registration deadline: <span className="text-foreground">{EVENT.deadline}</span></p>
        <a {...regProps} className="btn-arcade mt-10">START YOUR QUEST ↗</a>
        {REGISTRATION_URL === "#" && <p className="mt-4 font-pixel text-[0.5rem] text-muted-foreground">REGISTRATION LINK COMING SOON</p>}
      </Reveal>
      <Footer />
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-cyan/30 bg-void-2/95 px-5 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 font-pixel text-[0.5rem] text-muted-foreground">
        <span className="flex items-center gap-3"><GlowMark className="size-8" /> {EVENT.organizer.toUpperCase()}</span>
        <span className="text-cyan">1UP · {EVENT.name.toUpperCase()}</span>
        <nav className="flex gap-4" aria-label="Social">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="transition-colors hover:text-magenta"
            >
              {s.label.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function Index() {
  const { activeIdx, goToCheckpoint } = useCheckpointScroll();
  return (
    <div className="relative">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-cyan focus:p-2 focus:text-void">Skip to content</a>
      <Header />
      <CheckpointRail activeIdx={activeIdx} onSelect={goToCheckpoint} />
      <main id="main">
        <Hero />
        <ScrollStory />
        <PostStoryBackdrop>
          <Missions />
          <Status />
          <Checkpoints />
          <Faq />
        </PostStoryBackdrop>
        <FinalCta />
      </main>
    </div>
  );
}
