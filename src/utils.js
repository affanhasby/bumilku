// ─── DATE & PREGNANCY CALCULATIONS ───────────────────────────────────────
const calcHPL  = (h) => { if (!h) return null; const d = new Date(h); d.setDate(d.getDate() + 280); return d; };
const calcWeek = (h) => { if (!h) return 0; return Math.max(0, Math.floor((new Date() - new Date(h)) / (1000 * 60 * 60 * 24 * 7))); };
const calcDay  = (h) => { if (!h) return 0; return Math.max(0, Math.floor((new Date() - new Date(h)) / (1000 * 60 * 60 * 24))); };
const daysLeft = (h) => { const p = calcHPL(h); if (!p) return null; return Math.max(0, Math.floor((p - new Date()) / (1000 * 60 * 60 * 24))); };

// ─── DATE FORMATTERS ──────────────────────────────────────────────────────
const fmtDate  = (ds) => { if (!ds) return "-"; return new Date(ds).toLocaleDateString("id-ID", { day: "numeric", month: "long",  year: "numeric" }); };
const fmtShort = (ds) => { if (!ds) return "-"; return new Date(ds).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); };

// ─── BABY SIZE LOOKUP ─────────────────────────────────────────────────────
const getBaby = (w) => {
  const keys = Object.keys(BABY).map(Number).sort((a, b) => b - a);
  for (const k of keys) if (w >= k) return BABY[k];
  return ["🌱", "Embrio", "<1mm"];
};
