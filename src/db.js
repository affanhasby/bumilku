// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────
const SUPABASE_URL = "https://lwogmimqwqfokqkgdsan.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3b2dtaW1xd3Fmb2txa2dkc2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTg1MTgsImV4cCI6MjA5NTA5NDUxOH0.bMeVjNx5JEqsx8pD583YhHi4ZUdE0V9x9Qg9VaiLG-8";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── MAPPERS ──────────────────────────────────────────────────────────────
const kunjunganToDb = (v) => ({
  id: v.id,
  tanggal: v.tanggal || null,
  dokter: v.dokter || null,
  usia_kehamilan: v.usiaKehamilan || null,
  bb: v.bb || null,
  td_sis: v.tdSis || null,
  td_dia: v.tdDia || null,
  fundus: v.fundus || null,
  djj: v.djj || null,
  posisi_janin: v.posisiJanin || null,
  berat_janin: v.beratJanin || null,
  afi: v.afi || null,
  catatan: v.catatan || null,
  next_appointment: v.nextAppointment || null,
  obat: v.obat || [],
  ai_summary: v.aiSummary || null,
  temuan_penting: v.temuanPenting || null,
  uploads: (v.uploads || []).map(u => ({
    id: u.id, path: u.path || null,
    filename: u.filename, mime: u.mime,
    isPdf: u.isPdf, tanggal: u.tanggal,
  })),
  mode: v.mode || null,
});

const dbToKunjungan = (row) => ({
  id: row.id,
  tanggal: row.tanggal || "",
  dokter: row.dokter || "",
  usiaKehamilan: row.usia_kehamilan || "",
  bb: row.bb || "",
  tdSis: row.td_sis || "",
  tdDia: row.td_dia || "",
  fundus: row.fundus || "",
  djj: row.djj || "",
  posisiJanin: row.posisi_janin || "",
  beratJanin: row.berat_janin || "",
  afi: row.afi || "",
  catatan: row.catatan || "",
  nextAppointment: row.next_appointment || "",
  obat: row.obat || [],
  aiSummary: row.ai_summary || "",
  temuanPenting: row.temuan_penting || "",
  uploads: row.uploads || [],
  mode: row.mode || "",
});

// ─── APP CONFIG ───────────────────────────────────────────────────────────
const dbGetConfig = async (key) => {
  const { data } = await db.from("app_config").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
};
const dbSetConfig = async (key, value) => {
  await db.from("app_config").upsert({ key, value });
};

// ─── PROFIL ───────────────────────────────────────────────────────────────
const dbGetProfil = async () => {
  const { data } = await db.from("profil").select("data").eq("id", 1).maybeSingle();
  return data?.data ?? {};
};
const dbSaveProfil = async (profilData) => {
  await db.from("profil").upsert({ id: 1, data: profilData });
};

// ─── KUNJUNGAN ────────────────────────────────────────────────────────────
const dbGetKunjungan = async () => {
  const { data, error } = await db.from("kunjungan").select("*");
  if (error) throw error;
  return (data ?? []).map(dbToKunjungan);
};
const dbUpsertKunjungan = async (visit) => {
  const { error } = await db.from("kunjungan").upsert(kunjunganToDb(visit));
  if (error) throw error;
};
const dbDeleteKunjungan = async (id) => {
  const { error } = await db.from("kunjungan").delete().eq("id", id);
  if (error) throw error;
};

// ─── MONITOR: KICKS ──────────────────────────────────────────────────────
const dbGetKicks = async () => {
  const { data } = await db.from("monitor_kicks").select("*");
  const result = {};
  (data ?? []).forEach(r => { result[r.tanggal] = { count: r.count, times: r.times }; });
  return result;
};
const dbSaveKick = async (tanggal, kickData) => {
  await db.from("monitor_kicks").upsert({ tanggal, count: kickData.count, times: kickData.times });
};

// ─── MONITOR: MOODS ──────────────────────────────────────────────────────
const dbGetMoods = async () => {
  const { data } = await db.from("monitor_moods").select("*");
  const result = {};
  (data ?? []).forEach(r => { result[r.tanggal] = r.mood; });
  return result;
};
const dbSaveMood = async (tanggal, mood) => {
  await db.from("monitor_moods").upsert({ tanggal, mood });
};

// ─── MONITOR: SYMPTOMS ───────────────────────────────────────────────────
const dbGetSymptoms = async () => {
  const { data } = await db.from("monitor_symptoms").select("*");
  const result = {};
  (data ?? []).forEach(r => { result[r.tanggal] = r.symptoms; });
  return result;
};
const dbSaveSymptom = async (tanggal, symptoms) => {
  await db.from("monitor_symptoms").upsert({ tanggal, symptoms });
};

// ─── MONITOR: CONTRACTIONS ───────────────────────────────────────────────
const dbGetContractions = async () => {
  const { data } = await db.from("contractions").select("*").order("start_time", { ascending: true });
  return (data ?? []).map(c => ({
    id: c.id, startTime: c.start_time, endTime: c.end_time,
    duration: c.duration, interval: c.interval, date: c.tanggal, time: c.time,
  }));
};
const dbAddContraction = async (c) => {
  await db.from("contractions").insert({
    id: c.id, start_time: c.startTime, end_time: c.endTime,
    duration: c.duration, interval: c.interval, tanggal: c.date, time: c.time,
  });
};
const dbDeleteContractionsByDate = async (tanggal) => {
  await db.from("contractions").delete().eq("tanggal", tanggal);
};

// ─── STORAGE ──────────────────────────────────────────────────────────────
const dbUploadFile = async (dataUrl, path) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const { error } = await db.storage.from("uploads").upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw error;
};
const dbGetSignedUrl = async (path) => {
  const { data } = await db.storage.from("uploads").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
};
const dbDeleteFiles = async (paths) => {
  if (!paths.length) return;
  await db.storage.from("uploads").remove(paths);
};
