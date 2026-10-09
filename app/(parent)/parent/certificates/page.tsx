"use client";

import React, { useEffect, useState } from "react";
import { useParentChild } from "@/components/parent/parent-child-context";
import { Award, CheckCircle, Clock } from "lucide-react";
import CertificateDownloadButton from "@/components/certificates/CertificateDownloadButton";

interface Certificate {
  certificateId: string;
  certificateNumber: string;
  course: any;
  issueDate: string;
  status: string;
}

export default function ParentCertificatesPage() {
  const { selectedChild } = useParentChild();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      if (!selectedChild) {
        setCertificates([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // We fetch explicitly by the selected child to maintain Child Isolation
        const res = await fetch(`/api/parent/children/${selectedChild.studentId}/certificates`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setCertificates(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch certificates", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, [selectedChild]);

  if (!selectedChild) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 mt-6 max-w-4xl mx-auto">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800">No Child Selected</h2>
        <p className="text-sm text-slate-500 mt-1">Please select a child from the sidebar to view their certificates.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Official Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">
          View and download verified credentials for <span className="font-bold text-slate-800">{selectedChild.firstName}</span>.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">No Certificates Yet</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedChild.firstName} hasn't been issued any certificates yet. They will appear here automatically upon program completion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => {
            const courseName = typeof cert.course === "string" 
              ? cert.course 
              : cert.course?.name || cert.course?.courseName || "Certificate of Completion";

            return (
              <div key={cert.certificateId} className="bg-white rounded-2xl border border-slate-200 shadow-[var(--lms-shadow-md)] overflow-hidden flex flex-col hover:border-emerald-200 transition-colors group">
                <div className="h-32 bg-slate-800 relative p-6 flex flex-col justify-between overflow-hidden">
                  {/* Decorative graphic */}
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                  <div className="absolute right-4 bottom-4">
                     <Award className="w-12 h-12 text-white/10" />
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase self-start backdrop-blur-sm">
                    <CheckCircle className="w-3 h-3" /> Official
                  </span>
                  
                  <h3 className="text-white font-bold text-lg mt-auto leading-tight truncate z-10 drop-shadow-md">
                    {courseName}
                  </h3>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Issued</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cert ID</p>
                      <p className="text-sm font-mono font-medium text-slate-700 mt-0.5">
                        {cert.certificateNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <CertificateDownloadButton
                      certificateId={cert.certificateId}
                      certificateNumber={cert.certificateNumber}
                      className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                      label="Download PDF"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
