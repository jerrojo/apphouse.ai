import { useEffect, useRef } from "react";
import { getLoginUrl } from "@/const";
import { ArrowRight, Zap, Users, Globe, Shield, Sparkles, ChevronRight } from "lucide-react";

/* ── Vertical module marquee data ── */
const MODULES = [
  { emoji: "📱", label: "App & SaaS" },
  { emoji: "🛍️", label: "E-commerce" },
  { emoji: "✨", label: "Fashion & Luxury" },
  { emoji: "🏦", label: "Fintech" },
  { emoji: "🎮", label: "Games" },
  { emoji: "🎬", label: "Media & Content" },
  { emoji: "🧬", label: "Health & Bio" },
  { emoji: "🎓", label: "EdTech" },
  { emoji: "🤝", label: "B2B & Services" },
  { emoji: "🌎", label: "Social Impact" },
  { emoji: "🏗️", label: "Real Estate" },
  { emoji: "⚙️", label: "Industrial" },
  { emoji: "🍽️", label: "Hospitality" },
];

const FEATURES = [
  {
    icon: <Users size={20} />,
    title: "@Mention any agent",
    desc: "Route your message to the right specialist instantly. Type @ux, @front, @pm, or @team for focused expertise.",
    color: "oklch(0.68 0.24 292)",
    colorSubtle: "oklch(0.68 0.24 292 / 0.10)",
    span: "col-span-1",
  },
  {
    icon: <Zap size={20} />,
    title: "Parallel execution",
    desc: "Agents work simultaneously. The PM converts every conversation into structured Bugs, Tweaks, and Features automatically.",
    color: "oklch(0.68 0.22 145)",
    colorSubtle: "oklch(0.68 0.22 145 / 0.10)",
    span: "col-span-1",
  },
  {
    icon: <Globe size={20} />,
    title: "13 industry modules",
    desc: "Activate specialized agents for your vertical — Fintech, Fashion, Games, Health, and 9 more. One team, any domain.",
    color: "oklch(0.68 0.20 200)",
    colorSubtle: "oklch(0.68 0.20 200 / 0.10)",
    span: "col-span-1 md:col-span-2",
    wide: true,
  },
  {
    icon: <Shield size={20} />,
    title: "Universal Rules audit",
    desc: "Every project is audited against User-Friendly, Zero-Latency, Fool-Proof, and Accessibility pillars automatically.",
    color: "oklch(0.70 0.18 65)",
    colorSubtle: "oklch(0.70 0.18 65 / 0.10)",
    span: "col-span-1 md:col-span-2",
    wide: true,
  },
  {
    icon: <Sparkles size={20} />,
    title: "Live pointer sessions",
    desc: "Share your screen and point with your mouse. Agents see exactly what you're referencing in real time.",
    color: "oklch(0.68 0.22 315)",
    colorSubtle: "oklch(0.68 0.22 315 / 0.10)",
    span: "col-span-1",
  },
  {
    icon: <ChevronRight size={20} />,
    title: "Review & approve tasks",
    desc: "Accept or reject each task individually. Edit inline. Execute the final list with one click.",
    color: "oklch(0.68 0.20 248)",
    colorSubtle: "oklch(0.68 0.20 248 / 0.10)",
    span: "col-span-1",
  },
];

/* ── Animated gradient orb ── */
function GradientOrb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/* ── Marquee row ── */
function ModuleMarquee() {
  const doubled = [...MODULES, ...MODULES];
  return (
    <div className="relative overflow-hidden w-full py-1" aria-hidden>
      {/* fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--color-background), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--color-background), transparent)" }} />

      <div
        className="flex gap-3 w-max"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {doubled.map((m, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-secondary)",
            }}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const loginUrl = getLoginUrl();
  const heroRef = useRef<HTMLDivElement>(null);

  /* Subtle parallax on scroll */
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * 0.08}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden"
      style={{ background: "var(--color-background)" }}
    >
      {/* ── Ambient background orbs ── */}
      <GradientOrb
        className="w-[600px] h-[600px] -top-48 -left-32 opacity-25"
        style={{ background: "oklch(0.68 0.24 292)" } as React.CSSProperties}
      />
      <GradientOrb
        className="w-[400px] h-[400px] top-32 right-0 opacity-15"
        style={{ background: "oklch(0.68 0.22 315)" } as React.CSSProperties}
      />
      <GradientOrb
        className="w-[500px] h-[500px] top-[60vh] left-[30%] opacity-10"
        style={{ background: "oklch(0.68 0.20 248)" } as React.CSSProperties}
      />

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6"
        style={{
          background: "oklch(0.065 0.008 264 / 0.85)",
          backdropFilter: "blur(20px) saturate(1.8)",
          WebkitBackdropFilter: "blur(20px) saturate(1.8)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, oklch(0.68 0.24 292), oklch(0.60 0.26 268))",
              boxShadow: "0 0 12px oklch(0.68 0.24 292 / 0.4)",
            }}
          >
            P
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
          >
            PRISMA
          </span>
        </div>

        <a
          href={loginUrl}
          className="prisma-glow-btn inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{ color: "oklch(0.98 0 0)" }}
        >
          Get Started
          <ArrowRight size={14} />
        </a>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <div ref={heroRef} className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 mb-8 animate-fade-up" style={{ animationDelay: "0ms" }}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide"
              style={{
                background: "var(--color-accent-subtle)",
                border: "1px solid var(--color-accent-border)",
                color: "var(--color-accent)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-accent)", boxShadow: "0 0 6px var(--color-accent)" }}
              />
              30+ Specialized AI Agents · Any Industry, Any Project
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 animate-fade-up"
            style={{
              fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
              fontFamily: "var(--font-display)",
              animationDelay: "60ms",
            }}
          >
            <span style={{ color: "var(--color-foreground)" }}>Your AI team,</span>
            <br />
            <span className="prisma-gradient-animate">built for anything</span>
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mb-10 animate-fade-up"
            style={{
              maxWidth: "560px",
              fontSize: "1.125rem",
              lineHeight: 1.65,
              color: "var(--color-secondary)",
              animationDelay: "120ms",
            }}
          >
            PRISMA assembles a team of 30+ specialized AI agents that collaborate
            with you in real time — across apps, brands, games, fintech, content,
            and every industry in between.
          </p>

          {/* CTA group */}
          <div
            className="flex items-center justify-center gap-4 mb-16 animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <a
              href={loginUrl}
              className="prisma-glow-btn inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-base font-semibold"
              style={{ color: "oklch(0.98 0 0)" }}
            >
              Start Building
              <ArrowRight size={16} />
            </a>
            <span
              className="text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              No credit card required
            </span>
          </div>

          {/* Module marquee */}
          <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
            <ModuleMarquee />
          </div>
        </div>
      </section>

      {/* ── Feature bento grid ── */}
      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--color-muted)" }}
          >
            Everything your team needs
          </p>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--color-foreground)",
              fontFamily: "var(--font-display)",
            }}
          >
            One platform. Every workflow.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-6 overflow-hidden cursor-default ${f.span}`}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border-subtle)",
                transition: "border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out), transform 150ms var(--ease-out)",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = f.color;
                el.style.boxShadow = `0 4px 24px oklch(0 0 0 / 0.4), 0 0 0 1px ${f.color}`;
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-border-subtle)";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Ambient glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                style={{
                  background: `radial-gradient(ellipse at 0% 0%, ${f.colorSubtle}, transparent 70%)`,
                }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: f.colorSubtle,
                    color: f.color,
                    border: `1px solid ${f.color.replace(")", " / 0.25)")}`,
                  }}
                >
                  {f.icon}
                </div>

                <h3
                  className="mb-2 text-base font-semibold"
                  style={{
                    color: "var(--color-foreground)",
                    letterSpacing: "-0.02em",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-muted)" }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 pb-32 text-center">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-12 relative overflow-hidden"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, oklch(0.68 0.24 292 / 0.12), transparent 70%)",
            }}
          />
          <div className="relative z-10">
            <h2
              className="mb-4"
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                fontFamily: "var(--font-display)",
                color: "var(--color-foreground)",
              }}
            >
              Ready to build with your team?
            </h2>
            <p className="mb-8 text-base" style={{ color: "var(--color-secondary)" }}>
              Start free. No credit card. Your agents are ready.
            </p>
            <a
              href={loginUrl}
              className="prisma-glow-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold"
              style={{ color: "oklch(0.98 0 0)" }}
            >
              Get Started Free
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 text-center pb-8 px-6"
        style={{
          borderTop: "1px solid var(--color-border-subtle)",
          paddingTop: "2rem",
        }}
      >
        <p className="text-xs" style={{ color: "var(--color-faint)" }}>
          © 2026 PRISMA — Build the world's best products
        </p>
      </footer>
    </div>
  );
}
