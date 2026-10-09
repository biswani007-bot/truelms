"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ChildProfile {
  linkId: string;
  studentId: string;
  studentCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  name?: string;
  gender?: string;
  dob?: string | Date;
  age?: number | null;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  schoolCollege?: string;
  relationshipType: string;
  isCustodial: boolean;
  isEmergencyContact: boolean;
  canAccessPortal?: boolean;
  status: string;
}


interface ParentChildContextType {
  children: ChildProfile[];
  selectedChild: ChildProfile | null;
  setSelectedChild: (child: ChildProfile | null) => void;
  loading: boolean;
  error: string | null;
  refreshChildren: () => Promise<ChildProfile[]>;
}

const ParentChildContext = createContext<ParentChildContextType | undefined>(undefined);

export const ParentChildProvider: React.FC<{ children: React.ReactNode }> = ({ children: reactChildren }) => {
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async (): Promise<ChildProfile[]> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/parent/children", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load linked children");
      }
      const json = await res.json();
      const list: ChildProfile[] = json.data || [];
      setChildrenList(list);

      if (list.length > 0) {
        // Restore selected child from session/local storage if available, else first child
        const savedId = typeof window !== "undefined" ? localStorage.getItem("truelern_parent_active_child") : null;
        const matched = list.find((c) => c.studentId === savedId);
        const active = matched || list[0];
        setSelectedChild(active);
        if (typeof window !== "undefined") {
          localStorage.setItem("truelern_parent_active_child", active.studentId);
        }
      } else {
        setSelectedChild(null);
      }
      return list;
    } catch (err: any) {
      setError(err.message || "Failed to load linked children");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSelectChild = (child: ChildProfile | null) => {
    setSelectedChild(child);
    if (typeof window !== "undefined") {
      if (child) {
        localStorage.setItem("truelern_parent_active_child", child.studentId);
      } else {
        localStorage.removeItem("truelern_parent_active_child");
      }
    }
  };

  return (
    <ParentChildContext.Provider
      value={{
        children: childrenList,
        selectedChild,
        setSelectedChild: handleSelectChild,
        loading,
        error,
        refreshChildren: fetchChildren,
      }}
    >
      {reactChildren}
    </ParentChildContext.Provider>
  );
};

export const useParentChild = () => {
  const context = useContext(ParentChildContext);
  if (!context) {
    throw new Error("useParentChild must be used within a ParentChildProvider");
  }
  return context;
};
