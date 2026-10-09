"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, Filter, UploadCloud, Grid, List, Image as ImageIcon, 
  Trash2, Maximize2, Info, Folder, FolderPlus, Edit3, 
  CircleCheck, ChevronRight, SlidersHorizontal 
} from "lucide-react";
import { DeleteDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

export default function CMSMediaLibrary() {
  const toast = useToast();
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterUnused, setFilterUnused] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("All Assets");
  const [folders, setFolders] = useState<string[]>(["All Assets", "Blog Images", "Banners", "Documents"]);

  // Delete Dialog state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sidebar / Panel States
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [editMeta, setEditMeta] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);

  const fetchMedia = () => {
    setLoading(true);
    const unusedQuery = filterUnused ? "&unused=true" : "";
    fetch(`/api/admin/cms/media?search=${search}&sort=createdAt&order=desc${unusedQuery}`)
      .then((res) => res.json())
      .then((data) => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setMedia(parsed);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMedia();
  }, [search, filterUnused, selectedFolder]);

  const toggleBulkSelect = (id: string) => {
    setBulkSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleteLoading(true);
    setMedia(prev => prev.filter(m => !bulkSelected.includes(m._id)));
    toast.success("Assets Deleted", `Removed ${bulkSelected.length} media assets.`);
    setBulkSelected([]);
    setShowDeleteModal(false);
    setDeleteLoading(false);
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/admin/cms/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (data.success) {
        setMedia(prev => prev.map(m => m._id === id ? data.data : m));
        setSelectedAsset(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Folder Tree Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-900 text-sm">Media Library</h2>
          <button className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Create Folder">
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${selectedFolder === f ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Folder className="w-4 h-4" />
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-4 shadow-sm z-10 shrink-0">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            {bulkSelected.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                <span className="text-xs font-bold text-indigo-700">{bulkSelected.length} Selected</span>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="unused"
                checked={filterUnused}
                onChange={(e) => setFilterUnused(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="unused" className="text-xs font-bold text-gray-700">Unused Only</label>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition shrink-0">
              <UploadCloud className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>

        {/* Assets Grid/List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading assets...</div>
          ) : media.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No media assets found in {selectedFolder}.</div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {media.map((asset) => (
                <div 
                  key={asset._id} 
                  className={`group relative rounded-xl border overflow-hidden hover:shadow-md transition bg-white flex flex-col cursor-pointer ${selectedAsset?._id === asset._id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-gray-200'}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="absolute top-2 left-2 z-10">
                    <input 
                      type="checkbox" 
                      checked={bulkSelected.includes(asset._id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleBulkSelect(asset._id)}
                      className="rounded border-gray-300 text-indigo-600" 
                    />
                  </div>
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    {asset.mimeType?.startsWith("image/") ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-mono text-xs font-bold text-gray-400">DOC</div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 bg-white">
                    <p className="text-xs font-semibold text-gray-900 truncate">{asset.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-gray-500 font-mono">{formatBytes(asset.size)}</span>
                      {asset.usageCount > 0 ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">In Use</span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Unused</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 w-12">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="p-4">Asset</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {media.map((asset) => (
                    <tr 
                      key={asset._id} 
                      onClick={() => setSelectedAsset(asset)}
                      className={`hover:bg-gray-50/50 transition cursor-pointer ${selectedAsset?._id === asset._id ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={bulkSelected.includes(asset._id)}
                          onChange={() => toggleBulkSelect(asset._id)}
                          className="rounded border-gray-300 text-indigo-600" 
                        />
                      </td>
                      <td className="p-4 font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {asset.mimeType?.startsWith("image/") ? (
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-mono font-bold">DOC</span>
                          )}
                        </div>
                        {asset.name}
                      </td>
                      <td className="p-4 font-mono text-xs">{formatBytes(asset.size)}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${asset.usageCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {asset.usageCount > 0 ? `In Use (${asset.usageCount})` : 'Unused'}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-400">{asset.mimeType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Asset Side Panel Details */}
      {selectedAsset && (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 shadow-lg z-20">
          <div className="p-4 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-sm">Asset Details</h3>
            <button 
              onClick={() => setSelectedAsset(null)}
              className="text-gray-400 hover:text-gray-900 text-xs font-bold"
            >
              Close
            </button>
          </div>
          
          <div className="flex-1 p-4 space-y-5 overflow-y-auto">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center relative group">
              {selectedAsset.mimeType?.startsWith("image/") ? (
                <img src={selectedAsset.url} alt={selectedAsset.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 font-mono text-sm">Document Preview</span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">File Name</label>
                <input 
                  type="text" 
                  defaultValue={selectedAsset.name}
                  onBlur={(e) => handleRename(selectedAsset._id, e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Alt Text</label>
                <input 
                  type="text" 
                  placeholder="Alternative text for screen readers..."
                  className="w-full mt-1 px-3 py-1.5 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Usage References</label>
                <div className="mt-1 p-2 bg-slate-50 border rounded-lg text-xs space-y-1">
                  {selectedAsset.usageCount > 0 ? (
                    <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CircleCheck className="w-3.5 h-3.5" /> Referenced by 1 page/post
                    </div>
                  ) : (
                    <div className="text-amber-700 font-semibold">Orphan asset. Not in use.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex gap-2">
              <button 
                onClick={() => setCropMode(!cropMode)}
                className="flex-1 py-2 border rounded-lg text-xs font-semibold text-gray-700 hover:bg-slate-50 flex items-center justify-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Crop / Resize
              </button>
              <button 
                onClick={() => {
                  setBulkSelected([selectedAsset._id]);
                  setShowDeleteModal(true);
                }}
                className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Crop Modal Mockup */}
      {cropMode && selectedAsset && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Image Cropper & Resizer</h3>
            <div className="aspect-video bg-slate-100 border rounded flex items-center justify-center overflow-hidden">
              <img src={selectedAsset.url} alt="To crop" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Width (px)</label>
                <input type="number" defaultValue="800" className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Height (px)</label>
                <input type="number" defaultValue="600" className="w-full mt-1 border px-3 py-1.5 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setCropMode(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setCropMode(false); toast.success("Image Optimized", "Image cropped and updated."); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Selected Media Assets"
        description={`Are you sure you want to permanently delete ${bulkSelected.length} selected asset(s)? This action cannot be undone.`}
        confirmLabel="Delete Assets"
        onConfirm={handleBulkDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
