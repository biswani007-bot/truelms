"use client";

import React, { useEffect, useState } from "react";
import { QuestionBuilderModal } from "../../../../components/assessment/QuestionBuilderModal";
import { QuestionBankPicker } from "../../../../components/assessment/QuestionBankPicker";
import { ExcelImportModal } from "../../../../components/assessment/ExcelImportModal";
import { useToast } from "../../../../components/ui/dialogs/ToastProvider";

import {
  Plus,
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Send,
  Upload,
  BookOpen,
  Layers,
  Sparkles
} from "lucide-react";

interface Assessment {
  _id: string;
  assessmentCode: string;
  title: string;
  maximumMarks: number;
  passingMarks: number;
  duration: number;
  type: string;
  status: string;
  assessmentDate?: string;
  course?: { _id: string; name: string };
  batch?: { _id: string; batchName: string };
}

interface Question {
  _id?: string;
  questionBankId?: string;
  questionCode?: string;
  questionText: string;
  category?: string;
  difficultyLevel?: string;
  marks?: number;
  type?: string;
  options?: string[];
  correctAnswer?: any;
  mediaAttachments?: string[];
}

export default function AdminAssessmentsPage() {
  const toast = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Authoring State
  const [isAuthoring, setIsAuthoring] = useState(false);
  const [step, setStep] = useState(1);
  const [createdAssessmentId, setCreatedAssessmentId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  const [detailsForm, setDetailsForm] = useState({
    title: "",
    courseId: "",
    batchId: "",
    type: "quiz",
    maximumMarks: 100,
    passingMarks: 40,
    duration: 60,
    instructions: "",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetch('/api/batches?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBatches(data.data);
          const uniqueCourses = new Map();
          data.data.forEach((b: any) => {
            const courseId = b.course?.id || b.course?._id;
            if (courseId) {
              uniqueCourses.set(courseId, {
                _id: courseId,
                name: b.course.courseName || b.course.name || b.course.title || 'Unknown Course',
              });
            }
          });
          setCourses(Array.from(uniqueCourses.values()));
        }
      })
      .catch((err) => {
        console.error("Error fetching batches:", err);
      });
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assessments?limit=100");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAssessments(data.data);
      }
    } catch (err) {
      console.error("Error fetching assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuthoring = () => {
    setCreatedAssessmentId(null);
    setEditingQuestion(null);
    setDetailsForm({
      title: "",
      courseId: "",
      batchId: "",
      type: "quiz",
      maximumMarks: 100,
      passingMarks: 40,
      duration: 60,
      instructions: "",
    });
    setQuestions([]);
    setStep(1);
    setIsAuthoring(true);
  };

  const handleSaveStep1 = async () => {
    if (!detailsForm.title.trim()) {
      toast.error("Assessment title is required.");
      return;
    }
    if (!detailsForm.batchId) {
      toast.error("Please select a batch.");
      return;
    }

    setSaving(true);
    try {
      if (!createdAssessmentId) {
        // CREATE ASSESSMENT
        const res = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailsForm),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Assessment creation failed.");
        }
        setCreatedAssessmentId(data.data._id);
        toast.success("Assessment created successfully.");
        setStep(2);
      } else {
        // UPDATE ASSESSMENT
        const res = await fetch(`/api/assessments/${createdAssessmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailsForm),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Assessment updated failed.");
        }
        toast.success("Assessment updated successfully.");
        setStep(2);
      }
    } catch (err: any) {
      toast.error(err.message || "Assessment creation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      const mediaUrl = data.data?.url || data.data?.resourceUrl || data.data?.fileUrl;
      if (res.ok && data.success && mediaUrl) {
        const updated = [...questions];
        updated[qIndex].mediaAttachments = [...(updated[qIndex].mediaAttachments || []), mediaUrl];
        setQuestions(updated);
        toast.success("Image uploaded successfully.");
      } else {
        const errorMsg = data.message || data.error || "Image upload failed.";
        toast.error(errorMsg);
      }
    } catch(err: any) {
      toast.error(err.message || "Image upload failed.");
    }
  };

  const handlePublishAssessment = async () => {
    setSaving(true);
    try {
      let asmId = createdAssessmentId;

      // 1. Ensure assessment exists
      if (!asmId) {
        const resAsm = await fetch("/api/assessments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detailsForm),
        });
        const asmData = await resAsm.json();
        if (!asmData.success) throw new Error(asmData.message || "Assessment creation failed.");
        asmId = asmData.data._id;
        setCreatedAssessmentId(asmId);
      }

      // 2. Save Questions to the assessment
      const resQ = await fetch(`/api/assessments/${asmId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      const qData = await resQ.json();
      if (!qData.success) throw new Error(qData.message || "Question could not be saved.");

      // 3. Publish Assessment
      const resPub = await fetch(`/api/assessments/${asmId}/publish`, { method: "POST" });
      const pubData = await resPub.json();
      if (!pubData.success) throw new Error(pubData.message || "Assessment could not be published.");

      toast.success("Assessment published successfully.");
      setIsAuthoring(false);
      setCreatedAssessmentId(null);
      await fetchAssessments();
    } catch (err: any) {
      toast.error(err.message || "Assessment could not be published.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPublish = async (id: string) => {
    try {
      const res = await fetch(`/api/assessments/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Assessment published successfully.");
        await fetchAssessments();
      } else {
        toast.error(data.message || "Assessment could not be published.");
      }
    } catch (err: any) {
      toast.error(err.message || "Assessment could not be published.");
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Assessment deleted successfully.");
        await fetchAssessments();
      } else {
        toast.error(data.message || "Failed to delete assessment.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete assessment.");
    }
  };

  if (isAuthoring) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Author Assessment</h1>
            <p className="text-sm text-slate-500 mt-1">
              Step {step} of 3: {step === 1 ? "Assessment Details" : step === 2 ? "Questions" : "Review"}
            </p>
          </div>
          <button onClick={() => setIsAuthoring(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Assessment Title *</label>
              <input
                type="text"
                placeholder="e.g. Mid-term Science Assessment"
                value={detailsForm.title}
                onChange={(e) => setDetailsForm({ ...detailsForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course *</label>
                <select
                  value={detailsForm.courseId}
                  onChange={(e) => setDetailsForm({ ...detailsForm, courseId: e.target.value, batchId: "" })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch *</label>
                <select
                  value={detailsForm.batchId}
                  onChange={(e) => setDetailsForm({ ...detailsForm, batchId: e.target.value })}
                  disabled={!detailsForm.courseId}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm disabled:opacity-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="" disabled>Select a batch</option>
                  {batches
                    .filter((b: any) => {
                      const courseId = b.course?._id || b.course?.id || (typeof b.course === "string" ? b.course : undefined);
                      return courseId && courseId.toString() === detailsForm.courseId;
                    })
                    .map((b: any) => (
                      <option key={b._id} value={b._id}>
                        {b.batchName || b.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Maximum Marks</label>
                <input
                  type="number"
                  value={detailsForm.maximumMarks}
                  onChange={(e) => setDetailsForm({ ...detailsForm, maximumMarks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Passing Marks</label>
                <input
                  type="number"
                  value={detailsForm.passingMarks}
                  onChange={(e) => setDetailsForm({ ...detailsForm, passingMarks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (mins)</label>
                <input
                  type="number"
                  value={detailsForm.duration}
                  onChange={(e) => setDetailsForm({ ...detailsForm, duration: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Instructions (Optional)</label>
              <textarea
                rows={3}
                value={detailsForm.instructions}
                onChange={(e) => setDetailsForm({ ...detailsForm, instructions: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                placeholder="Special notes or test instructions for candidates..."
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveStep1}
                disabled={saving || !detailsForm.title || !detailsForm.batchId}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
              >
                {saving ? "Saving..." : "Next: Questions"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            {questions.length === 0 && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">No Questions Added Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Use the options below to build a new question, pick from the question bank, or import via Excel.</p>
              </div>
            )}

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Question {qIndex + 1}
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs uppercase font-medium">{q.type || 'MCQ'}</span>
                    </h3>
                    <p className="text-sm mt-2 text-slate-800 whitespace-pre-wrap">{q.questionText}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setShowBuilder(true);
                      }}
                      className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                      title="Edit Question"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      title="Remove Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {q.mediaAttachments && q.mediaAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.mediaAttachments.map((url, imgIdx) => (
                      <div key={imgIdx} className="h-28 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                        <img src={url} alt={`Attachment ${imgIdx + 1}`} className="h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 font-bold flex items-center justify-center text-[10px]">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-4 mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">Marks: <strong className="text-slate-800">{q.marks || 5}</strong></div>
                  <div className="text-xs text-slate-500">Difficulty: <strong className="text-slate-800 capitalize">{q.difficultyLevel || 'medium'}</strong></div>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <button 
                onClick={() => {
                  setEditingQuestion(null);
                  setShowBuilder(true);
                }}
                className="py-5 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-3xl text-slate-600 hover:text-indigo-600 font-bold text-sm flex flex-col items-center justify-center gap-2 transition"
              >
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Create New Question</span>
              </button>
              
              <button 
                onClick={() => setShowPicker(true)}
                className="py-5 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-3xl text-slate-600 hover:text-indigo-600 font-bold text-sm flex flex-col items-center justify-center gap-2 transition"
              >
                <Search className="w-5 h-5 text-indigo-600" />
                <span>Pick from Question Bank</span>
              </button>
              
              <button 
                onClick={() => setShowExcelModal(true)}
                className="py-5 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-3xl text-slate-600 hover:text-emerald-600 font-bold text-sm flex flex-col items-center justify-center gap-2 transition"
              >
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>Import from Excel</span>
              </button>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition">Back</button>
              <button 
                onClick={() => {
                  if (questions.length === 0) {
                    toast.error("Please add at least one question.");
                    return;
                  }
                  setStep(3);
                }} 
                disabled={questions.length === 0}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
              >
                Next: Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <QuestionBuilderModal 
              isOpen={showBuilder} 
              onClose={() => {
                setShowBuilder(false);
                setEditingQuestion(null);
              }} 
              questionId={editingQuestion?._id || editingQuestion?.questionBankId}
              onSuccess={(savedQ) => {
                setShowBuilder(false);
                if (savedQ) {
                  const formattedQ: Question = {
                    _id: savedQ._id,
                    questionBankId: savedQ._id,
                    questionCode: savedQ.questionCode,
                    questionText: savedQ.questionText,
                    type: savedQ.type,
                    marks: savedQ.marks,
                    difficultyLevel: savedQ.difficultyLevel,
                    options: savedQ.options || [],
                    correctAnswer: savedQ.correctAnswer,
                    mediaAttachments: savedQ.mediaAttachments || [],
                    category: savedQ.category,
                  };

                  if (editingQuestion) {
                    setQuestions(prev => prev.map(q => 
                      (q._id === editingQuestion._id || (editingQuestion.questionBankId && q.questionBankId === editingQuestion.questionBankId))
                        ? formattedQ
                        : q
                    ));
                  } else {
                    setQuestions(prev => [...prev, formattedQ]);
                  }
                }
                setEditingQuestion(null);
              }} 
            />
            
            {showPicker && (
              <QuestionBankPicker 
                alreadySelectedIds={(questions.map(q => q.questionBankId || q._id).filter(Boolean) as string[])}
                onClose={() => setShowPicker(false)}
                onAddQuestions={(selected) => {
                  if (selected.length === 0) {
                    setShowPicker(false);
                    return;
                  }
                  const mapped = selected.map(q => ({
                    _id: q._id,
                    questionBankId: q._id,
                    questionCode: q.questionCode,
                    questionText: q.questionText,
                    type: q.type,
                    marks: q.marks,
                    difficultyLevel: q.difficultyLevel,
                    options: q.options || [],
                    correctAnswer: q.correctAnswer,
                    mediaAttachments: q.mediaAttachments || [],
                    category: q.category,
                  }));
                  setQuestions(prev => [...prev, ...mapped]);
                  setShowPicker(false);
                  toast.success("Questions added successfully.");
                }}
              />
            )}
            
            <ExcelImportModal 
              isOpen={showExcelModal} 
              onClose={() => setShowExcelModal(false)} 
              onSuccess={(imported) => {
                setShowExcelModal(false);
                setShowPicker(true);
              }} 
            />
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="font-extrabold text-lg border-b pb-4 text-slate-900">Review Assessment</h3>
            
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Title</span>
                <span className="font-semibold text-slate-900">{detailsForm.title}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Questions</span>
                <span className="font-semibold text-slate-900">{questions.length} questions attached</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Max Marks</span>
                <span className="font-semibold text-slate-900">{detailsForm.maximumMarks}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Passing Marks</span>
                <span className="font-semibold text-slate-900">{detailsForm.passingMarks}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Duration</span>
                <span className="font-semibold text-slate-900">{detailsForm.duration} minutes</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs font-bold uppercase">Type</span>
                <span className="font-semibold text-slate-900 uppercase">{detailsForm.type}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button onClick={() => setStep(2)} className="px-6 py-2.5 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl flex items-center gap-2 transition">
                <ArrowLeft className="w-4 h-4" /> Back to Questions
              </button>
              <button 
                onClick={handlePublishAssessment} 
                disabled={saving || questions.length === 0}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 shadow-md transition flex items-center gap-2"
              >
                {saving ? "Publishing..." : "Publish Assessment"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal List View
  const filteredAssessments = assessments.filter(asm => 
    asm.title?.toLowerCase().includes(search.toLowerCase()) ||
    asm.course?.name?.toLowerCase().includes(search.toLowerCase()) ||
    asm.batch?.batchName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Faculty Assessments & Test Results</h1>
          <p className="text-xs text-slate-500 mt-1">Manage exam tests, quizzes, and publish student assessments</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleStartAuthoring}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading assessments...</div>
        ) : filteredAssessments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No assessments found.</div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map(asm => (
              <div key={asm._id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-slate-50/80 transition">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{asm.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {asm.course?.name || "General"} • {asm.batch?.batchName || "All Batches"} • {asm.maximumMarks} Marks
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                    asm.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}>
                    {asm.status}
                  </span>

                  {asm.status === "draft" && (
                    <button
                      onClick={() => handleQuickPublish(asm._id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      Publish
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteAssessment(asm._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Assessment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
