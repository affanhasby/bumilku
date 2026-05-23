// ─── DESTRUCTURE REACT HOOKS (shared globally for all subsequent scripts) ─
const { useState, useRef, useEffect } = React;

// ─── LOCAL STORAGE HOOK ───────────────────────────────────────────────────
function useLS(key, init) {
  const [v, sV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });

  const set = (x) => {
    const n = x instanceof Function ? x(v) : x;
    sV(n);
    try { localStorage.setItem(key, JSON.stringify(n)); } catch {}
  };

  return [v, set];
}
