// ─── MONITOR SCREEN ───────────────────────────────────────────────────────
function MonitorScreen({ initialTab = "kick", setInitialTab }) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (t) => {
    setTab(t);
    if (setInitialTab) setInitialTab(t);
  };

  // ── Date Navigation ───────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const isToday    = selectedDate === getLocalDateString();
  const prevDay    = () => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(getLocalDateString(d)); };
  const nextDay    = () => { if (!isToday) { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(getLocalDateString(d)); }};
  const goToday    = () => setSelectedDate(getLocalDateString());
  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ── Supabase state (replaces useLS) ──────────────────────────────────────
  const [allKicks,     setAllKicks]     = useState({});
  const [moods,        setMoods]        = useState({});
  const [symptoms,     setSymptoms]     = useState({});
  const [contractions, setContractions] = useState([]);
  const [loadingData,  setLoadingData]  = useState(true);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([dbGetKicks(), dbGetMoods(), dbGetSymptoms(), dbGetContractions()])
      .then(([k, m, s, c]) => {
        setAllKicks(k || {});
        setMoods(m || {});
        setSymptoms(s || {});
        setContractions(c || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  // ── Kick Counter ─────────────────────────────────────────────────────────
  const kd = allKicks[selectedDate] || { count: 0, times: [] };

  const addKick = () => {
    if (!isToday) return;
    const time = new Date().toTimeString().slice(0, 5);
    const newKd = { count: (kd.count || 0) + 1, times: [...(kd.times || []), time] };
    setAllKicks(prev => ({ ...prev, [selectedDate]: newKd }));
    dbSaveKick(selectedDate, newKd).catch(console.error);
  };

  const resetKicks = () => {
    const newKd = { count: 0, times: [] };
    setAllKicks(prev => ({ ...prev, [selectedDate]: newKd }));
    dbSaveKick(selectedDate, newKd).catch(console.error);
  };

  // ── Mood & Symptoms ──────────────────────────────────────────────────────
  const todayMood = moods[selectedDate];
  const todaySym  = symptoms[selectedDate] || [];

  const togSym = (s) => {
    const c = symptoms[selectedDate] || [];
    const newSym = c.includes(s) ? c.filter(x => x !== s) : [...c, s];
    setSymptoms(prev => ({ ...prev, [selectedDate]: newSym }));
    dbSaveSymptom(selectedDate, newSym).catch(console.error);
  };

  const setMood = (v) => {
    setMoods(prev => ({ ...prev, [selectedDate]: v }));
    dbSaveMood(selectedDate, v).catch(console.error);
  };

  const MOODS = [
    { v: 5, e: "😄", l: "Semangat" }, { v: 4, e: "🙂", l: "Baik" },
    { v: 3, e: "😐", l: "Biasa" },   { v: 2, e: "😔", l: "Kurang" },
    { v: 1, e: "😢", l: "Berat"  },
  ];

  // ── Contraction Timer ─────────────────────────────────────────────────────
  const [contracting,  setContracting]  = useState(false);
  const [contStart,    setContStart]    = useState(null);
  const [elapsed,      setElapsed]      = useState(0);
  const tmr = useRef();

  useEffect(() => {
    if (contracting) { tmr.current = setInterval(() => setElapsed(Math.floor((Date.now() - contStart) / 1000)), 500); }
    else             { clearInterval(tmr.current); }
    return () => clearInterval(tmr.current);
  }, [contracting, contStart]);

  const startC = () => { const t = Date.now(); setContStart(t); setContracting(true); setElapsed(0); };
  const stopC  = () => {
    const dur  = Math.floor((Date.now() - contStart) / 1000);
    const last = contractions[contractions.length - 1];
    const intv = last?.endTime ? Math.floor((contStart - last.endTime) / 1000) : null;
    const date = getLocalDateString();
    const newC = { id: genId(), startTime: contStart, endTime: Date.now(), duration: dur, interval: intv, date, time: new Date().toTimeString().slice(0, 5) };
    setContractions(p => [...p, newC]);
    setContracting(false);
    dbAddContraction(newC).catch(console.error);
  };

  const resetContractions = () => {
    setContractions(p => p.filter(c => (c.date || "") !== selectedDate));
    dbDeleteContractionsByDate(selectedDate).catch(console.error);
  };

  const fmtS = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Filter contractions for selected date
  const dayContractions = contractions.filter(c => (c.date || getLocalDateString(new Date(c.startTime || 0))) === selectedDate);
  const lastC   = [...dayContractions].slice(-5).reverse();
  const avgDur  = dayContractions.length > 1 ? Math.round(dayContractions.slice(-5).reduce((a, c) => a + c.duration, 0) / Math.min(dayContractions.length, 5)) : null;
  const avgInt  = dayContractions.filter(c => c.interval).length > 0
    ? Math.round(dayContractions.slice(-5).filter(c => c.interval).reduce((a, c) => a + (c.interval || 0), 0) / dayContractions.slice(-5).filter(c => c.interval).length)
    : null;
  const needRS  = avgDur && avgInt && avgDur >= 30 && avgInt <= 300;

  if (loadingData) {
    return (
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
        <span style={{ width: 36, height: 36, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
        <p style={{ fontFamily: "Lora,serif", color: "var(--dp)", fontSize: 14, fontWeight: 700 }}>Memuat data monitor...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="hdr">
        <div className="hdr-in">
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Pantau Harian</p>
          <h1 style={{ fontFamily: "Lora,serif", color: "#fff", fontSize: 26, fontWeight: 700 }}>Monitor 💗</h1>
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, marginTop: 4 }}>Data tersimpan otomatis per hari</p>
        </div>
      </div>

      <div style={{ padding: 18 }}>

        {/* ── Date Navigator ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--wh)", borderRadius: 14, padding: "10px 14px", marginBottom: 16, border: "1px solid var(--bd)", boxShadow: "0 2px 10px var(--sh)" }}>
          <button onClick={prevDay} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--mu)", padding: "0 4px" }}>‹</button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: "var(--tx)" }}>{displayDate}</p>
            {isToday
              ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sg2)", background: "rgba(123,166,138,.12)", borderRadius: 20, padding: "1px 8px" }}>Hari ini</span>
              : <button onClick={goToday} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--ro)", fontFamily: "Plus Jakarta Sans,sans-serif" }}>Kembali ke Hari ini →</button>
            }
          </div>
          <button onClick={nextDay} style={{ background: "none", border: "none", cursor: isToday ? "not-allowed" : "pointer", fontSize: 18, color: isToday ? "var(--bd)" : "var(--mu)", padding: "0 4px" }}>›</button>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          {[{ id: "kick", icon: "👶", l: "Kick" }, { id: "cont", icon: "⏱️", l: "Kontraksi" }, { id: "gejala", icon: "📝", l: "Gejala" }, { id: "bahaya", icon: "⚠️", l: "Bahaya" }].map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => handleTabChange(t.id)} style={{ fontSize: 11 }}>
              <span>{t.icon}</span><span>{t.l}</span>
            </button>
          ))}
        </div>

        {/* ── KICK COUNTER ── */}
        {tab === "kick" && (
          <div className="fu">
            {/* Mood */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em" }}>Mood</p>
                {todayMood && <span className="tag tsg" style={{ fontSize: 11 }}>Tersimpan ✓</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {MOODS.map(m => (
                  <button key={m.v} onClick={() => setMood(m.v)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: todayMood === m.v ? 1 : .3, transition: "all .2s", transform: todayMood === m.v ? "scale(1.25)" : "scale(1)" }}>
                    <span style={{ fontSize: 28 }}>{m.e}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mu)" }}>{m.l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kick Counter Card */}
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Kick Counter</p>
              <p style={{ fontSize: 12, color: "var(--mu)", marginBottom: 4 }}>Target 10 tendangan dalam 2 jam</p>
              <p style={{ fontSize: 12, color: "var(--mu)", marginBottom: 24 }}>Ketuk tombol setiap ada gerakan</p>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <button
                  className="kbtn" onClick={addKick}
                  style={{ opacity: isToday ? 1 : 0.5, cursor: isToday ? "pointer" : "not-allowed" }}
                >
                  <span style={{ fontSize: 34 }}>👶</span>
                  <span style={{ fontFamily: "Lora,serif", fontSize: 38, fontWeight: 700, color: "white", lineHeight: 1 }}>{kd.count}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>tendangan</span>
                </button>
              </div>

              {!isToday && (
                <div className="aam" style={{ marginBottom: 14, textAlign: "left" }}>
                  <p style={{ fontSize: 12 }}>📅 Lihat data <strong>{displayDate}</strong>. Hanya bisa menambahkan tendangan untuk hari ini.</p>
                </div>
              )}

              {kd.count >= 10 && <div className="asa" style={{ marginBottom: 14 }}><p style={{ fontWeight: 800 }}>🎉 Target tercapai! Janin aktif & sehat.</p></div>}
              {kd.count > 0 && kd.count < 10 && <p style={{ fontSize: 13, color: "var(--mu)", marginBottom: 12 }}>{10 - kd.count} tendangan lagi menuju target</p>}

              {kd.times?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginBottom: 14 }}>
                  {kd.times.map((t, i) => <span key={i} className="tag" style={{ fontSize: 10 }}>{i + 1}. {t}</span>)}
                </div>
              )}

              <button onClick={resetKicks} className="btn bg" style={{ width: "auto", padding: "10px 22px", margin: "20px auto 0" }}>Reset</button>
            </div>

            {/* Kick History — last 7 days */}
            {(() => {
              const history = [];
              for (let i = 1; i <= 6; i++) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const key = getLocalDateString(d);
                const data = allKicks[key];
                if (data && data.count > 0) history.push({ key, count: data.count, label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) });
              }
              if (!history.length) return null;
              return (
                <div className="card" style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Histori 7 Hari Terakhir</p>
                  {history.map(h => (
                    <div key={h.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--bd)" }}>
                      <span style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>{h.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: h.count >= 10 ? "var(--sg2)" : "var(--mu)" }}>{h.count} tendangan</span>
                        {h.count >= 10 && <span style={{ fontSize: 12 }}>✅</span>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CONTRACTION TIMER ── */}
        {tab === "cont" && (
          <div className="fu">
            {!isToday && (
              <div className="aam" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12 }}>📅 Melihat data <strong>{displayDate}</strong>. Timer hanya bisa digunakan untuk hari ini.</p>
              </div>
            )}
            {needRS && (
              <div className="are" style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>🚨</span>
                  <p style={{ fontWeight: 800, fontSize: 14 }}>Segera Ke RS!</p>
                </div>
                <p>Pola kontraksi menunjukkan persalinan aktif (durasi ≥30 dtk, interval ≤5 mnt).</p>
              </div>
            )}

            <div className="card" style={{ textAlign: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
                Ketuk MULAI saat kontraksi dimulai, SELESAI saat berhenti
              </p>
              {contracting && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontFamily: "Lora,serif", fontSize: 48, fontWeight: 700, color: "var(--ro)" }}>{fmtS(elapsed)}</p>
                  <p style={{ fontSize: 12, color: "var(--mu)" }}>durasi kontraksi berjalan</p>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                {isToday ? (
                  !contracting
                    ? <button className="cbtn cst" onClick={startC}><span style={{ fontSize: 28 }}>⏱️</span><span style={{ fontSize: 15, fontWeight: 800 }}>MULAI</span></button>
                    : <button className="cbtn csp" onClick={stopC}><span style={{ fontSize: 28 }}>⏹️</span><span style={{ fontSize: 15, fontWeight: 800 }}>SELESAI</span></button>
                ) : (
                  <div style={{ width: 130, height: 130, borderRadius: "50%", background: "var(--psm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: 12, color: "var(--mu)", textAlign: "center", padding: 16 }}>Timer hanya untuk hari ini</p>
                  </div>
                )}
              </div>
              {avgDur && (
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="chip"><span className="cv">{fmtS(avgDur)}</span><span className="cl">Rata Durasi</span></div>
                  {avgInt && <div className="chip"><span className="cv">{fmtS(avgInt)}</span><span className="cl">Rata Interval</span></div>}
                  <div className="chip"><span className="cv">{dayContractions.length}</span><span className="cl">Hari ini</span></div>
                </div>
              )}
            </div>

            {lastC.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Kontraksi Hari Ini</p>
                {lastC.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < lastC.length - 1 ? "1px solid var(--bd)" : "none" }}>
                    <div><p style={{ fontWeight: 700, fontSize: 13, color: "var(--tx)" }}>{c.time}</p>{c.interval && <p style={{ fontSize: 11, color: "var(--mu)" }}>Jeda: {fmtS(c.interval)}</p>}</div>
                    <span className="tag">{fmtS(c.duration)}</span>
                  </div>
                ))}
                {isToday && (
                  <button onClick={resetContractions} className="btn bg" style={{ marginTop: 12 }}>Reset Hari Ini</button>
                )}
              </div>
            )}

            <div className="aam">
              <p style={{ fontWeight: 800, marginBottom: 4 }}>ℹ️ Aturan 5-1-1</p>
              <p>Pergi ke RS jika kontraksi <strong>30–70 detik</strong>, setiap <strong>5 menit</strong>, selama <strong>1 jam</strong>.</p>
            </div>
          </div>
        )}

        {/* ── GEJALA ── */}
        {tab === "gejala" && (
          <div className="fu">
            <div className="card" style={{ marginBottom: 14 }}>
              <p style={{ fontFamily: "Lora,serif", fontSize: 17, fontWeight: 700, color: "var(--tx)", marginBottom: 4 }}>Keluhan Hari Ini</p>
              <p style={{ fontSize: 13, color: "var(--mu)", marginBottom: 16 }}>{displayDate} · centang yang kamu rasakan</p>
              {GEJALA.map(g => (
                <div key={g} className="ci" onClick={() => togSym(g)}>
                  <div className={`cb ${todaySym.includes(g) ? "on" : ""}`}>{todaySym.includes(g) && "✓"}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{g}</span>
                </div>
              ))}
            </div>

            {todaySym.length > 0 && (
              <div className="asa">
                <p style={{ fontWeight: 800, marginBottom: 6 }}>📋 Siap Dilaporkan ke Dokter:</p>
                <p style={{ fontSize: 13, lineHeight: 1.7 }}>Keluhan pada {displayDate}:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                  {todaySym.map((s, i) => <span key={i} className="tag tsg" style={{ fontSize: 11 }}>{s}</span>)}
                </div>
              </div>
            )}

            {/* Symptom History */}
            {(() => {
              const history = [];
              for (let i = 1; i <= 6; i++) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const key = getLocalDateString(d);
                const syms = symptoms[key];
                if (syms && syms.length > 0) history.push({ key, syms, label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) });
              }
              if (!history.length) return null;
              return (
                <div className="card" style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Histori Gejala</p>
                  {history.map(h => (
                    <div key={h.key} style={{ padding: "8px 0", borderBottom: "1px solid var(--bd)" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", marginBottom: 4 }}>{h.label}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {h.syms.map((s, i) => <span key={i} className="tag" style={{ fontSize: 10 }}>{s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TANDA BAHAYA ── */}
        {tab === "bahaya" && (
          <div className="fu">
            <div className="are" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 17 }}>⚠️</span>
                <p style={{ fontWeight: 800, fontSize: 15 }}>Segera ke IGD jika mengalami:</p>
              </div>
              <p style={{ fontSize: 12 }}>Jangan tunda! Ini bisa tanda kondisi darurat.</p>
            </div>
            <div className="card" style={{ marginBottom: 14 }}>
              {TANDA_BAHAYA.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: i < TANDA_BAHAYA.length - 1 ? "1px solid var(--bd)" : "none" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)" }}>{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
