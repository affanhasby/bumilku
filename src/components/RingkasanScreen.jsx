// ─── RINGKASAN SCREEN ─────────────────────────────────────────────────────
function RingkasanScreen({ profil, kunjungan }) {
  const [copied,      setCopied]      = useState(false);
  const [aiCopied,    setAiCopied]    = useState(false);
  const [viewingFile, setViewingFile] = useState(null);

  // Helper to calculate age from birthdate
  const getAge = (dob) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "-";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const parts = dob.split("-"); // YYYY-MM-DD
    const formattedDob = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dob;
    return `${age} tahun (Lahir ${formattedDob})`;
  };

  // Helper to render AI Markdown text cleanly into stylized lists, bold tags, and headings
  const renderCleanAI = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      let cleaned = line.trim();
      if (!cleaned) return <div key={idx} style={{ height: 8 }} />;
      
      // Detect and handle markdown headers
      let isHeading = false;
      let headingLevel = 0;
      if (cleaned.startsWith("###")) {
        isHeading = true;
        headingLevel = 3;
        cleaned = cleaned.replace(/^###\s*/, "");
      } else if (cleaned.startsWith("##")) {
        isHeading = true;
        headingLevel = 2;
        cleaned = cleaned.replace(/^##\s*/, "");
      } else if (cleaned.startsWith("#")) {
        isHeading = true;
        headingLevel = 1;
        cleaned = cleaned.replace(/^#\s*/, "");
      }

      // Convert list item * or - to bullet point
      let isBullet = false;
      if (cleaned.startsWith("* ") || cleaned.startsWith("- ") || cleaned.startsWith("• ")) {
        isBullet = true;
        cleaned = cleaned.replace(/^[\*\-•]\s*/, "");
      }
      
      // Strip any leading bullet indicator that is just an asterisk without space
      if (cleaned.startsWith("*") && !cleaned.startsWith("**")) {
        isBullet = true;
        cleaned = cleaned.replace(/^\*\s*/, "");
      }

      // Strip extra spaces left over
      cleaned = cleaned.trim();
      
      // Parse bold text **something** into <strong>something</strong>
      const parts = cleaned.split("**");
      const content = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} style={{ color: "var(--dp)", fontWeight: 800 }}>{part}</strong>;
        }
        return part;
      });

      if (isHeading) {
        const fontSize = headingLevel === 1 ? 16 : headingLevel === 2 ? 14 : 13;
        return (
          <p key={idx} style={{
            fontSize,
            fontWeight: 800,
            color: "var(--dp)",
            marginTop: 16,
            marginBottom: 8,
            fontFamily: "Lora, serif"
          }}>
            {content}
          </p>
        );
      }

      return (
        <p key={idx} style={{ 
          fontSize: 13, 
          lineHeight: "1.75", 
          marginBottom: isBullet ? "4px" : "12px",
          paddingLeft: isBullet ? "14px" : "0px",
          textIndent: isBullet ? "-14px" : "0px",
          color: "var(--tx)",
          fontWeight: isBullet ? 500 : 400
        }}>
          {isBullet ? "• " : ""}{content}
        </p>
      );
    });
  };

  // Helper to convert Markdown text into clean HTML string for the PDF report
  const markdownToHtml = (text) => {
    if (!text) return "";
    return text.split("\n").map(line => {
      let cleaned = line.trim();
      if (!cleaned) return '<div style="height: 6px;"></div>';
      
      let isHeading = false;
      let headingLevel = 0;
      if (cleaned.startsWith("###")) {
        isHeading = true;
        headingLevel = 3;
        cleaned = cleaned.replace(/^###\s*/, "");
      } else if (cleaned.startsWith("##")) {
        isHeading = true;
        headingLevel = 2;
        cleaned = cleaned.replace(/^##\s*/, "");
      } else if (cleaned.startsWith("#")) {
        isHeading = true;
        headingLevel = 1;
        cleaned = cleaned.replace(/^#\s*/, "");
      }

      let isBullet = false;
      if (cleaned.startsWith("* ") || cleaned.startsWith("- ") || cleaned.startsWith("• ")) {
        isBullet = true;
        cleaned = cleaned.replace(/^[\*\-•]\s*/, "");
      } else if (cleaned.startsWith("*") && !cleaned.startsWith("**")) {
        isBullet = true;
        cleaned = cleaned.replace(/^\*\s*/, "");
      }

      // Strip extra spaces
      cleaned = cleaned.trim();

      // Replace markdown bold with strong tags
      const parts = cleaned.split("**");
      const content = parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return `<strong style="color: #7A3A30; font-weight: 800;">${part}</strong>`;
        }
        return part;
      }).join("");

      if (isHeading) {
        const fontSize = headingLevel === 1 ? "14px" : headingLevel === 2 ? "12px" : "11px";
        return `<h${headingLevel} style="font-size: ${fontSize}; font-weight: 800; color: #7A3A30; margin-top: 14px; margin-bottom: 6px; font-family: 'Lora', serif;">${content}</h${headingLevel}>`;
      }

      if (isBullet) {
        return `<p style="margin: 3px 0 3px 12px; padding-left: 0px; text-indent: -10px; font-weight: 500; line-height: 1.5;">• ${content}</p>`;
      }

      return `<p style="margin: 0 0 8px 0; line-height: 1.5;">${content}</p>`;
    }).join("");
  };

  // ── Overall AI Summary States ───────────────────────────────────────────
  const [apiKey, setApiKey] = useState("");
  const [gmModel]                 = useLS("gm_model", "gemini-2.5-flash");
  const [aiSummaryOverall, setAiSummaryOverallState] = useState("");
  const saveAiSummary = (text) => {
    setAiSummaryOverallState(text);
    dbSetConfig("ai_summary_overall", text).catch(console.error);
  };
  const [isEditingAI,     setIsEditingAI]     = useState(false);
  const [tempAIVal,       setTempAIVal]       = useState("");
  const [loadingAI,       setLoadingAI]       = useState(false);
  const [aiError,         setAiError]         = useState("");
  const [aiDebugInfo,     setAiDebugInfo]     = useState(null);
  const [showDebug,       setShowDebug]       = useState(false);
  const [isAIMinimized,   setIsAIMinimized]   = useState(true);
  const [ringkasanTab,    setRingkasanTab]    = useState("ringkasan");
  const [showAllVisits,   setShowAllVisits]   = useState(false);

  // ── Monitor data states (populated by useEffect below) ───────────────────
  const [kicksData,       setKicksData]       = useState({});
  const [moodsData,       setMoodsData]       = useState({});
  const [symptomsData,    setSymptomsData]    = useState({});
  const [contractionsData,setContractionsData]= useState([]);

  // ── Load monitor data + AI summary from Supabase ──────────────────────────
  useEffect(() => {
    Promise.all([
      dbGetKicks(), dbGetMoods(), dbGetSymptoms(), dbGetContractions(),
      dbGetConfig("ai_summary_overall"),
      db.rpc("get_gemini_key"),
    ]).then(([k, m, s, c, aiSum, gmRes]) => {
      setKicksData(k || {});
      setMoodsData(m || {});
      setSymptomsData(s || {});
      setContractionsData(c || []);
      setAiSummaryOverallState(aiSum || "");
      if (gmRes.data) setApiKey(gmRes.data);
    }).catch(console.error);
  }, []);

  // ── Visit data (chronological for trends, last = newest) ─────────────────
  const sorted = [...kunjungan]
    .map((v, i) => ({ ...v, _idx: i }))
    .sort((a, b) => {
      const dateA = a.tanggal || "";
      const dateB = b.tanggal || "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a._idx - b._idx;
    });
  const last      = sorted[sorted.length - 1];

  // Consolidated unique medications prescribed across all visits
  const uniqueMeds = Array.from(
    new Set(sorted.flatMap(v => v.obat || []))
  ).filter(Boolean);
  const week      = calcWeek(profil.hpht);
  const dayInWeek = calcDay(profil.hpht) % 7;
  const hpl       = calcHPL(profil.hpht);
  const dl        = daysLeft(profil.hpht);
  const today     = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const todayKey  = getLocalDateString();
  const tdStr     = (v) => v?.tdSis && v?.tdDia ? `${v.tdSis}/${v.tdDia} mmHg` : (v?.tekananDarah || "-");

  // ── Monitor data aliases ──────────────────────────────────────────────────
  const kicks       = kicksData;
  const moods       = moodsData;
  const symptoms    = symptomsData;
  const contractions= contractionsData;

  const todayKick  = kicks[todayKey]   || { count: 0, times: [] };
  const todayMood  = moods[todayKey];
  const todaySym   = symptoms[todayKey] || [];
  const todayCont  = contractions.filter(c => {
    if (!c.startTime) return false;
    return getLocalDateString(new Date(c.startTime)) === todayKey;
  });
  const MOODS_MAP = { 5: "😄 Semangat", 4: "🙂 Baik", 3: "😐 Biasa", 2: "😔 Kurang", 1: "😢 Berat" };

  // ── Warning flags ─────────────────────────────────────────────────────────
  const warnTD  = last && last.tdSis && parseInt(last.tdSis) >= 140;
  const warnDJJ = last && last.djj && (parseInt(last.djj) < 110 || parseInt(last.djj) > 170);

  // ── Trend data ────────────────────────────────────────────────────────────
  const bbHistory = sorted.filter(v => v.bb).map(v => ({ date: fmtShort(v.tanggal), val: parseFloat(v.bb) }));
  const tdHistory = sorted
    .map(v => {
      if (v.tdSis) return { date: fmtShort(v.tanggal), sis: parseInt(v.tdSis), dia: parseInt(v.tdDia || 0) };
      if (v.tekananDarah) {
        const parts = String(v.tekananDarah).split("/");
        if (parts.length === 2 && !isNaN(parseInt(parts[0]))) return { date: fmtShort(v.tanggal), sis: parseInt(parts[0]), dia: parseInt(parts[1] || 0) };
      }
      return null;
    })
    .filter(Boolean);

  // ── AI Overall Summary Generator Function ────────────────────────────────
  const generateOverallAI = async () => {
    if (!apiKey) {
      setAiError("❌ API Key Gemini belum diisi. Buka tab Profil → Setup AI.");
      return;
    }
    setLoadingAI(true);
    setAiError("");
    let promptText = "";
    try {
      const visitsFormatted = sorted.map((v, idx) => {
        return `Kunjungan #${idx + 1} (${v.tanggal || "Tanpa Tanggal"}):
- Usia Kehamilan: ${v.usiaKehamilan || "-"} minggu
- Berat Badan: ${v.bb || "-"} kg
- Tekanan Darah: ${v.tdSis && v.tdDia ? `${v.tdSis}/${v.tdDia}` : (v.tekananDarah || "-")} mmHg
- Detak Jantung Janin (DJJ): ${v.djj || "-"} bpm
- Tinggi Fundus: ${v.fundus || "-"} cm
- Posisi Janin: ${v.posisiJanin || "-"}
- Estimasi Berat Janin (EFW): ${v.beratJanin || "-"} gram
- AFI Cairan Ketuban: ${v.afi || "-"} cm
- Resep Obat: ${v.obat?.length ? v.obat.join(", ") : "-"}
- Catatan Dokter: ${v.catatan || "-"}
- Ringkasan Pemeriksaan/USG: ${v.aiSummary || "-"}`;
      }).join("\n\n");

      promptText = `Kamu adalah asisten medis untuk ibu hamil di Indonesia. Buat ringkasan klinis SINGKAT yang bisa dibaca dokter dalam 10 detik. Tidak perlu analisis panjang — dokter sudah punya rekam medis sendiri.

DATA PASIEN:
- Nama: ${profil.namaIbu || "-"} | Usia: ${getAge(profil.tanggalLahirIbu)} | Gol. Darah: ${profil.golonganDarah || "-"}
- Usia Kehamilan: ${week} Minggu ${dayInWeek} Hari | HPL: ${fmtDate(getLocalDateString(hpl))} | Kehamilan ke-${profil.kehamilanKe || "?"}
- Riwayat Medis/Alergi: ${profil.riwayatMedis || "Tidak ada"}

KUNJUNGAN TERAKHIR (${last ? last.tanggal : "-"}):
- TD: ${last?.tdSis && last?.tdDia ? `${last.tdSis}/${last.tdDia} mmHg` : "-"} | BB Ibu: ${last?.bb ? `${last.bb} kg` : "-"} | DJJ: ${last?.djj ? `${last.djj} bpm` : "-"}
- EFW: ${last?.beratJanin ? `${last.beratJanin} gram` : "-"} | AFI: ${last?.afi ? `${last.afi} cm` : "-"} | Posisi: ${last?.posisiJanin || "-"}
- Obat: ${last?.obat?.length ? last.obat.join(", ") : "-"}
${last?.catatan ? `- Catatan dokter sebelumnya: "${last.catatan}"` : ""}

MONITOR HARIAN HARI INI (${today}):
- Gerakan janin: ${todayKick.count} tendangan | Keluhan: ${todaySym.length ? todaySym.join(", ") : "Tidak ada"} | Kontraksi: ${todayCont.length}x

SEMUA RIWAYAT KUNJUNGAN:
${visitsFormatted || "Belum ada riwayat kunjungan."}

TUGAS: Buat ringkasan klinis SINGKAT dengan format PERSIS seperti ini (gunakan emoji, isi sesuai data, tidak perlu kalimat panjang):

🤰 Status: Trimester [1/2/3] · Minggu [X] · HPL [tanggal]

📊 Vital Terakhir ([tanggal kunjungan]):
• TD [X/X mmHg] · BB [X kg] · DJJ [X bpm]
• EFW [X gram] · AFI [X cm] · Posisi [kepala/sungsang/lintang]

📝 Keluhan aktif: [sebutkan dari monitor harian, atau "Tidak ada"]

👶 Gerakan janin hari ini: [X]x [(✅ target tercapai) atau (⚠️ kurang dari target 10)]

⚠️ Perlu perhatian: [sebutkan nilai abnormal jika ada — TD ≥140/90, DJJ <110 atau >170, dll. Jika semua normal tulis "Semua parameter dalam batas normal ✅"]

💊 Obat/suplemen: [daftar dari semua kunjungan, atau "Tidak ada"]

Aturan ketat:
- Maksimal 10 baris total, tidak boleh lebih
- Tidak perlu analisis, tren, rekomendasi, atau penjelasan panjang
- Langsung ke data, padat, mudah dibaca sekilas
- Gunakan tanda ⚠️ hanya jika benar-benar ada nilai abnormal`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gmModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
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
        throw new Error(errMsg);
      }

      const data = await res.json();
      console.log("DEBUG BumilKu - Generated Prompt:", promptText);
      console.log("DEBUG BumilKu - Gemini API Response:", data);

      if (data?.promptFeedback?.blockReason) {
        throw new Error(`Permintaan diblokir filter keamanan Google: ${data.promptFeedback.blockReason}.`);
      }

      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason === "SAFETY") {
        throw new Error("Generasi laporan terhenti di tengah jalan karena kebijakan keamanan AI (SAFETY). Silakan periksa kembali apakah ada data sensitif.");
      }

      const txt = candidate?.content?.parts?.[0]?.text || "";
      if (!txt) throw new Error("Tidak ada respon dari model.");

      saveAiSummary(txt.trim());
      setAiDebugInfo({
        model: gmModel,
        prompt: promptText,
        rawResponse: txt,
        finishReason: finishReason || "STOP",
        status: "Success",
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setAiError(`❌ Gagal generate AI: ${err.message}`);
      setAiDebugInfo({
        model: gmModel,
        prompt: promptText || "Belum dibuat",
        rawResponse: "",
        finishReason: "ERROR",
        status: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // ── Plain-text summary for sharing (WA friendly) ────────────────────────
  const allVisitsWA = sorted.length > 0 ? [...sorted].reverse().map((v, i) => {
    const isHighTD = v.tdSis && parseInt(v.tdSis) >= 140;
    const isBadDJJ = v.djj && (parseInt(v.djj) < 110 || parseInt(v.djj) > 170);
    return `🗓️ *Kunjungan K-${sorted.length - i} (${fmtShort(v.tanggal)})* - Mgg ${v.usiaKehamilan || "?"}
• Tensi: ${tdStr(v)} ${isHighTD ? "⚠️ TINGGI" : "✓"} | BB: ${v.bb ? v.bb + " kg" : "-"}
• DJJ: ${v.djj ? v.djj + " bpm" : "-"} ${isBadDJJ ? "⚠️ KELUAR BATAS" : "✓"} | TFU: ${v.fundus ? v.fundus + " cm" : "-"}
• Janin: Posisi ${v.posisiJanin ? v.posisiJanin.split("(")[0].trim() : "-"} | EFW: ${v.beratJanin ? v.beratJanin + " gr" : "-"}
• Ketuban (AFI): ${v.afi ? v.afi + " cm" : "-"}
• Obat/Resep: ${v.obat?.length > 0 ? v.obat.join(", ") : "-"}
${v.catatan ? `• Catatan: "${v.catatan}"` : ""}`;
  }).join("\n\n") : "• Belum ada riwayat kunjungan.";

  const summaryText = `📋 *RINGKASAN MEDIS BUMILKU*
*Dicetak:* ${today}

👤 *IDENTITAS BUNDA*
• Ibu: ${profil.namaIbu || "-"}
• Usia Ibu: ${getAge(profil.tanggalLahirIbu)}
• Golongan Darah: ${profil.golonganDarah || "-"}
• Usia Kehamilan: ${week} Mgg ${dayInWeek} Hari
• HPL: ${fmtShort(getLocalDateString(hpl))} (${dl} hari lagi)
• Faskes: ${profil.namaRS || "-"} (${profil.namaDokter ? "dr. " + profil.namaDokter : "-"})

${aiSummaryOverall ? `🤖 *RINGKASAN PERKEMBANGAN AI*
${aiSummaryOverall}

` : ""}🩺 *RIWAYAT KUNJUNGAN MEDIS (${sorted.length} Kunjungan)*
${allVisitsWA}

💗 *MONITOR HARIAN HARI INI*
• Gerakan: ${todayKick.count}x tendangan ${todayKick.count >= 10 ? "✅" : "⚠️ (Kurang)"}
• Mood: ${todayMood ? MOODS_MAP[todayMood] : "Belum diisi"}
• Keluhan: ${todaySym.length > 0 ? todaySym.join(", ") : "Tidak ada keluhan"}
• Kontraksi: ${todayCont.length > 0 ? `${todayCont.length}x` : "Tidak ada"}

💊 *OBAT & SUPLEMEN YANG DIKONSUMSI*
${uniqueMeds.length > 0 ? uniqueMeds.map(m => `• ${m}`).join("\n") : "• Tidak ada obat/suplemen yang dikonsumsi"}

🚨 *ALERGI & RIWAYAT*
• ${profil.riwayatMedis || "Tidak ada"}

📞 *KONTAK*
• Hubungi: Dokter (${profil.noTeleponDokter || "-"}) | Keluarga (${profil.noTeleponDarurat || "-"})`;

  const copy = () => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const exportToPDF = () => {
    const element = document.createElement("div");
    element.style.background = "#ffffff";
    element.style.width = "750px";
    element.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .pdf-container {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          color: #3D2B26;
          background: #ffffff;
          padding: 30px;
          box-sizing: border-box;
        }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #E07B6A;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .pdf-logo {
          font-family: 'Lora', Georgia, serif;
          color: #E07B6A;
          font-size: 24px;
          margin: 0;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .pdf-title {
          font-size: 10px;
          color: #A08880;
          margin: 2px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .pdf-meta {
          text-align: right;
          font-size: 11px;
          color: #3D2B26;
        }
        .pdf-meta-date {
          font-weight: 700;
        }
        .pdf-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .pdf-card {
          background: #FAF0E6;
          border: 1px solid #EEE0D6;
          border-radius: 12px;
          padding: 16px;
        }
        .pdf-card.peach {
          background: #FEF3EE;
          border-color: #FDEEE6;
        }
        .pdf-card-title {
          font-family: 'Lora', serif;
          color: #7A3A30;
          font-size: 13px;
          margin: 0 0 10px 0;
          border-bottom: 1px solid #EEDCD0;
          padding-bottom: 6px;
          font-weight: 700;
        }
        .pdf-table-mini {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
        }
        .pdf-table-mini td {
          padding: 4px 0;
        }
        .pdf-table-mini td.label {
          color: #A08880;
          font-weight: 500;
          width: 40%;
        }
        .pdf-table-mini td.value {
          font-weight: 700;
          color: #3D2B26;
          text-align: right;
        }
        .pdf-section {
          background: #ffffff;
          border: 1px solid #EEE0D6;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          page-break-inside: avoid;
        }
        .pdf-section-title {
          font-family: 'Lora', serif;
          color: #7A3A30;
          font-size: 13px;
          margin: 0 0 12px 0;
          border-bottom: 1px solid #EEE0D6;
          padding-bottom: 6px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pdf-metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }
        .pdf-metric-card {
          background: #FAF0E6;
          border-radius: 8px;
          padding: 8px;
          text-align: center;
          border: 1px solid transparent;
        }
        .pdf-metric-card.warn {
          background: #FEF2F2;
          border-color: #FECACA;
        }
        .pdf-metric-label {
          font-size: 9px;
          color: #A08880;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
        }
        .pdf-metric-label.warn {
          color: #DC2626;
        }
        .pdf-metric-value {
          font-size: 14px;
          color: #7A3A30;
          font-weight: 700;
          display: block;
          margin-top: 4px;
        }
        .pdf-metric-value.warn {
          color: #DC2626;
        }
        .pdf-details-table {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .pdf-details-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #FAF0E6;
        }
        .pdf-details-table tr:last-child td {
          border-bottom: none;
        }
        .pdf-details-table td.label {
          color: #A08880;
          font-weight: 500;
          width: 25%;
        }
        .pdf-details-table td.value {
          font-weight: 700;
          color: #3D2B26;
        }
        .pdf-ai-summary-box {
          background: rgba(123, 166, 138, 0.06);
          border: 1px dashed rgba(123, 166, 138, 0.4);
          border-radius: 10px;
          padding: 12px;
          margin-top: 10px;
          font-size: 11px;
          line-height: 1.5;
        }
        .pdf-ai-summary-title {
          color: #5A8A6E;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 10px;
          margin: 0 0 6px 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pdf-monitor-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .pdf-monitor-card {
          background: #FFF;
          border: 1px solid #EEE0D6;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .pdf-monitor-card.green {
          background: rgba(123, 166, 138, 0.06);
          border-color: rgba(123, 166, 138, 0.3);
        }
        .pdf-monitor-card.yellow {
          background: #FFFBEB;
          border-color: #FDE68A;
        }
        .pdf-trends-table {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
        }
        .pdf-trends-table th {
          background: #FAF0E6;
          color: #7A3A30;
          font-weight: 700;
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid #EEE0D6;
        }
        .pdf-trends-table td {
          padding: 6px 8px;
          border-bottom: 1px dashed #EEE0D6;
        }
        .pdf-trends-table tr:last-child td {
          border-bottom: none;
        }
        .pdf-footer {
          margin-top: 30px;
          text-align: center;
          border-top: 1px solid #EEE0D6;
          padding-top: 12px;
          font-size: 9px;
          color: #A08880;
          line-height: 1.4;
          page-break-inside: avoid;
        }
      </style>
      
      <div class="pdf-container">
        <!-- Header -->
        <div class="pdf-header">
          <div>
            <h1 class="pdf-logo">BumilKu 📒</h1>
            <p class="pdf-title">Laporan Ringkasan Medis Kehamilan</p>
          </div>
          <div class="pdf-meta">
            <p><span class="pdf-meta-date">Tanggal Cetak:</span> ${today}</p>
            <p style="font-size: 9px; color: #A08880; margin-top: 2px;">Buku Kesehatan Ibu & Anak Digital</p>
          </div>
        </div>

        <!-- Demographics & Pregnancy Status Grid -->
        <div class="pdf-grid-2">
          <!-- Profil Ibu -->
          <div class="pdf-card">
            <h3 class="pdf-card-title">👤 Identitas Bunda</h3>
            <table class="pdf-table-mini">
              <tr><td class="label">Nama Ibu</td><td class="value">${profil.namaIbu || "-"}</td></tr>
              <tr><td class="label">Gol. Darah</td><td class="value">${profil.golonganDarah || "-"}</td></tr>
              <tr><td class="label">HPHT</td><td class="value">${fmtDate(profil.hpht)}</td></tr>
              <tr><td class="label">Kehamilan ke-</td><td class="value">${profil.kehamilanKe || "-"}</td></tr>
              <tr><td class="label">Riwayat Medis</td><td class="value" style="font-size: 10px; font-style: italic;">${profil.riwayatMedis || "Tidak ada"}</td></tr>
            </table>
          </div>

          <!-- Status Medis -->
          <div class="pdf-card peach">
            <h3 class="pdf-card-title" style="color: #E07B6A;">🤰 Status Kehamilan</h3>
            <table class="pdf-table-mini">
              <tr><td class="label">Usia Kehamilan</td><td class="value" style="color: #7A3A30;">${week} Mgg ${dayInWeek} Hari</td></tr>
              <tr><td class="label">Taksiran Lahir (HPL)</td><td class="value">${fmtDate(getLocalDateString(hpl))}</td></tr>
              <tr><td class="label">Sisa Waktu HPL</td><td class="value" style="color: #E07B6A;">${dl} Hari Lagi</td></tr>
              <tr><td class="label">Faskes Utama</td><td class="value">${profil.namaRS || "-"}</td></tr>
              <tr><td class="label">Dokter Kandungan</td><td class="value">${profil.namaDokter ? "dr. " + profil.namaDokter : "-"}</td></tr>
            </table>
          </div>
        </div>

        <!-- AI Integrated Summary (If Generated) -->
        ${aiSummaryOverall ? `
        <div class="pdf-section" style="border-color: rgba(123, 166, 138, 0.4); background: linear-gradient(135deg, rgba(123,166,138,0.04), rgba(255,255,255,0));">
          <h3 class="pdf-section-title" style="color: #5A8A6E; border-bottom-color: rgba(123, 166, 138, 0.2);">🤖 Ringkasan AI Perkembangan Kehamilan Terpadu</h3>
          <div style="font-size: 11px; color: #3D2B26;">${markdownToHtml(aiSummaryOverall)}</div>
        </div>
        ` : ""}

        <!-- Last Visit Data -->
        <div class="pdf-section">
          <h3 class="pdf-section-title">🩺 Data Pemeriksaan Kunjungan Terakhir (${last ? fmtShort(last.tanggal) : "Belum ada"})</h3>
          
          <div class="pdf-metrics-row">
            <div class="pdf-metric-card">
              <span class="pdf-metric-label">Berat Badan</span>
              <strong class="pdf-metric-value">${last?.bb ? `${last.bb} kg` : "-"}</strong>
            </div>
            <div class="pdf-metric-card ${warnTD ? "warn" : ""}">
              <span class="pdf-metric-label ${warnTD ? "warn" : ""}">Tensi Darah ${warnTD ? "⚠️" : ""}</span>
              <strong class="pdf-metric-value ${warnTD ? "warn" : ""}">${tdStr(last)}</strong>
            </div>
            <div class="pdf-metric-card ${warnDJJ ? "warn" : ""}">
              <span class="pdf-metric-label ${warnDJJ ? "warn" : ""}">DJJ Janin ${warnDJJ ? "⚠️" : ""}</span>
              <strong class="pdf-metric-value ${warnDJJ ? "warn" : ""}">${last?.djj ? `${last.djj} bpm` : "-"}</strong>
            </div>
            <div class="pdf-metric-card">
              <span class="pdf-metric-label">Berat Janin (EFW)</span>
              <strong class="pdf-metric-value">${last?.beratJanin ? `${last.beratJanin} gr` : "-"}</strong>
            </div>
          </div>

          <table class="pdf-details-table">
            <tr>
              <td class="label">Tinggi Fundus (TFU)</td>
              <td class="value" style="width: 30%;">${last?.fundus ? `${last.fundus} cm` : "-"}</td>
              <td class="label">Posisi Janin</td>
              <td class="value">${last?.posisiJanin || "-"}</td>
            </tr>
            <tr>
              <td class="label">Ketuban (AFI)</td>
              <td class="value">${last?.afi ? `${last.afi} cm` : "-"}</td>
              <td class="label">Dokter Pemeriksa</td>
              <td class="value">${last?.dokter ? `dr. ${last.dokter}` : "-"}</td>
            </tr>
            <tr>
              <td class="label">Obat & Resep</td>
              <td class="value" colspan="3" style="color: #5A8A6E;">${last?.obat?.length > 0 ? last.obat.join(", ") : "Tidak ada resep obat"}</td>
            </tr>
            ${last?.catatan ? `
            <tr>
              <td class="label">Catatan Dokter</td>
              <td class="value" colspan="3" style="font-style: italic; line-height: 1.4;">"${last.catatan}"</td>
            </tr>
            ` : ""}
          </table>

          ${last?.aiSummary ? `
          <div class="pdf-ai-summary-box">
            <h4 class="pdf-ai-summary-title">📄 Analisis AI Dokumen Lab/USG Terakhir:</h4>
            <div style="color: #3D2B26; font-size: 11px;">${markdownToHtml(last.aiSummary)}</div>
          </div>
          ` : ""}
        </div>

        <!-- Daily Monitor Summary -->
        <div class="pdf-section">
          <h3 class="pdf-section-title">💗 Catatan Monitor Harian (Hari Ini — ${today})</h3>
          <div class="pdf-monitor-grid">
            <div class="pdf-monitor-card ${todayKick.count >= 10 ? "green" : ""}">
              <span class="pdf-metric-label">Gerakan Janin</span>
              <strong class="pdf-metric-value" style="font-size: 18px; margin-top: 3px; color: ${todayKick.count >= 10 ? "#5A8A6E" : "#7A3A30"}">${todayKick.count}</strong>
              <span style="font-size: 9px; color: #A08880; display: block; margin-top: 2px;">${todayKick.count >= 10 ? "Target tercapai" : "Target: 10/hari"}</span>
            </div>
            <div class="pdf-monitor-card">
              <span class="pdf-metric-label">Mood Ibu</span>
              <strong class="pdf-metric-value" style="font-size: 15px; margin-top: 3px;">${todayMood ? MOODS_MAP[todayMood].split(" ")[0] : "—"}</strong>
              <span style="font-size: 9px; color: #A08880; display: block; margin-top: 2px;">${todayMood ? MOODS_MAP[todayMood].split(" ")[1] : "Belum diisi"}</span>
            </div>
            <div class="pdf-monitor-card ${todaySym.length > 0 ? "yellow" : ""}">
              <span class="pdf-metric-label">Keluhan / Gejala</span>
              <strong class="pdf-metric-value" style="font-size: 18px; margin-top: 3px; color: ${todaySym.length > 0 ? "#92400E" : "#7A3A30"}">${todaySym.length}</strong>
              <span style="font-size: 9px; color: #A08880; display: block; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                ${todaySym.length > 0 ? todaySym.join(", ") : "Tidak ada keluhan"}
              </span>
            </div>
            <div class="pdf-monitor-card">
              <span class="pdf-metric-label">Kontraksi Harian</span>
              <strong class="pdf-metric-value" style="font-size: 18px; margin-top: 3px;">${todayCont.length}</strong>
              <span style="font-size: 9px; color: #A08880; display: block; margin-top: 2px;">kali hari ini</span>
            </div>
          </div>
        </div>

        <!-- Consolidated Medications -->
        <div class="pdf-section">
          <h3 class="pdf-section-title">💊 Daftar Obat & Suplemen (Akumulatif)</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px;">
            ${uniqueMeds.length > 0 
              ? uniqueMeds.map(m => `<span style="background: rgba(224, 123, 106, 0.08); color: #7A3A30; border: 1px solid rgba(224, 123, 106, 0.3); padding: 5px 10px; border-radius: 6px; font-weight: 600;">${m}</span>`).join("")
              : `<span style="color: #A08880; font-style: italic;">Belum ada resep obat/suplemen yang tercatat.</span>`
            }
          </div>
        </div>

        <!-- History Trends (If Multiple Visits Exist) -->
        ${sorted.length > 1 ? `
        <div class="pdf-section">
          <h3 class="pdf-section-title">📊 Tren & Riwayat Pemeriksaan Klinis</h3>
          <table class="pdf-trends-table">
            <thead>
              <tr>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 12%;">Usia Hamil</th>
                <th style="width: 15%;">Tensi Darah</th>
                <th style="width: 12%;">DJJ Janin</th>
                <th style="width: 11%;">Berat Ibu</th>
                <th style="width: 13%;">Berat Janin</th>
                <th style="width: 25%;">Obat / Resep</th>
              </tr>
            </thead>
            <tbody>
              ${[...sorted].reverse().map(v => `
                <tr>
                  <td style="font-weight: 700;">${fmtShort(v.tanggal)}</td>
                  <td>${v.usiaKehamilan ? `${v.usiaKehamilan} Mgg` : "-"}</td>
                  <td style="color: ${parseInt(v.tdSis) >= 140 ? "#DC2626" : "#3D2B26"}; font-weight: ${parseInt(v.tdSis) >= 140 ? "700" : "normal"};">
                    ${tdStr(v)} ${parseInt(v.tdSis) >= 140 ? "⚠️" : ""}
                  </td>
                  <td style="color: ${(parseInt(v.djj) < 110 || parseInt(v.djj) > 170) ? "#DC2626" : "#3D2B26"}; font-weight: ${(parseInt(v.djj) < 110 || parseInt(v.djj) > 170) ? "700" : "normal"};">
                    ${v.djj ? `${v.djj} bpm` : "-"} ${(parseInt(v.djj) < 110 || parseInt(v.djj) > 170) ? "⚠️" : ""}
                  </td>
                  <td>${v.bb ? `${v.bb} kg` : "-"}</td>
                  <td>${v.beratJanin ? `${v.beratJanin} gr` : "-"}</td>
                  <td style="color: #5A8A6E; font-weight: 600;">${v.obat?.length > 0 ? v.obat.join(", ") : "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ` : ""}

        <!-- Emergency Contacts & Disclaimer -->
        <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 16px; margin-top: 16px; page-break-inside: avoid;">
          <div class="pdf-card" style="padding: 12px 16px;">
            <h4 style="font-family: 'Lora', serif; color: #7A3A30; font-size: 11px; margin: 0 0 6px 0; text-transform: uppercase; font-weight: 700;">📞 Kontak Darurat</h4>
            <table class="pdf-table-mini" style="font-size: 10px;">
              <tr><td style="color: #A08880;">Dokter Utama</td><td class="value">${profil.noTeleponDokter || "-"}</td></tr>
              <tr><td style="color: #A08880;">Keluarga</td><td class="value">${profil.noTeleponDarurat || "-"}</td></tr>
            </table>
          </div>
          <div class="pdf-card peach" style="padding: 12px 16px; display: flex; align-items: center;">
            <p style="font-size: 9px; color: #A08880; margin: 0; line-height: 1.4; font-style: italic;">
              * Laporan ini merupakan salinan rekam medis KIA digital dari aplikasi <strong>BumilKu</strong> yang di-ekspor langsung oleh pengguna. Harap verifikasi hasil cetak ini dengan riwayat pemeriksaan dokter/bidan di fasilitas kesehatan terkait.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="pdf-footer">
          <p>Laporan Medis KIA Digital • Dihasilkan otomatis oleh BumilKu pada ${today}</p>
          <p style="font-size: 8px; color: #C96150; margin-top: 3px;">Sehat selalu untuk Bunda & Buah Hati 💗</p>
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `bumilku-laporan-${getLocalDateString()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="hdr">
        <div className="hdr-in">
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 13, fontWeight: 500, marginBottom: 3 }}>Siap Dibagikan ke Dokter</p>
          <h1 style={{ fontFamily: "Lora,serif", color: "#fff", fontSize: 26, fontWeight: 700 }}>Ringkasan Medis 📄</h1>
          <p style={{ color: "rgba(255,255,255,.82)", fontSize: 14, marginTop: 4 }}>{today}</p>
        </div>
      </div>

      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Warnings — always visible ── */}
        {(warnTD || warnDJJ) && (
          <div className="are fu">
            <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>⚠️ Perlu Perhatian Dokter</p>
            {warnTD  && <p style={{ marginBottom: 4 }}>• Tekanan darah {last.tdSis}/{last.tdDia} mmHg — melebihi batas normal</p>}
            {warnDJJ && <p>• DJJ {last.djj} bpm — di luar rentang normal (110–170 bpm)</p>}
          </div>
        )}

        {/* ── Action Buttons — always visible ── */}
        <div style={{ display: "flex", gap: 10 }} className="fu f1">
          <button className="btn br" style={{ flex: 1 }} onClick={copy}>
            {copied ? "✓ Tersalin!" : "📋 Copy Teks WhatsApp"}
          </button>
          <button className="btn bs" style={{ flex: 1 }} onClick={exportToPDF}>
            📥 Ekspor ke PDF
          </button>
        </div>
        <div className="asa" style={{ fontSize: 12 }}>
          💡 Salin ringkasan teks berformat untuk WhatsApp, atau unduh laporan cetak PDF rapi untuk diberikan langsung ke dokter.
        </div>

        {/* ── Sub Tabs ── */}
        <div className="tabs">
          {[
            { id: "ringkasan", icon: "📋", l: "Ringkasan" },
            { id: "riwayat",   icon: "📅", l: "Riwayat"   },
            { id: "tren",      icon: "📈", l: "Tren"       },
          ].map(t => (
            <button key={t.id} className={`tab ${ringkasanTab === t.id ? "on" : ""}`} onClick={() => setRingkasanTab(t.id)} style={{ fontSize: 11 }}>
              <span>{t.icon}</span><span>{t.l}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: RINGKASAN ── */}
        {ringkasanTab === "ringkasan" && <>

        {/* ── AI Overall Summary Panel ── */}
        <div className="doc fu f1" style={{ border: "1.5px solid var(--sg)", background: "rgba(123, 166, 138, 0.04)" }}>
          <div className="doc-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isAIMinimized ? "none" : undefined, paddingBottom: isAIMinimized ? 0 : undefined, marginBottom: isAIMinimized ? 0 : undefined }}>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setIsAIMinimized(v => !v)}>
              <p style={{ fontFamily: "Lora,serif", fontSize: 16, fontWeight: 700, color: "var(--sg2)" }}>🤖 Ringkasan AI Kehamilan Terpadu</p>
              <p style={{ fontSize: 11, color: "var(--mu)", marginTop: 2 }}>Analisis otomatis dari riwayat & grafik perkembangan</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              {aiSummaryOverall && !isEditingAI && !isAIMinimized && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiSummaryOverall).then(() => {
                        setAiCopied(true);
                        setTimeout(() => setAiCopied(false), 2000);
                      });
                    }}
                    style={{ background: "none", border: "none", color: "var(--sg2)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    {aiCopied ? "✓ Tersalin!" : "📋 Salin"}
                  </button>
                  <button
                    onClick={() => {
                      setTempAIVal(aiSummaryOverall);
                      setIsEditingAI(true);
                    }}
                    style={{ background: "none", border: "none", color: "var(--ro)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    ✏️ Edit
                  </button>
                </>
              )}
              <button
                onClick={() => setIsAIMinimized(v => !v)}
                style={{ background: "var(--psm)", border: "1px solid var(--bd)", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--mu)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {isAIMinimized ? "▼" : "▲"}
              </button>
            </div>
          </div>

          {!isAIMinimized && loadingAI && (
            <div style={{ padding: "12px 0", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ width: 22, height: 22, border: "2.5px solid rgba(90,138,110,.2)", borderTop: "2.5px solid var(--sg2)", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite", flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "var(--sg2)", fontWeight: 700 }}>Gemini sedang menganalisis kehamilan Anda<span className="d">.</span><span className="d d2">.</span><span className="d d3">.</span></p>
            </div>
          )}

          {!isAIMinimized && aiError && (
            <div className="are" style={{ marginBottom: 10, padding: 10, fontSize: 12 }}>
              <p style={{ fontWeight: 800 }}>Gagal menganalisis:</p>
              <p>{aiError}</p>
            </div>
          )}

          {!isAIMinimized && !loadingAI && !isEditingAI && aiSummaryOverall && (
            <div>
              <div style={{ fontSize: 13, color: "var(--tx)", lineHeight: 1.6, maxHeight: "60vh", overflowY: "auto", scrollbarWidth: "none" }}>
                {renderCleanAI(aiSummaryOverall)}
              </div>
              <button 
                className="btn bg" 
                onClick={generateOverallAI} 
                style={{ marginTop: 14, fontSize: 12, padding: "8px 12px" }}
              >
                🔄 Buat Ulang Ringkasan AI
              </button>
            </div>
          )}

          {!isAIMinimized && !loadingAI && isEditingAI && (
            <div style={{ marginTop: 8 }}>
              <textarea 
                className="inp" 
                value={tempAIVal} 
                onChange={e => setTempAIVal(e.target.value)} 
                style={{ minHeight: 180, fontSize: "16px", lineHeight: "1.6", background: "var(--wh)", border: "1.5px solid var(--sg)" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button 
                  className="btn bs" 
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12 }} 
                  onClick={() => {
                    saveAiSummary(tempAIVal);
                    setIsEditingAI(false);
                  }}
                >
                  💾 Simpan
                </button>
                <button 
                  className="btn bg" 
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12 }} 
                  onClick={() => setIsEditingAI(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {!isAIMinimized && !loadingAI && !aiSummaryOverall && !aiError && (
            <div>
              <p style={{ fontSize: 12, color: "var(--tx)", lineHeight: 1.5, marginBottom: 12 }}>
                Gunakan AI Gemini untuk menganalisis seluruh data kunjungan medis dan catatan harian Anda guna menghasilkan ringkasan klinis terpadu yang siap dibagikan ke dokter atau bidan.
              </p>
              <button 
                className="btn bs" 
                onClick={generateOverallAI} 
                style={{ fontSize: 13, padding: "10px 14px" }}
              >
                🤖 Buat Ringkasan AI Terpadu
              </button>
            </div>
          )}

          {!isAIMinimized && aiDebugInfo && (
            <div style={{ marginTop: 16, borderTop: "1px dashed var(--bd)", paddingTop: 12 }}>
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                style={{ background: "none", border: "none", color: "var(--sg2)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0 }}
              >
                {showDebug ? "🔽 Sembunyikan Debug Info" : "🔎 Tunjukkan Debug Info (Bagaimana AI Dibuat)"}
              </button>
              {showDebug && (
                <div style={{ marginTop: 8, background: "var(--psm)", borderRadius: 8, padding: 10, fontSize: 11, fontFamily: "monospace", overflowX: "auto", display: "flex", flexDirection: "column", gap: 6, color: "var(--dp)" }}>
                  <p><strong>Waktu:</strong> {aiDebugInfo.timestamp}</p>
                  <p><strong>Model:</strong> {aiDebugInfo.model}</p>
                  <p><strong>Status:</strong> {aiDebugInfo.status}</p>
                  <p><strong>Finish Reason:</strong> {aiDebugInfo.finishReason}</p>
                  <div>
                    <strong>Raw Response ({aiDebugInfo.rawResponse.length} Karakter):</strong>
                    <pre style={{ background: "var(--wh)", padding: 6, borderRadius: 4, border: "1px solid var(--bd)", whiteSpace: "pre-wrap", marginTop: 4, maxHeight: 150, overflowY: "auto", color: "var(--tx)" }}>
                      {aiDebugInfo.rawResponse || "(Kosong)"}
                    </pre>
                  </div>
                  <div>
                    <strong>Prompt yang dikirim ke Gemini ({aiDebugInfo.prompt.length} Karakter):</strong>
                    <pre style={{ background: "var(--wh)", padding: 6, borderRadius: 4, border: "1px solid var(--bd)", whiteSpace: "pre-wrap", marginTop: 4, maxHeight: 200, overflowY: "auto", color: "var(--tx)" }}>
                      {aiDebugInfo.prompt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Status Kehamilan ── */}
        <div className="doc fu f1">
          <div className="doc-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--tx)" }}>Status Kehamilan</p>
              <p style={{ fontSize: 12, color: "var(--mu)", marginTop: 3 }}>Per {today}</p>
            </div>
            <span style={{ fontSize: 30 }}>🤰</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div className="chip"><span className="cv">{week}</span><span className="cl">Minggu</span></div>
            <div className="chip"><span className="cv">{dayInWeek}</span><span className="cl">Hari</span></div>
            <div className="chip"><span className="cv">{dl}</span><span className="cl">Hari Lagi</span></div>
            <div className="chip"><span className="cv">{week <= 12 ? "T1" : week <= 27 ? "T2" : "T3"}</span><span className="cl">Trimester</span></div>
          </div>
        </div>

        {/* ── Identitas Bunda ── */}
        <div className="doc fu">
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>Identitas</p>
          {[
            { l: "Nama",          v: profil.namaIbu || "-" },
            { l: "Usia Ibu",      v: getAge(profil.tanggalLahirIbu) },
            { l: "Gol. Darah",    v: profil.golonganDarah || "-" },
            { l: "HPHT",          v: fmtDate(profil.hpht) },
            { l: "HPL",           v: fmtDate(getLocalDateString(hpl)) },
            { l: "Kehamilan ke-", v: profil.kehamilanKe || "-" },
            { l: "Dokter",        v: profil.namaDokter ? "dr. " + profil.namaDokter : "-" },
            { l: "RS / Klinik",   v: profil.namaRS || "-" },
            { l: "Jaminan",       v: profil.jaminanKesehatan?.toUpperCase() || "-" },
          ].map(r => (
            <div key={r.l} className="doc-row">
              <span style={{ fontSize: 12, color: "var(--mu)", fontWeight: 600 }}>{r.l}</span>
              <span style={{ fontSize: 13, color: "var(--tx)", fontWeight: 700, textAlign: "right", maxWidth: "55%" }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* ── Data Kunjungan Terakhir ── */}
        {last && (
          <div className="doc fu f2">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Data Kunjungan Terakhir — {fmtShort(last.tanggal)}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
              {[
                { l: "Berat Badan",   v: last.bb          ? `${last.bb} kg`         : "-", warn: false },
                { l: "Tekanan Darah", v: tdStr(last),                                       warn: warnTD },
                { l: "DJJ",           v: last.djj         ? `${last.djj} bpm`        : "-", warn: warnDJJ },
                { l: "Tinggi Fundus", v: last.fundus      ? `${last.fundus} cm`      : "-", warn: false },
                { l: "Posisi Janin",  v: last.posisiJanin ? last.posisiJanin.split("(")[0].trim() : "-", warn: false },
                { l: "Berat Janin",   v: last.beratJanin  ? `${last.beratJanin} gr`  : "-", warn: false },
                { l: "AFI Cairan",    v: last.afi         ? `${last.afi} cm`         : "-", warn: false },
              ].map(x => (
                <div key={x.l} className="csm" style={x.warn ? { borderColor: "#FECACA", background: "#FEF2F2" } : {}}>
                  <p style={{ fontSize: 10, color: x.warn ? "#DC2626" : "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{x.l}{x.warn ? " ⚠️" : ""}</p>
                  <p style={{ fontFamily: "Lora,serif", fontSize: 16, fontWeight: 700, color: x.warn ? "#DC2626" : "var(--dp)", marginTop: 4 }}>{x.v}</p>
                </div>
              ))}
            </div>

            {/* Obat */}
            {last.obat?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Obat & Suplemen</p>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {last.obat.map((o, i) => <span key={i} className="otag">{o}</span>)}
                </div>
              </div>
            )}

            {/* AI Summary of last visit */}
            {last.aiSummary && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Ringkasan Dokumen Medis (AI)</p>
                <div className="aibox">
                  <AISummaryRenderer text={last.aiSummary} compact />
                  {last.temuanPenting && (
                    <div style={{ marginTop: 8, background: "rgba(220,38,38,.07)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(220,38,38,.2)" }}>
                      <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 700 }}>⚠️ {last.temuanPenting}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Thumbnails of last visit */}
            {last.uploads?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>📎 Dokumen Terlampir ({last.uploads.length})</p>
                <FileThumbnailGrid uploads={last.uploads} onView={setViewingFile} />
              </div>
            )}
          </div>
        )}

        {/* ── Monitor Harian ── */}
        <div className="doc fu f2">
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Monitor Harian — {today}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
            <div className="csm" style={todayKick.count >= 10 ? { borderColor: "rgba(123,166,138,.4)", background: "rgba(123,166,138,.06)" } : {}}>
              <p style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>👶 Kick Counter</p>
              <p style={{ fontFamily: "Lora,serif", fontSize: 22, fontWeight: 700, color: todayKick.count >= 10 ? "var(--sg2)" : "var(--dp)", marginTop: 4 }}>{todayKick.count}</p>
              <p style={{ fontSize: 10, color: "var(--mu)" }}>tendangan · target 10</p>
            </div>
            <div className="csm">
              <p style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>😊 Mood</p>
              <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--dp)", marginTop: 4 }}>
                {todayMood ? MOODS_MAP[todayMood].split(" ")[0] : "—"}
              </p>
              <p style={{ fontSize: 10, color: "var(--mu)" }}>{todayMood ? MOODS_MAP[todayMood].split(" ")[1] : "belum diisi"}</p>
            </div>
            <div className="csm">
              <p style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>⏱️ Kontraksi</p>
              <p style={{ fontFamily: "Lora,serif", fontSize: 22, fontWeight: 700, color: todayCont.length > 0 ? "var(--ro2)" : "var(--dp)", marginTop: 4 }}>{todayCont.length}</p>
              <p style={{ fontSize: 10, color: "var(--mu)" }}>kali hari ini</p>
            </div>
            <div className="csm" style={todaySym.length > 0 ? { borderColor: "rgba(244,196,68,.4)", background: "#FFFBEB" } : {}}>
              <p style={{ fontSize: 10, color: "var(--mu)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>📝 Gejala</p>
              <p style={{ fontFamily: "Lora,serif", fontSize: 22, fontWeight: 700, color: todaySym.length > 0 ? "#92400E" : "var(--dp)", marginTop: 4 }}>{todaySym.length}</p>
              <p style={{ fontSize: 10, color: "var(--mu)" }}>keluhan tercatat</p>
            </div>
          </div>
          {todaySym.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {todaySym.map((s, i) => <span key={i} className="tag" style={{ fontSize: 11 }}>{s}</span>)}
            </div>
          )}
        </div>

        {/* ── Kontak Darurat (masih di tab Ringkasan) ── */}
        {(profil.noTeleponDokter || profil.noTeleponDarurat) && (
          <div className="doc fu f5">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Kontak Darurat</p>
            {profil.noTeleponDokter && (
              <a href={`tel:${profil.noTeleponDokter}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--bd)", textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>👨‍⚕️</span>
                <div><p style={{ fontSize: 13, fontWeight: 800, color: "var(--tx)" }}>Dokter / Klinik</p><p style={{ fontSize: 12, color: "var(--ro)" }}>{profil.noTeleponDokter}</p></div>
              </a>
            )}
            {profil.noTeleponDarurat && (
              <a href={`tel:${profil.noTeleponDarurat}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>👨‍👩‍👧</span>
                <div><p style={{ fontSize: 13, fontWeight: 800, color: "var(--tx)" }}>Kontak Darurat</p><p style={{ fontSize: 12, color: "var(--ro)" }}>{profil.noTeleponDarurat}</p></div>
              </a>
            )}
          </div>
        )}

        {kunjungan.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📄</div>
            <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Belum ada data kunjungan</p>
            <p style={{ color: "var(--mu)", fontSize: 14 }}>Tambahkan kunjungan untuk melihat ringkasan</p>
          </div>
        )}

        </> /* end tab: ringkasan */ }

        {/* ── TAB: RIWAYAT ── */}
        {ringkasanTab === "riwayat" && (
          <div className="fu">
            {sorted.length === 0 ? (
              <div style={{ textAlign: "center", padding: "44px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📅</div>
                <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Belum ada riwayat kunjungan</p>
                <p style={{ color: "var(--mu)", fontSize: 14 }}>Rekam kunjungan pertama di tab Kunjungan</p>
              </div>
            ) : (
              <div className="doc">
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 14 }}>
                  Riwayat Kunjungan ({kunjungan.length})
                </p>
                {(showAllVisits ? [...sorted].reverse() : [...sorted].reverse().slice(0, 3)).map((v, i) => (
                  <div key={v.id} style={{ borderLeft: "3px solid var(--pe)", paddingLeft: 14, marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontWeight: 800, color: "var(--tx)", fontSize: 14 }}>{fmtShort(v.tanggal)}</p>
                      <span className="badge" style={{ fontSize: 10 }}>Mgg {v.usiaKehamilan || "?"}</span>
                    </div>
                    {v.dokter && <p style={{ fontSize: 12, color: "var(--mu)", marginBottom: 6 }}>dr. {v.dokter}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                      {v.bb           && <span className="tag">BB: {v.bb}kg</span>}
                      {tdStr(v) !== "-" && <span className="tag">TD: {tdStr(v)}</span>}
                      {v.djj          && <span className="tag">DJJ: {v.djj}bpm</span>}
                      {v.posisiJanin  && <span className="tag tsg">{v.posisiJanin.split("(")[0].trim()}</span>}
                      {v.beratJanin   && <span className="tag">EFW: {v.beratJanin}gr</span>}
                      {v.afi          && <span className="tag">AFI: {v.afi}cm</span>}
                    </div>
                    {v.aiSummary && (
                      <div className="aibox" style={{ marginBottom: 8 }}>
                        <AISummaryRenderer text={v.aiSummary} compact />
                        {v.temuanPenting && <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, marginTop: 8 }}>⚠️ {v.temuanPenting}</p>}
                      </div>
                    )}
                    {v.catatan && <p style={{ fontSize: 12, color: "var(--mu)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 6 }}>"{v.catatan}"</p>}
                    {v.obat?.length > 0 && <p style={{ fontSize: 11, color: "var(--mu)", marginBottom: 6 }}>💊 {v.obat.join(" · ")}</p>}
                    {v.uploads?.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, color: "var(--mu)", fontWeight: 600, marginBottom: 6 }}>📎 {v.uploads.length} dokumen</p>
                        <FileThumbnailGrid uploads={v.uploads} onView={setViewingFile} />
                      </div>
                    )}
                  </div>
                ))}
                {sorted.length > 3 && (
                  <button
                    className="btn bg"
                    onClick={() => setShowAllVisits(v => !v)}
                    style={{ marginTop: 4 }}
                  >
                    {showAllVisits ? "▲ Tampilkan lebih sedikit" : `▼ Lihat semua ${sorted.length} kunjungan`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TREN ── */}
        {ringkasanTab === "tren" && (
          <div className="fu">
            {bbHistory.length <= 1 && tdHistory.length <= 1 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>📈</div>
                <p style={{ fontFamily: "Lora,serif", fontSize: 18, fontWeight: 700, color: "var(--tx)", marginBottom: 8 }}>Data tren belum cukup</p>
                <p style={{ color: "var(--mu)", fontSize: 14, marginBottom: 18 }}>Tren muncul jika minimal 2 kunjungan memiliki data berikut:</p>
                <div style={{ display: "inline-flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                  {[
                    { icon: "⚖️", label: "Berat Badan Ibu (kg)", ok: bbHistory.length >= 2 },
                    { icon: "🩺", label: "Tekanan Darah (sistolik/diastolik)", ok: tdHistory.length >= 2 },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: "var(--tx)", fontWeight: 600 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: item.ok ? "var(--sg2)" : "var(--mu)", fontWeight: 700 }}>
                        {item.ok ? `✅ ${item.label === "Berat Badan Ibu (kg)" ? bbHistory.length : tdHistory.length} data` : "–"}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ color: "var(--mu)", fontSize: 12, marginTop: 18 }}>Lengkapi field tersebut saat merekam kunjungan</p>
              </div>
            ) : (
              <>
                {bbHistory.length > 1 && (
                  <div className="doc fu f1">
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Tren Berat Badan Ibu</p>
                    {bbHistory.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--mu)", fontWeight: 600, width: 80, flexShrink: 0 }}>{b.date}</span>
                        <div style={{ flex: 1, background: "var(--psm)", borderRadius: 20, height: 16, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", background: "linear-gradient(90deg,var(--ro),var(--pe))", borderRadius: 20, width: `${Math.min(100, (b.val / 100) * 100)}%`, minWidth: "8%" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--dp)", width: 52, textAlign: "right" }}>{b.val} kg</span>
                        {i > 0 && <span style={{ fontSize: 11, color: b.val > bbHistory[i-1].val ? "#DC2626" : "var(--sg2)", fontWeight: 700, width: 36, textAlign: "right", flexShrink: 0 }}>{b.val > bbHistory[i-1].val ? "+" : ""}{(b.val - bbHistory[i-1].val).toFixed(1)}</span>}
                      </div>
                    ))}
                    <p style={{ fontSize: 12, color: "var(--mu)", marginTop: 10 }}>
                      Total kenaikan: <strong style={{ color: "var(--dp)" }}>{(bbHistory[bbHistory.length - 1].val - bbHistory[0].val).toFixed(1)} kg</strong>
                    </p>
                  </div>
                )}

                {tdHistory.length > 1 && (
                  <div className="doc fu f2">
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ro)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>Tren Tekanan Darah</p>
                    {tdHistory.map((t, i) => (
                      <div key={i} className="doc-row">
                        <span style={{ fontSize: 12, color: "var(--mu)", fontWeight: 600 }}>{t.date}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: t.sis >= 140 ? "#DC2626" : "var(--dp)" }}>
                          {t.sis}/{t.dia} mmHg {t.sis >= 140 ? "⚠️" : t.sis < 120 ? "✓" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div style={{ height: 6 }} />
      </div>

      {/* ── File Viewer ── */}
      <FileViewerOverlay file={viewingFile} onClose={() => setViewingFile(null)} />
    </div>
  );
}
