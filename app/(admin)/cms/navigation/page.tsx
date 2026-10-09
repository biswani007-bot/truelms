"use client";

import React, { useEffect, useState } from "react";
import { Menu, Plus, Save, Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CMSNavigation() {
  const toast = useToast();
  const [navData, setNavData] = useState<any>({ name: "header", items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState("header");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/cms/navigation?name=${activeMenu}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNavData(data.data);
        }
        setLoading(false);
      });
  }, [activeMenu]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cms/navigation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(navData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Navigation Saved", "Menu structure updated successfully.");
      } else {
        toast.error("Save Failed", data.error || "Error saving navigation");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error", "Failed to communicate with server.");
    }
    setSaving(false);
  };

  const NavItemRow = ({ item, depth = 0 }: { item: any, depth?: number }) => (
    <div className="flex flex-col gap-2">
      <div 
        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors group"
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <div className="cursor-move text-gray-400 hover:text-indigo-600 transition-colors p-1">
          <Menu className="w-4 h-4" />
        </div>
        <div className="flex-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {item.children && item.children.length > 0 && (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-semibold text-gray-900">{item.label}</span>
            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{item.url}</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.visibility ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
              {item.visibility ? 'Visible' : 'Hidden'}
            </span>
            <button className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors font-bold text-[10px]">
              + Sub
            </button>
          </div>
        </div>
      </div>
      
      {item.children && item.children.length > 0 && (
        <div className="flex flex-col gap-2">
          {item.children.map((child: any, idx: number) => (
            <NavItemRow key={idx} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Navigation Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Visually construct menus, dropdowns, and mega-menus.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm rounded-lg transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Navigation"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Menus */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Menus</div>
          <div className="flex-1 p-2 space-y-1">
            <button 
              onClick={() => setActiveMenu("header")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${activeMenu === 'header' ? 'bg-white shadow-sm border border-gray-200 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Main Header Menu
              <ChevronRight className={`w-4 h-4 ${activeMenu === 'header' ? 'text-indigo-400' : 'text-transparent'}`} />
            </button>
            <button 
              onClick={() => setActiveMenu("footer_col1")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${activeMenu === 'footer_col1' ? 'bg-white shadow-sm border border-gray-200 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Footer Column 1
              <ChevronRight className={`w-4 h-4 ${activeMenu === 'footer_col1' ? 'text-indigo-400' : 'text-transparent'}`} />
            </button>
            <button 
              onClick={() => setActiveMenu("footer_col2")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex justify-between items-center ${activeMenu === 'footer_col2' ? 'bg-white shadow-sm border border-gray-200 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Footer Column 2
              <ChevronRight className={`w-4 h-4 ${activeMenu === 'footer_col2' ? 'text-indigo-400' : 'text-transparent'}`} />
            </button>
          </div>
          <div className="p-4 border-t border-gray-100">
            <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-white transition-colors">
              + Create Menu
            </button>
          </div>
        </div>

        {/* Builder Canvas */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="font-bold text-gray-900 capitalize text-sm">{activeMenu.replace("_", " ")} Structure</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-md transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Root Item
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading menu structure...</div>
            ) : navData.items && navData.items.length > 0 ? (
              <div className="flex flex-col gap-2">
                {navData.items.map((item: any, idx: number) => (
                  <NavItemRow key={idx} item={item} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Menu className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-900">This menu is empty</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Start building your navigation by adding a root item.</p>
                <button className="mt-6 px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Add First Item
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
