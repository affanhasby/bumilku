// ─── TEKANAN DARAH INPUT ──────────────────────────────────────────────────
function TekananDarahInput({ sis, dia, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <input
        type="text" inputMode="numeric" pattern="[0-9]*" className="inp"
        style={{ textAlign: "center", flex: 1, padding: "11px 6px" }}
        value={sis}
        onChange={e => onChange("sis", e.target.value.replace(/\D/g, ""))}
      />
      <span style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>/</span>
      <input
        type="text" inputMode="numeric" pattern="[0-9]*" className="inp"
        style={{ textAlign: "center", flex: 1, padding: "11px 6px" }}
        value={dia}
        onChange={e => onChange("dia", e.target.value.replace(/\D/g, ""))}
      />
      <span style={{ fontSize: 11, color: "var(--mu)", flexShrink: 0, fontWeight: 700 }}>mmHg</span>
    </div>
  );
}

// ─── OBAT INPUT ───────────────────────────────────────────────────────────
function ObatInput({ obat, setObat }) {
  const [custom, setCustom] = useState("");

  const toggle = (o) => setObat(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);
  const addCustom = () => {
    if (custom.trim() && !obat.includes(custom.trim())) {
      setObat(p => [...p, custom.trim()]);
      setCustom("");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>
        {OBAT_UMUM.map(o => (
          <button key={o} onClick={() => toggle(o)} style={{
            margin: 3, padding: "5px 11px", borderRadius: 20,
            border: `1.5px solid ${obat.includes(o) ? "var(--sg)" : "var(--bd)"}`,
            background: obat.includes(o) ? "rgba(123,166,138,.15)" : "var(--wh)",
            color: obat.includes(o) ? "var(--sg2)" : "var(--mu)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "Plus Jakarta Sans,sans-serif", transition: "all .2s",
          }}>
            {obat.includes(o) ? "✓ " : ""}{o}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="inp" style={{ flex: 1 }} placeholder="Tambah obat lain..."
          value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustom()} />
        <button onClick={addCustom} className="btn bs" style={{ width: "auto", padding: "0 14px", flexShrink: 0 }}>+</button>
      </div>
      {obat.filter(o => !OBAT_UMUM.includes(o)).map(o => (
        <span key={o} className="otag">{o}
          <button onClick={() => toggle(o)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mu)", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
        </span>
      ))}
    </div>
  );
}

// ─── AI SUMMARY RENDERER ──────────────────────────────────────────────────
// Parses structured AI text (emoji headers + bullet points) into readable sections
function AISummaryRenderer({ text, compact }) {
  if (!text) return null;

  // Build sections: each starts with an emoji header line
  const lines  = text.split("\n").map(l => l.trim());
  const sections = [];
  let cur = null;

  for (const line of lines) {
    if (!line) continue;
    // Detect emoji-led header (short line starting with an emoji character)
    const isHeader = /^\p{Emoji}/u.test(line) && line.length < 80;
    if (isHeader) {
      if (cur) sections.push(cur);
      cur = { header: line.replace(/\*\*/g, "").replace(/^\#+\s*/, ""), items: [] };
    } else if (cur) {
      cur.items.push(line);
    } else {
      // Content before any header
      if (!sections.length || sections[sections.length - 1].header !== null) {
        sections.push({ header: null, items: [] });
      }
      sections[sections.length - 1].items.push(line);
    }
  }
  if (cur) sections.push(cur);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 16 }}>
      {sections.map((s, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.65)",
          borderRadius: 10,
          padding: compact ? "8px 10px" : "10px 12px",
          border: "1px solid rgba(238,224,214,0.8)",
        }}>
          {s.header && (() => {
            const spIdx = s.header.indexOf(" ");
            const hIcon = spIdx > 0 ? s.header.slice(0, spIdx) : "";
            const hText = spIdx > 0 ? s.header.slice(spIdx + 1) : s.header;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: s.items.length ? 6 : 0 }}>
                {hIcon && <span style={{ fontSize: compact ? 13 : 15, flexShrink: 0, lineHeight: 1 }}>{hIcon}</span>}
                <p style={{ fontWeight: 800, fontSize: compact ? 11 : 12, color: "var(--ro2)", letterSpacing: ".01em" }}>{hText}</p>
              </div>
            );
          })()}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {s.items.map((item, j) => {
              let cleaned = item.trim();
              if (cleaned.startsWith("###")) cleaned = cleaned.replace(/^###\s*/, "");
              else if (cleaned.startsWith("##")) cleaned = cleaned.replace(/^##\s*/, "");
              else if (cleaned.startsWith("#")) cleaned = cleaned.replace(/^#\s*/, "");

              let isBullet = false;
              if (cleaned.startsWith("* ") || cleaned.startsWith("- ") || cleaned.startsWith("• ")) {
                isBullet = true;
                cleaned = cleaned.replace(/^[\*\-•]\s*/, "");
              } else if (cleaned.startsWith("*") && !cleaned.startsWith("**")) {
                isBullet = true;
                cleaned = cleaned.replace(/^\*\s*/, "");
              }

              cleaned = cleaned.trim();

              const parts = cleaned.split("**");
              const content = parts.map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  return <strong key={pIdx} style={{ color: "var(--dp)", fontWeight: 800 }}>{part}</strong>;
                }
                return part;
              });

              return (
                <p key={j} style={{
                  fontSize: compact ? 12 : 13,
                  color: "var(--tx)",
                  lineHeight: 1.7,
                  marginBottom: isBullet ? "2px" : "6px",
                  paddingLeft: isBullet ? "12px" : "0px",
                  textIndent: isBullet ? "-12px" : "0px",
                  fontWeight: isBullet ? 500 : 400
                }}>
                  {isBullet ? "• " : ""}{content}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FILE VIEWER OVERLAY ──────────────────────────────────────────────────
// Handles both in-memory (preview) and Storage-backed (path) files
function FileViewerOverlay({ file, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    if (file.preview) {
      setPreviewUrl(file.preview);
    } else if (file.path) {
      setUrlLoading(true);
      dbGetSignedUrl(file.path)
        .then(url => setPreviewUrl(url))
        .catch(() => setPreviewUrl(null))
        .finally(() => setUrlLoading(false));
    } else {
      setPreviewUrl(null);
    }
  }, [file?.id]);

  if (!file) return null;

  return (
    <Overlay onClose={onClose}>
      <div className="sht" style={{ paddingBottom: 24 }}>
        <div className="hndl" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "var(--tx)", flex: 1, marginRight: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {file.filename || "Dokumen"}
          </p>
          <button onClick={onClose} style={{ background: "var(--psm)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "var(--mu)", flexShrink: 0 }}>✕</button>
        </div>

        {urlLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
            <span style={{ width: 32, height: 32, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
          </div>
        ) : !previewUrl ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: "var(--mu)" }}>Gagal memuat file.</p>
          </div>
        ) : file.isPdf ? (
          <div>
            <iframe
              src={previewUrl}
              style={{ width: "100%", height: "70vh", border: "none", borderRadius: 12, display: "block" }}
              title={file.filename || "PDF"}
            />
            <a
              href={previewUrl} download={file.filename || "dokumen.pdf"}
              className="btn bg"
              style={{ marginTop: 12, textDecoration: "none" }}
            >
              📥 Download PDF
            </a>
          </div>
        ) : (
          <img
            src={previewUrl}
            alt={file.filename || ""}
            style={{ width: "100%", borderRadius: 12, display: "block", maxHeight: "75vh", objectFit: "contain", background: "#f5f5f5" }}
          />
        )}
      </div>
    </Overlay>
  );
}

// ─── FILE THUMBNAIL GRID ──────────────────────────────────────────────────
function ThumbnailItem({ u, onView }) {
  const [imgSrc, setImgSrc] = useState(u.preview || null);

  useEffect(() => {
    if (!u.isPdf && !u.preview && u.path) {
      dbGetSignedUrl(u.path).then(url => { if (url) setImgSrc(url); }).catch(() => {});
    }
  }, [u.id]);

  return (
    <button onClick={() => onView(u)}
      style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid var(--bd)", background: "var(--wh)", cursor: "pointer", padding: 0 }}>
      {u.isPdf ? (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--pxs)", padding: 6, textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--mu)", marginTop: 4, wordBreak: "break-all", lineHeight: 1.2 }}>
            {(u.filename || "PDF").length > 18 ? (u.filename || "PDF").slice(0, 15) + "…" : (u.filename || "PDF")}
          </span>
        </div>
      ) : imgSrc ? (
        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pxs)" }}>
          <span style={{ fontSize: 22, opacity: 0.4 }}>⏳</span>
        </div>
      )}
      <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,.6)", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 10, fontWeight: 700 }}>🔍</span>
    </button>
  );
}

// Handles both in-memory (preview) and Storage-backed (path) files
function FileThumbnailGrid({ uploads, onView }) {
  if (!uploads || uploads.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {uploads.map(u => <ThumbnailItem key={u.id} u={u} onView={onView} />)}
    </div>
  );
}
