"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { DataTable } from "../../../../components/ui/DataTable";
import { QuestionBuilderModal } from "../../../../components/assessment/QuestionBuilderModal";

interface Question {
  _id: string;
  questionCode: string;
  questionText: string;
  category: string;
  difficultyLevel: string;
  marks: number;
  type: string;
  tags: string[];
}

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    search: "",
    sort: "createdAt",
    order: "desc"
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: pagination.sort,
        order: pagination.order
      });

      if (pagination.search) {
        queryParams.append("search", pagination.search);
      }

      const response = await fetch(`/api/admin/questions?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data);
        setTotalRecords(data.meta.total);
      } else {
        throw new Error(data.message || "Failed to fetch questions");
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        alert("Question deleted successfully");
        fetchQuestions();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const columns = [
    {
      header: "Code",
      key: "questionCode",
      sortable: true
    },
    {
      header: "Question",
      key: "questionText",
      render: (row: Question) => (
        <div className="max-w-md truncate" title={row.questionText}>
          {row.questionText.replace(/<[^>]*>?/gm, '')}
        </div>
      )
    },
    {
      header: "Type",
      key: "type",
      render: (row: Question) => (
        <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.type.replace("-", " ")}
        </span>
      )
    },
    {
      header: "Category",
      key: "category",
      sortable: true
    },
    {
      header: "Difficulty",
      key: "difficultyLevel",
      render: (row: Question) => {
        const colors = {
          easy: "bg-green-100 text-green-800",
          medium: "bg-yellow-100 text-yellow-800",
          hard: "bg-red-100 text-red-800"
        };
        return (
          <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${colors[row.difficultyLevel as keyof typeof colors] || "bg-gray-100 text-gray-800"}`}>
            {row.difficultyLevel}
          </span>
        );
      }
    },
    {
      header: "Marks",
      key: "marks",
      sortable: true
    },
    {
      header: "Actions",
      key: "actions",
      render: (row: Question) => (
        <div className="flex items-center gap-3">
          <button onClick={() => {
            setEditingQuestion(row);
            setIsModalOpen(true);
          }} className="text-gray-600 hover:text-blue-600">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your assessment questions repository
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <a
            href="/admin/questions/import"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Import CSV
          </a>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <DataTable
          columns={columns}
          data={questions}
          loading={loading}
        />
      </div>

      <QuestionBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSuccess={() => {
          fetchQuestions();
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        questionId={editingQuestion?._id}
      />
    </div>
  );
}
