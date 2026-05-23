// ─── ID GENERATOR ────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substr(2, 9);

// ─── LOCAL DATE STRING HELPER (Timezone safe YYYY-MM-DD locked to WIB/Jakarta) ──
const getLocalDateString = (d = new Date()) => {
  if (!d) return "";
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  try {
    // Force format using WIB (Asia/Jakarta) timezone
    return dateObj.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  } catch (e) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
};

// ─── BABY SIZE COMPARISON ─────────────────────────────────────────────────
const BABY = {
  4:  ["🌱", "Biji Poppy",      "<1mm"],
  6:  ["🫐", "Blueberry",       "~6mm"],
  8:  ["🍓", "Raspberry",       "~16mm"],
  10: ["🍇", "Anggur",          "~3cm"],
  12: ["🍋", "Jeruk Nipis",     "~6cm"],
  14: ["🍑", "Persik",          "~9cm"],
  16: ["🥑", "Alpukat",         "~12cm"],
  18: ["🥭", "Mangga",          "~14cm"],
  20: ["🍌", "Pisang",          "~26cm"],
  22: ["🌽", "Jagung",          "~28cm"],
  24: ["🌽", "Jagung Besar",    "~30cm"],
  26: ["🥬", "Selada",          "~35cm"],
  28: ["🍆", "Terong",          "~37cm"],
  30: ["🥦", "Brokoli",         "~40cm"],
  32: ["🥥", "Kelapa",          "~43cm"],
  34: ["🎃", "Labu Kecil",      "~45cm"],
  36: ["🍉", "Semangka Kecil",  "~47cm"],
  38: ["🎃", "Labu",            "~50cm"],
  40: ["👶", "Bayi Siap Lahir!","~51cm"],
};

// ─── PREGNANCY MILESTONES ─────────────────────────────────────────────────
const MILESTONES = [
  { week: 4,  icon: "🌱", title: "Implantasi",       desc: "Embrio menempel di rahim" },
  { week: 6,  icon: "💗", title: "Jantung Berdetak", desc: "Detak jantung janin pertama" },
  { week: 8,  icon: "🧬", title: "Organ Terbentuk",  desc: "Organ utama mulai berkembang" },
  { week: 12, icon: "⭐", title: "Akhir Trimester 1",desc: "Risiko keguguran menurun drastis" },
  { week: 16, icon: "🦶", title: "Gerakan Pertama",  desc: "Mulai merasakan tendangan" },
  { week: 20, icon: "🔬", title: "USG Anatomi",      desc: "Detail organ & jenis kelamin" },
  { week: 24, icon: "🏆", title: "Viabilitas",       desc: "Janin bisa bertahan di luar rahim" },
  { week: 28, icon: "👁️", title: "Trimester 3",      desc: "Janin buka tutup mata" },
  { week: 32, icon: "🔄", title: "Posisi Kepala",    desc: "Janin mulai turun ke bawah" },
  { week: 36, icon: "🏥", title: "Full Term Awal",   desc: "Persiapkan tas ke RS!" },
  { week: 40, icon: "🎉", title: "Hari H!",          desc: "Saatnya bertemu si kecil" },
];

// ─── SYMPTOM & DANGER LISTS ───────────────────────────────────────────────
const GEJALA = [
  "Mual / Muntah", "Pusing / Sakit Kepala", "Nyeri Punggung", "Bengkak Kaki",
  "Sesak Napas", "Heartburn", "Susah Tidur", "Sering BAK",
  "Kram Perut", "Kontraksi Braxton Hicks", "Gatal-gatal", "Lemas / Fatigue",
  "Sembelit", "Perdarahan Ringan",
];

const TANDA_BAHAYA = [
  { icon: "🩸",  text: "Perdarahan dari jalan lahir" },
  { icon: "🤯",  text: "Sakit kepala hebat yang tidak hilang" },
  { icon: "👁️",  text: "Penglihatan kabur atau ada kilatan cahaya" },
  { icon: "🦶",  text: "Bengkak mendadak di wajah, tangan, atau kaki" },
  { icon: "😖",  text: "Nyeri perut hebat atau terus-menerus" },
  { icon: "🌡️", text: "Demam tinggi (>38°C)" },
  { icon: "💧",  text: "Keluar cairan dari vagina sebelum waktunya" },
  { icon: "👶",  text: "Gerakan janin berkurang (<10 per 2 jam)" },
  { icon: "😮‍💨", text: "Sesak napas tiba-tiba dan berat" },
];

const POSISI_JANIN = [
  "Presentasi Kepala (Normal)",
  "Presentasi Bokong / Sungsang",
  "Lintang (Melintang)",
  "Miring / Oblique",
  "Belum dapat dinilai",
];

const OBAT_UMUM = [
  "Asam Folat", "Vitamin D", "Fe (Zat Besi)", "Kalsium",
  "Omega-3 / DHA", "Vitamin B12", "Vitamin C", "Antasida (mual)",
  "Domperidone", "Metformin", "Labetalol", "Nifedipin",
];

// ─── BLANK VISIT FORM ─────────────────────────────────────────────────────
const BLANK = {
  tanggal: getLocalDateString(),
  dokter: "", usiaKehamilan: "", bb: "",
  tdSis: "", tdDia: "", fundus: "", djj: "",
  posisiJanin: "", beratJanin: "", afi: "",
  catatan: "", nextAppointment: "",
  obat: [], uploads: [],
  aiSummary: "", temuanPenting: "", mode: "",
};
