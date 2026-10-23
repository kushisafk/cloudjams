import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { GlowMark, Hud, PixelCloud } from "@/components/jams/Pixel";
import { EVENT, REGISTRATION_OPEN } from "@/config/event";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register · Google Cloud Study Jams · GDG on Campus IARE" },
      {
        name: "description",
        content:
          "Your cloud journey starts here. Register for Google Cloud Study Jams hosted by GDG on Campus at IARE.",
      },
    ],
  }),
  component: RegisterPage,
});

type ScreenMode = "title" | "student" | "learning" | "confirm" | "success";
type UsedGcp = "yes" | "no" | "";
type ExperienceLevel = "beginner" | "some" | "experienced" | "";

interface FormData {
  fullName: string;
  rollNumber: string;
  collegeEmail: string;
  collegeName: string;
  yearOfStudy: string;
  branch: string;
  phone: string;
  usedGcp: UsedGcp;
  experienceLevel: ExperienceLevel;
  cloudInterest: string;
  consent: boolean;
}

const INITIAL_FORM: FormData = {
  fullName: "",
  rollNumber: "",
  collegeEmail: "",
  collegeName: "Institute of Aeronautical Engineering (IARE)",
  yearOfStudy: "",
  branch: "",
  phone: "",
  usedGcp: "",
  experienceLevel: "",
  cloudInterest: "",
  consent: false,
};

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const POPULAR_BRANCHES = ["CSE", "CSE (AI & ML)", "CSE (DS)", "IT", "ECE", "EEE", "Aero"];

function RegisterPage() {
  const [screen, setScreen] = useState<ScreenMode>("title");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [playerCode, setPlayerCode] = useState("P1-4210");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const isStudentInfoComplete = Boolean(
    form.fullName.trim() &&
      form.rollNumber.trim() &&
      form.collegeEmail.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.collegeEmail.trim()) &&
      form.collegeName.trim() &&
      form.yearOfStudy &&
      form.branch.trim(),
  );

  const isLearningComplete = Boolean(
    form.usedGcp || form.experienceLevel || form.cloudInterest.trim(),
  );

  const validateStudentInfo = () => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Please enter your full name";
    if (!form.rollNumber.trim()) {
      nextErrors.rollNumber = "Please enter your roll number (e.g. 25951A05F3)";
    } else if (!/^[A-Za-z0-9-]{4,24}$/.test(form.rollNumber.trim())) {
      nextErrors.rollNumber = "Enter a valid roll number (e.g. 25951A05F3)";
    }

    const email = form.collegeEmail.trim().toLowerCase();
    const typoDomains: Record<string, string> = {
      "gmial.com": "gmail.com",
      "gamil.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmail.co": "gmail.com",
      "gmail.con": "gmail.com",
      "yaho.com": "yahoo.com",
      "outlok.com": "outlook.com",
      "hotmial.com": "hotmail.com",
    };
    const blockedDomains = new Set([
      "example.com",
      "test.com",
      "mailinator.com",
      "yopmail.com",
      "tempmail.com",
      "10minutemail.com",
      "guerrillamail.com",
      "trashmail.com",
    ]);

    if (!email) {
      nextErrors.collegeEmail = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
      nextErrors.collegeEmail = "Enter a valid email address";
    } else {
      const domain = email.split("@")[1] ?? "";
      if (typoDomains[domain]) {
        nextErrors.collegeEmail = `Did you mean @${typoDomains[domain]}?`;
      } else if (blockedDomains.has(domain)) {
        nextErrors.collegeEmail = "Please enter a real email address (no test/disposable emails)";
      }
    }

    if (!form.collegeName.trim()) nextErrors.collegeName = "Please enter your college name";
    if (!form.yearOfStudy) nextErrors.yearOfStudy = "Please select your year of study";
    if (!form.branch.trim()) nextErrors.branch = "Please enter your branch or department";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleStudentContinue = () => {
    if (validateStudentInfo()) {
      setScreen("learning");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!REGISTRATION_OPEN) return;

    if (!validateStudentInfo()) {
      setScreen("student");
      return;
    }

    if (!form.consent) {
      setErrors({ consent: "Please agree to receive event updates to continue" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (result.ok) {
        if (result.playerCode) {
          setPlayerCode(result.playerCode);
        }
        setScreen("success");
        return;
      }

      const studentFields: Array<keyof FormData> = [
        "fullName",
        "rollNumber",
        "collegeEmail",
        "collegeName",
        "yearOfStudy",
        "branch",
        "phone",
      ];
      const hasStudentFieldError =
        result.fieldErrors &&
        studentFields.some((f) => Boolean(result.fieldErrors?.[f]));

      if (hasStudentFieldError && result.fieldErrors) {
        setErrors(result.fieldErrors);
        setScreen("student");
        return;
      }

      setErrors({ consent: result.message || "Registration could not be completed." });
    } catch {
      setErrors({
        consent: "Could not complete registration right now. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const menuOptions = [
    {
      id: "student" as const,
      title: "NEW GAME",
      subtitle: "Student Info — Name, email, year & branch",
      status: isStudentInfoComplete ? "SAVED ✓" : "START HERE",
      statusClass: isStudentInfoComplete
        ? "border-cyan text-cyan bg-cyan/10"
        : "border-magenta text-magenta bg-magenta/10",
      onSelect: () => setScreen("student"),
    },
    {
      id: "learning" as const,
      title: "LOADOUT",
      subtitle: "Learning Profile — Cloud experience & interests",
      status: isLearningComplete ? "CUSTOMIZED ✓" : "OPTIONAL",
      statusClass: isLearningComplete
        ? "border-cyan text-cyan bg-cyan/10"
        : "border-violet/60 text-muted-foreground bg-void/60",
      onSelect: () => setScreen("learning"),
    },
    {
      id: "confirm" as const,
      title: "START JOURNEY.",
      subtitle: "Confirm details, privacy notice & launch quest",
      status: isStudentInfoComplete ? "READY ▶" : "STEP 03",
      statusClass: isStudentInfoComplete
        ? "border-cyan text-void bg-cyan font-bold"
        : "border-violet/40 text-muted-foreground bg-void/40",
      onSelect: () => setScreen("confirm"),
    },
    {
      id: "exit" as const,
      title: "EXIT TO LOBBY",
      subtitle: "Return to the main Cloud Quest website",
      status: "ESC",
      statusClass: "border-cyan/25 text-muted-foreground bg-void/40",
      onSelect: () => {
        window.location.href = "/";
      },
    },
  ];

  // Keyboard navigation on the Arcade Home Screen
  useEffect(() => {
    if (screen !== "title") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1) % menuOptions.length);
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        menuOptions[selectedIdx]?.onSelect();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, selectedIdx]);

  return (
    <div className="relative min-h-screen md:h-screen md:overflow-hidden bg-void text-foreground flex flex-col justify-between overflow-x-hidden">
      {/* Synthwave Arcade Horizon Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 starfield opacity-70" />
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, color-mix(in oklab, var(--violet) 26%, transparent), transparent 70%), radial-gradient(ellipse 55% 40% at 50% 85%, color-mix(in oklab, var(--cyan) 16%, transparent), transparent 65%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[36vh] overflow-hidden opacity-45">
          <div className="neon-floor absolute -inset-x-1/2 top-0 h-[200%]" />
        </div>
        <div className="absolute inset-x-0 bottom-[36vh] h-px bg-magenta/60 shadow-[0_0_16px_var(--magenta)]" />
      </div>

      {/* Top Arcade Bar */}
      <header className="animate-page-fade relative z-20 shrink-0 border-b border-cyan/20 bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <a href="/" className="flex items-center gap-3" aria-label="Back to Cloud Quest home">
            <GlowMark className="size-9 sm:size-10" />
            <span className="font-pixel text-[0.58rem] leading-snug tracking-wide sm:text-[0.65rem]">
              Google Cloud Study Jams
              <span className="mt-0.5 block text-[0.5rem] text-muted-foreground sm:text-[0.55rem]">
                GDG · IARE
              </span>
            </span>
          </a>

          <div className="flex items-center gap-3 sm:gap-4">
            <Hud tone={REGISTRATION_OPEN ? "cyan" : "magenta"}>
              {REGISTRATION_OPEN ? "REGISTRATION OPEN" : "REGISTRATION CLOSED"}
            </Hud>
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 border border-cyan/40 bg-void-2/80 px-3 py-1.5 font-pixel text-[0.55rem] text-cyan transition-colors hover:bg-cyan hover:text-void"
            >
              ◀ LOBBY
            </a>
          </div>
        </div>
      </header>

      {/* Main Centered Arcade Screen */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4">
        <div className="w-full max-w-2xl">
          {/* ============================================================
              SCREEN 0: ARCADE GAME HOME SCREEN (TITLE MENU)
             ============================================================ */}
          {screen === "title" && (
            <div className="text-center">
              {/* Small Pixel-Art Arcade Visual */}
              <div
                className="animate-enter-scale relative mx-auto mb-3 flex h-14 w-36 items-center justify-center overflow-hidden border border-cyan/40 bg-void-2/80 box-glow"
                style={{ animationDelay: "50ms" }}
              >
                <div className="absolute size-11 rounded-full bg-gradient-to-b from-magenta via-violet to-transparent opacity-75 [mask-image:repeating-linear-gradient(0deg,black_0_4px,transparent_4px_6px)]" />
                <PixelCloud className="relative z-10 w-20 text-cyan drop-shadow-[0_0_12px_var(--cyan)] animate-floaty" />
              </div>

              {/* Main Title */}
              <h1
                className="animate-enter-up font-display text-2xl font-black uppercase tracking-tight sm:text-4xl"
                style={{ animationDelay: "110ms" }}
              >
                GOOGLE CLOUD <span className="text-cyan glow-cyan">STUDY JAMS</span>
              </h1>

              {/* Short Line */}
              <p
                className="animate-enter-up mt-1 text-sm sm:text-base text-muted-foreground"
                style={{ animationDelay: "160ms" }}
              >
                Your cloud journey starts here.
              </p>

              {/* Arcade Game Main Menu */}
              <div
                className="animate-enter-scale mt-4 text-left bg-void-2/90 backdrop-blur-md box-glow p-4 sm:p-5"
                style={{ animationDelay: "210ms" }}
              >
                <div className="flex items-center justify-between border-b border-cyan/25 pb-2.5 mb-3">
                  <span className="font-pixel text-[0.55rem] uppercase tracking-wider text-cyan">
                    SELECT OPTION
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    CLICK OR USE ↑↓ + ENTER
                  </span>
                </div>

                <div className="space-y-2" role="menu" aria-label="Arcade registration menu">
                  {menuOptions.map((item, idx) => {
                    const active = selectedIdx === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIdx(idx)}
                        onClick={item.onSelect}
                        className={[
                          "w-full text-left px-3.5 py-2.5 sm:py-3 border transition-all flex items-center justify-between gap-4",
                          active
                            ? "border-cyan bg-cyan/10 shadow-[0_0_22px_-6px_var(--cyan)]"
                            : "border-cyan/20 bg-void/70 hover:border-cyan/50",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={[
                              "font-pixel text-xs w-4 text-center shrink-0",
                              active ? "text-magenta animate-blink" : "text-muted-foreground/30",
                            ].join(" ")}
                          >
                            ▶
                          </span>
                          <div className="min-w-0">
                            <div
                              className={[
                                "font-display text-sm sm:text-base font-bold tracking-wide",
                                active ? "text-cyan" : "text-foreground",
                              ].join(" ")}
                            >
                              {item.title}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 border px-2 py-1 font-pixel text-[0.5rem] tracking-wider ${item.statusClass}`}
                        >
                          {item.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Start Bar */}
                <div className="mt-4 pt-3 border-t border-cyan/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {REGISTRATION_OPEN
                      ? `Registration open until ${EVENT.deadline} · Free for students`
                      : "Registration is currently closed"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setScreen(isStudentInfoComplete ? "confirm" : "student")}
                    className="btn-arcade w-full sm:w-auto justify-center py-3 px-5"
                  >
                    ▶ {isStudentInfoComplete ? "CONTINUE TO LAUNCH" : "PRESS START"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              FOCUSED STEP SCREENS (STUDENT / LEARNING / CONFIRM)
             ============================================================ */}
          {(screen === "student" || screen === "learning" || screen === "confirm") && (
            <div>
              {/* Top Arcade Mode Switcher */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setScreen("title")}
                  className="inline-flex items-center gap-2 border border-cyan/40 bg-void-2/80 px-3 py-1.5 font-pixel text-[0.52rem] text-cyan hover:bg-cyan hover:text-void transition-colors"
                >
                  ⌂ TITLE SCREEN
                </button>

                <div className="flex items-center gap-1.5">
                  {[
                    { id: "student" as const, label: "01 NEW GAME" },
                    { id: "learning" as const, label: "02 LOADOUT" },
                    { id: "confirm" as const, label: "03 LAUNCH" },
                  ].map((tab) => {
                    const active = screen === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setScreen(tab.id)}
                        className={[
                          "border px-2.5 py-1.5 font-pixel text-[0.5rem] transition-colors",
                          active
                            ? "border-cyan bg-cyan text-void"
                            : "border-cyan/25 bg-void-2/60 text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================
                  SCREEN 1: NEW GAME — STUDENT INFORMATION
                 ============================================================ */}
              {screen === "student" && (
                <section className="animate-enter-scale bg-void-2/95 backdrop-blur-md box-glow p-5 sm:p-6">
                  <div className="mb-4 border-b border-cyan/20 pb-3">
                    <div className="font-pixel text-[0.52rem] uppercase tracking-wider text-cyan">
                      MODE 01 · NEW GAME (REQUIRED)
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
                      Student Information
                    </h2>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {/* Full Name */}
                      <div>
                        <label
                          htmlFor="fullName"
                          className="mb-1 block text-xs sm:text-sm font-medium text-foreground"
                        >
                          Full name <span className="text-magenta">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={form.fullName}
                          onChange={(e) => updateField("fullName", e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          className="h-10 w-full border border-cyan/35 bg-void px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-magenta">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Roll Number */}
                      <div>
                        <label
                          htmlFor="rollNumber"
                          className="mb-1 block text-xs sm:text-sm font-medium text-foreground"
                        >
                          Roll number <span className="text-magenta">*</span>
                        </label>
                        <input
                          id="rollNumber"
                          type="text"
                          value={form.rollNumber}
                          onChange={(e) =>
                            updateField("rollNumber", e.target.value.toUpperCase())
                          }
                          placeholder="e.g. 25951A05F3"
                          className="h-10 w-full border border-cyan/35 bg-void px-3 font-mono text-sm uppercase text-foreground placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                        {errors.rollNumber && (
                          <p className="mt-1 text-xs text-magenta">{errors.rollNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {/* Email Address */}
                      <div>
                        <label
                          htmlFor="collegeEmail"
                          className="mb-1 block text-xs sm:text-sm font-medium text-foreground"
                        >
                          Email address <span className="text-magenta">*</span>
                        </label>
                        <input
                          id="collegeEmail"
                          type="email"
                          value={form.collegeEmail}
                          onChange={(e) => updateField("collegeEmail", e.target.value)}
                          placeholder="you@gmail.com"
                          className="h-10 w-full border border-cyan/35 bg-void px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                        {errors.collegeEmail && (
                          <p className="mt-1 text-xs text-magenta">{errors.collegeEmail}</p>
                        )}
                      </div>

                      {/* College Name */}
                      <div>
                        <label
                          htmlFor="collegeName"
                          className="mb-1 block text-xs sm:text-sm font-medium text-foreground"
                        >
                          College name <span className="text-magenta">*</span>
                        </label>
                        <input
                          id="collegeName"
                          type="text"
                          value={form.collegeName}
                          onChange={(e) => updateField("collegeName", e.target.value)}
                          placeholder="Institute of Aeronautical Engineering (IARE)"
                          className="h-10 w-full border border-cyan/35 bg-void px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                        {errors.collegeName && (
                          <p className="mt-1 text-xs text-magenta">{errors.collegeName}</p>
                        )}
                      </div>
                    </div>

                    {/* Year of Study */}
                    <div>
                      <label className="mb-1 block text-xs sm:text-sm font-medium text-foreground">
                        Year of study <span className="text-magenta">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {YEAR_OPTIONS.map((yr) => {
                          const selected = form.yearOfStudy === yr;
                          return (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => updateField("yearOfStudy", yr)}
                              className={[
                                "h-10 border text-sm font-medium transition-colors",
                                selected
                                  ? "border-cyan bg-cyan/20 text-cyan shadow-[0_0_14px_-4px_var(--cyan)]"
                                  : "border-cyan/25 bg-void text-muted-foreground hover:border-cyan/60 hover:text-foreground",
                              ].join(" ")}
                            >
                              {yr}
                            </button>
                          );
                        })}
                      </div>
                      {errors.yearOfStudy && (
                        <p className="mt-1 text-xs text-magenta">{errors.yearOfStudy}</p>
                      )}
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {/* Branch / Department */}
                      <div>
                        <label
                          htmlFor="branch"
                          className="mb-1 block text-xs sm:text-sm font-medium text-foreground"
                        >
                          Branch / department <span className="text-magenta">*</span>
                        </label>
                        <input
                          id="branch"
                          type="text"
                          value={form.branch}
                          onChange={(e) => updateField("branch", e.target.value)}
                          placeholder="e.g. CSE, IT, ECE"
                          className="h-10 w-full border border-cyan/35 bg-void px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {POPULAR_BRANCHES.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => updateField("branch", b)}
                              className={[
                                "border px-2 py-0.5 text-[11px] transition-colors",
                                form.branch === b
                                  ? "border-cyan bg-cyan/20 text-cyan"
                                  : "border-cyan/20 bg-void text-muted-foreground hover:text-foreground",
                              ].join(" ")}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                        {errors.branch && (
                          <p className="mt-1 text-xs text-magenta">{errors.branch}</p>
                        )}
                      </div>

                      {/* Phone Number (Optional) */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <label htmlFor="phone" className="text-xs sm:text-sm font-medium text-foreground">
                            Phone number
                          </label>
                          <span className="text-xs text-muted-foreground">Optional</span>
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="+91 98765 43210"
                          className="h-10 w-full border border-cyan/25 bg-void px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step Footer */}
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-cyan/20 pt-4">
                    <button
                      type="button"
                      onClick={() => setScreen("title")}
                      className="text-sm text-muted-foreground hover:text-cyan transition-colors"
                    >
                      ← Title Screen
                    </button>
                    <button
                      type="button"
                      onClick={handleStudentContinue}
                      className="btn-arcade py-3 px-5"
                    >
                      NEXT: LOADOUT ▶
                    </button>
                  </div>
                </section>
              )}

              {/* ============================================================
                  SCREEN 2: LOADOUT — LEARNING PROFILE (OPTIONAL)
                 ============================================================ */}
              {screen === "learning" && (
                <section className="animate-enter-scale bg-void-2/95 backdrop-blur-md box-glow-violet p-6 sm:p-8">
                  <div className="mb-6 border-b border-violet/30 pb-4">
                    <div className="font-pixel text-[0.55rem] uppercase tracking-wider text-violet">
                      MODE 02 · LOADOUT (OPTIONAL)
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">
                      Learning Profile
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Optional — helps organizers understand participants. No prior cloud experience needed!
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Used Google Cloud before? */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Have you used Google Cloud before?
                      </label>
                      <div className="grid max-w-xs grid-cols-2 gap-3">
                        {[
                          { value: "yes" as const, label: "Yes" },
                          { value: "no" as const, label: "No" },
                        ].map((opt) => {
                          const selected = form.usedGcp === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                updateField("usedGcp", selected ? "" : opt.value)
                              }
                              className={[
                                "h-11 border text-sm font-medium transition-colors",
                                selected
                                  ? "border-cyan bg-cyan/20 text-cyan shadow-[0_0_14px_-4px_var(--cyan)]"
                                  : "border-cyan/25 bg-void text-muted-foreground hover:border-cyan/60 hover:text-foreground",
                              ].join(" ")}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Experience level */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Experience level
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          {
                            value: "beginner" as const,
                            title: "Beginner",
                            desc: "New to cloud computing",
                          },
                          {
                            value: "some" as const,
                            title: "Some experience",
                            desc: "Tried a few labs or tools",
                          },
                          {
                            value: "experienced" as const,
                            title: "Experienced",
                            desc: "Deployed projects on cloud",
                          },
                        ].map((lvl) => {
                          const selected = form.experienceLevel === lvl.value;
                          return (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() =>
                                updateField(
                                  "experienceLevel",
                                  selected ? "" : lvl.value,
                                )
                              }
                              className={[
                                "border p-4 text-left transition-colors",
                                selected
                                  ? "border-cyan bg-cyan/20 text-foreground shadow-[0_0_14px_-4px_var(--cyan)]"
                                  : "border-cyan/25 bg-void text-muted-foreground hover:border-cyan/60 hover:text-foreground",
                              ].join(" ")}
                            >
                              <div className="text-sm font-semibold text-foreground">
                                {lvl.title}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {lvl.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* What interests you */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label
                          htmlFor="cloudInterest"
                          className="text-sm font-medium text-foreground"
                        >
                          What interests you about cloud computing?
                        </label>
                        <span className="text-xs text-muted-foreground">Optional</span>
                      </div>
                      <input
                        id="cloudInterest"
                        type="text"
                        value={form.cloudInterest}
                        onChange={(e) => updateField("cloudInterest", e.target.value)}
                        placeholder="e.g. AI & Gemini, deploying apps, Kubernetes, cloud fundamentals..."
                        className="h-11 w-full border border-cyan/30 bg-void px-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-cyan focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Step Footer */}
                  <div className="mt-8 flex items-center justify-between gap-4 border-t border-violet/30 pt-5">
                    <button
                      type="button"
                      onClick={() => setScreen("student")}
                      className="text-sm text-muted-foreground hover:text-cyan transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("confirm")}
                      className="btn-arcade"
                    >
                      NEXT: LAUNCH ▶
                    </button>
                  </div>
                </section>
              )}

              {/* ============================================================
                  SCREEN 3: CONFIRMATION & SUBMISSION (START JOURNEY)
                 ============================================================ */}
              {screen === "confirm" && (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="animate-enter-scale bg-void-2/95 backdrop-blur-md box-glow p-6 sm:p-8"
                >
                  <div className="mb-6 border-b border-cyan/20 pb-4">
                    <div className="font-pixel text-[0.55rem] uppercase tracking-wider text-magenta">
                      MODE 03 · READY TO LAUNCH
                    </div>
                    <h2 className="mt-1.5 font-display text-2xl font-bold text-foreground sm:text-3xl">
                      Confirmation & Submission
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review your details and lock in your spot for Google Cloud Study Jams.
                    </p>
                  </div>

                  {/* Compact Player Summary */}
                  <div className="mb-5 flex flex-col justify-between gap-3 border border-cyan/30 bg-void p-4 sm:flex-row sm:items-center">
                    {isStudentInfoComplete ? (
                      <div>
                        <div className="text-base font-semibold text-foreground">
                          {form.fullName}{" "}
                          <span className="font-mono text-xs text-cyan">
                            ({form.rollNumber})
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                          {form.collegeEmail} · {form.branch} ({form.yearOfStudy})
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-magenta">
                        Please complete your required Student Information first.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setScreen("student")}
                      className="self-start border border-cyan/40 px-3 py-1.5 font-pixel text-[0.52rem] text-cyan hover:bg-cyan hover:text-void transition-colors sm:self-center"
                    >
                      {isStudentInfoComplete ? "EDIT INFO" : "FILL INFO ▶"}
                    </button>
                  </div>

                  {/* Privacy Notice */}
                  <div className="mb-5 border border-violet/40 bg-void/80 p-4">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan">
                      Privacy Notice
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Your registration data is used strictly by{" "}
                      <span className="text-foreground">GDG on Campus at IARE</span> to
                      manage Google Cloud Study Jams participation, send lab access links,
                      track progress, and issue certificates. Your information is never sold
                      or shared with third parties.
                    </p>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="flex cursor-pointer items-start gap-3.5 border border-cyan/30 bg-void p-4 transition-colors hover:border-cyan">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => updateField("consent", e.target.checked)}
                      className="mt-1 size-4 shrink-0 accent-[var(--cyan)]"
                    />
                    <span className="text-sm leading-snug text-foreground">
                      I agree to receive event-related communications, lab links, and schedule
                      updates from GDG on Campus at IARE.{" "}
                      <span className="text-magenta">*</span>
                    </span>
                  </label>
                  {errors.consent && (
                    <p className="mt-2 text-xs text-magenta">{errors.consent}</p>
                  )}

                  {/* Start Journey Button */}
                  <div className="mt-8 flex flex-col-reverse items-center justify-between gap-4 border-t border-cyan/20 pt-5 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setScreen("learning")}
                      className="text-sm text-muted-foreground hover:text-cyan transition-colors"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={!REGISTRATION_OPEN || submitting}
                      className={[
                        "btn-arcade w-full sm:w-auto justify-center text-sm",
                        !REGISTRATION_OPEN || submitting
                          ? "opacity-50 cursor-not-allowed"
                          : "",
                      ].join(" ")}
                    >
                      ▶ {submitting ? "STARTING JOURNEY..." : "START JOURNEY."}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================
              SCREEN 4: SUCCESS SCREEN
             ============================================================ */}
          {screen === "success" && (
            <section className="animate-enter-scale bg-void-2/95 backdrop-blur-md box-glow p-6 sm:p-10 text-center">
              <Hud tone="cyan">★ REGISTRATION COMPLETE</Hud>

              <h1 className="mt-4 font-display text-3xl font-black uppercase sm:text-4xl">
                QUEST <span className="text-cyan glow-cyan">UNLOCKED!</span>
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm sm:text-base text-muted-foreground">
                You&apos;re registered for{" "}
                <span className="text-foreground font-medium">Google Cloud Study Jams</span>{" "}
                hosted by GDG on Campus at IARE.
              </p>

              {/* Player Pass Card */}
              <div className="mx-auto mt-6 max-w-md border border-cyan/40 bg-void p-5 text-left text-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-cyan/20 pb-2 font-pixel text-[0.55rem] text-cyan">
                  <span>PLAYER PASS</span>
                  <span className="text-magenta">#{playerCode}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Player</span>
                  <span className="font-medium text-foreground text-right">{form.fullName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-mono text-cyan text-right">{form.rollNumber}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground text-right break-all">{form.collegeEmail}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Branch & Year</span>
                  <span className="text-foreground text-right">
                    {form.branch} · {form.yearOfStudy}
                  </span>
                </div>
              </div>

              <p className="mx-auto mt-5 max-w-md text-xs sm:text-sm text-muted-foreground">
                We&apos;ll send your Google Cloud Skills Boost onboarding instructions and
                kickoff schedule to <span className="text-cyan">{form.collegeEmail}</span>.
              </p>

              {/* Noticeable Spam Notice */}
              <div className="mx-auto mt-4 max-w-md border-2 border-magenta bg-void/90 p-3.5 sm:p-4 text-left shadow-[0_0_24px_-4px_var(--magenta)]">
                <div className="flex items-start gap-2.5 font-pixel text-[0.6rem] sm:text-[0.66rem] text-magenta leading-relaxed">
                  <span className="text-base leading-none animate-blink shrink-0">⚠</span>
                  <span className="font-bold tracking-wide">
                    Check Spam folder if you don&apos;t get the mail in inbox
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Your confirmation email with your QR code pass was sent to{" "}
                  <span className="text-cyan font-medium">{form.collegeEmail}</span>.
                  Automated emails can sometimes land in <strong className="text-foreground">Spam</strong> or{" "}
                  <strong className="text-foreground">Promotions</strong>—please check there and click
                  &ldquo;Report not spam&rdquo; so the QR code loads and you don&apos;t miss event updates.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <a href="/" className="btn-arcade">
                  ◀ BACK TO HOME
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setScreen("title");
                  }}
                  className="btn-ghost-neon"
                >
                  TITLE SCREEN
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Minimal Arcade Footer */}
      <footer className="relative z-10 shrink-0 py-2 text-center font-pixel text-[0.48rem] uppercase tracking-widest text-muted-foreground/60">
        GOOGLE CLOUD STUDY JAMS · GDG ON CAMPUS IARE
      </footer>
    </div>
  );
}
