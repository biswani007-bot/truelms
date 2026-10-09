"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { verifyPdfBlob } from "@/lib/utils/pdf-validation";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface CertificateDownloadButtonProps {
  certificateId: string;
  certificateNumber?: string;
  className?: string;
  label?: string;
}

export default function CertificateDownloadButton({
  certificateId,
  certificateNumber,
  className,
  label = "Download PDF",
}: CertificateDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;

    setDownloading(true);
    try {
      const token = typeof window !== "undefined"
        ? (localStorage.getItem("token") || localStorage.getItem("accessToken"))
        : null;

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/certificates/${certificateId}/download`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        let msg = "Failed to download certificate";
        try {
          const json = await response.json();
          msg = json.message || msg;
        } catch {
          // not json
        }
        toast.error("Download Failed", msg);
        return;
      }

      const blob = await response.blob();
      const validation = await verifyPdfBlob(blob, response.headers.get("content-type"));

      if (!validation.isValid) {
        toast.error("Corrupted Document", validation.error || "The server returned an invalid PDF document.");
        return;
      }

      // Safe trigger download
      const filename = `TrueLern-Certificate-${certificateNumber || certificateId}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download Complete", "Official certificate PDF downloaded successfully.");
    } catch (err: any) {
      toast.error("Download Error", err.message || "An error occurred while downloading the certificate.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={
        className ||
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow hover:bg-indigo-50 transition disabled:opacity-60"
      }
    >
      {downloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>{downloading ? "Validating..." : label}</span>
    </button>
  );
}
