import React, { useState } from "react";
import * as XLSX from "xlsx";
import { X, Upload, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useToast } from "../ui/dialogs/ToastProvider";

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedQuestions?: any[]) => void;
}

const SUPPORTED_TYPES = ["MCQ", "multiple-select", "true-false", "short-answer", "fill-in-the-blanks", "essay"];
const SUPPORTED_DIFFICULTIES = ["easy", "medium", "hard"];

export function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ total: number; valid: number; invalid: number; imported: number; duplicates: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 1. Questions Sheet
    const qs = [
      {
        "Question Text": "What is the capital of France?",
        "Question Type": "MCQ",
        "Category": "Geography",
        "Difficulty": "easy",
        "Marks": 5,
        "Tags": "europe, capitals",
        "Explanation": "Paris is the capital.",
        "Option 1": "London",
        "Option 2": "Paris",
        "Option 3": "Berlin",
        "Option 4": "Madrid",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "Paris",
        "Blank Answer(s)": "",
        "Image URL": ""
      },
      {
        "Question Text": "Which of these are programming languages?",
        "Question Type": "multiple-select",
        "Category": "Computer Science",
        "Difficulty": "medium",
        "Marks": 5,
        "Tags": "coding, basic",
        "Explanation": "Python and Java are languages. HTML is markup.",
        "Option 1": "Python",
        "Option 2": "HTML",
        "Option 3": "Java",
        "Option 4": "CSS",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "Python,Java",
        "Blank Answer(s)": "",
        "Image URL": ""
      },
      {
        "Question Text": "The Earth is flat.",
        "Question Type": "true-false",
        "Category": "Science",
        "Difficulty": "easy",
        "Marks": 2,
        "Tags": "astronomy",
        "Explanation": "The Earth is an oblate spheroid.",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "False",
        "Blank Answer(s)": "",
        "Image URL": ""
      },
      {
        "Question Text": "What does CPU stand for?",
        "Question Type": "short-answer",
        "Category": "Computer Science",
        "Difficulty": "medium",
        "Marks": 5,
        "Tags": "hardware",
        "Explanation": "",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "Central Processing Unit",
        "Blank Answer(s)": "",
        "Image URL": ""
      },
      {
        "Question Text": "The capital of Japan is [Tokyo] and the currency is [Yen].",
        "Question Type": "fill-in-the-blanks",
        "Category": "Geography",
        "Difficulty": "medium",
        "Marks": 5,
        "Tags": "asia",
        "Explanation": "",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "",
        "Blank Answer(s)": "Tokyo|Yen",
        "Image URL": ""
      },
      {
        "Question Text": "Explain the significance of the Turing test.",
        "Question Type": "essay",
        "Category": "Computer Science",
        "Difficulty": "hard",
        "Marks": 10,
        "Tags": "ai, history",
        "Explanation": "Must cover AI evaluation criteria.",
        "Option 1": "",
        "Option 2": "",
        "Option 3": "",
        "Option 4": "",
        "Option 5": "",
        "Option 6": "",
        "Correct Answer(s)": "",
        "Blank Answer(s)": "",
        "Image URL": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(qs);
    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    // 2. Instructions Sheet
    const instructions = [
      { "Topic": "General", "Description": "One row equals one question. Do NOT change column headers." },
      { "Topic": "Question Types", "Description": "Must be one of: MCQ, multiple-select, true-false, short-answer, fill-in-the-blanks, essay." },
      { "Topic": "Difficulty", "Description": "Must be one of: easy, medium, hard." },
      { "Topic": "Marks", "Description": "Must be a number greater than 0." },
      { "Topic": "Options (1-6)", "Description": "Fill options for MCQ and multiple-select. Leave blank for others." },
      { "Topic": "Correct Answer(s)", "Description": "For MCQ, enter exact option text. For multiple-select, separate with commas (e.g. Option1,Option3). For true-false, use True or False." },
      { "Topic": "Blank Answer(s)", "Description": "For fill-in-the-blanks, provide answers separated by | (e.g. Tokyo|Yen). Use [blank] format in Question Text." },
      { "Topic": "Image URL", "Description": "Provide a valid public URL if the question requires an image. Leave blank if not." },
    ];
    
    const wsInstr = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions");

    XLSX.writeFile(wb, "TrueLern_Universal_Questions_Template.xlsx");
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setErrors([]);
    setResults(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets["Questions"] || workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);
      
      const payload: any[] = [];
      const rowErrors: string[] = [];
      const seenTexts = new Set<string>();
      let duplicateCount = 0;

      rows.forEach((r: any, idx: number) => {
        const rowNum = idx + 2; // +1 for 0-index, +1 for header
        const qText = (r["Question Text"] || r.questionText || r.Question || "").toString().trim();
        const type = (r["Question Type"] || r.type || r.Type || "").toString().trim();
        const category = (r["Category"] || r.category || "Uncategorized").toString().trim();
        const difficulty = (r["Difficulty"] || r.difficultyLevel || "medium").toString().trim().toLowerCase();
        const marks = Number(r["Marks"] || r.marks) || 5;
        const tagsRaw = r["Tags"] || r.tags || "";
        const tags = tagsRaw ? tagsRaw.toString().split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        const explanation = (r["Explanation"] || r.explanation || "").toString().trim();
        const imgUrl = (r["Image URL"] || r.mediaAttachments || "").toString().trim();

        if (!qText) { rowErrors.push(`Row ${rowNum}: Missing Question Text`); return; }
        if (seenTexts.has(qText)) { duplicateCount++; return; } // duplicate in file
        seenTexts.add(qText);

        if (!SUPPORTED_TYPES.includes(type)) { rowErrors.push(`Row ${rowNum}: Unsupported Question Type '${type}'`); return; }
        if (!SUPPORTED_DIFFICULTIES.includes(difficulty)) { rowErrors.push(`Row ${rowNum}: Invalid difficulty '${difficulty}'`); return; }
        if (marks <= 0) { rowErrors.push(`Row ${rowNum}: Invalid marks (must be > 0)`); return; }
        if (imgUrl && !imgUrl.startsWith("http")) { rowErrors.push(`Row ${rowNum}: Malformed media reference (must be a valid URL)`); return; }

        let options: string[] = [];
        let correctAnswer: any = "";

        if (type === "MCQ" || type === "multiple-select") {
          for (let i = 1; i <= 6; i++) {
            const opt = (r[`Option ${i}`] || r[`option${i}`] || "").toString().trim();
            if (opt) options.push(opt);
          }
          if (options.length < 2) { rowErrors.push(`Row ${rowNum}: ${type} requires at least 2 options`); return; }

          const caRaw = (r["Correct Answer(s)"] || r.correctAnswer || "").toString().trim();
          if (!caRaw) { rowErrors.push(`Row ${rowNum}: Missing Correct Answer(s)`); return; }

          if (type === "MCQ") {
            if (!options.includes(caRaw)) { rowErrors.push(`Row ${rowNum}: Correct Answer not found in Options`); return; }
            correctAnswer = caRaw;
          } else {
            const caArr = caRaw.split(',').map((a: string) => a.trim());
            const invalidAnswers = caArr.filter((a: string) => !options.includes(a));
            if (invalidAnswers.length > 0) { rowErrors.push(`Row ${rowNum}: Invalid Multiple Select answer(s)`); return; }
            correctAnswer = caArr;
          }
        } else if (type === "true-false") {
          const caRaw = (r["Correct Answer(s)"] || r.correctAnswer || "").toString().trim().toLowerCase();
          if (caRaw !== "true" && caRaw !== "false") { rowErrors.push(`Row ${rowNum}: True/False requires 'True' or 'False'`); return; }
          correctAnswer = caRaw === "true" ? "True" : "False";
        } else if (type === "short-answer") {
          const caRaw = (r["Correct Answer(s)"] || r.correctAnswer || "").toString().trim();
          if (!caRaw) { rowErrors.push(`Row ${rowNum}: Missing Correct Answer(s)`); return; }
          correctAnswer = caRaw;
        } else if (type === "fill-in-the-blanks") {
          const baRaw = (r["Blank Answer(s)"] || r.blankAnswers || "").toString().trim();
          if (!baRaw) { rowErrors.push(`Row ${rowNum}: Missing Blank Answer(s)`); return; }
          if (!qText.includes("[") || !qText.includes("]")) { rowErrors.push(`Row ${rowNum}: Question Text must contain placeholders like [blank]`); return; }
          correctAnswer = baRaw;
        } else if (type === "essay") {
          correctAnswer = "";
        }

        payload.push({
          questionText: qText,
          type,
          category,
          difficultyLevel: difficulty,
          marks,
          tags,
          explanation,
          options,
          correctAnswer,
          mediaAttachments: imgUrl ? [imgUrl] : []
        });
      });

      if (rowErrors.length > 0) {
        setErrors(rowErrors.slice(0, 10)); // show up to 10
        if (payload.length === 0) {
          throw new Error("No valid questions found.");
        }
      }

      if (payload.length > 0) {
        const res = await fetch('/api/admin/questions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: payload })
        });
        
        if (res.ok) {
          const data = await res.json();
          setResults({ 
            total: rows.length, 
            valid: payload.length, 
            invalid: rowErrors.length, 
            duplicates: duplicateCount, 
            imported: payload.length 
          });
          toast.success(`${payload.length} questions imported successfully.`);
          
          if (rowErrors.length === 0) {
            setTimeout(() => {
              onSuccess(payload);
              onClose();
            }, 1200);
          }
        } else {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "Excel import failed.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Excel import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700">
          <X className="w-5 h-5"/>
        </button>
        <h2 className="text-xl font-bold mb-4">Import Questions from Excel</h2>
        
        <div className="flex justify-between items-center mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="text-sm text-indigo-900">
            <p className="font-semibold mb-1">Need the required format?</p>
            <p className="text-xs text-indigo-700">Download the universal template to get started.</p>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg shadow-sm border border-indigo-200 hover:bg-indigo-50 transition"
          >
            <Download className="w-4 h-4" /> Template
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-6 bg-slate-50">
          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700 mb-2">Choose .xlsx File</p>
          <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl mb-4 text-xs space-y-1 border border-rose-100">
            <p className="font-bold mb-2 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Validation Errors</p>
            {errors.map((e, i) => <p key={i}>{e}</p>)}
            {errors.length === 10 && <p className="font-bold mt-2">...and more.</p>}
          </div>
        )}

        {results && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl mb-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-bold">Import Results</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-emerald-100"><span className="text-slate-500 block">Total Rows</span><strong className="text-lg">{results.total}</strong></div>
              <div className="bg-white p-2 rounded border border-emerald-100"><span className="text-slate-500 block">Imported</span><strong className="text-lg text-emerald-600">{results.imported}</strong></div>
              <div className="bg-white p-2 rounded border border-emerald-100"><span className="text-slate-500 block">Invalid</span><strong className="text-lg text-rose-600">{results.invalid}</strong></div>
              <div className="bg-white p-2 rounded border border-emerald-100"><span className="text-slate-500 block">Duplicates</span><strong className="text-lg text-amber-600">{results.duplicates}</strong></div>
            </div>
            {errors.length > 0 && (
              <button onClick={() => { onSuccess(); onClose(); }} className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700">
                Continue with Valid Questions
              </button>
            )}
          </div>
        )}

        {(!results || errors.length === 0) && (
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 text-sm">Cancel</button>
            <button onClick={handleImport} disabled={!file || loading} className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
              {loading ? "Importing..." : "Preview / Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
