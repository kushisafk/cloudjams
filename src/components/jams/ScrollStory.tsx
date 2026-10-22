import { useEffect, useRef, useState } from "react";
import { Hud, Panel, PixelCloud } from "./Pixel";

const CHAPTERS = [
  { key: "BOOT SEQUENCE", tone: "cyan" as const, title: "Boot sequence", body: "Power on. Learn the vocabulary, open the console, and get your bearings in the cloud." },
  { key: "ENTER THE CLOUD", tone: "violet" as const, title: "Enter the cloud", body: "Work through guided hands-on labs and deploy real services, step by step." },
  { key: "COMPLETE THE QUEST", tone: "magenta" as const, title: "Complete the quest", body: "Finish your path, share your progress, and keep leveling up with the community." },
];

const BOOT = ["POST CHECK ........ OK", "MOUNT /labs ....... OK", "LINK gdg-iare ..... OK", "LOAD cloud.sys .... OK", "PLAYER 01 DETECTED", "> READY_"];

function Stage({ chapter, local, progress }: { chapter: number; local: number; progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="crt scanlines relative aspect-[4/3] w-full overflow-hidden border-2 border-cyan/60 bg-void">
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden" aria-hidden="true">
        <div
          className="neon-floor absolute -inset-x-1/2 top-0 h-[200%] transition-transform duration-500"
          style={{ transform: `perspective(420px) rotateX(${62 - chapter * 8}deg)` }}
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--violet)_30%,transparent),transparent_60%)]" aria-hidden="true" />

      {/* Scene 1: boot */}
      <div className="absolute inset-0 p-6 font-mono text-xs text-cyan transition-all duration-500 sm:text-sm" style={{ opacity: chapter === 0 ? 1 : 0, transform: `translateY(${chapter === 0 ? 0 : -30}px)` }}>
        {BOOT.map((l, i) => (
          <p key={l} style={{ opacity: local * BOOT.length > i ? 1 : 0.12 }} className="transition-opacity">{l}</p>
        ))}
        <PixelCloud assemble={local} className="absolute bottom-[22%] right-[8%] w-1/3 text-cyan drop-shadow-[0_0_12px_var(--cyan)]" />
      </div>

      {/* Scene 2: dashboard nodes */}
      <div className="absolute inset-0 transition-all duration-500" style={{ opacity: chapter === 1 ? 1 : 0, transform: `scale(${chapter === 1 ? 1 : 0.9})` }}>
        <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" aria-hidden="true">
          {[[200, 110, 90, 60], [200, 110, 310, 70], [200, 110, 120, 200], [200, 110, 300, 190], [90, 60, 120, 200], [310, 70, 300, 190]].map(([a, b, c, d], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4" style={{ opacity: local > i / 6 ? 0.9 : 0.1 }} />
          ))}
          {[[90, 60], [310, 70], [120, 200], [300, 190]].map(([x, y], i) => (
            <rect key={i} x={(x ?? 0) - 7} y={(y ?? 0) - 7} width="14" height="14" fill={i % 2 ? "var(--magenta)" : "var(--cyan)"} />
          ))}
        </svg>
        <PixelCloud className="absolute left-1/2 top-[22%] w-28 -translate-x-1/2 text-violet drop-shadow-[0_0_16px_var(--violet)]" />
        {["COMPUTE", "STORAGE", "NETWORK"].map((t, i) => (
          <div
            key={t}
            className="absolute border border-cyan/60 bg-void/80 px-2 py-1 font-pixel text-[0.5rem] text-cyan transition-transform duration-500"
            style={{ left: `${8 + i * 30}%`, bottom: "10%", transform: `translateY(${local > i * 0.25 ? 0 : 60}px)` }}
          >
            {t} <span className="text-magenta">●</span>
          </div>
        ))}
      </div>

      {/* Scene 3: portal + badge */}
      <div className="absolute inset-0 grid place-items-center transition-all duration-700" style={{ opacity: chapter === 2 ? 1 : 0, transform: `scale(${chapter === 2 ? 1 : 0.6})` }}>
        <div className="relative grid size-48 place-items-center sm:size-56">
          <div className="absolute inset-0 animate-spin-slow rounded-full border-4 border-dashed border-violet shadow-[0_0_40px_var(--violet)]" />
          <div className="absolute inset-5 rounded-full border-2 border-cyan shadow-[0_0_30px_var(--cyan)]" />
          <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle,var(--magenta),transparent_70%)] opacity-60 animate-pulse-glow" />
          <div className="relative text-center">
            <p className="font-pixel text-[0.55rem] text-cyan">ACHIEVEMENT</p>
            <p className="mt-2 font-display text-2xl font-black text-foreground glow-magenta">QUEST<br />CLEAR</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t border-cyan/40 bg-void/85 px-4 py-2 font-pixel text-[0.5rem] text-cyan">
        <span>{CHAPTERS[chapter]?.key}</span>
        <span className="relative h-1.5 flex-1 bg-muted">
          <span className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan via-violet to-magenta" style={{ width: `${pct}%` }} />
        </span>
        <span className="tabular-nums">{String(pct).padStart(3, "0")}%</span>
      </div>
    </div>
  );
}

export function ScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px) and (prefers-reduced-motion: no-preference)");
    const update = () => setPinned(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setProgress(Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight))));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pinned]);

  const chapter = Math.min(2, Math.floor(progress * 3));
  const local = Math.min(1, progress * 3 - chapter);

  const header = (
    <div>
      <Hud tone="violet">Chapter select · scroll to play</Hud>
      <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
        From <span className="text-cyan glow-cyan">curious</span> to <span className="text-violet glow-violet">cloud-ready</span>
      </h2>
    </div>
  );

  if (!pinned) {
    return (
      <section ref={ref} id="story" className="relative px-5 py-24">
        <div className="mx-auto max-w-2xl space-y-12">
          {header}
          {CHAPTERS.map((s, i) => (
            <div key={s.key} className="space-y-4">
              <Hud tone={s.tone}>{`0${i + 1} · ${s.key}`}</Hud>
              <p className="text-lg text-muted-foreground">{s.body}</p>
              <Stage chapter={i} local={1} progress={(i + 1) / 3} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="story" className="relative h-[280vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0 starfield opacity-60" style={{ transform: `translateY(${progress * -80}px)` }} aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-[0.9fr_1.3fr] items-center gap-14 px-8">
          <div className="space-y-8">
            {header}
            <ol className="relative space-y-3 border-l-2 border-muted pl-6">
              <span className="absolute -left-[2px] top-0 w-[2px] bg-cyan shadow-[0_0_10px_var(--cyan)]" style={{ height: `${progress * 100}%` }} aria-hidden="true" />
              {CHAPTERS.map((s, i) => (
                <li key={s.key} className={`transition-all duration-300 ${i === chapter ? "translate-x-1" : "opacity-40"}`}>
                  <p className="font-pixel text-[0.55rem] text-cyan">{i < chapter ? "■ CLEARED" : i === chapter ? "▶ NOW PLAYING" : "□ LOCKED"}</p>
                  <p className="mt-1 font-display text-2xl font-black uppercase">{s.title}</p>
                  <p className={`mt-1 max-w-sm text-muted-foreground transition-all ${i === chapter ? "max-h-24 opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <Panel title={`stage_0${chapter + 1}.exe`} tone={chapter === 1 ? "violet" : "cyan"}>
            <Stage chapter={chapter} local={local} progress={progress} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
