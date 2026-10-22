import { useEffect, useRef, type ReactNode } from "react";

const CLOUD = [
  ".....XXXX.......",
  "....XXXXXX.XXX..",
  "..XXXXXXXXXXXXX.",
  ".XXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXXXX",
  ".XXXXXXXXXXXXXX.",
];

/** Pixel cloud. `assemble` 0..1 controls how many pixels are drawn (for boot effect). */
export function PixelCloud({ className = "", fill = "currentColor", assemble = 1 }: { className?: string; fill?: string; assemble?: number }) {
  let n = 0;
  return (
    <svg viewBox="0 0 16 7" className={`pixelated ${className}`} aria-hidden="true">
      {CLOUD.flatMap((row, y) =>
        [...row].map((c, x) => {
          if (c !== "X") return null;
          n++;
          const show = ((n * 37) % 100) / 100 < assemble;
          return <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={fill} style={{ opacity: show ? 1 : 0, transition: "opacity .3s" }} />;
        }),
      )}
    </svg>
  );
}

export function GlowMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-grid grid-cols-3 gap-[2px] ${className}`} aria-hidden="true">
      {[0, 1, 0, 1, 1, 1, 1, 0, 1].map((on, i) => (
        <span key={i} className={`size-1.5 ${on ? (i === 4 ? "bg-magenta" : "bg-cyan") : "bg-transparent"} ${on ? "shadow-[0_0_6px_var(--cyan)]" : ""}`} />
      ))}
    </span>
  );
}

export function Hud({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "magenta" }) {
  const c = { cyan: "text-cyan border-cyan/60", violet: "text-violet border-violet/70", magenta: "text-magenta border-magenta/70" }[tone];
  const d = { cyan: "bg-cyan", violet: "bg-violet", magenta: "bg-magenta" }[tone];
  return (
    <span className={`inline-flex items-center gap-2 border bg-void/70 px-2.5 py-1.5 font-pixel text-[0.55rem] uppercase tracking-wider ${c}`}>
      <span className={`size-1.5 animate-blink ${d}`} />
      {children}
    </span>
  );
}

export function Panel({ title, children, className = "", tone = "cyan" }: { title: string; children: ReactNode; className?: string; tone?: "cyan" | "violet" }) {
  return (
    <div className={`relative bg-void-2/80 backdrop-blur-sm ${tone === "cyan" ? "box-glow" : "box-glow-violet"} ${className}`}>
      <div className={`flex items-center justify-between border-b px-3 py-2 ${tone === "cyan" ? "border-cyan/40" : "border-violet/50"}`}>
        <span className="font-pixel text-[0.55rem] uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 bg-cyan" />
          <span className="size-2 bg-violet" />
          <span className="size-2 bg-magenta" />
        </span>
      </div>
      {children}
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("reveal");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
