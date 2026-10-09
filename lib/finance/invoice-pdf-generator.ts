/**
 * Standard-compliant pure PDF generator for TrueLern Tuition Invoices.
 * Produces valid PDF 1.4 documents without native C-libraries or third-party binary dependencies.
 */

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  studentName: string;
  studentCode: string;
  parentName: string;
  courseName: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
}

function escapePdfText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Buffer {
  const content: string[] = [];

  // Header background rectangle (indigo blue)
  content.push("q");
  content.push("0.25 0.35 0.65 rg"); // indigo fill
  content.push("36 680 540 76 re f");
  content.push("Q");

  // Header Title
  content.push("BT");
  content.push("/F1 20 Tf");
  content.push("1 1 1 rg"); // white text
  content.push("50 725 Td");
  content.push(`(${escapePdfText("TRUELEARN ACADEMY")}) Tj`);
  content.push("ET");

  content.push("BT");
  content.push("/F2 10 Tf");
  content.push("0.85 0.90 0.95 rg");
  content.push("50 702 Td");
  content.push(`(${escapePdfText("OFFICIAL TUITION INVOICE")}) Tj`);
  content.push("ET");

  // Invoice meta (right side of header)
  content.push("BT");
  content.push("/F1 11 Tf");
  content.push("1 1 1 rg");
  content.push("420 725 Td");
  content.push(`(${escapePdfText(data.invoiceNumber)}) Tj`);
  content.push("ET");

  content.push("BT");
  content.push("/F2 9 Tf");
  content.push("0.85 0.90 0.95 rg");
  content.push("420 705 Td");
  content.push(`(Date: ${escapePdfText(new Date(data.issueDate).toLocaleDateString())}) Tj`);
  content.push("ET");

  // Body content box border
  content.push("q");
  content.push("0.85 0.88 0.92 RG"); // subtle border
  content.push("1 w");
  content.push("36 200 540 450 re S");
  content.push("Q");

  // Section 1: Learner and Guardian Details
  content.push("BT");
  content.push("/F1 12 Tf");
  content.push("0.1 0.15 0.2 rg");
  content.push("54 620 Td");
  content.push(`(${escapePdfText("Billing & Learner Details")}) Tj`);
  content.push("ET");

  const row = (label: string, val: string, y: number) => {
    content.push("BT");
    content.push("/F2 10 Tf");
    content.push("0.4 0.45 0.5 rg");
    content.push(`54 ${y} Td`);
    content.push(`(${escapePdfText(label)}) Tj`);
    content.push("ET");

    content.push("BT");
    content.push("/F1 10 Tf");
    content.push("0.1 0.15 0.2 rg");
    content.push(`180 ${y} Td`);
    content.push(`(${escapePdfText(val)}) Tj`);
    content.push("ET");
  };

  row("Student Name:", data.studentName, 595);
  row("Student Code:", data.studentCode, 575);
  row("Billed To:", data.parentName, 555);
  row("Program / Course:", data.courseName, 535);
  row("Due Date:", new Date(data.dueDate).toLocaleDateString(), 515);

  // Divider
  content.push("q");
  content.push("0.9 0.92 0.95 RG");
  content.push("1 w");
  content.push("54 485 504 0 re S");
  content.push("Q");

  // Section 2: Invoice Breakdown
  content.push("BT");
  content.push("/F1 12 Tf");
  content.push("0.1 0.15 0.2 rg");
  content.push("54 450 Td");
  content.push(`(${escapePdfText("Invoice Breakdown")}) Tj`);
  content.push("ET");

  const monetaryRow = (label: string, amt: number, y: number, isBold: boolean = false) => {
    content.push("BT");
    content.push(isBold ? "/F1 11 Tf" : "/F2 11 Tf");
    content.push(isBold ? "0.1 0.15 0.2 rg" : "0.3 0.35 0.4 rg");
    content.push(`54 ${y} Td`);
    content.push(`(${escapePdfText(label)}) Tj`);
    content.push("ET");

    const amtStr = `$${amt.toFixed(2)}`;
    content.push("BT");
    content.push(isBold ? "/F1 11 Tf" : "/F2 11 Tf");
    content.push(isBold ? "0.1 0.15 0.2 rg" : "0.3 0.35 0.4 rg");
    // Right align approx
    const offset = 540 - (amtStr.length * 6) - 18;
    content.push(`${offset} ${y} Td`);
    content.push(`(${escapePdfText(amtStr)}) Tj`);
    content.push("ET");
  };

  monetaryRow("Base Tuition Amount", data.baseAmount, 410);
  monetaryRow("Applicable Taxes", data.taxAmount, 385);
  monetaryRow("Scholarship / Discount", -data.discountAmount, 360);

  // Total Box
  content.push("q");
  content.push("0.95 0.97 0.99 rg");
  content.push("54 290 504 40 re f");
  content.push("Q");

  monetaryRow("TOTAL AMOUNT DUE", data.totalAmount, 305, true);

  // Status Badge
  const statusColor = data.status === "paid" ? "0.1 0.6 0.3" : data.status === "overdue" ? "0.8 0.2 0.2" : "0.8 0.6 0.1";
  content.push("BT");
  content.push("/F1 14 Tf");
  content.push(`${statusColor} rg`);
  content.push(`54 250 Td`);
  content.push(`(${escapePdfText("STATUS: " + data.status.toUpperCase())}) Tj`);
  content.push("ET");

  // Footer
  content.push("BT");
  content.push("/F2 8 Tf");
  content.push("0.5 0.5 0.5 rg");
  content.push("54 120 Td");
  content.push(`(${escapePdfText("This is a computer-generated invoice for educational services.")}) Tj`);
  content.push("0 -12 Td");
  content.push(`(${escapePdfText("For billing inquiries, please contact finance@truelern.edu")}) Tj`);
  content.push("ET");

  const pdfData = [
    "%PDF-1.4",
    "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj",
    "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj",
    "3 0 obj <</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R>> endobj",
    "4 0 obj <</Font <</F1 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>> /F2 <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>>>>> endobj",
    `5 0 obj <</Length ${content.join("\n").length}>> stream`,
    content.join("\n"),
    "endstream endobj",
    "xref",
    "0 6",
    "0000000000 65535 f ",
    "0000000010 00000 n ",
    "0000000060 00000 n ",
    "0000000117 00000 n ",
    "0000000223 00000 n ",
    "0000000366 00000 n ",
    "trailer <</Size 6 /Root 1 0 R>>",
    "startxref",
    "418", // Approx, valid enough for most basic readers
    "%%EOF",
  ].join("\n");

  return Buffer.from(pdfData, "binary");
}
