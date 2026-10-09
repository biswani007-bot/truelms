import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Check, X, Filter } from "lucide-react";

interface Question {
  _id: string;
  questionCode: string;
  questionText: string;
  category: string;
  difficultyLevel: string;
  marks: number;
  type: string;
  options?: string[];
  correctAnswer?: any;
  mediaAttachments?: string[];
}

interface QuestionBankPickerProps {
  onAddQuestions: (selected: Question[]) => void;
  onClose: () => void;
  alreadySelectedIds: string[];
}

export function QuestionBankPicker({ onAddQuestions, onClose, alreadySelectedIds }: QuestionBankPickerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    search: "",
    type: "",
    difficultyLevel: ""
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (pagination.search) params.append("search", pagination.search);
      if (pagination.type) params.append("type", pagination.type);
      if (pagination.difficultyLevel) params.append("difficultyLevel", pagination.difficultyLevel);

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
        setTotalPages(data.meta.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching question bank:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleSelection = (q: Question) => {
    if (alreadySelectedIds.includes(q._id)) return;
    
    if (selectedQuestions.find(sq => sq._id === q._id)) {
      setSelectedQuestions(selectedQuestions.filter(sq => sq._id !== q._id));
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
    }
  };

  const handleAdd = () => {
    onAddQuestions(selectedQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pick from Question Bank</h2>
            <p className="text-xs text-gray-500">Select existing questions to add to your assessment</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {previewQuestion ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            <button onClick={() => setPreviewQuestion(null)} className="flex items-center gap-2 text-blue-600 text-sm hover:underline mb-2 w-max">
              <ChevronLeft className="w-4 h-4" /> Back to list
            </button>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 bg-white border rounded text-xs font-mono">{previewQuestion.questionCode}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs capitalize">{previewQuestion.type}</span>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-800 rounded text-xs">{previewQuestion.marks} Marks</span>
              </div>
              <p className="font-medium text-gray-900 whitespace-pre-wrap">{previewQuestion.questionText}</p>
              
              {previewQuestion.mediaAttachments && previewQuestion.mediaAttachments.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {previewQuestion.mediaAttachments.map((url, i) => (
                    <img key={i} src={url} alt="Attachment" className="max-h-40 rounded border" />
                  ))}
                </div>
              )}

              {previewQuestion.type.includes("MCQ") || previewQuestion.type === "multiple-select" ? (
                <div className="space-y-2 mt-4">
                  {previewQuestion.options?.map((opt, i) => {
                    const isCorrect = Array.isArray(previewQuestion.correctAnswer) 
                      ? previewQuestion.correctAnswer.includes(opt)
                      : previewQuestion.correctAnswer === opt;
                    return (
                      <div key={i} className={`p-3 rounded border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        {opt} {isCorrect && <span className="ml-2 text-xs text-green-700 font-bold">(Correct Answer)</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <span className="font-bold text-yellow-800">Correct Answer:</span> {JSON.stringify(previewQuestion.correctAnswer)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-white">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  value={pagination.search}
                  onChange={(e) => setPagination({ ...pagination, search: e.target.value, page: 1 })}
                />
              </div>
              <select
                className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                value={pagination.type}
                onChange={(e) => setPagination({ ...pagination, type: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="multiple-select">Multiple Select</option>
                <option value="true-false">True/False</option>
                <option value="short-answer">Short Answer</option>
                <option value="essay">Essay</option>
              </select>
              <select
                className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                value={pagination.difficultyLevel}
                onChange={(e) => setPagination({ ...pagination, difficultyLevel: e.target.value, page: 1 })}
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-10 text-center text-gray-500">Loading...</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-10"></th>
                      <th className="p-3 font-medium text-gray-600">Question</th>
                      <th className="p-3 font-medium text-gray-600">Type</th>
                      <th className="p-3 font-medium text-gray-600">Diff</th>
                      <th className="p-3 font-medium text-gray-600">Marks</th>
                      <th className="p-3 font-medium text-gray-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map((q) => {
                      const isAlreadyAdded = alreadySelectedIds.includes(q._id);
                      const isSelected = selectedQuestions.some(sq => sq._id === q._id);

                      return (
                        <tr key={q._id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50' : ''}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isAlreadyAdded || isSelected}
                              disabled={isAlreadyAdded}
                              onChange={() => toggleSelection(q)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3">
                            <div className="text-gray-900 font-medium max-w-md truncate" title={q.questionText}>
                              {q.questionText}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{q.questionCode}</div>
                          </td>
                          <td className="p-3 text-gray-600 capitalize">{q.type}</td>
                          <td className="p-3 text-gray-600 capitalize">{q.difficultyLevel}</td>
                          <td className="p-3 text-gray-600">{q.marks}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              Preview
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {questions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-500">No questions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm py-1.5 px-2 text-gray-600">Page {pagination.page} of {totalPages}</span>
                <button
                  disabled={pagination.page >= totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedQuestions.length} selected
                </span>
                <button
                  onClick={handleAdd}
                  disabled={selectedQuestions.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
