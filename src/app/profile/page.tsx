"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, User, Mail, Phone, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getLocalCvText, getLocalProfile, saveLocalProfile } from "@/lib/local-profile";

interface NotificationState {
  show: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

export default function ProfilePage() {
  const USER_ID = "default_user";

  // Personal Data State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // CV Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [existingCvName, setExistingCvName] = useState<string | null>(null);

  // Notification State
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  // Muat profil: browser dulu (instan & selalu ada), cloud menimpa kalau tersedia.
  useEffect(() => {
    const local = getLocalProfile();
    if (local.fullName) setFullName(local.fullName);
    if (local.email) setEmail(local.email);
    if (local.phone) setPhone(local.phone);

    const localCv = getLocalCvText();
    if (localCv) {
      setExistingCvName(local.cvName || 'CV tersimpan (browser)');
      setUploadSuccess(true);
    }
    setIsLoadingProfile(false);

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('user_cvs')
          .select('cv_name, full_name, email, phone')
          .eq('user_id', USER_ID)
          .single();

        if (data) {
          if (data.cv_name && !localCv) {
            setExistingCvName(data.cv_name);
            setUploadSuccess(true);
          }
          if (data.full_name && !local.fullName) setFullName(data.full_name);
          if (data.email && !local.email) setEmail(data.email);
          if (data.phone && !local.phone) setPhone(data.phone);
        }
      } catch (err) {
        console.warn('Cloud profil tidak tersedia, memakai data browser:', err);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);

    // 1. Simpan di browser — tidak butuh jaringan, tidak pernah gagal.
    saveLocalProfile({ fullName, email, phone });

    // 2. Sinkronkan ke cloud kalau bisa; kegagalan cloud bukan kegagalan menyimpan.
    let cloudOk = true;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: USER_ID,
          full_name: fullName,
          email: email,
          phone: phone,
        }, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (error) {
      cloudOk = false;
      console.warn("Sinkronisasi profil ke cloud gagal:", error);
    }

    setNotification(
      cloudOk
        ? {
            show: true,
            type: "success",
            title: "Profil Diperbarui",
            message: "Data pribadi Anda berhasil disimpan dan disinkronkan ke cloud!",
          }
        : {
            show: true,
            type: "success",
            title: "Profil Tersimpan di Browser",
            message: "Data pribadi Anda tersimpan dan langsung dipakai fitur AI. Sinkronisasi cloud sedang tidak tersedia, jadi data disimpan di browser ini.",
          }
    );
    setIsSavingProfile(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || uploadData.error || !uploadData.text) {
        throw new Error(uploadData.error || "Gagal mem-parsing CV. Pastikan format file adalah PDF atau DOCX.");
      }

      const extractedText = uploadData.text;

      // Simpan di browser dulu (selalu berhasil), lalu coba cloud.
      saveLocalProfile({ cvText: extractedText, cvName: file.name });

      let cloudOk = true;
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('user_cvs')
          .upsert({
            user_id: USER_ID,
            cv_text: extractedText,
            cv_name: file.name,
          }, { onConflict: 'user_id' });
        if (error) throw error;
      } catch (error) {
        cloudOk = false;
        console.warn("Sinkronisasi CV ke cloud gagal:", error);
      }

      setExistingCvName(file.name);
      setUploadSuccess(true);
      setNotification({
        show: true,
        type: "success",
        title: "CV Berhasil Diekstrak",
        message: cloudOk
          ? `Dokumen "${file.name}" berhasil diunggah dan diuraikan oleh AI.`
          : `Dokumen "${file.name}" berhasil diuraikan dan disimpan di browser ini. Cloud sedang tidak tersedia, tapi fitur AI sudah bisa memakai CV ini.`,
      });
    } catch (error: any) {
      console.error("Gagal mengunggah CV:", error);
      setNotification({
        show: true,
        type: "error",
        title: "Pengunggahan Gagal",
        message: error.message || "Gagal menyimpan CV ke database.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-4xl w-full mx-auto space-y-5">
      <header>
        <h1 className="font-gothic text-lg lg:text-xl font-bold uppercase tracking-[0.12em] text-foreground">Profil &amp; CV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data ini dipakai AI untuk membuat CV tailored dan menilai kecocokan lowongan.
        </p>
      </header>

      {/* Data pribadi */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Data Pribadi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nomor telepon</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="input pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={handleSaveProfile} disabled={isSavingProfile || isLoadingProfile} className="btn-primary">
            {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Perubahan
          </button>
        </div>
      </section>

      {/* CV utama */}
      <section className="card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" /> CV Utama
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Unggah CV (PDF/DOCX/TXT). Teksnya diekstrak otomatis dan disimpan di browser ini, siap dipakai fitur AI.
        </p>

        <div className="rounded-xl border border-dashed border-border-strong bg-white/[0.03] p-6 text-center">
          {!uploadSuccess ? (
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] text-primary grid place-items-center mb-3">
                <UploadCloud className="w-5 h-5" />
              </div>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="cv-upload"
              />

              <label htmlFor="cv-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                Klik untuk mengunggah
              </label>
              <span className="text-xs text-muted-foreground mt-1">atau tarik file ke sini (PDF / DOCX / TXT)</span>

              {file && (
                <div className="mt-4 text-xs font-medium text-muted-foreground bg-card px-3 py-2 rounded-lg border border-border">
                  File terpilih: {file.name}
                </div>
              )}

              {file && (
                <button onClick={handleUpload} disabled={isUploading} className="btn-primary mt-4">
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : "Simpan & Ekstrak Data"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] text-foreground grid place-items-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">CV tersimpan</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Data dari <span className="font-medium text-foreground">{existingCvName || file?.name}</span> siap dipakai fitur AI.
              </p>

              <button
                onClick={async () => {
                  setFile(null);
                  setUploadSuccess(false);
                  setExistingCvName(null);

                  saveLocalProfile({ cvText: '', cvName: '' });
                  try {
                    const supabase = createClient();
                    await supabase.from('user_cvs').update({ cv_text: null, cv_name: null }).eq('user_id', USER_ID);
                  } catch (error) {
                    console.warn('Gagal menghapus CV di cloud:', error);
                  }
                }}
                className="mt-4 text-xs font-medium text-primary hover:underline"
              >
                Ganti CV Utama
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Notification */}
      {notification && notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 max-w-sm w-full flex flex-col items-center text-center gap-3 animate-pop-in">
            {notification.type === 'success' ? (
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] text-foreground grid place-items-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] text-foreground grid place-items-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}

            <h3 className="text-base font-semibold text-foreground">{notification.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>

            <button onClick={() => setNotification(null)} className="btn-primary w-full mt-1">
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
