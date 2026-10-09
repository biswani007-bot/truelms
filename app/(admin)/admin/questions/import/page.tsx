"use client";

import React, { useState } from "react";
import { Download, Upload, AlertCircle, CheckCircle2, ChevronLeft, Info, FileSpreadsheet } from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalized: any;
}

interface ParsedRow {
  rowIndex: number;
  raw: any;
  validation: ValidationResult;
}

export default function BulkImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const supportedTypes = ["MCQ", "multiple-select", "true-false", "short-answer", "fill-in-the-blanks", "essay"];
  const supportedDifficulties = ["easy", "medium", "hard"];

  const handleDownloadTemplate = () => {
    const headers = "questionText,type,difficultyLevel,marks,options,correctAnswer,explanation,tags\n";
    const example1 = `"What is 2+2?","MCQ","easy","1","1|2|3|4","4","Basic math","math,basics"\n`;
    const example2 = `"Which are fruits?","multiple-select","medium","2","Apple|Carrot|Banana","Apple|Banana","Apples and bananas are fruits","biology"\n`;
    const example3 = `"The earth is flat","true-false","easy","1","","False","","geography"\n`;
    const blob = new Blob([headers + example1 + example2 + example3], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "question_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const result: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(field);
          field = "";
        } else if (char === '\n' || char === '\r') {
          if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
            i++;
          }
          row.push(field);
          result.push(row);
          row = [];
          field = "";
        } else {
          field += char;
        }
      }
    }
    if (field || row.length > 0) {
      row.push(field);
      result.push(row);
    }
    return result;
  };

  const validateAndNormalize = (rawRow: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const normalized: any = { ...rawRow };

    // Basic required fields
    if (!rawRow.questionText?.trim()) errors.push("Missing questionText");
    
    // Type normalization
    let type = (rawRow.type || "").trim();
    if (!supportedTypes.includes(type)) {
      errors.push(`Invalid type: ${type}. Supported: ${supportedTypes.join(", ")}`);
    }
    normalized.type = type;

    // Difficulty normalization
    let diff = (rawRow.difficultyLevel || "medium").trim().toLowerCase();
    if (!supportedDifficulties.includes(diff)) {
      errors.push(`Invalid difficulty: ${diff}`);
    }
    normalized.difficultyLevel = diff;

    // Marks
    const marks = parseFloat(rawRow.marks);
    if (isNaN(marks) || marks <= 0) errors.push("Marks must be a positive number");
    normalized.marks = marks || 1;

    // Options
    const rawOpts = (rawRow.options || "").split("|").map((o: string) => o.trim()).filter(Boolean);
    const rawCorrect = (rawRow.correctAnswer || "").trim();
    
    if (type === "MCQ") {
      normalized.options = rawOpts;
      if (rawOpts.length < 2) errors.push("MCQ requires at least 2 options delimited by |");
      if (rawOpts.length > 6) errors.push("Maximum 6 options allowed");
      if (!rawCorrect) errors.push("MCQ requires a correctAnswer");
      else if (!rawOpts.includes(rawCorrect)) errors.push("correctAnswer must exactly match one of the options");
      normalized.correctAnswer = rawCorrect;
    } else if (type === "multiple-select") {
      normalized.options = rawOpts;
      if (rawOpts.length < 2) errors.push("multiple-select requires at least 2 options delimited by |");
      if (rawOpts.length > 6) errors.push("Maximum 6 options allowed");
      const correctArray = rawCorrect.split("|").map((a: string) => a.trim()).filter(Boolean);
      if (correctArray.length === 0) errors.push("multiple-select requires at least one correctAnswer");
      for (const ans of correctArray) {
        if (!rawOpts.includes(ans)) errors.push(`correctAnswer '${ans}' not found in options`);
      }
      normalized.correctAnswer = correctArray;
    } else if (type === "true-false") {
      normalized.options = []; // backend doesn't need it
      let ans = rawCorrect.toLowerCase();
      if (ans === "true" || ans === "t" || ans === "1" || ans === "yes") {
        normalized.correctAnswer = "True";
      } else if (ans === "false" || ans === "f" || ans === "0" || ans === "no") {
        normalized.correctAnswer = "False";
      } else {
        errors.push("true-false requires True or False as correctAnswer");
      }
    } else if (["short-answer", "fill-in-the-blanks"].includes(type)) {
      if (!rawCorrect) errors.push("Answer is required");
      normalized.correctAnswer = rawCorrect;
      normalized.options = [];
    } else if (type === "essay") {
      normalized.correctAnswer = rawCorrect;
      normalized.options = [];
    }

    normalized.tags = (rawRow.tags || "").split("|").map((t: string) => t.trim()).filter(Boolean);
    normalized.explanation = rawRow.explanation || "";

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      normalized
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        alert("File appears empty or missing data rows");
        return;
      }

      const headers = parsed[0].map(h => h.trim());
      const expectedHeaders = ["questionText", "type", "difficultyLevel", "marks", "options", "correctAnswer", "explanation", "tags"];
      
      const missing = expectedHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        alert(`Missing required columns: ${missing.join(", ")}`);
        return;
      }

      const parsedRows: ParsedRow[] = [];
      const questionTexts: string[] = [];

      for (let i = 1; i < parsed.length; i++) {
        const r = parsed[i];
        if (r.length === 1 && !r[0]) continue; // skip empty line
        
        const rawObj: any = {};
        headers.forEach((h, idx) => {
          rawObj[h] = r[idx] || "";
        });

        const validation = validateAndNormalize(rawObj);
        
        // Detect duplicates within CSV itself
        if (validation.isValid) {
          if (questionTexts.includes(validation.normalized.questionText)) {
            validation.warnings.push("Duplicate question within this CSV file");
          } else {
            questionTexts.push(validation.normalized.questionText);
          }
        }

        parsedRows.push({ rowIndex: i + 1, raw: rawObj, validation });
      }

      setRows(parsedRows);

      // Check backend duplicates
      if (questionTexts.length > 0) {
        setCheckingDuplicates(true);
        try {
          const res = await fetch("/api/admin/questions/check-duplicates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: questionTexts })
          });
          const data = await res.json();
          if (data.success && data.data) {
            setRows(current => current.map(row => {
              if (row.validation.isValid && data.data.includes(row.validation.normalized.questionText)) {
                return {
                  ...row,
                  validation: {
                    ...row.validation,
                    warnings: [...row.validation.warnings, "Already exists in Question Bank"]
                  }
                };
              }
              return row;
            }));
          }
        } catch (err) {
          console.error("Duplicate check failed", err);
        } finally {
          setCheckingDuplicates(false);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => r.validation.isValid);
    if (validRows.length === 0) return;

    try {
      setIsImporting(true);
      const res = await fetch("/api/admin/questions/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: validRows.map(r => ({ ...r.validation.normalized, rowIndex: r.rowIndex }))
        })
      });

      const data = await res.json();
      if (data.success) {
        setImportResult(data.data);
      } else {
        alert("Import failed: " + data.message);
      }
    } catch (err: any) {
      alert("Import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = rows.filter(r => r.validation.isValid).length;
  const invalidCount = rows.filter(r => !r.validation.isValid).length;

  if (importResult) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <a href="/admin/questions" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Question Bank
        </a>
        <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Import Complete</h2>
          <div className="flex justify-center gap-8 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{importResult.created}</div>
              <div className="text-sm text-gray-500">Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{importResult.skipped}</div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="text-left bg-red-50 p-4 rounded text-sm text-red-800">
              <p className="font-semibold mb-2">Errors during import:</p>
              <ul className="list-disc pl-5 space-y-1">
                {importResult.errors.map((e: any, i: number) => (
                  <li key={i}>Row {e.row}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4">
            <a href="/admin/questions" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium inline-block">
              View Question Bank
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      <div className="flex items-center gap-2 text-gray-500">
        <a href="/admin/questions" className="hover:text-blue-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Question Bank
        </a>
        <span>/</span>
        <span className="text-gray-900 font-medium">Bulk Import</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h1>
          <p className="text-sm text-gray-500">Upload questions from a CSV file directly to the Question Bank (Authoring Mode)</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Download Template
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer font-medium shadow-sm">
            <Upload className="w-4 h-4" /> Choose CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {!rows.length && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-blue-800 flex gap-4 mt-8">
          <Info className="w-6 h-6 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">How to import questions:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Download the CSV template using the button above.</li>
              <li>Fill in your questions. Do not change the header row.</li>
              <li>For multiple options (MCQ), separate them with a pipe character <code>|</code>. Example: <code>Apple|Banana|Orange</code></li>
              <li>Upload the completed file to preview and validate.</li>
            </ol>
            <p className="text-sm opacity-80 mt-2">Note: Images cannot be imported via CSV. You can add images later using the Question Builder.</p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{rows.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Invalid</div>
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={validCount === 0 || isImporting || checkingDuplicates}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
            >
              {isImporting ? "Importing..." : checkingDuplicates ? "Checking duplicates..." : `Import ${validCount} Valid Rows`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 font-medium">Row</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Question</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Options</th>
                  <th className="p-3 font-medium">Correct Ans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, i) => (
                  <tr key={i} className={row.validation.isValid ? (row.validation.warnings.length > 0 ? "bg-yellow-50" : "bg-white") : "bg-red-50"}>
                    <td className="p-3 font-mono text-gray-500">{row.rowIndex}</td>
                    <td className="p-3">
                      {row.validation.isValid ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-medium w-max">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                          {row.validation.warnings.map((w, idx) => (
                            <span key={idx} className="text-xs text-yellow-700 bg-yellow-100 px-1 rounded block w-max">{w}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-medium w-max">
                            <AlertCircle className="w-3 h-3" /> Invalid
                          </span>
                          {row.validation.errors.map((e, idx) => (
                            <span key={idx} className="text-xs text-red-600 block">{e}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-[300px] truncate" title={row.raw.questionText}>
                      {row.raw.questionText}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {row.raw.type}
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-gray-600" title={row.raw.options}>
                      {row.raw.options}
                    </td>
                    <td className="p-3 max-w-[150px] truncate text-gray-800 font-medium" title={row.raw.correctAnswer}>
                      {row.raw.correctAnswer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
