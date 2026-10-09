import React from 'react';
import { Award, CheckCircle } from 'lucide-react';

interface CertificateData {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  verificationCode: string;
  grade?: string;
  authorityName?: string;
}

interface Props {
  data: CertificateData;
}

export default function CertificateTemplateRenderer({ data }: Props) {
  // This is a strictly decoupled structural renderer. 
  // It provides designated zones for the visual layout so the official 
  // certificate template can be applied without altering logic.
  
  return (
    <div className="w-full max-w-4xl mx-auto aspect-[1.414/1] bg-white border shadow-2xl relative flex flex-col p-8 sm:p-12 md:p-16 overflow-hidden print:shadow-none print:border-none">
      
      {/* Decorative Border Layer Placeholder */}
      <div className="absolute inset-4 border-2 border-indigo-900/10 pointer-events-none z-0" />
      <div className="absolute inset-5 border border-indigo-900/5 pointer-events-none z-0" />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full justify-between items-center text-center">
        
        {/* Header Zone */}
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
            <Award className="size-8 sm:size-10 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif text-slate-900 uppercase tracking-widest font-bold">
            Certificate of Completion
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-[0.2em] mt-3">
            This is to certify that
          </p>
        </div>

        {/* Dynamic Data Zone - Student */}
        <div className="w-full py-6 sm:py-8 my-auto border-y border-slate-100">
          <h2 className="text-3xl sm:text-5xl font-serif italic text-slate-900 mb-4">
            {data.studentName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            has successfully completed the comprehensive program in
            <br />
            <span className="font-bold text-slate-800 text-sm sm:text-base inline-block mt-2">
              {data.courseName}
            </span>
          </p>
          {data.grade && (
            <p className="text-xs font-bold text-slate-600 mt-4 bg-slate-50 inline-block px-4 py-1.5 rounded-full border border-slate-200">
              Grade Achieved: {data.grade}
            </p>
          )}
        </div>

        {/* Footer Zone - Signatures and Verification */}
        <div className="w-full flex justify-between items-end pt-4">
          
          {/* Issue Date & Cert Number */}
          <div className="text-left w-1/3">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              Date of Issue
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-800 border-b border-slate-300 pb-1 pr-4 inline-block min-w-[120px]">
              {data.issueDate}
            </p>
            <p className="text-[9px] text-slate-400 mt-2 font-mono">
              ID: {data.certificateNumber}
            </p>
          </div>
          
          {/* QR Code Placeholder Zone */}
          <div className="w-1/3 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-2 border-slate-100 p-2 shadow-sm relative group flex items-center justify-center">
               <div className="text-[10px] text-slate-400 font-medium text-center">
                 QR Zone<br/>vrf:{data.verificationCode.slice(0, 4)}
               </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
              <CheckCircle className="size-3 text-emerald-500" /> Officially Verified
            </p>
          </div>

          {/* Signature Zone */}
          <div className="text-right w-1/3 flex flex-col items-end">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              Authorized Signature
            </p>
            <div className="border-b border-slate-300 pb-1 min-w-[120px] text-right">
              <span className="font-serif italic text-lg sm:text-xl text-slate-800 pr-2 block h-8">
                {/* Signature Graphic Placeholder */}
              </span>
            </div>
            <p className="text-[10px] text-slate-700 mt-1 font-medium pr-2">
              {data.authorityName || "Program Director"}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
