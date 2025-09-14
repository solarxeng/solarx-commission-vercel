"use client";

// This page implements the Solar X Commission Calculator using React.
// It reuses the calculator logic and UI from the original code, but imports
// minimal stub components from our own ui library so that the project can
// build without pulling in external UI dependencies. The styling classes
// (mostly from Tailwind or shadcn) remain; however, they will only apply
// styles if you add Tailwind or custom CSS to the project. For a functional
// calculator, these classes can be ignored.

import { useState, useEffect, type CSSProperties, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// ----------------------
// Utilities & Visuals
// ----------------------
function currency(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function CashStack({ style }: { style?: CSSProperties }) {
  return (
    <svg width="64" height="40" viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="1" y="8" width="62" height="24" rx="6" fill="#10b981" />
      <rect x="5" y="12" width="54" height="16" rx="4" fill="#065f46" opacity="0.35" />
      <circle cx="32" cy="20" r="6" fill="#34d399" />
      <rect x="0" y="4" width="64" height="4" fill="#059669" opacity="0.8" />
      <rect x="0" y="32" width="64" height="4" fill="#059669" opacity="0.8" />
    </svg>
  );
}

const CONFETTI_COLORS = [
  "#22c55e",
  "#10b981",
  "#60a5fa",
  "#38bdf8",
  "#fde047",
  "#fca5a5",
  "#f472b6",
  "#a78bfa",
] as const;

type ConfettiPiece = { left: number; delay: number; rotate: number; color: string; id: number };

function ConfettiBurst({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[60]">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-20px",
            width: 8,
            height: 14,
            background: p.color,
            transform: `rotate(${p.rotate}deg)` as any,
            animation: "confettiFall 1100ms ease-in forwards",
            animationDelay: `${p.delay}ms`,
            borderRadius: 2,
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  );
}

// ----------------------
// Modes & Accents
// ----------------------
export type SavedDeal = {
  id: string;
  name: string;
  deals: number;
  ppw: number;
  watts: number;
  total: number;
  createdAt: number;
  saleKind?: "loan" | "tpo";
};

type Mode = "light" | "dark";
type Accent = "none" | "sunset" | "bw";

const ACCENTS: Record<
  Accent,
  {
    titleGradientLight: string;
    titleGradientDark: string;
    spotRGB: string;
    primaryBtn: string;
    primaryBtnHover: string;
  }
> = {
  none: {
    titleGradientLight: "from-slate-900 via-slate-700 to-slate-900",
    titleGradientDark: "from-zinc-100 via-zinc-300 to-white",
    spotRGB: "16,185,129",
    primaryBtn: "",
    primaryBtnHover: "",
  },
  sunset: {
    titleGradientLight: "from-orange-500 via-rose-500 to-pink-600",
    titleGradientDark: "from-orange-300 via-rose-300 to-pink-400",
    spotRGB: "236,72,153",
    primaryBtn: "bg-rose-600 text-white",
    primaryBtnHover: "hover:bg-rose-500",
  },
  bw: {
    titleGradientLight: "from-black via-zinc-700 to-black",
    titleGradientDark: "from-white via-zinc-300 to-white",
    spotRGB: "0,0,0",
    primaryBtn: "bg-black text-white",
    primaryBtnHover: "hover:bg-black/90",
  },
};

// ----------------------
// Payout logic
// ----------------------
export function computePayout(deals: number, ppw: number, watts: number) {
  const kw = watts / 1000;
  let base = 0;
  if (deals >= 7) base = 2500;
  else if (deals >= 4) base = 2200;
  else if (deals >= 1) base = 1800;

  let ppwBonus = 0;
  if (ppw >= 2.8 && ppw <= 2.99) ppwBonus = 25 * kw;
  else if (ppw >= 3.0 && ppw <= 3.2) ppwBonus = 50 * kw;
  else if (ppw > 3.2 && ppw <= 3.5) ppwBonus = 75 * kw;
  else if (ppw > 3.5 && ppw <= 4.5) ppwBonus = 100 * kw;

  let bigSystemBonus = 0;
  if (kw >= 10) {
    const clamped = Math.min(20, kw);
    bigSystemBonus = Math.round(200 + 50 * (clamped - 10));
  }

  const baseR = Math.round(base);
  const ppwR = Math.round(ppwBonus);
  const total = Math.round(baseR + ppwR + bigSystemBonus);
  return { base: baseR, ppwBonus: ppwR, bigSystemBonus, total };
}

export function computePayoutTpo(deals: number, ppw: number, watts: number) {
  const base = computePayout(deals, ppw, watts);
  return { ...base, ppwBonus: 0, bigSystemBonus: 0, total: base.base };
}

export const shouldConfetti = (total: number) => total >= 2500;

// ----------------------
// Component
// ----------------------
export default function SolarXCommissionCalculator() {
  // Simple client-side auth (hardcoded)
  const AUTH = { username: "SolarX4EVER.", password: "20kAmonth!" } as const;

  const [authed, setAuthed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sx_authed") === "1";
  });
  const [u, setU] = useState<string>("");
  const [p, setP] = useState<string>("");
  const [authErr, setAuthErr] = useState<string>("");

  const handleLogin = (e?: FormEvent) => {
    e?.preventDefault?.();
    if (u === AUTH.username && p === AUTH.password) {
      try {
        localStorage.setItem("sx_authed", "1");
      } catch {}
      setAuthed(true);
      setAuthErr("");
    } else {
      setAuthErr("Invalid credentials. Case-sensitive. Try again.");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("sx_authed");
    } catch {}
    setAuthed(false);
    setU("");
    setP("");
  };

  // Mode & accent
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" ? ((localStorage.getItem("sx_mode") as Mode) || "light") : "light"
  );
  const [accent, setAccent] = useState<Accent>(() =>
    typeof window !== "undefined" ? ((localStorage.getItem("sx_accent") as Accent) || "none") : "none"
  );

  // Sale kind
  type SaleKind = "loan" | "tpo";
  const [saleKind, setSaleKind] = useState<SaleKind>(() =>
    typeof window !== "undefined" ? ((localStorage.getItem("sx_saleKind") as SaleKind) || "loan") : "loan"
  );

  // Inputs
  const [deals, setDeals] = useState<number>(0);
  const [ppw, setPpw] = useState<number>(0);
  const [watts, setWatts] = useState<number>(0);
  const [ppwInput, setPpwInput] = useState<string>("0");
  const [wattsInput, setWattsInput] = useState<string>("0");

  // Results & UI state
  const [result, setResult] = useState<null | { base: number; ppwBonus: number; bigSystemBonus: number; total: number }>(null);
  const [spotlight, setSpotlight] = useState<boolean>(false);
  const [cashStacks, setCashStacks] = useState<number[]>([]);
  const [myDeals, setMyDeals] = useState<number>(0);
  const [myEarnings, setMyEarnings] = useState<number>(0);
  const [bursts, setBursts] = useState<ConfettiPiece[][]>([]);
  const [saved, setSaved] = useState<SavedDeal[]>([]);
  const [savedQuery, setSavedQuery] = useState<string>("");

  const QUOTES = [
    "Momentum wins. Execution > hesitation.",
    "One-call close: go for the decision today.",
    "Price is a story. Value is the plot.",
    "Clarity + urgency = signatures.",
    "Every objection is a request for confidence.",
    "Anchor on lifetime savings, not today's bill.",
  ];
  const [quoteIdx, setQuoteIdx] = useState<number>(0);

  useEffect(() => {
    const id = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 15000);
    return () => clearInterval(id);
  }, []);

  // Persist mode / accent / sale kind
  useEffect(() => {
    try {
      localStorage.setItem("sx_mode", mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem("sx_accent", accent);
    } catch {}
  }, [accent]);

  useEffect(() => {
    try {
      localStorage.setItem("sx_saleKind", saleKind);
    } catch {}
  }, [saleKind]);

  // Load saved tracker & deals once
  useEffect(() => {
    try {
      const d = Number(localStorage.getItem("sx_myDeals") || 0);
      const e = Number(localStorage.getItem("sx_myEarn") || 0);
      setMyDeals(isNaN(d) ? 0 : d);
      setMyEarnings(isNaN(e) ? 0 : e);
      const raw = localStorage.getItem("sx_savedDeals");
      if (raw) setSaved(JSON.parse(raw) as SavedDeal[]);
    } catch {}
  }, []);

  const compute = () => (saleKind === "tpo" ? computePayoutTpo(deals, ppw, watts) : computePayout(deals, ppw, watts));

  useEffect(() => {
    setResult(compute());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, ppw, watts, saleKind]);

  const persistSaved = (next: SavedDeal[]) => {
    setSaved(next);
    try {
      localStorage.setItem("sx_savedDeals", JSON.stringify(next));
    } catch {}
  };

  const commitPpw = () => {
    const v = parseFloat(ppwInput);
    const safe = isNaN(v) ? 0 : Math.max(2.4, Math.min(5, v));
    const fixed = Number(safe.toFixed(2));
    setPpw(fixed);
    setPpwInput(fixed.toString());
  };

  const commitWatts = () => {
    const v = parseInt(wattsInput.replace(/[^0-9]/g, ""), 10);
    const safe = isNaN(v) ? 0 : Math.max(4001, Math.min(30000, v));
    setWatts(safe);
    setWattsInput(String(safe));
  };

  const MAX_STACKS = 40;
  const dropCash = () => setCashStacks((prev) => (prev.length < MAX_STACKS ? [...prev, Date.now()] : prev));

  const triggerConfettiIfNeeded = (newTotal: number) => {
    if (!shouldConfetti(newTotal)) return;
    const pieces: ConfettiPiece[] = Array.from({ length: 64 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.round(Math.random() * 250),
      rotate: Math.random() * 360,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));
    setBursts((b) => [...b, pieces]);
    setTimeout(() => setBursts((b) => b.slice(1)), 1400);
    setSpotlight(true);
    setTimeout(() => setSpotlight(false), 1400);
  };

  const clearCash = () => setCashStacks([]);

  // Style helpers based on mode
  const isLight = mode === "light";
  const textBase = isLight ? "text-zinc-900" : "text-zinc-100";
  const mutedText = isLight ? "text-zinc-600" : "text-zinc-300";
  const pageBg = isLight ? "bg-white" : "bg-zinc-950";
  const cardBg = isLight ? "bg-white border-zinc-200" : "bg-zinc-950/70 border-zinc-800";
  const panelBg = isLight ? "bg-zinc-50/80 border-zinc-200" : "bg-zinc-900/60 border-zinc-800";
  const inputBg = isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-zinc-900 border-zinc-800 text-zinc-100";
  const inputPh = isLight ? "placeholder:text-zinc-500" : "placeholder:text-white/60";

  // Title glow from accent
  const titleGlow: CSSProperties = { textShadow: `0 0 18px rgba(${ACCENTS[accent].spotRGB}, ${isLight ? 0.18 : 0.35})` };
  const titleGradient = isLight ? ACCENTS[accent].titleGradientLight : ACCENTS[accent].titleGradientDark;

  const primaryBtn = (extra = "") => {
    if (accent === "none") {
      return `${isLight ? "bg-zinc-900 text-white hover:bg-black" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"} ${extra}`;
    }
    return `${ACCENTS[accent].primaryBtn} ${ACCENTS[accent].primaryBtnHover} ${extra}`;
  };

  const subtleBtn = (extra = "") =>
    `${isLight ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"} ${extra}`;

  const coachTip = (() => {
    if (saleKind === "tpo") return "TPO/PPA selected: Only base payout varies with monthly deals. PPW & system bonuses are not applied.";
    const kw = watts / 1000;
    const nextPpwTier = ppw < 3.0 ? 3.0 : ppw <= 3.2 ? 3.21 : ppw <= 3.5 ? 3.51 : ppw < 4.5 ? 4.51 : null;
    const nextPpwDelta = nextPpwTier ? nextPpwTier - ppw : null;
    let nextKw: number | null = null;
    if (kw < 10) nextKw = 10;
    else if (kw < 20) nextKw = Math.floor(kw) === kw ? kw + 1 : Math.ceil(kw);
    else nextKw = null;
    const nextKwDelta = nextKw ? nextKw - kw : null;
    if (nextPpwDelta && nextPpwDelta > 0 && nextPpwDelta <= 0.1) {
      const perKw = nextPpwTier && nextPpwTier >= 3.5 ? 100 : nextPpwTier && nextPpwTier > 3.2 ? 75 : nextPpwTier && nextPpwTier >= 3.0 ? 50 : 25;
      return `Bump PPW by ${nextPpwDelta.toFixed(2)} to reach tier ${nextPpwTier.toFixed(2)} and unlock ~$${perKw}/kW.`;
    }
    if (nextKwDelta && nextKwDelta > 0 && nextKwDelta <= 1.0) {
      const msg = nextKw === 10 ? "start the $200 system bonus" : "add another $50 system bonus";
      return `Add ~${Math.ceil(nextKwDelta * 1000)} watts to hit ${nextKw} kW and ${msg}.`;
    }
    if (result && result.total < 2500) return "Push to $2.5k: raise PPW slightly or add panels to reach the next bonus tier.";
    return "Nice! Lock it in. If homeowner is value-focused, anchor on lifetime savings vs. payment.";
  })();

  const saveCurrent = () => {
    const next = compute();
    const name = prompt("Name this deal (e.g., Smith 8.4kW @ 3.05)?") || `Deal ${saved.length + 1}`;
    const item: SavedDeal = {
      id: `${Date.now()}`,
      name,
      deals,
      ppw,
      watts,
      total: next.total,
      createdAt: Date.now(),
      saleKind,
    };
    persistSaved([item, ...saved].slice(0, 12));
  };

  const loadDeal = (id: string) => {
    const item = saved.find((s) => s.id === id);
    if (!item) return;
    setDeals(item.deals);
    setPpw(item.ppw);
    setPpwInput(item.ppw.toFixed(2));
    setWatts(item.watts);
    setWattsInput(String(item.watts));
    if (item.saleKind === "loan" || item.saleKind === "tpo") setSaleKind(item.saleKind);
    setResult(compute());
  };

  const deleteDeal = (id: string) => persistSaved(saved.filter((s) => s.id !== id));

  const renameDeal = (id: string) => {
    const name = prompt("New name for this deal?");
    if (!name) return;
    persistSaved(saved.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  // Active segmented toggle styles (fixes visibility of which one is selected)
  const Segmented = ({ value, onChange }: { value: "loan" | "tpo"; onChange: (v: "loan" | "tpo") => void }) => (
    <div className={`inline-flex rounded-xl p-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} role="tablist" aria-label="Sale type">
      {(["loan", "tpo"] as const).map((k) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`px-3 py-1 rounded-lg text-sm transition ${value === k ? primaryBtn() : subtleBtn()}`}
        >
          {k === "loan" ? "Loan/Cash" : "TPO/PPA"}
        </button>
      ))}
    </div>
  );

  const Box = ({ label, value, color, highlight }: { label: string; value: number | string; color: string; highlight?: boolean }) => {
    const glowRGB = ACCENTS[accent].spotRGB;
    const glowStyle: CSSProperties | undefined = highlight
      ? {
          boxShadow: `0 0 0 2px rgba(${glowRGB}, ${isLight ? 0.35 : 0.75}), 0 0 40px 8px rgba(${glowRGB}, ${isLight ? 0.18 : 0.35})`,
          position: "relative",
        }
      : undefined;
    return (
      <div className={`rounded-xl border ${panelBg} p-4 flex flex-col justify-between min-h-[100px]`} style={glowStyle}>
        <p className={`${mutedText} text-sm truncate`} title={String(value)}>
          {label}
        </p>
        <p className={`text-3xl font-extrabold ${color}`}>${currency(Number(value))}</p>
      </div>
    );
  };

  const RecomputeButton = () => (
    <Button
      onClick={() => {
        const next = compute();
        setResult(next);
        dropCash();
        triggerConfettiIfNeeded(next.total);
        if (next?.total) {
          const newDeals = myDeals + 1;
          const newEarn = myEarnings + next.total;
          setMyDeals(newDeals);
          setMyEarnings(newEarn);
          try {
            localStorage.setItem("sx_myDeals", String(newDeals));
            localStorage.setItem("sx_myEarn", String(newEarn));
          } catch {}
        }
      }}
      className={primaryBtn()}
    >
      Rain Cash (or Confetti)
    </Button>
  );

  const filteredSaved = saved.filter((s) => {
    const q = savedQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = `${s.name} ${s.ppw.toFixed(2)} ${s.watts} ${s.total} ${s.saleKind ?? ""}`.toLowerCase();
    return q.split(/\s+/).every((tok) => hay.includes(tok));
  });

  // ----------------------
  // AUTH GATE UI
  // ----------------------
  if (!authed) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${isLight ? "bg-white" : "bg-zinc-950"} p-6`}>
        <Card className={`w-full max-w-sm rounded-2xl border ${cardBg}`}>
          <CardHeader>
            <CardTitle className={`text-xl ${textBase} flex items-center gap-2`}>
              <span className="inline-block">🔒</span> Secure Access
            </CardTitle>
            <p className={`text-xs ${mutedText}`}>Enter your credentials to open the calculator.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label className={textBase}>Username</Label>
                <Input value={u} onChange={(e) => setU(e.target.value)} placeholder="Username" className={`${inputBg} ${inputPh}`} autoFocus />
              </div>
              <div className="space-y-2">
                <Label className={textBase}>Password</Label>
                <Input value={p} onChange={(e) => setP(e.target.value)} type="password" placeholder="Password" className={`${inputBg} ${inputPh}`} />
              </div>
              {authErr && <div className="text-sm text-red-600">{authErr}</div>}
              <div className="flex items-center gap-2">
                <Button type="submit" className={primaryBtn("w-full")}>Sign in</Button>
              </div>
              <div className={`text-xs ${mutedText}`}>Case-sensitive • Username and password must match exactly.</div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ----------------------
  // MAIN APP UI (rendered only when authed)
  // ----------------------
  return (
    <div className={`min-h-screen w-full ${pageBg} ${textBase} p-6`}>
      <style>{`
        @keyframes fall { from { transform: translateY(-160px) rotate(-6deg); opacity: 0; } to { transform: translateY(0) rotate(0deg); opacity: 1; } }
        @keyframes confettiFall { from { transform: translateY(-40px) rotate(0deg); opacity: .9; } to { transform: translateY(110vh) rotate(600deg); opacity: 0; } }
      `}</style>

      {bursts.map((pieces, idx) => (
        <ConfettiBurst key={idx} pieces={pieces} />
      ))}

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CALCULATOR */}
        <Card className={`rounded-2xl border ${cardBg} shadow-[0_0_60px_-20px_rgba(100,150,255,0.15)] lg:col-span-2 relative overflow-hidden`}>
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle>
                <div
                  className={`text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}
                  style={titleGlow}
                >
                  {"Solar X \u2022 Commission Calculator"}
                </div>
              </CardTitle>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Mode toggle */}
                <div className={`inline-flex rounded-xl p-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} role="tablist" aria-label="Color mode">
                  <button aria-selected={isLight} onClick={() => setMode("light")} className={`px-3 py-1 rounded-lg text-sm ${isLight ? primaryBtn() : subtleBtn()}`}>
                    Light
                  </button>
                  <button aria-selected={!isLight} onClick={() => setMode("dark")} className={`px-3 py-1 rounded-lg text-sm ${!isLight ? primaryBtn() : subtleBtn()}`}>
                    Dark
                  </button>
                </div>

                {/* Accent toggle */}
                <div className={`inline-flex rounded-xl p-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} role="tablist" aria-label="Accent">
                  {(["none", "sunset", "bw"] as Accent[]).map((a) => (
                    <button key={a} aria-selected={accent === a} onClick={() => setAccent(a)} className={`px-3 py-1 rounded-lg text-sm ${accent === a ? primaryBtn() : subtleBtn()}`}>
                      {a === "none" ? "Neutral" : a === "bw" ? "B&W" : "Sunset"}
                    </button>
                  ))}
                </div>

                {/* Sale type toggle */}
                <Segmented value={saleKind} onChange={setSaleKind} />

                {/* Logout */}
                <Button className={subtleBtn()} onClick={handleLogout} title="Sign out">
                  Logout
                </Button>
              </div>
            </div>

            <p className={`${mutedText} text-sm`}>
              Type values or use the sliders. System size is in <span className="font-semibold">watts</span> (e.g., 8000 for 8kW).
            </p>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8 relative">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Deals */}
              <div className="space-y-3">
                <Label className={textBase}>Deals Closed (this month)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={deals}
                    onChange={(e) => setDeals(Math.max(0, Math.min(50, Number(e.target.value))))}
                    className={`${inputBg}`}
                  />
                  <Button className={subtleBtn()} onClick={() => setDeals(0)}>
                    Clear
                  </Button>
                </div>
                <Slider value={[deals]} onValueChange={(v) => setDeals(v[0])} min={0} max={30} step={1} />
              </div>

              {/* PPW */}
              <div className="space-y-3">
                <Label className={textBase}>Price Per Watt (PPW)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ppwInput}
                    onChange={(e) => setPpwInput(e.target.value)}
                    onBlur={commitPpw}
                    disabled={saleKind === "tpo"}
                    className={`${inputBg} ${inputPh} ${saleKind === "tpo" ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <Button
                    className={subtleBtn()}
                    onClick={() => {
                      setPpw(2.4);
                      setPpwInput("2.40");
                    }}
                    disabled={saleKind === "tpo"}
                  >
                    Clear
                  </Button>
                </div>
                <Slider
                  value={[ppw]}
                  onValueChange={(v) => {
                    const val = Number(v[0].toFixed(2));
                    setPpw(val);
                    setPpwInput(val.toFixed(2));
                  }}
                  min={2.4}
                  max={4.5}
                  step={0.01}
                  disabled={saleKind === "tpo"}
                />
              </div>

              {/* Watts */}
              <div className="space-y-3">
                <Label className={textBase}>System Size (Watts)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={wattsInput}
                    onChange={(e) => setWattsInput(e.target.value)}
                    onBlur={commitWatts}
                    disabled={saleKind === "tpo"}
                    className={`${inputBg} ${inputPh} ${saleKind === "tpo" ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  <Button
                    className={subtleBtn()}
                    onClick={() => {
                      setWatts(0);
                      setWattsInput("0");
                    }}
                    disabled={saleKind === "tpo"}
                  >
                    Clear
                  </Button>
                </div>
                <Slider
                  value={[watts]}
                  onValueChange={(v) => {
                    const val = Math.round(v[0]);
                    setWatts(val);
                    setWattsInput(String(val));
                  }}
                  min={4000}
                  max={30000}
                  step={100}
                  disabled={saleKind === "tpo"}
                />
              </div>
            </section>

            {result && (
              <section className="relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Box label="Base Payout" value={result.base} color={isLight ? "text-emerald-700" : "text-amber-300"} />
                  <Box label="PPW Bonus" value={result.ppwBonus} color={isLight ? "text-orange-700" : "text-orange-300"} />
                  <Box label="System Bonus" value={result.bigSystemBonus} color={isLight ? "text-rose-700" : "text-red-300"} />
                  <Box label="Total Payout" value={result.total} color={isLight ? "text-sky-700" : "text-cyan-300"} highlight={spotlight} />
                </div>

                {/* Falling cash overlay */}
                <div className="pointer-events-none absolute -right-2 top-0 bottom-0 w-24 md:w-32 flex items-end justify-center gap-1 pr-2">
                  {cashStacks.map((id, idx) => (
                    <div key={id} style={{ animation: `fall 700ms ease-in`, animationDelay: `${idx * 30}ms` }}>
                      <CashStack />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <RecomputeButton />
                  <Button className={subtleBtn()} onClick={() => { clearCash(); setBursts([]); }}>
                    Clear Cash
                  </Button>
                </div>
              </section>
            )}

            {/* Micro-Coach */}
            <div className={`rounded-xl border ${panelBg} p-4`}>
              <div className={`${mutedText} text-xs mb-1`}>{"Micro\u2011Coach"}</div>
              <div className={`${textBase} text-sm`}>{coachTip}</div>
            </div>
          </CardContent>
        </Card>

        {/* SIDEBAR */}
        <Card className={`rounded-2xl border ${cardBg}`}>
          <CardHeader>
            <CardTitle className={`text-xl ${textBase}`}>Your Month</CardTitle>
            <p className={`text-xs ${mutedText}`}>Quick snapshot of your grind</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal tracker */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border ${panelBg} p-3`}>
                  <div className={`text-xs ${textBase}`}>Recomputes</div>
                  <div className={`text-3xl font-bold ${isLight ? "text-sky-700" : "text-cyan-300"}`}>{myDeals}</div>
                </div>
                <div className={`rounded-xl border ${panelBg} p-3`}>
                  <div className={`text-xs ${textBase}`}>Estimated Earnings</div>
                  <div className={`text-3xl font-bold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>${currency(myEarnings)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  className={subtleBtn()}
                  onClick={() => {
                    setMyDeals(0);
                    setMyEarnings(0);
                    try {
                      localStorage.removeItem("sx_myDeals");
                      localStorage.removeItem("sx_myEarn");
                    } catch {}
                  }}
                >
                  Reset
                </Button>
                <Button className={subtleBtn()} onClick={saveCurrent}>
                  Save Current
                </Button>
              </div>
            </div>

            <div className={`h-px ${isLight ? "bg-zinc-200" : "bg-white/20"}`} />

            {/* Saved Deals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-lg font-semibold ${textBase}`}>Saved Deals</div>
                <div className={`text-xs ${mutedText}`}>{saved.length} total</div>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Input value={savedQuery} onChange={(e) => setSavedQuery(e.target.value)} placeholder="Search name, PPW, watts, total" className={`${inputBg} ${inputPh}`} />
                <Button className={subtleBtn("shrink-0")} onClick={() => setSavedQuery("")}>Clear</Button>
              </div>
              <div className="space-y-2">
                {saved.length === 0 && <div className={`text-sm ${mutedText}`}>No saved deals yet.</div>}
                {saved.length > 0 && filteredSaved.length === 0 && <div className={`text-sm ${mutedText}`}>No matches. Try a different search.</div>}
                {filteredSaved.map((s) => (
                  <div key={s.id} className={`rounded-lg border ${panelBg} p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className={`font-medium text-sm ${textBase}`}>{s.name}</div>
                        <div className={`text-xs ${mutedText}`}>
                          {new Date(s.createdAt).toLocaleString()} • {s.watts} W • PPW {s.ppw.toFixed(2)} • ${currency(s.total)} • {s.saleKind?.toUpperCase() || "LOAN"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className={subtleBtn()} onClick={() => loadDeal(s.id)}>
                          Load
                        </Button>
                        <Button size="sm" className={subtleBtn()} onClick={() => renameDeal(s.id)}>
                          Rename
                        </Button>
                        <Button size="sm" className={subtleBtn()} onClick={() => deleteDeal(s.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`h-px ${isLight ? "bg-zinc-200" : "bg-white/20"}`} />

            {/* Rotating Motivation */}
            <div className={`rounded-xl border ${panelBg} p-4`}>
              <div className={`text-xs ${mutedText} mb-1`}>{"Motivation \u2022 rotates every 15s"}</div>
              <div className={`text-sm italic ${textBase}`}>{QUOTES[quoteIdx]}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ----------------------
// Runtime tests (dev only)
// ----------------------
declare global {
  interface Window {
    __SX_TESTS_RAN__?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__SX_TESTS_RAN__) {
  window.__SX_TESTS_RAN__ = true;
  (function runTests() {
    const approxEq = (a: number, b: number) => Math.abs(a - b) < 1e-6;
    const t1 = computePayout(1, 3.0, 8000);
    console.assert(t1.base === 1800 && t1.ppwBonus === 400 && t1.bigSystemBonus === 0 && t1.total === 2200, "Test 1 failed", t1);
    const t2 = computePayout(7, 3.6, 14000);
    console.assert(t2.base === 2500 && t2.ppwBonus === 1400 && t2.bigSystemBonus === 400 && t2.total === 4300, "Test 2 failed", t2);
    const t3 = computePayout(0, 2.85, 12000);
    console.assert(t3.base === 0 && approxEq(t3.ppwBonus, 300) && t3.bigSystemBonus === 300 && t3.total === 600, "Test 3 failed", t3);
    console.assert(shouldConfetti(2499) === false, "Confetti rule failed for 2499");
    console.assert(shouldConfetti(2500) === true, "Confetti rule failed for 2500");
    console.assert(shouldConfetti(4500) === true, "Confetti rule failed for 4500");
    const t7 = computePayout(0, 3.0, 13500);
    console.assert(t7.base === 0 && t7.ppwBonus === 675 && t7.bigSystemBonus === 375 && t7.total === 1050, "Test 7 failed", t7);
    const t8 = computePayout(1, 2.8, 20000);
    console.assert(t8.base === 1800 && t8.ppwBonus === 500 && t8.bigSystemBonus === 700 && t8.total === 3000, "Test 8 failed", t8);
    const t9 = computePayout(4, 3.2, 0);
    console.assert(t9.base === 2200 && t9.ppwBonus === 0 && t9.bigSystemBonus === 0 && t9.total === 2200, "Test 9 failed", t9);
    const t10 = computePayout(7, 3.5, 30000);
    console.assert(t10.base === 2500 && t10.ppwBonus === 2250 && t10.bigSystemBonus === 800 && t10.total === 5550, "Test 10 failed", t10);
    const t11 = computePayout(0, 3.6, 17500);
    console.assert(t11.bigSystemBonus === 600, "Test 11 failed", t11);
    const t12 = computePayout(1, 3.21, 15000);
    console.assert(t12.base === 1800 && t12.ppwBonus === 1125 && t12.bigSystemBonus === 450 && t12.total === 3375, "Test 12 failed", t12);
    const t13 = computePayout(0, 3.0, 9900);
    console.assert(t13.bigSystemBonus === 0, "Test 13 failed", t13);
    const t14 = computePayout(0, 3.0, 21000);
    console.assert(t14.bigSystemBonus === 700, "Test 14 failed", t14);
    const t15 = computePayoutTpo(7, 3.6, 20000);
    console.assert(t15.base === 2500 && t15.ppwBonus === 0 && t15.bigSystemBonus === 0 && t15.total === 2500, "Test 15 (TPO) failed", t15);
    const t16 = computePayoutTpo(0, 3.6, 20000);
    console.assert(t16.base === 0 && t16.ppwBonus === 0 && t16.bigSystemBonus === 0 && t16.total === 0, "Test 16 (TPO) failed", t16);
  })();
}
