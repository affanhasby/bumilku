// ─── OVERLAY COMPONENT ────────────────────────────────────────────────────
// Backdrop sheet yang mengunci scroll body & mencegah touch bleed ke belakang
function Overlay({ onClose, children }) {
  const ref = useRef();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const el = ref.current;
    const block = (e) => { if (e.target === el) e.preventDefault(); };
    el?.addEventListener("touchmove", block, { passive: false });

    return () => {
      document.body.style.overflow = prev;
      el?.removeEventListener("touchmove", block);
    };
  }, []);

  return (
    <div ref={ref} className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      {children}
    </div>
  );
}
