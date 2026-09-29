"use client";

import React, { createContext, useContext, useState } from "react";
import { saveApplication } from "@/lib/applications-store";
import { createClient } from "@/lib/supabase/client";

export interface ActiveGeneration {
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: "loading" | "success" | "error";
  error?: string;
}

interface BackgroundJobsContextType {
  activeGenerations: ActiveGeneration[];
  generateCv: (params: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobDescription: string;
  }) => Promise<void>;
  clearGeneration: (jobId: string) => void;
}

const BackgroundJobsContext = createContext<BackgroundJobsContextType | undefined>(undefined);

export function BackgroundJobsProvider({ children }: { children: React.ReactNode }) {
  const [activeGenerations, setActiveGenerations] = useState<ActiveGeneration[]>([]);

  // Function to start background generation
  const generateCv = async ({
    jobId,
    jobTitle,
    companyName,
    location,
    jobDescription,
  }: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobDescription: string;
  }) => {
    // Check if already loading
    if (activeGenerations.some((g) => g.jobId === jobId && g.status === "loading")) {
      return;
    }

    // Add to active generations state
    const newGen: ActiveGeneration = {
      jobId,
      jobTitle,
      companyName,
      status: "loading",
    };
    setActiveGenerations((prev) => [...prev.filter((g) => g.jobId !== jobId), newGen]);

    try {
      // 1. Fetch CV text and contact info from Supabase
      const supabase = createClient();
      const { data } = await supabase
        .from("user_cvs")
        .select("cv_text, full_name, email, phone")
        .eq("user_id", "default_user")
        .single();

      if (!data || !data.cv_text) {
        throw new Error(
          "CV Utama Anda belum tersedia. Silakan isi CV Anda di halaman Profil terlebih dahulu."
        );
      }

      // 2. Clean HTML from job description
      const cleanJobDesc = jobDescription.replace(/<[^>]*>?/gm, "").trim();

      // 3. Post to generation API
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText: data.cv_text,
          jobTitle,
          jobDescription: cleanJobDesc,
          companyName,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membuat CV otomatis.");
      }

      const generateData = await res.json();
      if (generateData.error) throw new Error(generateData.error);
      if (!generateData.tailoredCv) throw new Error("Hasil CV kosong dari AI.");

      // 4. Save to local storage
      saveApplication({
        jobId,
        jobTitle,
        companyName,
        location,
        generatedCv: generateData.tailoredCv,
      });

      // Update state to success
      setActiveGenerations((prev) =>
        prev.map((g) => (g.jobId === jobId ? { ...g, status: "success" } : g))
      );
    } catch (err: any) {
      console.error(err);
      setActiveGenerations((prev) =>
        prev.map((g) =>
          g.jobId === jobId
            ? { ...g, status: "error", error: err.message || "Gagal membuat CV." }
            : g
        )
      );
    }
  };

  const clearGeneration = (jobId: string) => {
    setActiveGenerations((prev) => prev.filter((g) => g.jobId !== jobId));
  };

  return (
    <BackgroundJobsContext.Provider value={{ activeGenerations, generateCv, clearGeneration }}>
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs() {
  const context = useContext(BackgroundJobsContext);
  if (!context) {
    throw new Error("useBackgroundJobs must be used within a BackgroundJobsProvider");
  }
  return context;
}
