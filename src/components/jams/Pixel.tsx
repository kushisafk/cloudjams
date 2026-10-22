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

export function GlowMark({ className = "size-10" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="GDG on Campus IARE logo"
      className={`inline-block shrink-0 object-contain ${className}`}
    />
  );
}

export function PixelRunner({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`pixelated ${className}`} aria-hidden="true">
      <rect x="4" y="1" width="4" height="3" fill="var(--cyan)" />
      <rect x="3" y="4" width="6" height="4" fill="var(--magenta)" />
      <rect x="2" y="8" width="3" height="3" fill="var(--violet)" />
      <rect x="7" y="8" width="3" height="3" fill="var(--violet)" />
    </svg>
  );
}

export function Hud({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "magenta" }) {
  const c = { cyan: "text-cyan border-cyan/60", violet: "text-violet border-violet/70", magenta: "text-magenta border-magenta/70" }[tone];
  const d = { cyan: "bg-cyan", violet: "bg-violet", magenta: "bg-magenta" }[tone];
  return (
    <span className={`inline-flex items-center gap-2 border bg-void/85 px-2.5 py-1.5 font-pixel text-[0.55rem] uppercase tracking-wider ${c}`}>
      <span className={`size-1.5 animate-blink ${d}`} />
      {children}
    </span>
  );
}

export function Panel({ title, children, className = "", tone = "cyan" }: { title: string; children: ReactNode; className?: string; tone?: "cyan" | "violet" }) {
  return (
    <div className={`relative bg-void-2/95 ${tone === "cyan" ? "box-glow" : "box-glow-violet"} ${className}`}>
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
