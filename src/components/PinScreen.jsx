// ─── PIN SCREEN ────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }) {
  const [mode,    setMode]    = useState("checking"); // checking | setup | confirm | enter
  const [pin,     setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    db.rpc("has_pin")
      .then(({ data }) => setMode(data ? "enter" : "setup"))
      .catch(() => setMode("setup"));
  }, []);

  const currentInput = mode === "confirm" ? confirm : pin;
  const setCurrentInput = mode === "confirm"
    ? (fn) => setConfirm(typeof fn === "function" ? fn(confirm) : fn)
    : (fn) => setPin(typeof fn === "function" ? fn(pin) : fn);

  const handleDigit = (d) => {
    setError("");
    setCurrentInput(p => p + d);
  };

  const handleBack = () => {
    setCurrentInput(p => p.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (busy) return;
    if (mode === "setup") {
      if (pin.length < 6) { setError("PIN minimal 6 digit"); return; }
      setMode("confirm");
      setError("");
    } else if (mode === "confirm") {
      if (confirm !== pin) {
        setError("PIN tidak cocok, coba lagi");
        setConfirm("");
        return;
      }
      setBusy(true);
      try {
        const { error } = await db.rpc("setup_pin", { new_pin: pin });
        if (error) throw error;
        onUnlock();
      } catch (e) {
        setError("Gagal menyimpan PIN. Coba lagi.");
      }
      setBusy(false);
    } else if (mode === "enter") {
      setBusy(true);
      try {
        const { data: ok, error } = await db.rpc("verify_pin", { input_pin: pin });
        if (error) throw error;
        if (ok) {
          onUnlock();
        } else {
          setError("PIN salah, coba lagi");
          setPin("");
        }
      } catch (e) {
        setError("Gagal memverifikasi PIN. Coba lagi.");
      }
      setBusy(false);
    }
  };

  if (mode === "checking") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 40, height: 40, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
      </div>
    );
  }

  const dots = Math.max(6, currentInput.length);

  return (
    <div className="pin-wrap">
      <div className="pin-top" />
      <div style={{ fontSize: 52, marginBottom: 14 }}>🔐</div>
      <h1 style={{ fontFamily: "Lora,serif", fontSize: 24, fontWeight: 700, color: "var(--dp)", marginBottom: 6, textAlign: "center" }}>BumilKu</h1>
      <p style={{ fontSize: 14, color: "var(--mu)", marginBottom: 28, textAlign: "center", lineHeight: 1.5 }}>
        {mode === "setup"   ? "Buat PIN keamanan\n(minimal 6 digit, tidak ada batas maksimum)" :
         mode === "confirm" ? "Konfirmasi PIN Anda" :
         "Masukkan PIN untuk membuka"}
      </p>

      {/* PIN Dots */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center", flexWrap: "wrap", maxWidth: 280 }}>
        {Array.from({ length: dots }).map((_, i) => (
          <div key={i} style={{
            width: 13, height: 13, borderRadius: "50%",
            background: i < currentInput.length ? "var(--ro)" : "transparent",
            border: `2px solid ${i < currentInput.length ? "var(--ro)" : "var(--bd)"}`,
            transition: "all .15s",
          }} />
        ))}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 700, marginBottom: 14, textAlign: "center" }}>{error}</p>
      )}

      {/* Numpad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 76px)", gap: 12, marginBottom: 20 }}>
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} onClick={() => handleDigit(String(d))}
            style={{ height: 76, borderRadius: 18, border: "1.5px solid var(--bd)", background: "var(--wh)", fontSize: 24, fontWeight: 700, color: "var(--dp)", cursor: "pointer", fontFamily: "Lora,serif", boxShadow: "0 2px 8px var(--sh)", WebkitTapHighlightColor: "transparent" }}>
            {d}
          </button>
        ))}
        <div />
        <button onClick={() => handleDigit("0")}
          style={{ height: 76, borderRadius: 18, border: "1.5px solid var(--bd)", background: "var(--wh)", fontSize: 24, fontWeight: 700, color: "var(--dp)", cursor: "pointer", fontFamily: "Lora,serif", boxShadow: "0 2px 8px var(--sh)", WebkitTapHighlightColor: "transparent" }}>
          0
        </button>
        <button onClick={handleBack}
          style={{ height: 76, borderRadius: 18, border: "1.5px solid var(--bd)", background: "var(--wh)", fontSize: 20, fontWeight: 700, color: "var(--mu)", cursor: "pointer", boxShadow: "0 2px 8px var(--sh)", WebkitTapHighlightColor: "transparent" }}>
          ⌫
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={currentInput.length < 6 || busy}
        className="btn br"
        style={{ width: 240, opacity: currentInput.length >= 6 && !busy ? 1 : .4 }}
      >
        {busy ? "⏳ Memproses..." :
         mode === "setup"   ? "Lanjut →" :
         mode === "confirm" ? "Buat PIN 🔐" :
         "Buka 🔓"}
      </button>

      {mode === "enter" && (
        <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 20, textAlign: "center" }}>
          Lupa PIN? Hubungi admin untuk reset.
        </p>
      )}
    </div>
  );
}
