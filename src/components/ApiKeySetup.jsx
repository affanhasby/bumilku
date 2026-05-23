// ─── GEMINI MODEL SETUP ───────────────────────────────────────────────────
function ApiKeySetup() {
  const [gmModel, setGmModel] = useLS("gm_model", "gemini-2.5-flash");

  return (
    <div className="card">
      <p style={{ fontWeight: 800, fontSize: 14, color: "var(--tx)", marginBottom: 4 }}>Model AI — Google Gemini</p>
      <p style={{ fontSize: 12, color: "var(--mu)", marginBottom: 14, lineHeight: 1.5 }}>Model yang digunakan untuk analisis dokumen medis.</p>
      <select className="inp" value={gmModel} onChange={e => setGmModel(e.target.value)}>
        <option value="gemini-2.5-flash">gemini-2.5-flash — Akurat & cepat ✅ (rekomendasi)</option>
        <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite — Paling cepat</option>
        <option value="gemini-2.5-pro">gemini-2.5-pro — Paling pintar, quota kecil</option>
        <option value="gemini-2.0-flash">gemini-2.0-flash — Versi lama, masih jalan</option>
      </select>
    </div>
  );
}
