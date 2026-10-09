"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

interface DeleteLiveClassButtonProps {
  liveClassId: string;
  classTitle: string;
}

export function DeleteLiveClassButton({ liveClassId, classTitle }: DeleteLiveClassButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to archive/delete the live session "${classTitle}"?\nCompleted sessions with attendance will be archived.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success("Success", data.message || "Session archived/deleted.");
        router.push("/admin/live-classes");
      } else {
        toast.error("Deletion Failed", data.error || "Unable to delete session.");
      }
    } catch (e) {
      toast.error("Network Error", "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-sm font-bold transition flex items-center h-[38px] disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4 mr-1.5" />
      {loading ? "Processing..." : "Archive / Delete"}
    </button>
  );
}
