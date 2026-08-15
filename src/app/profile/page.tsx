"use client";

import { useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, User, Mail, Phone, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

  // Fetch existing CV and Profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_cvs')
        .select('cv_name, full_name, email, phone')
        .eq('user_id', USER_ID)
        .single();
      
      if (data) {
        if (data.cv_name) {
          setExistingCvName(data.cv_name);
          setUploadSuccess(true);
        }
        if (data.full_name) setFullName(data.full_name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
      }
      setIsLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
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
      setNotification({
        show: true,
        type: "success",
        title: "Profil Diperbarui",
        message: "Data pribadi Anda berhasil disimpan dengan aman!"
      });
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      setNotification({
        show: true,
        type: "error",
        title: "Gagal Menyimpan",
        message: "Gagal menyimpan profil ke database. Silakan coba kembali."
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Create FormData to send file to API
      const formData = new FormData();
      formData.append('file', file);

      // Call internal API to parse PDF
      const uploadRes = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mem-parsing CV. Pastikan format file adalah PDF.");
      }

      const uploadData = await uploadRes.json();
      
      if (uploadData.error) {
        throw new Error(uploadData.error);
      }

      const extractedText = uploadData.text;
      const supabase = createClient();
      
      // Upsert into Supabase (preserve existing profile fields if any)
      const { error } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: USER_ID,
          cv_text: extractedText,
          cv_name: file.name
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setExistingCvName(file.name);
      setUploadSuccess(true);
      setNotification({
        show: true,
        type: "success",
        title: "CV Berhasil Diekstrak",
        message: `Dokumen "${file.name}" berhasil diunggah dan diuraikan oleh AI.`
      });
    } catch (error: any) {
      console.error("Gagal mengunggah CV:", error);
      setNotification({
        show: true,
        type: "error",
        title: "Pengunggahan Gagal",
        message: error.message || "Gagal menyimpan CV ke database."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-10 tracking-tight">Profil Saya</h1>

      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-md shadow-slate-100/40 mb-8">
        <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2.5">
          <User className="w-5 h-5 text-primary"/> Data Pribadi
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Nama Lengkap</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email.anda@contoh.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-wider">Nomor Telepon</label>
            <div className="relative">
               <Phone className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/50 text-sm font-semibold transition-all duration-200"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile || isLoadingProfile}
            className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 flex items-center gap-2 duration-200"
          >
            {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-md shadow-slate-100/40">
        <h2 className="text-lg font-extrabold text-slate-800 mb-2.5 flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-primary"/> CV Utama
        </h2>
        <p className="text-slate-500 font-medium text-xs mb-6 uppercase tracking-wider leading-relaxed">
          Unggah CV utama Anda (PDF/DOCX). Data CV akan diuraikan AI secara otomatis untuk mempermudah pembuatan CV baru.
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/30 hover:bg-slate-50/60 transition-all duration-200">
          {!uploadSuccess ? (
            <div className="flex flex-col items-center justify-center">
               <div className="bg-primary/5 text-primary p-4 rounded-full border border-primary/10 shadow-sm mb-4">
                 <UploadCloud className="w-7 h-7" />
               </div>
               
               <input 
                 type="file" 
                 accept=".pdf,.docx" 
                 onChange={handleFileChange}
                 className="hidden" 
                 id="cv-upload"
               />
               
               <label 
                 htmlFor="cv-upload" 
                 className="cursor-pointer font-bold text-primary hover:text-primary-dark transition-colors text-sm"
               >
                 Klik untuk mengunggah
               </label>
               <span className="text-xs text-slate-400 mt-1 font-semibold">atau tarik file ke sini (PDF / DOCX)</span>
               
               {file && (
                 <div className="mt-4 text-xs font-bold text-slate-650 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                   File terpilih: <span>{file.name}</span>
                 </div>
               )}

               {file && (
                 <button 
                   onClick={handleUpload}
                   disabled={isUploading}
                   className="mt-6 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 inline-flex items-center gap-2 text-sm shadow-md shadow-primary/20 duration-200"
                 >
                   {isUploading ? <><Loader2 className="w-4 h-4 animate-spin"/> Memproses...</> : "Simpan & Ekstrak Data"}
                 </button>
               )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
               <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100 shadow-sm mb-4">
                 <CheckCircle2 className="w-7 h-7" />
               </div>
               <h3 className="text-base font-extrabold text-slate-800">CV Tersimpan di Cloud!</h3>
               <p className="text-slate-400 text-xs font-semibold mt-1">Data dari <span className="text-slate-650 font-bold">{existingCvName || file?.name}</span> telah berhasil disimpan.</p>
               
               <button 
                 onClick={async () => { 
                   setFile(null); 
                   setUploadSuccess(false); 
                   setExistingCvName(null);
                   
                   // Set cv_text and cv_name to null in Supabase instead of deleting the whole row
                   const supabase = createClient();
                   await supabase.from('user_cvs').update({ cv_text: null, cv_name: null }).eq('user_id', USER_ID);
                 }}
                 className="mt-6 text-primary hover:text-primary-dark text-xs font-bold hover:underline transition-colors"
               >
                 Ganti CV Utama
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Modern Custom UI Notification Overlay */}
      {notification && notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl transform scale-100 transition-all flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {notification.type === 'success' ? (
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-9 h-9" />
              </div>
            )}
            
            <h3 className="text-xl font-bold text-gray-900">
              {notification.title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {notification.message}
            </p>
            
            <button
              onClick={() => setNotification(null)}
              className="w-full bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-semibold transition-colors mt-2"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
