// ─── ROOT APP COMPONENT ───────────────────────────────────────────────────
function App() {
  const [tab,       setTab]       = useState("home");
  const [unlocked,  setUnlocked]  = useState(false);
  const [profil,    setProfil]    = useState({});
  const [kunjungan, setKunjungan] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Prevent iOS pinch-zoom & input-focus zoom
  useEffect(() => {
    let vp = document.querySelector('meta[name="viewport"]');
    if (!vp) { vp = document.createElement("meta"); vp.name = "viewport"; document.head.appendChild(vp); }
    vp.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
    document.documentElement.style.touchAction = "manipulation";
  }, []);

  // Load data from Supabase after unlock
  useEffect(() => {
    if (!unlocked) { setLoading(false); return; }
    setLoading(true);
    Promise.all([dbGetProfil(), dbGetKunjungan()])
      .then(([p, k]) => { setProfil(p || {}); setKunjungan(k || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [unlocked]);

  // ── Profil API ─────────────────────────────────────────────────────────────
  const updateProfil = (newProfil) => {
    setProfil(newProfil);
    dbSaveProfil(newProfil).catch(console.error);
  };

  // ── Kunjungan API ──────────────────────────────────────────────────────────
  const addKunjungan = async (visit) => {
    await dbUpsertKunjungan(visit);
    setKunjungan(p => [...p, visit]);
  };

  const updateKunjungan = async (visit) => {
    await dbUpsertKunjungan(visit);
    setKunjungan(p => p.map(v => v.id === visit.id ? visit : v));
  };

  const deleteKunjungan = async (id) => {
    await dbDeleteKunjungan(id);
    setKunjungan(p => p.filter(v => v.id !== id));
  };

  const TABS = [
    { id: "home",      icon: "🏠", label: "Beranda"   },
    { id: "kunjungan", icon: "📒", label: "Kunjungan" },
    { id: "ringkasan", icon: "📄", label: "Ringkasan" },
    { id: "monitor",   icon: "💗", label: "Monitor"   },
    { id: "profil",    icon: "👤", label: "Profil"    },
  ];

  const screenRef = useRef();
  const scrollToTop = () => { if (screenRef.current) screenRef.current.scrollTop = 0; };

  const [monitorSubTab, setMonitorSubTab] = useState("kick");
  const navigateToTab = (t, sub = "kick") => {
    setTab(t);
    setMonitorSubTab(sub);
    scrollToTop();
  };

  const renderScreen = () => {
    switch (tab) {
      case "home":      return <HomeScreen      profil={profil} kunjungan={kunjungan} go={navigateToTab} />;
      case "kunjungan": return <KunjunganScreen kunjungan={kunjungan} addKunjungan={addKunjungan} updateKunjungan={updateKunjungan} deleteKunjungan={deleteKunjungan} profil={profil} />;
      case "ringkasan": return <RingkasanScreen profil={profil} kunjungan={kunjungan} />;
      case "monitor":   return <MonitorScreen   initialTab={monitorSubTab} setInitialTab={setMonitorSubTab} />;
      case "profil":    return <ProfilScreen    profil={profil} setProfil={updateProfil} kunjungan={kunjungan} />;
      default:          return null;
    }
  };

  // Selalu render .shell agar ukuran konsisten (PIN / loading / app)
  const shellContent = !unlocked ? (
    <PinScreen onUnlock={() => setUnlocked(true)} />
  ) : loading ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <span style={{ width: 44, height: 44, border: "3px solid rgba(90,138,110,.2)", borderTop: "3px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
      <p style={{ fontFamily: "Lora,serif", color: "var(--dp)", fontSize: 16, fontWeight: 700 }}>Memuat data...</p>
    </div>
  ) : (
    <>
      <div ref={screenRef} className="screen">{renderScreen()}</div>
      <nav className="bnav">
        {TABS.map(t => (
          <button key={t.id} className={`ni ${tab === t.id ? "on" : ""}`} onClick={() => { setTab(t.id); scrollToTop(); }}>
            <span className="ni-i">{t.icon}</span>
            <span className="ni-l">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">{shellContent}</div>
    </>
  );
}
