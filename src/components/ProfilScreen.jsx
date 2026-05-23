// ─── PROFIL SCREEN ────────────────────────────────────────────────────────
function ProfilScreen({ profil, setProfil, kunjungan }) {
  const [form,  setForm]  = useState(profil);
  const [saved, setSaved] = useState(false);
  const setF  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const week  = calcWeek(profil.hpht);
  const hpl   = calcHPL(profil.hpht);

  const save = () => {
    const hplDate = calcHPL(form.hpht);
    setProfil({ ...form, hpl: hplDate ? getLocalDateString(hplDate) : "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const exportData = () => {
    const d = { profil, kunjungan, exportDate: new Date().toISOString() };
    const b = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `bumilku-${getLocalDateString()}.json`;
    a.click(); URL.revokeObjectURL(u);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="hdr">
        <div className="hdr-in">
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, marginBottom: 10 }}>🤰</div>
          <h1 style={{ fontFamily: "Lora,serif", color: "#fff", fontSize: 24, fontWeight: 700 }}>{profil.namaIbu || "Profil Saya"}</h1>
          {profil.hpht && <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, marginTop: 4 }}>Minggu ke-{week} · HPL: {fmtShort(getLocalDateString(hpl))}</p>}
        </div>
      </div>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Stats Chips ── */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { v: kunjungan.length,                                            l: "Kunjungan"  },
            { v: kunjungan.filter(k => k.uploads?.length > 0).length,        l: "Dok. Upload" },
            { v: kunjungan.reduce((a, k) => a + (k.uploads?.length || 0), 0), l: "Total File"  },
          ].map(s => (
            <div key={s.l} className="chip"><span className="cv">{s.v}</span><span className="cl">{s.l}</span></div>
          ))}
        </div>

        {/* ── Setup AI ── */}
        <ApiKeySetup />

        {/* ── Data Ibu ── */}
        <div className="card">
          <p style={{ fontFamily: "Lora,serif", fontSize: 17, fontWeight: 700, color: "var(--tx)", marginBottom: 16 }}>Data Ibu</p>
          <div className="ig">
            <label className="lbl">Nama Lengkap</label>
            <input type="text" className="inp" value={form.namaIbu || ""} onChange={e => setF("namaIbu", e.target.value)} />
          </div>
          <div className="ig">
            <label className="lbl">Tanggal Lahir</label>
            <input type="date" className="inp" value={form.tanggalLahirIbu || ""} min="1970-01-01" max="2006-12-31" onChange={e => setF("tanggalLahirIbu", e.target.value)} />
          </div>
          <div className="ig">
            <label className="lbl">Nomor HP</label>
            <input type="tel" className="inp" value={form.nomorHP || ""} onChange={e => setF("nomorHP", e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Contoh: 08xx-xxxx-xxxx</p>
          </div>
          <div className="ig">
            <label className="lbl">Golongan Darah</label>
            <select className="inp" value={form.golonganDarah || ""} onChange={e => setF("golonganDarah", e.target.value)}>
              <option value="">Pilih</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="ig">
            <label className="lbl">Riwayat Alergi / Kondisi Medis</label>
            <textarea className="inp" value={form.riwayatMedis || ""} onChange={e => setF("riwayatMedis", e.target.value)} style={{ minHeight: 64 }} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Contoh: alergi obat tertentu, riwayat hipertensi, diabetes, dll</p>
          </div>
        </div>

        {/* ── Data Kehamilan ── */}
        <div className="card">
          <p style={{ fontFamily: "Lora,serif", fontSize: 17, fontWeight: 700, color: "var(--tx)", marginBottom: 16 }}>Data Kehamilan</p>
          <div className="ig">
            <label className="lbl">HPHT — Hari Pertama Haid Terakhir</label>
            <input type="date" className="inp" value={form.hpht || ""} min="2025-01-01" max="2026-12-31" onChange={e => setF("hpht", e.target.value)} />
          </div>
          {form.hpht && (
            <div className="asa" style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700 }}>📅 HPL: {fmtDate(getLocalDateString(calcHPL(form.hpht)))}</p>
              <p style={{ marginTop: 4 }}>🍼 Usia Kehamilan: Minggu ke-<strong>{calcWeek(form.hpht)}</strong></p>
            </div>
          )}
          <div className="ig">
            <label className="lbl">Kehamilan ke-</label>
            <select className="inp" value={form.kehamilanKe || ""} onChange={e => setF("kehamilanKe", e.target.value)}>
              <option value="">Pilih</option>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="ig">
            <label className="lbl">Rencana Persalinan</label>
            <select className="inp" value={form.rencanaPersalinan || ""} onChange={e => setF("rencanaPersalinan", e.target.value)}>
              <option value="">Pilih</option>
              <option value="normal">Persalinan Normal (Spontan)</option>
              <option value="caesar">Sectio Caesarea (Caesar)</option>
              <option value="vbac">VBAC</option>
              <option value="belum">Belum Diputuskan</option>
            </select>
          </div>
        </div>

        {/* ── Dokter & Fasilitas ── */}
        <div className="card">
          <p style={{ fontFamily: "Lora,serif", fontSize: 17, fontWeight: 700, color: "var(--tx)", marginBottom: 16 }}>Dokter & Fasilitas</p>
          <div className="ig">
            <label className="lbl">Nama Dokter / Bidan</label>
            <input type="text" className="inp" value={form.namaDokter || ""} onChange={e => setF("namaDokter", e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Contoh: dr. Nama, Sp.OG</p>
          </div>
          <div className="ig">
            <label className="lbl">Nama Klinik / RS</label>
            <input type="text" className="inp" value={form.namaRS || ""} onChange={e => setF("namaRS", e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Contoh: RS Bunda / Klinik Citra</p>
          </div>
          <div className="ig">
            <label className="lbl">No. Telepon Dokter / Klinik</label>
            <input type="tel" className="inp" value={form.noTeleponDokter || ""} onChange={e => setF("noTeleponDokter", e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Contoh: 021-xxxxxxxx</p>
          </div>
          <div className="ig">
            <label className="lbl">Kontak Darurat Keluarga</label>
            <input type="tel" className="inp" value={form.noTeleponDarurat || ""} onChange={e => setF("noTeleponDarurat", e.target.value)} />
            <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 5 }}>Suami, orangtua, atau kontak terdekat</p>
          </div>
          <div className="ig">
            <label className="lbl">Jaminan Kesehatan</label>
            <select className="inp" value={form.jaminanKesehatan || ""} onChange={e => setF("jaminanKesehatan", e.target.value)}>
              <option value="">Pilih</option>
              <option value="bpjs">BPJS Kesehatan</option>
              <option value="asuransi">Asuransi Swasta</option>
              <option value="mandiri">Mandiri / Umum</option>
            </select>
          </div>
        </div>

        {/* ── Save Button ── */}
        <button className="btn br" onClick={save} style={{ background: saved ? "linear-gradient(135deg,var(--sg2),var(--sg))" : undefined }}>
          {saved ? "✓ Tersimpan!" : "Simpan Profil"}
        </button>

        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}
