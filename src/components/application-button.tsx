"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBackgroundJobs } from "@/context/background-jobs-context";
import { createClient } from "@/lib/supabase/client";

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
      // 1. Quick check if base CV exists in Supabase
      const supabase = createClient();
      const { data } = await supabase
        .from('user_cvs')
        .select('cv_text')
        .eq('user_id', "default_user")
        .single();
      
      if (!data || !data.cv_text) {
        setNotification({
          show: true,
          type: "warning",
          title: "CV Belum Tersedia",
          message: "CV Utama Anda belum tersedia. Silakan isi CV Anda di halaman Profil terlebih dahulu agar AI bisa membuatkan CV khusus untuk lowongan ini.",
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

  return (
    <>
      <button
        onClick={handleApplyClick}
        disabled={isJobLoading}
        className="bg-primary hover:bg-primary-light text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isJobLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Memproses AI (BG)...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Buat CV Otomatis
          </>
        )}
      </button>

      {/* Modern Custom UI Notification Overlay */}
      {notification && notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl transform scale-100 transition-all flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {notification.type === 'success' && (
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            )}
            {notification.type === 'error' && (
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-9 h-9" />
              </div>
            )}
            {notification.type === 'warning' && (
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-9 h-9" />
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900">
              {notification.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {notification.message}
            </p>
            
            <button
              onClick={() => {
                const onConf = notification.onConfirm;
                setNotification(null);
                if (onConf) {
                  onConf();
                }
              }}
              className="w-full bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-semibold transition-colors mt-2"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
