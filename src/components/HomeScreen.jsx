// ─── HOME SCREEN ──────────────────────────────────────────────────────────
function HomeScreen({ profil, kunjungan, go }) {
  const week  = calcWeek(profil.hpht);
  const hpl   = calcHPL(profil.hpht);
  const dl    = daysLeft(profil.hpht);
  const [em, sz, ln] = getBaby(week);

  // Progress ring geometry
  const pct = Math.min(week / 40, 1);
  const R   = 54, C = 2 * Math.PI * R, off = C * (1 - pct);

  const lastV = [...kunjungan]
    .map((v, i) => ({ ...v, _idx: i }))
    .sort((a, b) => {
      const dateA = a.tanggal || "";
      const dateB = b.tanggal || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b._idx - a._idx;
    })[0];
  const nextM  = MILESTONES.find(m => m.week > week);
  const passedM = MILESTONES.filter(m => m.week <= week);
  const tdStr  = (v) => v?.tdSis && v?.tdDia ? `${v.tdSis}/${v.tdDia}` : (v?.tekananDarah || "-");

  return (
    <div>
      {/* ── Header ── */}
      <div className="hdr">
        <div className="hdr-in">
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 style={{ fontFamily: "Lora,serif", color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 2 }}>
            {profil.namaIbu ? `Halo, ${profil.namaIbu.split(" ")[0]}! 👋` : "Halo, Bunda! 👋"}
          </h1>
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 14 }}>
            {profil.hpht ? `Kehamilan Minggu ke-${week} dari 40` : "Lengkapi profil untuk mulai"}
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 13 }}>

        {/* ── Progress Ring & Baby Size ── */}
        {profil.hpht ? (
          <div className="card fu f1">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width="120" height="120" viewBox="0 0 128 128" className="ring">
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C96150" />
                      <stop offset="100%" stopColor="#F2A58E" />
                    </linearGradient>
                  </defs>
                  <circle cx="64" cy="64" r={R} fill="none" stroke="var(--psm)" strokeWidth="10" />
                  <circle cx="64" cy="64" r={R} fill="none" stroke="url(#rg)" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
                    style={{ transformOrigin: "64px 64px", transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "Lora,serif", fontSize: 28, fontWeight: 700, color: "var(--dp)", lineHeight: 1 }}>{week}</span>
                  <span style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700 }}>/ 40 Mgg</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 32 }}>{em}</span>
                <p style={{ fontFamily: "Lora,serif", fontSize: 15, fontWeight: 700, color: "var(--tx)", marginTop: 5, marginBottom: 2 }}>Sebesar {sz}</p>
                <p style={{ fontSize: 11, color: "var(--mu)" }}>Panjang ≈ {ln}</p>
                <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 1 }}>HPL: {fmtShort(getLocalDateString(hpl))}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                  <div className="chip"><span className="cv">{dl}</span><span className="cl">Hari lagi</span></div>
                  <div className="chip"><span className="cv">{Math.floor(week / 4)}</span><span className="cl">Bulan</span></div>
                  <div className="chip"><span className="cv">{40 - week}</span><span className="cl">Mgg lagi</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card fu f1" style={{ textAlign: "center", padding: "32px 18px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤰</div>
            <p style={{ fontFamily: "Lora,serif", fontSize: 20, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Selamat Datang di BumilKu!</p>
            <p style={{ color: "var(--mu)", fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>Buku KIA digital untuk memantau kehamilan & berbagi info ke dokter</p>
            <button className="btn br" onClick={() => go("profil")}>Lengkapi Profil →</button>
          </div>
        )}

        {/* ── Data Kunjungan Terakhir ── */}
        {lastV && (
          <div className="fu f2">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 9 }}>
              Kunjungan Terakhir — {fmtShort(lastV.tanggal)}
            </p>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                { v: tdStr(lastV),                       l: "Tekanan Darah" },
                { v: lastV.bb ? `${lastV.bb}kg` : "-",  l: "Berat Badan" },
                { v: lastV.djj ? `${lastV.djj}bpm` : "-", l: "DJJ Janin" },
              ].map(s => (
                <div key={s.l} className="chip">
                  <span className="cv" style={{ fontSize: 14 }}>{s.v}</span>
                  <span className="cl">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Milestone Berikutnya ── */}
        {nextM && profil.hpht && (
          <div className="fu f3">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 9 }}>Milestone Berikutnya</p>
            <div className="csm" style={{ display: "flex", gap: 13, alignItems: "center" }}>
              <span style={{ fontSize: 34, flexShrink: 0 }}>{nextM.icon}</span>
              <div>
                <p style={{ fontWeight: 800, color: "var(--tx)", fontSize: 14 }}>Minggu {nextM.week}: {nextM.title}</p>
                <p style={{ fontSize: 12, color: "var(--mu)", marginTop: 3 }}>{nextM.desc}</p>
                <span className="tag" style={{ marginTop: 7, display: "inline-block" }}>🕐 {nextM.week - week} minggu lagi</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Milestone Tercapai ── */}
        {passedM.length > 0 && (
          <div className="fu f4">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 9 }}>Milestone Tercapai 🎉</p>
            <div className="hsc">
              {[...passedM].reverse().map(m => (
                <div key={m.week} className="mc p">
                  <div style={{ fontSize: 26 }}>{m.icon}</div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "var(--sg2)", marginTop: 7 }}>Mgg {m.week}</p>
                  <p style={{ fontSize: 10, color: "var(--mu)", marginTop: 2, fontWeight: 600 }}>{m.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Aksi Cepat ── */}
        <div className="fu f5">
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 9 }}>Aksi Cepat</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {[
              { icon: "📒", label: "Tambah Kunjungan",   tab: "kunjungan" },
              { icon: "📄", label: "Ringkasan Dokter",   tab: "ringkasan" },
              { icon: "👶", label: "Kick Counter",       tab: "monitor"   },
              { icon: "⏱️", label: "Contraction Timer",  tab: "monitor"   },
            ].map(a => (
              <button
                key={a.label} onClick={() => go(a.tab)}
                style={{ background: "var(--wh)", border: "1px solid var(--bd)", borderRadius: 14, padding: "14px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, boxShadow: "0 2px 10px var(--sh)", transition: "all .2s", textAlign: "left" }}
              >
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tanda Bahaya Banner ── */}
        <div className="aam fu f5" style={{ display: "flex", gap: 11, alignItems: "center" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>Kenali Tanda Bahaya</p>
            <p style={{ fontSize: 12 }}>Segera ke IGD jika mengalami gejala berbahaya</p>
          </div>
          <button
            onClick={() => go("monitor", "bahaya")}
            style={{ background: "none", border: "1px solid #FDE68A", borderRadius: 9, padding: "6px 11px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#92400E", fontFamily: "Plus Jakarta Sans,sans-serif", flexShrink: 0 }}
          >Lihat →</button>
        </div>

        <div style={{ height: 6 }} />
      </div>
    </div>
  );
}
