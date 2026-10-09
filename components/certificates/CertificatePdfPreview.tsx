"use client";

import React, { useEffect, useState } from "react";
import { verifyPdfBlob } from "@/lib/utils/pdf-validation";

export default function CertificatePdfPreview({
  id,
  refreshKey = 0,
}: {
  id: string;
  refreshKey?: number | string;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function fetchPdf() {
      try {
        setLoading(true);
        // We fetch using the browser's credentials (assuming standard setup for this LMS).
        // Since it's a client component, it will automatically include cookies. 
        // If Bearer token is needed from localStorage, we add it:
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/certificates/${id}/download?preview=true&t=${Date.now()}`, {
          method: "GET",
          headers
        });

        if (!response.ok) {
          let errorMsg = "Failed to load PDF preview (unauthorized or missing)";
          try {
            const errJson = await response.json();
            if (errJson.message) errorMsg = errJson.message;
          } catch {
            // response was not json
          }
          throw new Error(errorMsg);
        }

        const blob = await response.blob();
        const validation = await verifyPdfBlob(blob, response.headers.get("content-type"));
        if (!validation.isValid) {
          throw new Error(validation.error || "The server response was not a valid PDF document.");
        }

        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, refreshKey]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading document securely...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-red-50 text-red-500 text-sm p-4 text-center">
        {error}
      </div>
    );
  }

  if (pdfUrl) {
    return (
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0 min-h-[500px]"
        title="Certificate Preview"
      />
    );
  }

  return null;
}
