// ─── GEMINI API KEY SETUP ─────────────────────────────────────────────────
function ApiKeySetup() {
  const [apiKey, setApiKey] = useLS("gm_key", "AIzaSyCmc8sE_ME8AyYNKgJovSTVmD6aCm79n9I");
  const [gmModel, setGmModel] = useLS("gm_model", "gemini-2.5-flash");
  const [draft, setDraft] = useState(apiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isSet = !!apiKey;

  return (
    <div className="card" style={{ borderColor: isSet ? "rgba(123,166,138,.4)" : "var(--bd)", background: isSet ? "rgba(123,166,138,.06)" : "var(--wh)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 26 }}>{isSet ? "✅" : "🔑"}</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: isSet ? "var(--sg2)" : "var(--tx)" }}>
            Setup AI — Google Gemini {isSet ? "(Aktif)" : "(Belum diset)"}
          </p>
          <p style={{ fontSize: 12, color: "var(--mu)", marginTop: 2, lineHeight: 1.5 }}>
            Butuh API key untuk auto-analisis dokumen medis. Gratis dari Google AI Studio.
          </p>
        </div>
      </div>

      {!isSet && (
        <div className="aam" style={{ marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}>
          <p style={{ fontWeight: 800, marginBottom: 4 }}>Cara dapat API key (1 menit):</p>
          <p>1. Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style={{ color: "var(--ro2)", fontWeight: 700 }}>aistudio.google.com/app/apikey</a></p>
          <p>2. Login Google → klik <strong>"Create API Key"</strong></p>
          <p>3. Copy key-nya, paste di kotak bawah ini</p>
        </div>
      )}

      <div className="ig">
        <label className="lbl">API Key Gemini</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type={show ? "text" : "password"} className="inp"
            placeholder="AIzaSy..." value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}
          />
          <button
            onClick={() => setShow(!show)}
            style={{ background: "var(--psm)", border: "1px solid var(--bd)", borderRadius: 12, padding: "0 12px", cursor: "pointer", fontSize: 14 }}
          >
            {show ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <div className="ig">
        <label className="lbl">Model</label>
        <select className="inp" value={gmModel} onChange={e => setGmModel(e.target.value)}>
          <option value="gemini-2.5-flash">gemini-2.5-flash — Akurat & cepat ✅ (rekomendasi)</option>
          <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite — Paling cepat</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro — Paling pintar, quota kecil</option>
          <option value="gemini-2.0-flash">gemini-2.0-flash — Versi lama, masih jalan</option>
        </select>
      </div>

      <button
        onClick={save} className="btn br"
        style={{ background: saved ? "linear-gradient(135deg,var(--sg2),var(--sg))" : undefined }}
      >
        {saved ? "✓ API Key Tersimpan!" : "💾 Simpan API Key"}
      </button>

      <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 10, lineHeight: 1.5 }}>
        🔒 Key disimpan di browser kamu saja (localStorage), tidak dikirim ke server lain.
      </p>
    </div>
  );
}
