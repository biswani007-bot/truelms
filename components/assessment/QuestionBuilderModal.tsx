"use client";

import React, { useState, useEffect } from "react";
import { EnterpriseDialog } from "../ui/dialogs/EnterpriseDialog";
import { useToast } from "../ui/dialogs/ToastProvider";
import { Plus, X, Trash2, Image as ImageIcon } from "lucide-react";

interface QuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedQuestion?: any) => void;
  questionId?: string;
}

export function QuestionBuilderModal({
  isOpen,
  onClose,
  onSuccess,
  questionId
}: QuestionBuilderModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"authoring" | "preview">("authoring");
  
  const [formData, setFormData] = useState({
    type: "MCQ",
    category: "",
    difficultyLevel: "medium",
    marks: 5,
    questionText: "",
    options: [] as string[],
    correctAnswer: "" as any,
    explanation: "",
    tags: [] as string[],
    mediaAttachments: [] as string[]
  });

  const questionTypes = [
    { value: "MCQ", label: "Multiple Choice (Single)" },
    { value: "multiple-select", label: "Multiple Choice (Multiple)" },
    { value: "true-false", label: "True / False" },
    { value: "short-answer", label: "Short Answer" },
    { value: "fill-in-the-blanks", label: "Fill in the Blanks" },
    { value: "essay", label: "Written / Essay" }
  ];

  useEffect(() => {
    if (isOpen) {
      if (questionId) {
        fetchQuestion(questionId);
      } else {
        setFormData({
          type: "MCQ",
          category: "",
          difficultyLevel: "medium",
          marks: 5,
          questionText: "",
          options: ["", ""],
          correctAnswer: "",
          explanation: "",
          tags: [],
          mediaAttachments: []
        });
      }
    }
  }, [isOpen, questionId]);

  const fetchQuestion = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/questions/${id}`);
      const data = await res.json();
      if (data.success) {
        setFormData({
          ...data.data,
          tags: data.data.tags || [],
          options: data.data.options || [],
          mediaAttachments: data.data.mediaAttachments || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError("");
      setLoading(true);

      // Validation
      if (!formData.questionText.trim()) throw new Error("Question text is required.");
      if (formData.marks < 1) throw new Error("Marks must be at least 1.");
      
      let payload = { ...formData };

      if (["MCQ", "multiple-select"].includes(payload.type)) {
        payload.options = payload.options.map(o => o.trim()).filter(Boolean);
        if (payload.options.length < 2) {
          throw new Error("At least 2 non-empty options are required.");
        }
        if (payload.options.length > 6) {
          throw new Error("Maximum of 6 options allowed.");
        }
        
        if (payload.type === "MCQ") {
          if (!payload.correctAnswer || !payload.options.includes(payload.correctAnswer)) {
            throw new Error("Please select a valid correct answer.");
          }
        } else {
          if (!payload.correctAnswer || payload.correctAnswer.length === 0) {
            throw new Error("Please select at least one correct answer.");
          }
          const validAnswers = payload.correctAnswer.filter((ans: string) => payload.options.includes(ans));
          if (validAnswers.length === 0) throw new Error("Please select valid correct answers.");
          payload.correctAnswer = validAnswers;
        }
      } else if (payload.type === "true-false") {
        if (!payload.correctAnswer || (payload.correctAnswer !== "True" && payload.correctAnswer !== "False")) {
          throw new Error("Please select True or False as the correct answer.");
        }
      } else if (["short-answer", "fill-in-the-blanks"].includes(payload.type)) {
        if (!payload.correctAnswer || typeof payload.correctAnswer !== "string" || !payload.correctAnswer.trim()) {
          throw new Error("Correct answer is required.");
        }
      }

      const method = questionId ? "PUT" : "POST";
      const url = questionId ? `/api/admin/questions/${questionId}` : `/api/admin/questions`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(questionId ? "Question updated successfully." : "Question added successfully.");
        onSuccess(data.data);
      } else {
        const errorMsg = data.message || (questionId ? "Question could not be updated." : "Question could not be saved.");
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || (questionId ? "Question could not be updated." : "Question could not be saved.");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderOptionsEditor = () => {
    if (formData.type === "MCQ" || formData.type === "multiple-select") {
      const isMulti = formData.type === "multiple-select";
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium">Options</label>
          {formData.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-200">
              <input
                type={isMulti ? "checkbox" : "radio"}
                name="correctAnswer"
                className="w-4 h-4 cursor-pointer"
                checked={isMulti ? (formData.correctAnswer || []).includes(opt) : formData.correctAnswer === opt}
                onChange={(e) => {
                  if (!opt.trim()) return;
                  if (isMulti) {
                    const current = formData.correctAnswer || [];
                    const updated = e.target.checked 
                      ? [...current, opt]
                      : current.filter((c: string) => c !== opt);
                    setFormData({ ...formData, correctAnswer: updated });
                  } else {
                    setFormData({ ...formData, correctAnswer: opt });
                  }
                }}
                title="Mark as correct answer"
              />
              <input
                type="text"
                className="flex-1 border-b border-gray-300 bg-transparent px-2 py-1 focus:outline-none focus:border-blue-500"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...formData.options];
                  const oldVal = newOpts[idx];
                  newOpts[idx] = e.target.value;
                  
                  let newAns = formData.correctAnswer;
                  if (isMulti && Array.isArray(newAns)) {
                    newAns = newAns.map((a: string) => a === oldVal ? e.target.value : a);
                  } else if (newAns === oldVal) {
                    newAns = e.target.value;
                  }
                  
                  setFormData({ ...formData, options: newOpts, correctAnswer: newAns });
                }}
                placeholder={`Option ${idx + 1}`}
              />
              <button 
                type="button" 
                onClick={() => {
                  const newOpts = [...formData.options];
                  newOpts[idx] = "";
                  
                  let newAns = formData.correctAnswer;
                  if (isMulti && Array.isArray(newAns)) {
                    newAns = newAns.filter((a: string) => a !== opt);
                  } else if (newAns === opt) {
                    newAns = "";
                  }
                  setFormData({ ...formData, options: newOpts, correctAnswer: newAns });
                }} 
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Clear Option"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const newOpts = formData.options.filter((_, i) => i !== idx);
                  let newAns = formData.correctAnswer;
                  if (isMulti && Array.isArray(newAns)) {
                    newAns = newAns.filter((a: string) => a !== opt);
                  } else if (newAns === opt) {
                    newAns = "";
                  }
                  setFormData({ ...formData, options: newOpts, correctAnswer: newAns });
                }} 
                className="text-red-400 hover:text-red-600 p-1"
                title="Remove Option"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.options.length < 6 && (
            <button type="button" onClick={() => setFormData({ ...formData, options: [...formData.options, ""] })} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:text-blue-700">
              <Plus className="w-4 h-4" /> Add Option
            </button>
          )}
        </div>
      );
    }
    
    if (formData.type === "true-false") {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium">Correct Answer</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.correctAnswer === "True"} onChange={() => setFormData({ ...formData, correctAnswer: "True" })} /> True
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={formData.correctAnswer === "False"} onChange={() => setFormData({ ...formData, correctAnswer: "False" })} /> False
            </label>
          </div>
        </div>
      );
    }

    if (["short-answer", "fill-in-the-blanks"].includes(formData.type)) {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-medium">Correct Answer(s)</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded p-2"
            value={formData.correctAnswer || ""}
            onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
            placeholder="Expected answer (use commas for multiple accepted terms)"
          />
        </div>
      );
    }

    return null;
  };

  const handleImageUpload = async (file: File) => {
    try {
      setError("");
      setIsUploading(true);
      const form = new FormData();
      form.append("file", file);
      
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form
      });
      const data = await res.json();
      const mediaUrl = data.data?.url || data.data?.resourceUrl || data.data?.fileUrl;
      if (res.ok && data.success && mediaUrl) {
        setFormData(prev => ({
          ...prev,
          mediaAttachments: [...(prev.mediaAttachments || []), mediaUrl]
        }));
        toast.success("Image uploaded successfully.");
      } else {
        const errorMsg = data.message || data.error || "Image upload failed.";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Image upload failed.";
      setError(`Upload Error: ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.indexOf("image") !== -1) {
        handleImageUpload(file);
        break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <EnterpriseDialog
      isOpen={isOpen}
      onClose={onClose}
      title={questionId ? "Edit Question" : "Create Question"}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 ${mode === "authoring" ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-500"}`}
          onClick={() => setMode("authoring")}
        >
          Authoring
        </button>
        <button
          className={`px-4 py-2 ${mode === "preview" ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-500"}`}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
      </div>

      {mode === "authoring" ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative"
            >
              <label className="block text-sm font-medium mb-1">Question Text</label>
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                onPaste={handlePaste}
                placeholder="Enter the question text here... (Drag & Drop images here)"
              />
              <div className="mt-1 flex justify-between items-center text-sm text-gray-500">
                <span>(Markdown supported. Paste images directly here)</span>
                <label className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Upload Image
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              </div>
              {formData.mediaAttachments && formData.mediaAttachments.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {formData.mediaAttachments.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                      <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          mediaAttachments: prev.mediaAttachments.filter((_, i) => i !== idx)
                        }))}
                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {renderOptionsEditor()}

            <div>
              <label className="block text-sm font-medium mb-1">Explanation (Optional)</label>
              <textarea
                rows={2}
                className="w-full border border-gray-300 rounded p-2"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Explanation shown after attempt..."
              />
            </div>
          </div>

          <div className="col-span-1 space-y-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Question Type</label>
              <select
                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  const isOldMulti = ["MCQ", "multiple-select"].includes(formData.type);
                  const isNewMulti = ["MCQ", "multiple-select"].includes(type);
                  
                  // Keep options if switching between MCQ types
                  const preservedOptions = (isOldMulti && isNewMulti) ? formData.options : ["", ""];
                  
                  const defaults = {
                    "MCQ": { options: preservedOptions, correctAnswer: "" },
                    "multiple-select": { options: preservedOptions, correctAnswer: [] },
                    "true-false": { options: [], correctAnswer: "" },
                    "short-answer": { options: [], correctAnswer: "" },
                    "fill-in-the-blanks": { options: [], correctAnswer: "" },
                    "essay": { options: [], correctAnswer: "" }
                  };
                  setFormData({ ...formData, type, ...(defaults[type as keyof typeof defaults] || {}) });
                }}
              >
                {questionTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Mathematics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marks</label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 rounded p-2"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2"
                value={formData.tags.join(", ")}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="e.g. algebra, basics"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white border rounded-lg min-h-[40vh] space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium whitespace-pre-wrap">{formData.questionText || "No question text provided"}</h3>
            {formData.mediaAttachments && formData.mediaAttachments.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {formData.mediaAttachments.map((url, idx) => (
                  <img key={idx} src={url} alt="Question Attachment" className="max-w-xs rounded border border-gray-200" />
                ))}
              </div>
            )}
          </div>
          
          {formData.type === "MCQ" && (
            <div className="space-y-3">
              {formData.options.filter(Boolean).map((opt, i) => (
                <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-not-allowed bg-gray-50">
                  <input type="radio" disabled name="preview-mcq" className="w-4 h-4 text-blue-600" /> 
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          {formData.type === "multiple-select" && (
            <div className="space-y-3">
              {formData.options.filter(Boolean).map((opt, i) => (
                <label key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-not-allowed bg-gray-50">
                  <input type="checkbox" disabled className="w-4 h-4 text-blue-600 rounded" /> 
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          {formData.type === "true-false" && (
            <div className="space-y-3 flex flex-col sm:flex-row gap-4">
               <label className="flex items-center gap-3 p-3 border border-gray-200 rounded flex-1 cursor-not-allowed bg-gray-50">
                 <input type="radio" disabled name="preview-tf" className="w-4 h-4 text-blue-600" /> 
                 <span>True</span>
               </label>
               <label className="flex items-center gap-3 p-3 border border-gray-200 rounded flex-1 cursor-not-allowed bg-gray-50">
                 <input type="radio" disabled name="preview-tf" className="w-4 h-4 text-blue-600" /> 
                 <span>False</span>
               </label>
            </div>
          )}
          {["short-answer", "fill-in-the-blanks"].includes(formData.type) && (
            <input type="text" disabled className="w-full border border-gray-300 p-3 rounded bg-gray-50 cursor-not-allowed" placeholder="Student will enter their answer here..." />
          )}
          {formData.type === "essay" && (
            <textarea disabled rows={5} className="w-full border border-gray-300 p-3 rounded bg-gray-50 cursor-not-allowed" placeholder="Student will enter their essay here..." />
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Question"}
        </button>
      </div>
    </EnterpriseDialog>
  );
}
