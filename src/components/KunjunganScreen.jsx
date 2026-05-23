// ─── KUNJUNGAN SCREEN ─────────────────────────────────────────────────────
function KunjunganScreen({ kunjungan, addKunjungan, updateKunjungan, deleteKunjungan, profil }) {
  const [showForm, setShowForm] = useState(false);
  const [detail,   setDetail]   = useState(null);
  const [form,     setForm]     = useState({ ...BLANK });
  const [viewingFile, setViewingFile] = useState(null);
  const [showAllKunjungan, setShowAllKunjungan] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [gmModel, setGmModelFix] = useLS("gm_model",  "gemini-2.5-flash");

  useEffect(() => {
    db.rpc("get_gemini_key").then(({ data }) => { if (data) setApiKey(data); }).catch(() => {});
  }, []);

  // Auto-migrate deprecated models
  useEffect(() => { if (/^gemini-1\.5/.test(gmModel)) setGmModelFix("gemini-2.5-flash"); }, [gmModel, setGmModelFix]);

  const [extracting,   setExtracting]   = useState(false);
  const [rawResponse,  setRawResponse]  = useState("");
  const [extractError, setExtractError] = useState("");

  const MAX_FILES = 6;
  const resultRef = useRef();
  const fileRef   = useRef();

  // Newest first (with original index as tie-breaker for same-day visits)
  const sorted = [...kunjungan]
    .map((v, i) => ({ ...v, _idx: i }))
    .sort((a, b) => {
      const dateA = a.tanggal || "";
      const dateB = b.tanggal || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b._idx - a._idx;
    });
  const week   = calcWeek(profil.hpht);
  const setF   = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const tdStr  = (v) => v.tdSis && v.tdDia ? `${v.tdSis}/${v.tdDia}` : (v.tekananDarah || "-");

  // ── File Processing ──────────────────────────────────────────────────────
  const compressToJpeg = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1600;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gagal membaca gambar")); };
    img.src = url;
  });

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(new Error("Gagal baca file"));
    r.readAsDataURL(file);
  });

  const onFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const available = MAX_FILES - form.uploads.length;
    if (available <= 0) { setExtractError(`❌ Maksimal ${MAX_FILES} file.`); e.target.value = ""; return; }
    const toAdd = files.slice(0, available);
    setRawResponse(""); setExtractError(""); setExtracting(true);
    try {
      const newOnes = [];
      for (const f of toAdd) {
        if (f.type === "application/pdf") {
          newOnes.push({ id: genId(), preview: await fileToDataURL(f), filename: f.name, mime: "application/pdf", isPdf: true, tanggal: new Date().toISOString() });
        } else if (f.type.startsWith("image/")) {
          newOnes.push({ id: genId(), preview: await compressToJpeg(f), filename: f.name, mime: "image/jpeg", isPdf: false, tanggal: new Date().toISOString() });
        }
      }
      if (newOnes.length > 0) {
        const updatedUploads = [...form.uploads, ...newOnes];
        setForm(p => ({ ...p, uploads: updatedUploads }));
        await extractAI(updatedUploads);
      }
      if (files.length > available) setExtractError(`⚠️ Hanya ${available} file ditambahkan (max ${MAX_FILES}).`);
    } catch (err) { setExtractError(`❌ Gagal baca file: ${err.message}`); }
    setExtracting(false);
    e.target.value = "";
  };

  const removeUpload = (id) => {
    setForm(p => ({ ...p, uploads: p.uploads.filter(x => x.id !== id) }));
  };

  // ── AI Extract — only processes files with preview (in-memory) ────────────
  const extractAI = async (filesToAnalyze = form.uploads) => {
    const previewFiles = (filesToAnalyze || []).filter(f => f.preview);
    if (!previewFiles.length) {
      setExtractError("❌ Tidak ada file baru untuk dianalisis. Tambahkan foto/PDF terlebih dahulu.");
      return;
    }
    if (!apiKey) { setExtractError("❌ API Key Gemini belum diisi. Buka tab Profil → Setup AI."); return; }
    setExtracting(true); setRawResponse(""); setExtractError("");
    try {
      const prompt = `Kamu adalah asisten medis profesional untuk ibu hamil di Indonesia. Saya kirim ${previewFiles.length === 1 ? "1 dokumen" : `${previewFiles.length} dokumen (bisa multi halaman atau dari pemeriksaan berbeda)`}. Analisis SEMUA dokumen secara menyeluruh.

Dokumen bisa berupa: hasil USG, hasil lab darah/urin, buku KIA, resep dokter, atau catatan dokter.

WAJIB jawab dengan format PERSIS seperti ini (jangan pakai markdown code block):

RINGKASAN:
📄 Jenis Dokumen
[Sebutkan jenis semua dokumen]

📅 Tanggal Pemeriksaan
[Tanggal dari dokumen, atau "tidak tertera"]

🔍 Temuan & Nilai
• [Nilai spesifik 1 — contoh: "Hemoglobin: 11.8 g/dL"]
• [Nilai spesifik 2 — contoh: "Berat janin (EFW): 1.450 gram"]
• [Sebutkan SEMUA nilai yang terbaca]

⚠️ Nilai Perlu Perhatian
• [Nilai abnormal/borderline, atau tulis "Semua nilai dalam batas normal"]

💬 Instruksi / Saran Dokter
[Instruksi dari dokumen, atau "tidak ada catatan instruksi"]

TEMUAN_PENTING: [1–3 hal paling kritis, dipisah titik koma. Tulis "tidak ada" jika semua normal.]

JSON_DATA:
{"usiaKehamilan":null,"beratJanin":null,"djj":null,"posisiJanin":null,"afi":null,"tdSis":null,"tdDia":null,"bb":null,"fundus":null}

Aturan JSON_DATA:
- usiaKehamilan: minggu (angka saja, contoh 24)
- beratJanin: EFW dalam gram (contoh 750)
- djj: bpm (contoh 148)
- posisiJanin: "kepala" / "sungsang" / "lintang" / "oblique"
- afi: cm (contoh 14)
- tdSis: sistolik (contoh 120)
- tdDia: diastolik (contoh 80)
- bb: kg ibu (contoh 62.5)
- fundus: cm (contoh 24)
Isi null jika tidak terbaca. JSON harus valid.`;

      const parts = previewFiles.map(p => ({ inlineData: { mimeType: p.mime, data: p.preview.split(",")[1] } }));
      parts.push({ text: prompt });

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gmModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 16384,
            responseMimeType: "text/plain",
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let errMsg = `HTTP ${res.status}`;
        try { const ej = JSON.parse(errText); errMsg = ej?.error?.message || errMsg; } catch {}
        if (res.status === 400 && /API key/i.test(errMsg))       setExtractError("❌ API Key tidak valid. Cek Profil → Setup AI.");
        else if (res.status === 429)                              setExtractError("❌ Quota Gemini habis. Tunggu beberapa menit atau ganti model.");
        else if (res.status === 413 || /too large/i.test(errMsg)) setExtractError("❌ File terlalu besar. Kurangi jumlah file atau pakai foto saja.");
        else                                                      setExtractError(`❌ Error Gemini: ${errMsg}`);
        setExtracting(false); return;
      }

      const data = await res.json();
      if (data?.candidates?.[0]?.finishReason === "SAFETY") {
        setExtractError("❌ Konten diblokir safety filter. Coba file lain.");
        setExtracting(false); return;
      }
      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!txt) { setExtractError("❌ Tidak ada respons dari model."); setExtracting(false); return; }

      setRawResponse(txt);

      // Parse RINGKASAN & TEMUAN_PENTING
      const ringkasanMatch = txt.match(/RINGKASAN:\s*([\s\S]+?)(?=\n\s*TEMUAN_PENTING:|$)/i);
      const temuanMatch    = txt.match(/TEMUAN_PENTING:\s*([\s\S]+?)(?=\n\s*JSON_DATA:|$)/i);
      const ringkasan = ringkasanMatch?.[1]?.trim().replace(/^\[|\]$/g, "") || "";
      const temuan    = temuanMatch?.[1]?.trim().replace(/^\[|\]$/g, "") || "";

      // Parse JSON_DATA — robust
      let parsed = {};
      const afterMarker = txt.split(/JSON_DATA:/i)[1] || txt;
      const cleaned = afterMarker.replace(/```json|```/gi, "").trim();
      const fb = cleaned.indexOf("{"), lb = cleaned.lastIndexOf("}");
      if (fb >= 0 && lb > fb) {
        const jsonStr = cleaned.substring(fb, lb + 1);
        try { parsed = JSON.parse(jsonStr); }
        catch { try { parsed = JSON.parse(jsonStr.replace(/,(\s*[}\]])/g, "$1").replace(/'/g, '"')); } catch {} }
      }

      const cleanVal  = (v) => { if (v == null || v === "" || v === "null") return null; return String(v).replace(/[^0-9.]/g, "").trim() || null; };
      const cleanText = (v) => { if (v == null || v === "null") return null; return String(v).trim() || null; };

      setForm(p => {
        const next = { ...p };
        const set  = (k, val, isText) => { const c = isText ? cleanText(val) : cleanVal(val); if (c != null) next[k] = c; };
        set("usiaKehamilan", parsed.usiaKehamilan);
        set("beratJanin",    parsed.beratJanin);
        set("djj",           parsed.djj);
        set("posisiJanin",   parsed.posisiJanin, true);
        set("afi",           parsed.afi);
        set("tdSis",         parsed.tdSis);
        set("tdDia",         parsed.tdDia);
        set("bb",            parsed.bb);
        set("fundus",        parsed.fundus);
        if (ringkasan) next.aiSummary = ringkasan;
        next.temuanPenting = (temuan && temuan.toLowerCase() !== "tidak ada") ? temuan : "";
        return next;
      });

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    } catch (e) { setExtractError(`❌ Gagal: ${e.message}`); }
    setExtracting(false);
  };

  // ── Save — uploads new files to Storage then persists visit ───────────────
  const save = async () => {
    if (!form.tanggal) return;
    setSaving(true);
    setSaveError("");
    try {
      const visitId = form.id || genId();

      // Upload any in-memory files (preview but no path) to Supabase Storage
      const processedUploads = await Promise.all(
        (form.uploads || []).map(async (u) => {
          if (u.preview && !u.path) {
            const ext = u.isPdf ? "pdf" : "jpg";
            const storagePath = `kunjungan/${visitId}/${u.id}.${ext}`;
            await dbUploadFile(u.preview, storagePath);
            return { id: u.id, path: storagePath, filename: u.filename, mime: u.mime, isPdf: u.isPdf, tanggal: u.tanggal };
          }
          // Already in Storage — keep path, strip preview to keep state lean
          const { preview: _, ...rest } = u;
          return rest;
        })
      );

      const visitToSave = { ...form, id: visitId, uploads: processedUploads };

      if (form.id) {
        await updateKunjungan(visitToSave);
        setDetail(visitToSave);
      } else {
        await addKunjungan(visitToSave);
      }
      setShowForm(false);
      setForm({ ...BLANK });
    } catch (e) {
      setSaveError(`❌ Gagal simpan: ${e.message}`);
    }
    setSaving(false);
  };

  // ── Delete — removes Storage files then deletes visit ─────────────────────
  const del = async (id) => {
    const visit = kunjungan.find(v => v.id === id);
    if (visit) {
      const paths = (visit.uploads || []).filter(u => u.path).map(u => u.path);
      if (paths.length) await dbDeleteFiles(paths).catch(console.error);
    }
    await deleteKunjungan(id);
    setDetail(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="hdr">
        <div className="hdr-in">
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Rekam Medis Digital</p>
          <h1 style={{ fontFamily: "Lora,serif", color: "#fff", fontSize: 26, fontWeight: 700 }}>Buku KIA Digital 📒</h1>
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 14, marginTop: 4 }}>{kunjungan.length} kunjungan tercatat</p>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <button className="btn br" onClick={() => setShowForm(true)} style={{ marginBottom: 18 }}>+ Tambah Kunjungan Baru</button>

        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📒</div>
            <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Belum ada kunjungan</p>
            <p style={{ color: "var(--mu)", fontSize: 14 }}>Rekam kunjungan pertamamu ke dokter</p>
          </div>
        ) : (
          <>
            {(showAllKunjungan ? sorted : sorted.slice(0, 3)).map((v, i) => (
              <div key={v.id} className="vc fu" style={{ animationDelay: `${i * .04}s` }} onClick={() => setDetail(v)}>

                {/* Top row: badge + attachments + arrow */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="badge">Mgg {v.usiaKehamilan || "?"}</span>
                    {v.uploads?.length > 0 && (
                      <span className="tag tsg">
                        <span>📎</span><span>{v.uploads.length} file</span>
                      </span>
                    )}
                  </div>
                  <span style={{ color: "var(--mu)", fontSize: 22, lineHeight: 1 }}>›</span>
                </div>

                {/* Date & Doctor */}
                <p style={{ fontFamily: "Lora,serif", fontSize: 16, fontWeight: 700, color: "var(--tx)", marginBottom: 2 }}>{fmtDate(v.tanggal)}</p>
                {v.dokter && <p style={{ fontSize: 12, color: "var(--mu)", marginBottom: 9 }}>dr. {v.dokter}</p>}

                {/* Vitals tags */}
                {(tdStr(v) !== "-" || v.bb || v.djj || v.posisiJanin || v.nextAppointment) && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: (v.aiSummary || v.catatan) ? 9 : 0 }}>
                    {tdStr(v) !== "-"  && <span className="tag">TD: {tdStr(v)}</span>}
                    {v.bb              && <span className="tag">BB: {v.bb} kg</span>}
                    {v.djj             && <span className="tag">DJJ: {v.djj} bpm</span>}
                    {v.posisiJanin     && <span className="tag tsg">{v.posisiJanin.split(" ").slice(0, 2).join(" ")}</span>}
                    {v.nextAppointment && <span className="tag"><span>📅</span><span>{fmtShort(v.nextAppointment)}</span></span>}
                  </div>
                )}

                {/* Summary preview */}
                {v.aiSummary && (
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🤖</span>
                    <p style={{ fontSize: 12, color: "var(--sg2)", fontStyle: "italic", lineHeight: 1.5 }}>
                      "{v.aiSummary.replace(/\*/g, "").substring(0, 70).trim()}{v.aiSummary.replace(/\*/g, "").length > 70 ? "…" : ""}"
                    </p>
                  </div>
                )}
                {v.catatan && !v.aiSummary && (
                  <p style={{ fontSize: 12, color: "var(--mu)", fontStyle: "italic", lineHeight: 1.5 }}>
                    "{v.catatan.substring(0, 70)}{v.catatan.length > 70 ? "…" : ""}"
                  </p>
                )}
              </div>
            ))}
            {sorted.length > 3 && (
              <button className="btn bg" onClick={() => setShowAllKunjungan(v => !v)}>
                {showAllKunjungan ? "▲ Tampilkan lebih sedikit" : `▼ Lihat semua ${sorted.length} kunjungan`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Form Sheet ── */}
      {showForm && (
        <Overlay onClose={() => { setShowForm(false); setForm({ ...BLANK }); setSaveError(""); }}>
          <div className="sht">
            <div style={{ position: "sticky", top: 0, background: "var(--cr)", zIndex: 10, paddingTop: 12, marginBottom: 20 }}>
              <div className="hndl" style={{ margin: "0 auto 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Lora,serif", fontSize: 21, fontWeight: 700, color: "var(--tx)" }}>{form.id ? "Edit Kunjungan" : "Tambah Kunjungan"}</h2>
                <button onClick={() => { setShowForm(false); setForm({ ...BLANK }); setSaveError(""); }} style={{ background: "var(--psm)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "var(--mu)" }}>✕</button>
              </div>
            </div>

            {/* Mode Picker */}
            {!form.mode && (
              <div>
                <p style={{ fontSize: 13, color: "var(--mu)", marginBottom: 14, textAlign: "center" }}>Pilih cara input data kunjungan:</p>
                <div className="mtog">
                  <button className="mopt" onClick={() => setF("mode", "upload")}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                    <p style={{ fontWeight: 800, color: "var(--tx)", fontSize: 14, marginBottom: 4 }}>Upload Dokumen</p>
                    <p style={{ fontSize: 12, color: "var(--mu)" }}>Foto buku KIA, USG, atau lab → AI baca otomatis</p>
                  </button>
                  <button className="mopt" onClick={() => setF("mode", "manual")}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✏️</div>
                    <p style={{ fontWeight: 800, color: "var(--tx)", fontSize: 14, marginBottom: 4 }}>Isi Manual</p>
                    <p style={{ fontSize: 12, color: "var(--mu)" }}>Isi langsung dari data dokter</p>
                  </button>
                </div>
              </div>
            )}

            {/* Upload Mode */}
            {form.mode === "upload" && (
              <div>
                <button onClick={() => setF("mode", "")} style={{ background: "none", border: "none", color: "var(--mu)", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 16, fontFamily: "Plus Jakarta Sans,sans-serif" }}>← Ganti cara input</button>

                {/* Drop Zone */}
                <div className="drop" onClick={() => !extracting && form.uploads.length < MAX_FILES && fileRef.current.click()}
                  style={{ marginBottom: 12, opacity: extracting ? .6 : 1, padding: form.uploads.length ? "18px 14px" : "32px 18px", cursor: form.uploads.length >= MAX_FILES ? "not-allowed" : "pointer" }}>
                  {form.uploads.length > 0 ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                        {form.uploads.map(p => (
                          <div key={p.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: "1px solid var(--bd)", background: "var(--wh)" }}>
                            {p.isPdf ? (
                              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--pxs)", padding: 6, textAlign: "center" }}>
                                <span style={{ fontSize: 28 }}>📄</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--mu)", marginTop: 4, wordBreak: "break-all", lineHeight: 1.2 }}>{p.filename.length > 18 ? p.filename.slice(0, 15) + "…" : p.filename}</span>
                              </div>
                            ) : p.preview ? (
                              <img src={p.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--pxs)", padding: 6, textAlign: "center" }}>
                                <span style={{ fontSize: 28 }}>🖼️</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--mu)", marginTop: 4, wordBreak: "break-all", lineHeight: 1.2 }}>{(p.filename || "Gambar").length > 18 ? (p.filename || "Gambar").slice(0, 15) + "…" : (p.filename || "Gambar")}</span>
                              </div>
                            )}
                            <button onClick={e => { e.stopPropagation(); removeUpload(p.id); }} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                          </div>
                        ))}
                        {form.uploads.length < MAX_FILES && !extracting && (
                          <div style={{ aspectRatio: "1", borderRadius: 10, border: "2px dashed var(--pe)", background: "var(--pxs)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <span style={{ fontSize: 24, color: "var(--ro)" }}>+</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mu)" }}>Tambah</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--mu)", textAlign: "center", fontWeight: 600 }}>{form.uploads.length} / {MAX_FILES} file · klik ✕ untuk hapus</p>
                    </>
                  ) : extracting ? (
                    <div>
                      <span style={{ width: 36, height: 36, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite", marginBottom: 12 }} />
                      <p style={{ fontFamily: "Lora,serif", fontSize: 14, fontWeight: 700, color: "var(--dp)" }}>Memproses file...</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 44, marginBottom: 10 }}>📄</div>
                      <p style={{ fontFamily: "Lora,serif", fontSize: 15, fontWeight: 700, color: "var(--dp)", marginBottom: 5 }}>Upload Dokumen Medis</p>
                      <p style={{ fontSize: 12, color: "var(--mu)" }}>Buku KIA · USG · Lab · Resep</p>
                      <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 6 }}>📸 Foto / 📄 PDF · Max {MAX_FILES} file</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple style={{ display: "none" }} onChange={onFile} />

                {form.uploads.filter(u => u.preview).length > 0 && !extracting && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <button className="btn bg" onClick={() => extractAI(form.uploads)} style={{ flex: 1, padding: "10px 14px" }}>
                      🤖 Analisis Ulang {form.uploads.filter(u => u.preview).length} Dokumen dengan AI
                    </button>
                  </div>
                )}

                {extracting && (
                  <div style={{ background: "rgba(123,166,138,.08)", border: "1px solid rgba(123,166,138,.25)", borderRadius: 14, padding: "16px 18px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ width: 28, height: 28, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: 800, color: "var(--sg2)", fontSize: 14 }}>Gemini sedang baca {form.uploads.filter(u => u.preview).length} dokumen...</p>
                      <p style={{ fontSize: 12, color: "var(--mu)", marginTop: 3 }}>Mengekstrak data lengkap, ~15–30 detik</p>
                    </div>
                  </div>
                )}

                {extractError && (
                  <div className="are" style={{ marginBottom: 14 }}>
                    <p style={{ fontWeight: 800, marginBottom: 4 }}>Analisis Gagal</p>
                    <p style={{ fontSize: 12, lineHeight: 1.6 }}>{extractError}</p>
                  </div>
                )}

                {/* AI Result — structured display */}
                {rawResponse && !extracting && (
                  <div ref={resultRef} className="aibox" style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <p style={{ fontWeight: 800, color: "var(--sg2)", fontSize: 14 }}>Analisis Selesai — Gemini Vision</p>
                    </div>

                    {form.aiSummary && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 13 }}>📋</span>
                          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em" }}>Ringkasan Dokumen</p>
                        </div>
                        <AISummaryRenderer text={form.aiSummary} />
                      </div>
                    )}

                    {form.temuanPenting && (
                      <div style={{ background: "rgba(220,38,38,.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid rgba(220,38,38,.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 14 }}>⚠️</span>
                          <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>Temuan Penting</p>
                        </div>
                        <p style={{ fontSize: 13, color: "#DC2626", lineHeight: 1.6 }}>{form.temuanPenting}</p>
                      </div>
                    )}

                    {(form.usiaKehamilan || form.bb || form.tdSis || form.djj || form.posisiJanin || form.beratJanin || form.afi || form.fundus) && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 13 }}>🔄</span>
                          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--sg2)", textTransform: "uppercase", letterSpacing: ".05em" }}>Data yang berhasil di-auto-isi:</p>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {form.usiaKehamilan && <span className="tag tsg">✓ Usia: {form.usiaKehamilan} mgg</span>}
                          {form.bb           && <span className="tag tsg">✓ BB: {form.bb} kg</span>}
                          {form.tdSis        && <span className="tag tsg">✓ TD: {form.tdSis}/{form.tdDia}</span>}
                          {form.djj          && <span className="tag tsg">✓ DJJ: {form.djj} bpm</span>}
                          {form.posisiJanin  && <span className="tag tsg">✓ Posisi: {form.posisiJanin.split(" ")[0]}</span>}
                          {form.beratJanin   && <span className="tag tsg">✓ EFW: {form.beratJanin} gr</span>}
                          {form.afi          && <span className="tag tsg">✓ AFI: {form.afi} cm</span>}
                          {form.fundus       && <span className="tag tsg">✓ Fundus: {form.fundus} cm</span>}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                      <span style={{ fontSize: 13 }}>👇</span>
                      <p style={{ fontSize: 11, color: "var(--sg2)", fontWeight: 600 }}>Scroll ke bawah untuk cek &amp; koreksi form, lalu simpan.</p>
                    </div>
                  </div>
                )}

                {form.uploads.length > 0 && (
                  <div className="asa" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📎</span>
                    <p style={{ fontSize: 13 }}><strong>{form.uploads.length} file</strong> siap disimpan</p>
                  </div>
                )}

                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)", marginBottom: 14 }}>
                  {rawResponse ? "✏️ Cek & koreksi data di bawah sebelum disimpan:" : "Lengkapi data kunjungan:"}
                </p>
              </div>
            )}

            {/* Form Fields */}
            {form.mode && (
              <>
                {/* Tanggal Kunjungan */}
                <div className="ig">
                  <label className="lbl">Tanggal Kunjungan</label>
                  <input type="date" className="inp" value={form.tanggal} onChange={e => setF("tanggal", e.target.value)} />
                </div>

                {/* Nama Dokter */}
                <div className="ig">
                  <label className="lbl">Nama Dokter / Bidan</label>
                  <input type="text" className="inp" placeholder="dr. Sari, Sp.OG" value={form.dokter} onChange={e => setF("dokter", e.target.value)} />
                </div>

                {/* Usia Kehamilan */}
                <div className="ig">
                  <label className="lbl">Usia Hamil (Minggu)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="numeric" className="inp" value={form.usiaKehamilan} onChange={e => setF("usiaKehamilan", e.target.value.replace(/\D/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>mgg</span>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>HPHT: Minggu ke-{week}</p>
                </div>

                {/* Berat Badan Ibu */}
                <div className="ig">
                  <label className="lbl">Berat Badan Ibu</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="decimal" className="inp" value={form.bb} onChange={e => setF("bb", e.target.value.replace(/[^0-9.]/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>kg</span>
                  </div>
                </div>

                {/* Tekanan Darah */}
                <div className="ig">
                  <label className="lbl">Tekanan Darah</label>
                  <TekananDarahInput sis={form.tdSis} dia={form.tdDia} onChange={(k, v) => setF(k === "sis" ? "tdSis" : "tdDia", v)} />
                  <p style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>Normal: sistolik 90–120 / diastolik 60–80 mmHg</p>
                </div>

                {/* DJJ */}
                <div className="ig">
                  <label className="lbl">DJJ Janin</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="numeric" className="inp" value={form.djj} onChange={e => setF("djj", e.target.value.replace(/\D/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>bpm</span>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>Normal: 110–170 bpm</p>
                </div>

                {/* Tinggi Fundus */}
                <div className="ig">
                  <label className="lbl">Tinggi Fundus (TFU)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="decimal" className="inp" value={form.fundus} onChange={e => setF("fundus", e.target.value.replace(/[^0-9.]/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>cm</span>
                  </div>
                </div>

                {/* Posisi Janin */}
                <div className="ig">
                  <label className="lbl">Posisi Janin</label>
                  <select className="inp" value={form.posisiJanin} onChange={e => setF("posisiJanin", e.target.value)}>
                    <option value="">Pilih posisi...</option>
                    {POSISI_JANIN.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Taksiran Berat Janin */}
                <div className="ig">
                  <label className="lbl">Taksiran Berat Janin (EFW)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="numeric" className="inp" value={form.beratJanin} onChange={e => setF("beratJanin", e.target.value.replace(/\D/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>gram</span>
                  </div>
                </div>

                {/* AFI */}
                <div className="ig">
                  <label className="lbl">AFI Cairan Ketuban</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="text" inputMode="decimal" className="inp" value={form.afi} onChange={e => setF("afi", e.target.value.replace(/[^0-9.]/g, ""))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mu)", flexShrink: 0 }}>cm</span>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>Normal: 8–24 cm</p>
                </div>

                <div className="ig">
                  <label className="lbl">Obat & Suplemen yang Diresepkan</label>
                  <ObatInput obat={form.obat} setObat={v => setForm(p => ({ ...p, obat: typeof v === "function" ? v(p.obat) : v }))} />
                </div>
                {form.aiSummary && (
                  <div className="ig">
                    <label className="lbl" style={{ color: "var(--sg2)", display: "flex", justifyContent: "space-between" }}>
                      <span>Ringkasan Medis (AI — Bisa Diedit)</span>
                      <span style={{ fontSize: 10, textTransform: "none", color: "var(--mu)" }}>{form.aiSummary.length} karakter</span>
                    </label>
                    <textarea
                      className="inp"
                      value={form.aiSummary}
                      onChange={e => setF("aiSummary", e.target.value)}
                      style={{ minHeight: 220, border: "1.5px solid rgba(123,166,138,.4)", background: "var(--wh)", fontSize: "16px", lineHeight: "1.65", fontFamily: "inherit" }}
                      placeholder="Masukkan ringkasan medis..."
                    />
                  </div>
                )}
                {form.temuanPenting && (
                  <div className="ig">
                    <label className="lbl" style={{ color: "#DC2626" }}>Temuan Penting / Catatan Kritis (AI — Bisa Diedit)</label>
                    <textarea
                      className="inp"
                      value={form.temuanPenting}
                      onChange={e => setF("temuanPenting", e.target.value)}
                      style={{ minHeight: 80, border: "1.5px solid rgba(220,38,38,.3)", background: "var(--wh)", fontSize: "16px", lineHeight: "1.6", fontFamily: "inherit" }}
                      placeholder="Masukkan temuan penting..."
                    />
                  </div>
                )}
                <div className="ig">
                  <label className="lbl">Catatan Dokter / Hasil Konsultasi</label>
                  <textarea className="inp" value={form.catatan} onChange={e => setF("catatan", e.target.value)} />
                </div>
                <div className="ig">
                  <label className="lbl">Jadwal Kunjungan Berikutnya</label>
                  <input type="date" className="inp" value={form.nextAppointment} min="2026-01-01" onChange={e => setF("nextAppointment", e.target.value)} />
                </div>

                {saveError && (
                  <div className="are" style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13 }}>{saveError}</p>
                  </div>
                )}

                <button className="btn br" onClick={save} disabled={saving}>
                  {saving
                    ? <><span>⏳</span><span>Menyimpan...</span></>
                    : form.id
                      ? <><span>💾</span><span>Perbarui Kunjungan</span></>
                      : <><span>💾</span><span>Simpan Kunjungan</span></>
                  }
                </button>
              </>
            )}
          </div>
        </Overlay>
      )}

      {/* ── Detail Sheet ── */}
      {detail && (
        <Overlay onClose={() => setDetail(null)}>
          <div className="sht">
            <div style={{ position: "sticky", top: 0, background: "var(--cr)", zIndex: 10, paddingTop: 12, marginBottom: 16 }}>
              <div className="hndl" style={{ margin: "0 auto 12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge">Minggu {detail.usiaKehamilan || "?"}</span>
                <button onClick={() => setDetail(null)} style={{ background: "var(--psm)", border: "none", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "var(--mu)" }}>✕</button>
              </div>
            </div>
            <h2 style={{ fontFamily: "Lora,serif", fontSize: 22, fontWeight: 700, color: "var(--tx)", marginBottom: 4 }}>{fmtDate(detail.tanggal)}</h2>
            {detail.dokter && <p style={{ color: "var(--mu)", fontSize: 14, marginBottom: 18 }}>dr. {detail.dokter}</p>}

            {/* Vital Signs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 18 }}>
              {[
                { l: "Berat Badan",   v: detail.bb         ? `${detail.bb} kg`         : "-" },
                { l: "Tekanan Darah", v: tdStr(detail) },
                { l: "DJJ",           v: detail.djj        ? `${detail.djj} bpm`        : "-" },
                { l: "Tinggi Fundus", v: detail.fundus     ? `${detail.fundus} cm`      : "-" },
                { l: "Posisi Janin",  v: detail.posisiJanin ? detail.posisiJanin.split("(")[0].trim() : "-" },
                { l: "Berat Janin",   v: detail.beratJanin  ? `${detail.beratJanin} gr` : "-" },
                { l: "AFI Cairan",    v: detail.afi         ? `${detail.afi} cm`         : "-" },
              ].map(x => (
                <div key={x.l} className="csm">
                  <p style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{x.l}</p>
                  <p style={{ fontFamily: "Lora,serif", fontSize: 17, fontWeight: 700, color: "var(--dp)", marginTop: 4 }}>{x.v}</p>
                </div>
              ))}
            </div>

            {/* AI Summary */}
            {detail.aiSummary && (
              <div style={{ marginBottom: 14 }}>
                <p className="lbl" style={{ marginBottom: 8 }}>Ringkasan AI</p>
                <div className="aibox">
                  <AISummaryRenderer text={detail.aiSummary} />
                  {detail.temuanPenting && (
                    <div style={{ marginTop: 10, background: "rgba(220,38,38,.07)", borderRadius: 8, padding: "8px 12px", border: "1px solid rgba(220,38,38,.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>⚠️</span>
                        <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>Temuan Penting</p>
                      </div>
                      <p style={{ fontSize: 13, color: "#DC2626", lineHeight: 1.6 }}>{detail.temuanPenting}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {detail.catatan && (
              <div style={{ marginBottom: 14 }}>
                <p className="lbl" style={{ marginBottom: 7 }}>Catatan Dokter</p>
                <div className="asa"><p style={{ lineHeight: 1.7 }}>"{detail.catatan}"</p></div>
              </div>
            )}

            {detail.obat?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p className="lbl" style={{ marginBottom: 7 }}>Obat & Suplemen</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {detail.obat.map((o, i) => <span key={i} className="tag">{o}</span>)}
                </div>
              </div>
            )}

            {/* File Thumbnails — clickable */}
            {detail.uploads?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p className="lbl" style={{ marginBottom: 7 }}>Dokumen Terlampir ({detail.uploads.length}) — ketuk untuk buka</p>
                <FileThumbnailGrid uploads={detail.uploads} onView={setViewingFile} />
              </div>
            )}

            {detail.nextAppointment && (
              <div className="cpe" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 24 }}>📅</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em" }}>Kunjungan Berikutnya</p>
                  <p style={{ fontWeight: 800, color: "var(--dp)", fontSize: 15 }}>{fmtDate(detail.nextAppointment)}</p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button className="btn bg" style={{ flex: 1, margin: 0 }} onClick={() => {
                setForm({ ...detail });
                setShowForm(true);
                setDetail(null);
              }}>
                <span>✏️</span><span>Edit Kunjungan</span>
              </button>
              <button className="btn bd2" style={{ flex: 1, margin: 0 }} onClick={() => del(detail.id)}>
                <span>🗑️</span><span>Hapus</span>
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── File Viewer ── */}
      <FileViewerOverlay file={viewingFile} onClose={() => setViewingFile(null)} />
    </div>
  );
}
