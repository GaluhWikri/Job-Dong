"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowRight, Briefcase, ChevronDown, ChevronUp, Database, FileText,
  Loader2, RefreshCw, Search, Sparkles, SquareKanban, Target, Trash2, UploadCloud, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLocalCvText, getLocalProfile, saveLocalProfile } from "@/lib/local-profile";
import {
  APPLICATION_STATUSES, ApplicationRecord, ApplicationStatus, MatchAnalysis,
  applicationKey, createApplication, getApplications, removeApplication, syncFromSheet, updateApplication,
} from "@/lib/applications-store";
import type { TrackerRow } from "@/lib/tracker-sheet";

const COLUMN_HINT: Record<ApplicationStatus, string> = {
  'CV Dibuat': 'CV siap, belum dikirim',
  'Dikirim': 'Menunggu balasan',
  'Dilihat': 'Dibaca recruiter',
  'Interview': 'Panggilan / tes',
  'Diterima': 'Offer masuk',
  'Ditolak': 'Belum jodoh',
};

/** Skor → warna: lime (kuat), kuning (cukup), koral (lemah). */
function scoreClass(score: number) {
  if (score >= 75) return "text-lime border-lime/40 bg-lime/10";
  if (score >= 50) return "text-yellow border-yellow/40 bg-yellow/10";
  return "text-coral border-coral/40 bg-coral/10";
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreClass(score)}`}>
      {score}% cocok
    </span>
  );
}

function AnalysisBlock({ match }: { match: MatchAnalysis }) {
  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground leading-relaxed">{match.verdict}</p>

      {match.matched.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sudah cocok</div>
          <ul className="space-y-1">
            {match.matched.map((m, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-foreground font-bold shrink-0">✓</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.missing.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Belum ada di CV</div>
          <ul className="space-y-1">
            {match.missing.map((m, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="shrink-0">✗</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.suggestions.length > 0 && (
        <div className="bg-white/[0.06] rounded-xl p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Saran perbaikan CV
          </div>
          <ul className="space-y-1">
            {match.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="font-semibold shrink-0">{i + 1}.</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function KanbanPage() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [cvText, setCvText] = useState("");
  const [cvName, setCvName] = useState<string | null>(null);
  const [loadingCv, setLoadingCv] = useState(true);
  const [cvOpen, setCvOpen] = useState(false);
  const [cvDraft, setCvDraft] = useState("");

  const [jd, setJd] = useState("");
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ match: MatchAnalysis; jobTitle: string; companyName: string } | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<ApplicationStatus | null>(null);

  // Spreadsheet tracker = sumber data asli lamaran; kanban diisi darinya.
  const [sheetRows, setSheetRows] = useState<TrackerRow[]>([]);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  // Cegah panggilan dobel: mount + event fokus/visibility sering datang bersamaan.
  const inFlight = useRef(false);
  const lastRunAt = useRef(0);
  const [query, setQuery] = useState("");
  // Papan kini berisi puluhan kartu — panel skor default terlipat biar board dapat porsi besar.
  const [panelOpen, setPanelOpen] = useState(false);

  // Ambil baris spreadsheet lalu samakan kanban dengannya.
  // force = tombol Sinkron (timpa juga kartu yang digeser manual).
  const loadSheet = useCallback(async (force = false) => {
    if (inFlight.current) return;
    if (!force && Date.now() - lastRunAt.current < 5000) return;

    inFlight.current = true;
    lastRunAt.current = Date.now();
    setSyncing(true);
    try {
      const res = await fetch(`/api/tracker${force ? '?fresh=1' : ''}`, { cache: 'no-store' });
      const data = await res.json();
      const rows: TrackerRow[] = data.rows ?? [];
      setSheetRows(rows);
      setSheetError(data.error ?? null);
      if (rows.length === 0) return;

      const { imported, updated } = syncFromSheet(rows, { force });
      setApps(getApplications());

      const parts: string[] = [];
      if (imported) parts.push(`${imported} lamaran baru`);
      if (updated) parts.push(`${updated} status diperbarui`);
      setSyncNote(parts.length ? `Spreadsheet: ${parts.join(' · ')}` : null);
      setLastSync(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlight.current = false;
      setSyncing(false);
    }
  }, []);

  // Ikuti perubahan spreadsheet: saat tab kembali fokus dan tiap 2 menit.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') loadSheet(); };
    const timer = setInterval(refresh, 120_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadSheet]);

  useEffect(() => {
    setApps(getApplications());
    loadSheet();

    // CV dari browser dulu (instan, tidak tergantung jaringan); cloud hanya cadangan.
    const localCv = getLocalCvText();
    if (localCv.trim()) {
      setCvText(localCv);
      setCvName(getLocalProfile().cvName || 'CV tersimpan (browser)');
      setLoadingCv(false);
      return;
    }

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('user_cvs')
          .select('cv_text, cv_name')
          .eq('user_id', 'default_user')
          .single();
        if (data?.cv_text) setCvText(data.cv_text);
        if (data?.cv_name) setCvName(data.cv_name);
      } catch (err) {
        console.warn("Cloud CV tidak tersedia:", err);
      } finally {
        setLoadingCv(false);
      }
    })();
  }, []);

  const saveCv = () => {
    const text = cvDraft.trim();
    if (!text) return;
    saveLocalProfile({ cvText: text });
    setCvText(text);
    setCvName(getLocalProfile().cvName || 'CV tersimpan (browser)');
    setCvDraft('');
    setCvOpen(false);
  };

  const handleScore = async () => {
    if (!jd.trim() || !cvText.trim()) return;
    setScoring(true);
    setError(null);
    setDraft(null);

    try {
      const res = await fetch('/api/match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal menilai kecocokan.');
      setDraft({
        match: data.match,
        jobTitle: data.match.jobTitle || 'Posisi Tanpa Judul',
        companyName: data.match.companyName || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menilai kecocokan.');
    } finally {
      setScoring(false);
    }
  };

  const handleSaveDraft = () => {
    if (!draft) return;

    // Kalau lowongan ini sudah ada di kanban (mis. impor dari spreadsheet),
    // tempelkan hasil penilaian ke kartu itu — jangan bikin kartu kembar.
    const key = applicationKey(draft.jobTitle, draft.companyName);
    const existing = apps.find(a => applicationKey(a.jobTitle, a.companyName) === key);

    if (existing) {
      setApps(updateApplication(existing.id, { match: draft.match, jobDescription: jd }));
      setOpenId(existing.id);
    } else {
      const record = createApplication({
        jobId: `paste-${Date.now()}`,
        jobTitle: draft.jobTitle,
        companyName: draft.companyName,
        location: '',
        jobDescription: jd,
        match: draft.match,
      });
      setApps(getApplications());
      setOpenId(record.id);
    }

    setDraft(null);
    setJd('');
  };

  const move = (id: string, status: ApplicationStatus) => {
    // Tandai override supaya auto-sinkron tidak mengembalikan kartu ke status spreadsheet;
    // tombol "Sinkron Spreadsheet" yang menimpanya.
    setApps(updateApplication(id, { status, manualOverride: true }));
  };

  const nextStatus = (status: ApplicationStatus) => {
    const i = APPLICATION_STATUSES.indexOf(status);
    return i >= 0 && i < APPLICATION_STATUSES.length - 2 ? APPLICATION_STATUSES[i + 1] : null;
  };

  const hasCv = Boolean(cvText.trim());

  // 96 kartu itu banyak — saring berdasarkan posisi/perusahaan.
  const q = query.trim().toLowerCase();
  const visibleApps = q
    ? apps.filter(a => `${a.jobTitle} ${a.companyName}`.toLowerCase().includes(q))
    : apps;

  return (
    // Layar penuh: header + panel input tetap, papan mengisi sisa tinggi. Hanya
    // daftar kartu di dalam kolom yang scroll sendiri — halaman tidak scroll.
    <div className="flex-1 min-h-0 flex flex-col px-4 lg:px-6 py-5 overflow-hidden">

      <header className="shrink-0 flex flex-wrap items-end justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Kanban Lamaran</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kartu diisi dari spreadsheet tracker. Tempel deskripsi lowongan untuk menilai kecocokan dengan CV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge">
            <Database className="w-3 h-3" /> Spreadsheet: {sheetRows.length} baris
          </span>
          <span className="badge">
            <SquareKanban className="w-3 h-3" /> {q ? `${visibleApps.length} / ${apps.length}` : apps.length} kartu
          </span>
          {lastSync && (
            <span className="badge">
              <RefreshCw className="w-3 h-3" /> sinkron {lastSync}
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-transparent focus-within:border-border-strong transition-all">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari posisi / perusahaan..."
              aria-label="Cari kartu lamaran"
              className="bg-transparent border-none outline-none w-44 text-xs text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => loadSheet(true)}
            disabled={syncing}
            className="btn-ghost text-xs py-1.5"
            title="Tarik baris baru dari spreadsheet tanpa menggandakan kartu yang sudah ada"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sinkron Spreadsheet
          </button>
        </div>
      </header>

      {(syncNote || sheetError) && (
        <div className="shrink-0 mb-3">
          {sheetError ? (
            <span className="badge bg-white/[0.05] text-foreground border-border-strong">
              <AlertCircle className="w-3 h-3" /> Spreadsheet tidak terbaca — kanban memakai data tersimpan
            </span>
          ) : (
            <span className="badge bg-white/[0.06] text-foreground border-border">
              <Database className="w-3 h-3" /> {syncNote}
            </span>
          )}
        </div>
      )}

      {/* Panel penilaian */}
      <section className="shrink-0 max-h-[45%] overflow-y-auto scroll-thin card p-3 mb-3">
        <div className={`flex flex-wrap items-center justify-between gap-2 ${panelOpen ? 'mb-3' : ''}`}>
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="text-sm font-semibold text-foreground flex items-center gap-2"
            aria-expanded={panelOpen}
          >
            <Target className="w-4 h-4 text-primary" /> Nilai Kecocokan Lowongan
            {panelOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {loadingCv ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat CV...
            </span>
          ) : hasCv ? (
            <span className="flex items-center gap-2">
              <span className="badge">
                <FileText className="w-3 h-3" /> {cvName || 'CV Utama'}
              </span>
              <button
                onClick={() => { setCvOpen(!cvOpen); setCvDraft(cvText); }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ganti
              </button>
            </span>
          ) : (
            <button onClick={() => setCvOpen(true)} className="badge bg-white/[0.05] text-foreground border-border-strong">
              <UploadCloud className="w-3 h-3" /> Tempel CV dulu
            </button>
          )}
        </div>

        {panelOpen && cvOpen && (
          <div className="mb-3">
            <textarea
              value={cvDraft}
              onChange={(e) => setCvDraft(e.target.value)}
              rows={5}
              placeholder="Tempel isi CV Anda di sini (teks) — disimpan di browser, dipakai untuk menilai kecocokan."
              className="input font-mono text-xs"
            />
            <div className="mt-2 flex items-center gap-3">
              <button onClick={saveCv} disabled={!cvDraft.trim()} className="btn-primary text-xs py-1.5">
                Simpan CV
              </button>
              <button onClick={() => { setCvOpen(false); setCvDraft(''); }} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Batal
              </button>
              <span className="text-[11px] text-muted-foreground">Tersimpan lokal di browser ini.</span>
            </div>
          </div>
        )}

        {panelOpen && (
          <>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={3}
          placeholder="Tempel deskripsi lowongan di sini (requirement, kualifikasi, tanggung jawab)..."
          className="input font-mono text-xs"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={handleScore}
            disabled={scoring || !jd.trim() || !hasCv}
            className="btn-primary text-xs"
          >
            {scoring ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menilai...</> : <><Sparkles className="w-3.5 h-3.5" /> Nilai Kecocokan</>}
          </button>
          {jd.trim() && (
            <button onClick={() => { setJd(''); setDraft(null); setError(null); }} className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Bersihkan
            </button>
          )}
          {error && (
            <span className="text-xs font-medium text-foreground bg-white/[0.05] border border-border-strong px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
        </div>

        {draft && (
          <div className="mt-3 rounded-xl border border-border bg-white/[0.03] p-3 animate-pop-in">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <ScoreBadge score={draft.match.score} />
                  <span className="text-[11px] text-muted-foreground">belum disimpan</span>
                </div>
                <h3 className="font-semibold text-sm text-foreground">{draft.jobTitle}</h3>
                {draft.companyName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Briefcase className="w-3 h-3" /> {draft.companyName}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveDraft} className="btn-primary text-xs py-1.5">Simpan ke Kanban</button>
                <button onClick={() => setDraft(null)} className="btn-ghost text-xs py-1.5">
                  <X className="w-3.5 h-3.5" /> Buang
                </button>
              </div>
            </div>
            <AnalysisBlock match={draft.match} />
          </div>
        )}
          </>
        )}
      </section>

      {/* Board */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-x-auto scroll-thin">
        {APPLICATION_STATUSES.map((status) => {
          const items = visibleApps.filter((a) => a.status === status);
          const isOver = overStatus === status;
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); if (overStatus !== status) setOverStatus(status); }}
              onDragLeave={() => setOverStatus((s) => (s === status ? null : s))}
              onDrop={() => {
                if (dragId) move(dragId, status);
                setDragId(null);
                setOverStatus(null);
              }}
              className={`flex-1 min-w-[112px] rounded-2xl border p-2.5 flex flex-col min-h-0 transition-colors ${
                isOver ? "border-primary bg-white/[0.06]" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-1 px-1 pb-2 shrink-0">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">{status}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{COLUMN_HINT[status]}</div>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scroll-thin space-y-2 pr-0.5">
                {items.length === 0 && (
                  <div className="flex-1 border border-dashed border-border-strong rounded-xl grid place-items-center p-3 text-center text-[11px] text-muted-foreground">
                    Tarik kartu ke sini
                  </div>
                )}

                {items.map((app) => {
                  const next = nextStatus(app.status);
                  const open = openId === app.id;
                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      onDragEnd={() => { setDragId(null); setOverStatus(null); }}
                      className="bg-card border border-border rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:border-border-strong transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        {app.match ? (
                          <ScoreBadge score={app.match.score} />
                        ) : (
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">belum dinilai</span>
                        )}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => setOpenId(open ? null : app.id)}
                            title={open ? 'Tutup' : 'Lihat analisis'}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setApps(removeApplication(app.id))}
                            title="Hapus kartu"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-xs text-foreground mt-1.5 leading-snug break-words">{app.jobTitle}</h4>
                      {app.companyName && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{app.companyName}</div>
                      )}
                      {app.source === 'sheet' && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Database className="w-2.5 h-2.5 shrink-0" /> <span className="whitespace-nowrap">{app.appliedAt.slice(0, 10)}</span>
                        </div>
                      )}

                      {app.match && !open && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{app.match.verdict}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {app.generatedCv && (
                          <Link href={`/custom-cv?appId=${app.id}`} className="text-[11px] font-semibold text-primary hover:underline">
                            Lihat CV
                          </Link>
                        )}
                        {next && (
                          <button
                            onClick={() => move(app.id, next)}
                            className="ml-auto text-[11px] font-medium text-muted-foreground hover:text-primary flex items-center gap-1"
                            title={`Pindah ke ${next}`}
                          >
                            {next} <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      {open && app.match && <AnalysisBlock match={app.match} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
