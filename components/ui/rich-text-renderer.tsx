"use client";

import React, { useMemo } from "react";

interface RichTextRendererProps {
  content?: string | null;
  fallback?: string;
  className?: string;
}

/**
 * Basic HTML sanitizer that strips malicious tags (<script>, <iframe>, <object>, etc.)
 * and dangerous event attributes (onload, onerror, onclick, javascript: URIs)
 * while preserving safe styling tags (strong, em, b, i, p, ul, ol, li, h1-h6, br, span, a).
 */
function sanitizeHtml(raw: string): string {
  if (!raw) return "";

  let cleaned = raw
    // Remove dangerous tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove inline JS event handlers like onclick="...", onerror="..."
  cleaned = cleaned.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  cleaned = cleaned.replace(/\son\w+\s*=\s*[^>\s]+/gi, "");

  // Remove javascript: pseudo-protocols
  cleaned = cleaned.replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href="#"');

  return cleaned;
}

export function RichTextRenderer({
  content,
  fallback = "—",
  className = "text-slate-600 text-xs leading-relaxed",
}: RichTextRendererProps) {
  const isHtml = useMemo(() => {
    if (!content) return false;
    return /<[a-z][\s\S]*>/i.test(content);
  }, [content]);

  if (!content || !content.trim()) {
    return <span className="text-slate-400 italic text-xs">{fallback}</span>;
  }

  if (!isHtml) {
    return (
      <div className={`whitespace-pre-line ${className}`}>
        {content}
      </div>
    );
  }

  const sanitized = sanitizeHtml(content);

  return (
    <div
      className={`prose prose-sm max-w-none text-slate-600 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

export default RichTextRenderer;
