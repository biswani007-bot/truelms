"use client";

import React from "react";
import { NotificationCenter } from "../navigation/NotificationCenter";
import { UserMenu } from "../navigation/UserMenu";

export interface TopNavigationProps {
  title?: string;
  children?: React.ReactNode;
}

export function TopNavigation({ title = "Enterprise Console", children }: TopNavigationProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-gray-700">{title}</span>
        {children}
      </div>

      <div className="flex items-center gap-3">
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
