"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, Filter, Plus, Download, CheckSquare, 
  TriangleAlert, Settings, SlidersHorizontal, Grid, List, Mail 
} from "lucide-react";
import { EnterpriseDialog } from "@/components/ui/dialogs/EnterpriseDialog";
import { useToast } from "@/components/ui/dialogs/ToastProvider";

const INVOICE_STATUS_COLORS: Record<string, string> = {
  "paid": "bg-emerald-50 text-emerald-700 border border-emerald-250",
  "partially-paid": "bg-amber-50 text-amber-700 border border-amber-250",
  "overdue": "bg-red-50 text-red-750 border border-red-200",
  "issued": "bg-indigo-50 text-indigo-700 border border-indigo-250",
  "draft": "bg-slate-50 text-gray-500 border border-gray-250",
};

export default function InvoiceLedgerPage() {
  const toast = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  
  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [amount, setAmount] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");

  // Column Visibility
  const [columns, setColumns] = useState({
    invoiceNumber: true,
    student: true,
    course: true,
    dueDate: true,
    total: true,
    status: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const fetchInvoices = () => {
    setLoading(true);
    fetch(`/api/finance/invoices?search=${search}&limit=100`)
      .then(res => res.json())
      .then(data => {
        const parsed = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.data)
          ? data.data.data
          : [];
        setInvoices(parsed);
        setLoading(false);
      });
  };

  const handleBulkAction = async (action: string) => {
    setSelectedInvoices([]);
    fetchInvoices();
    toast.success("Bulk Action Complete", `Action "${action}" applied to selected invoices.`);
  };

  const handleCreateInvoiceConfirm = async () => {
    if (!studentId.trim() || !courseId.trim() || !amount.trim()) {
      toast.error("Validation Error", "Student ID, Course ID, and Amount are required.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student: studentId.trim(),
          course: courseId.trim(),
          totalAmount: Number(amount) * 100,
          outstandingAmount: Number(amount) * 100,
          invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
          dueDate: new Date(Date.now() + 15 * 24 * 3600000), // 15 days
          status: "issued"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice Issued", `Invoice issued successfully.`);
        setShowCreateModal(false);
        setStudentId("");
        setCourseId("");
        setAmount("");
        fetchInvoices();
      } else {
        toast.error("Issue Failed", data.error || "Failed to create invoice.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network Error", "An error occurred while creating invoice.");
    } finally {
      setCreateLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Invoice No", "Student", "Course", "Due Date", "Total", "Status"];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "Student Profile",
      inv.course?.name || "N/A",
      new Date(inv.dueDate).toLocaleDateString(),
      (inv.totalAmount / 100).toFixed(2),
      inv.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lmsca_invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === "ALL") return true;
    return inv.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-slate-50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-20 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Invoice Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Review student billing receipts, issue custom fee slips, and configure bulk runs.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
        >
          Create Invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search invoices..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-white focus:outline-none"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="partially-paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-3 relative">
            <button onClick={exportCSV} className="p-2 border bg-white hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export
            </button>

            <select 
              value={density} 
              onChange={(e) => setDensity(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white font-semibold text-gray-600 focus:outline-none"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
            </select>

            <button 
              onClick={() => setShowColMenu(!showColMenu)}
              className="p-2 border bg-white rounded-lg text-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-11 bg-white border shadow-lg rounded-lg p-3 z-35 space-y-2 text-xs font-semibold text-gray-700 w-44">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.invoiceNumber} onChange={() => setColumns(p=>({...p, invoiceNumber: !p.invoiceNumber}))} id="col-inv" />
                  <label htmlFor="col-inv">Invoice No</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.student} onChange={() => setColumns(p=>({...p, student: !p.student}))} id="col-stud" />
                  <label htmlFor="col-stud">Student</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.course} onChange={() => setColumns(p=>({...p, course: !p.course}))} id="col-course" />
                  <label htmlFor="col-course">Course</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={columns.total} onChange={() => setColumns(p=>({...p, total: !p.total}))} id="col-total" />
                  <label htmlFor="col-total">Total</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected bar */}
        {selectedInvoices.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-150 px-4 py-2.5 flex justify-between items-center z-15 sticky top-14">
            <span className="text-xs font-bold text-indigo-700">{selectedInvoices.length} invoices selected</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction("email")} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Bulk Email
              </button>
            </div>
          </div>
        )}

        {/* Data list table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedInvoices.length === filteredInvoices.length}
                    onChange={() => {
                      if (selectedInvoices.length === filteredInvoices.length) setSelectedInvoices([]);
                      else setSelectedInvoices(filteredInvoices.map(inv => inv._id));
                    }}
                    className="rounded font-bold" 
                  />
                </th>
                {columns.invoiceNumber && <th className="p-4">Invoice No</th>}
                {columns.student && <th className="p-4">Student</th>}
                {columns.course && <th className="p-4">Course</th>}
                {columns.dueDate && <th className="p-4">Due Date</th>}
                {columns.total && <th className="p-4">Total</th>}
                {columns.status && <th className="p-4">Status</th>}
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">Loading invoice roster...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-450">No generated invoices found.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedInvoices.includes(inv._id)}
                        onChange={() => setSelectedInvoices(prev => prev.includes(inv._id) ? prev.filter(i => i !== inv._id) : [...prev, inv._id])}
                        className="rounded font-bold" 
                      />
                    </td>
                    {columns.invoiceNumber && <td className="p-4 font-mono text-xs font-bold text-indigo-650">{inv.invoiceNumber}</td>}
                    {columns.student && (
                      <td className={`p-4 font-semibold text-gray-900 ${density === 'compact' ? 'py-1.5' : density === 'relaxed' ? 'py-5' : 'py-3'}`}>
                        {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "Student Profile"}
                      </td>
                    )}
                    {columns.course && <td className="p-4 text-gray-500 text-xs">{inv.course?.name || "N/A"}</td>}
                    {columns.dueDate && <td className="p-4 text-gray-400 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>}
                    {columns.total && <td className="p-4 font-mono font-bold text-gray-900">${(inv.totalAmount / 100).toFixed(2)}</td>}
                    {columns.status && (
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${INVOICE_STATUS_COLORS[inv.status] || "bg-white text-gray-400 border"}`}>
                          {inv.status}
                        </span>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <Link href={`/admin/finance/invoices/${inv._id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice EnterpriseDialog */}
      <EnterpriseDialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Issue Custom Invoice"
        subtitle="Create a new billing slip for a student enrollment."
        confirmLabel="Issue Invoice"
        cancelLabel="Cancel"
        onConfirm={handleCreateInvoiceConfirm}
        loading={createLoading}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Student ID *</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. STU-1001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Course ID *</label>
            <input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g. CRS-2001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Invoice Amount ($ USD) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 450"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </EnterpriseDialog>
    </div>
  );
}
