"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, BellRing, Briefcase, Calendar, Database, Lightbulb,
  Loader2, Sparkles, SquareKanban, Target, TrendingUp,
} from "lucide-react";
import { APPLICATION_STATUSES, ApplicationRecord, ApplicationStatus, SHEET_STATUS_MAP, normalizeSheetDate } from "@/lib/applications-store";
import type { TrackerRow } from "@/lib/tracker-sheet";

// Trio aksen dipakai konsisten di seluruh aplikasi:
// kuning = sedang berjalan, koral = butuh perhatian, lime = berhasil, abu = netral.
const STATUS_TONE: Record<ApplicationStatus, string> = {
  'CV Dibuat': "bg-white/45",
  'Dikirim': "bg-yellow",
  'Dilihat': "bg-yellow/60",
  'Interview': "bg-coral",
  'Diterima': "bg-lime",
  'Ditolak': "bg-white/20",
};

interface MergedEntry {
  key: string;
  position: string;
  company: string;
  status: ApplicationStatus;
  rawStatus: string;
  date: string;
  updatedAt: string;
  score?: number;
  verdict?: string;
  sources: Array<'spreadsheet' | 'kanban'>;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-lime border-lime/40 bg-lime/10";
  if (score >= 50) return "text-yellow border-yellow/40 bg-yellow/10";
  return "text-coral border-coral/40 bg-coral/10";
}

function norm(s: string) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function daysSince(ymd: string): number | null {
  if (!ymd) return null;
  const d = new Date(ymd);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Target; label: string; value: string; hint?: string }) {
  return (
    <div className="card card-hover p-4 flex items-center gap-3.5">
      <span className="w-10 h-10 rounded-xl bg-white/[0.06] border border-border text-foreground grid place-items-center shrink-0">
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold text-foreground leading-tight">{value}</div>
        {hint && <div className="text-xs text-muted-foreground truncate">{hint}</div>}
      </div>
    </div>
  );
}

export function DashboardInsights() {
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadSheet = () =>
      fetch("/api/tracker", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          setRows(d.rows ?? []);
          setSheetError(d.error ?? null);
        })
        .catch((e) => alive && setSheetError(e instanceof Error ? e.message : String(e)))
        .finally(() => alive && setReady(true));

    import("@/lib/applications-store").then(({ getApplications }) => {
      if (alive) setApps(getApplications());
    });

    loadSheet();

    // Ikuti perubahan spreadsheet saat tab kembali aktif (halaman ini tidak di-reload).
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      import("@/lib/applications-store").then(({ getApplications }) => alive && setApps(getApplications()));
      loadSheet();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      alive = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const merged = useMemo<MergedEntry[]>(() => {
    const byKey = new Map<string, MergedEntry>();

    rows.forEach((row) => {
      const key = norm(row.position) + "|" + norm(row.company);
      if (!row.position && !row.company) return;
      const mapped = SHEET_STATUS_MAP[row.status.trim().toLowerCase()] ?? 'Dikirim';
      byKey.set(key, {
        key,
        position: row.position || '(tanpa posisi)',
        company: row.company,
        status: mapped,
        rawStatus: row.status || 'Pending',
        date: normalizeSheetDate(row.date),
        updatedAt: normalizeSheetDate(row.updatedAt || row.date),
        sources: ['spreadsheet'],
      });
    });

    apps.forEach((app) => {
      const key = norm(app.jobTitle) + "|" + norm(app.companyName);
      const existing = byKey.get(key);
      if (existing) {
        existing.sources.push('kanban');
        existing.score = app.match?.score;
        existing.verdict = app.match?.verdict;
        return;
      }
      byKey.set(key, {
        key,
        position: app.jobTitle,
        company: app.companyName,
        status: app.status,
        rawStatus: app.status,
        date: app.appliedAt.slice(0, 10),
        updatedAt: app.appliedAt.slice(0, 10),
        score: app.match?.score,
        verdict: app.match?.verdict,
        sources: ['kanban'],
      });
    });

    return [...byKey.values()];
  }, [rows, apps]);

  if (!ready) {
    return (
      <div className="card p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat ringkasan lamaran...
      </div>
    );
  }

  if (merged.length === 0) {
    return (
      <section className="card p-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-border text-foreground grid place-items-center mb-4">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h2 className="font-gothic text-sm font-bold uppercase tracking-[0.14em] text-foreground">Belum ada data lamaran</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Spreadsheet tracker masih kosong dan belum ada kartu di Kanban. Tempel deskripsi lowongan di Kanban untuk dapat skor kecocokan + saran perbaikan CV.
        </p>
        <div className="flex flex-wrap gap-2 mt-5 justify-center">
          <Link href="/kanban" className="btn-primary"><SquareKanban className="w-4 h-4" /> Buka Kanban</Link>
          <Link href="/jobs" className="btn-ghost">Cari Lowongan</Link>
        </div>
      </section>
    );
  }

  const count = (s: ApplicationStatus) => merged.filter((e) => e.status === s).length;
  const scored = apps.filter((a) => a.match);
  const avgScore = scored.length ? Math.round(scored.reduce((sum, a) => sum + (a.match?.score ?? 0), 0) / scored.length) : null;

  const active = count('Dikirim') + count('Dilihat');
  const interviews = count('Interview');
  const offers = count('Diterima');
  const rejected = count('Ditolak');

  const topMatches = [...scored].sort((a, b) => (b.match!.score) - (a.match!.score)).slice(0, 4);
  const needsWork = [...scored].sort((a, b) => (a.match!.score) - (b.match!.score)).slice(0, 3);

  // Requirement yang paling sering belum ada di CV — sinyal paling berguna untuk perbaikan CV.
  const gapCount = new Map<string, number>();
  scored.forEach((a) => a.match!.missing.forEach((m) => gapCount.set(m, (gapCount.get(m) ?? 0) + 1)));
  const topGaps = [...gapCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const suggestions = [...new Set(needsWork.flatMap((a) => a.match!.suggestions))].slice(0, 4);

  // Lamaran yang belum ada kabar lama — kandidat follow-up.
  const followUps = merged
    .filter((e) => e.status === 'Dikirim' || e.status === 'Dilihat')
    .map((e) => ({ ...e, age: daysSince(e.updatedAt) }))
    .filter((e) => e.age !== null && e.age >= 14)
    .sort((a, b) => (b.age ?? 0) - (a.age ?? 0))
    .slice(0, 4);

  const latest = [...merged]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Sumber data */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">
          <Database className="w-3 h-3" /> Spreadsheet tracker: {rows.length} baris
        </span>
        <span className="badge">
          <SquareKanban className="w-3 h-3" /> Kanban: {apps.length} kartu
        </span>
        {sheetError && (
          <span className="badge bg-white/[0.05] text-foreground border-border-strong">
            Spreadsheet tidak terbaca — memakai data Kanban saja
          </span>
        )}
      </div>

      {/* Statistik utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Briefcase} label="Total lamaran" value={String(merged.length)} hint={`${count('Dikirim')} menunggu balasan`} />
        <Stat icon={TrendingUp} label="Sedang diproses" value={String(active)} hint={`${count('Dilihat')} sudah dilihat`} />
        <Stat icon={Calendar} label="Interview" value={String(interviews)} hint={offers > 0 ? `${offers} offer masuk` : 'belum ada offer'} />
        <Stat
          icon={Target}
          label="Rata-rata skor"
          value={avgScore === null ? '—' : `${avgScore}%`}
          hint={scored.length ? `${scored.length} lowongan dinilai AI` : 'belum ada yang dinilai'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sebaran tahapan */}
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-foreground" /> Sebaran tahapan lamaran
          </h2>

          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-white/[0.05] border border-border">
            {APPLICATION_STATUSES.map((s) => {
              const n = count(s);
              if (!n) return null;
              return <div key={s} className={STATUS_TONE[s]} style={{ width: `${(n / merged.length) * 100}%` }} title={`${s}: ${n}`} />;
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
            {APPLICATION_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.035] border border-border">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 border border-border-strong ${STATUS_TONE[s]}`} />
                <span className="text-xs text-muted-foreground truncate">{s}</span>
                <span className="ml-auto text-xs font-semibold text-foreground">{count(s)}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {interviews + offers > 0
              ? `Rasio lolos: ${interviews + offers} dari ${merged.length} lamaran masuk tahap interview/offer.`
              : `Belum ada yang masuk tahap interview dari ${merged.length} lamaran.`}
            {rejected > 0 && ` ${rejected} lamaran ditolak/ditutup.`}
          </p>
        </section>

        {/* Peluang terkuat */}
        <section className="card p-5">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-foreground" /> Peluang terkuat
          </h2>

          {topMatches.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada lowongan yang dinilai AI. Tempel deskripsi di Kanban.</p>
          ) : (
            <ul className="space-y-2.5">
              {topMatches.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${scoreTone(a.match!.score)}`}>
                    {a.match!.score}%
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{a.jobTitle}</div>
                    {a.companyName && <div className="text-xs text-muted-foreground truncate">{a.companyName}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Celah CV */}
        <section className="card p-5">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" /> Celah CV yang paling sering muncul
          </h2>

          {topGaps.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {scored.length === 0
                ? 'Belum ada data. Nilai kecocokan CV di Kanban dulu.'
                : 'Mantap — tidak ada requirement yang berulang kali absen dari CV Anda.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {topGaps.map(([gap, n]) => (
                <li key={gap} className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-muted-foreground bg-white/[0.03] border border-border px-1.5 py-0.5 rounded shrink-0">
                    {n}×
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{gap}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-foreground mt-4">
            Perbarui CV utama <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Saran */}
        <section className="card p-5">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-foreground" /> Saran perbaikan CV
          </h2>

          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {scored.length === 0
                ? 'Belum ada saran. Nilai kecocokan CV di Kanban untuk mendapat rekomendasi konkret.'
                : 'Semua lamaran sudah berskor tinggi — tidak ada saran mendesak.'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {suggestions.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          )}
          <Link href="/kanban" className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-foreground mt-4">
            Buka Kanban lamaran <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Follow-up */}
        <section className="card p-5">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-foreground" /> Perlu ditindak lanjuti
          </h2>

          {followUps.length === 0 ? (
            <p className="text-xs text-muted-foreground">Tidak ada lamaran yang menggantung lebih dari 14 hari.</p>
          ) : (
            <ul className="space-y-2.5">
              {followUps.map((e) => (
                <li key={e.key} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground bg-white/[0.05] border border-border-strong px-1.5 py-0.5 rounded shrink-0">
                    {e.age} hari
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{e.position}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.company || '—'} · {e.rawStatus}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lamaran terbaru */}
        <section className="card p-5">
          <h2 className="font-gothic text-xs font-bold uppercase tracking-[0.14em] text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-foreground" /> Lamaran terbaru
          </h2>

          <ul className="space-y-2.5">
            {latest.map((e) => (
              <li key={e.key} className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 border border-border-strong ${STATUS_TONE[e.status]}`} />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{e.position}</div>
                  <div className="text-xs text-muted-foreground truncate">{e.company || '—'} · {e.rawStatus}{e.date ? ` · ${e.date}` : ''}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
