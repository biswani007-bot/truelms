import * as React from "react";
import { Sidebar, SidebarItem } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";
import { CommandPalette } from "../navigation/CommandPalette";

export interface AppShellProps {
  sidebarItems: SidebarItem[];
  children: React.ReactNode;
}

export function AppShell({ sidebarItems, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar items={sidebarItems} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
