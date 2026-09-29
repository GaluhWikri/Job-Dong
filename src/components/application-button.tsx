"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBackgroundJobs } from "@/context/background-jobs-context";
import { createClient } from "@/lib/supabase/client";
import { getLocalCvText } from "@/lib/local-profile";

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobDescription: string;
}

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  onConfirm?: () => void;
}

export function ApplicationButton({ jobId, jobTitle, companyName, location, jobDescription }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const router = useRouter();
  const { activeGenerations, generateCv } = useBackgroundJobs();

  const currentGen = activeGenerations.find((g) => g.jobId === jobId);
  const isJobLoading = currentGen?.status === "loading" || isLoading;

  const handleApplyClick = async () => {
    setIsLoading(true);
    try {
      // 1. CV dari browser dipakai dulu (cloud bisa tidak tersedia), cloud jadi cadangan.
      let hasCv = Boolean(getLocalCvText().trim());
      if (!hasCv) {
        const supabase = createClient();
        const { data } = await supabase
          .from('user_cvs')
          .select('cv_text')
          .eq('user_id', "default_user")
          .single();
        hasCv = Boolean(data?.cv_text);
      }

      if (!hasCv) {
        setNotification({
          show: true,
          type: "warning",
          title: "CV Belum Tersedia",
          message: "CV Utama Anda belum ada. Isi CV di halaman Profil (atau tempel di Kanban) agar AI bisa membuatkan CV khusus untuk lowongan ini.",
          onConfirm: () => {
            router.push('/profile');
          }
        });
        setIsLoading(false);
        return;
      }

      // 2. Start background CV generation (will run in background context)
      generateCv({
        jobId,
        jobTitle,
        companyName,
        location,
        jobDescription,
      });

      // 3. Immediately redirect to applications page to track progress
      router.push('/applications');
    } catch (err: any) {
      console.error(err);
      setNotification({
        show: true,
        type: "error",
        title: "Koneksi Gagal",
        message: err.message || "Gagal menghubungi database."
      });
      setIsLoading(false);
    }
  };

  const ICONS = {
    success: { Icon: CheckCircle2, cls: "bg-white/[0.06] text-foreground" },
    error: { Icon: AlertCircle, cls: "bg-white/[0.05] text-foreground" },
    warning: { Icon: AlertTriangle, cls: "bg-white/[0.05] text-foreground" },
  };

  return (
    <>
      <button onClick={handleApplyClick} disabled={isJobLoading} className="btn-primary w-full">
        {isJobLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Buat CV Otomatis
          </>
        )}
      </button>

      {notification && notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 max-w-sm w-full flex flex-col items-center text-center gap-3 animate-pop-in">
            {(() => {
              const { Icon, cls } = ICONS[notification.type];
              return (
                <div className={`w-12 h-12 rounded-xl grid place-items-center ${cls}`}>
                  <Icon className="w-6 h-6" />
                </div>
              );
            })()}

            <h3 className="text-base font-semibold text-foreground">{notification.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>

            <button
              onClick={() => {
                const onConf = notification.onConfirm;
                setNotification(null);
                if (onConf) {
                  onConf();
                }
              }}
              className="btn-primary w-full mt-1"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
