"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

/**
 * Universal Portal component that mounts children into document.body (or a custom container)
 * after client-side hydration, preventing SSR mismatch and breaking out of parent stacking contexts.
 */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = container || (typeof document !== "undefined" ? document.body : null);
  if (!target) return null;

  return createPortal(children, target);
}

export default Portal;
