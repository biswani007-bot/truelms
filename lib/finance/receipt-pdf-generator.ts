/**
 * Standard-compliant pure PDF generator for TrueLern Tuition Payment Receipts.
 * Produces valid PDF 1.4 documents without native C-libraries or third-party binary dependencies.
 */

export interface ReceiptPdfData {
  receiptNumber: string;
  issueDate: Date | string;
  invoiceNumber: string;
  studentName: string;
  studentCode: string;
  parentName: string;
  courseName: string;
  amount: number;
  taxes: number;
  paymentMethod: string;
  transactionReference: string;
}

function escapePdfText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function generateReceiptPdfBuffer(data: ReceiptPdfData): Buffer {
  const content: string[] = [];

  // Header background rectangle (emerald green)
  content.push("q");
  content.push("0.05 0.45 0.35 rg"); // emerald fill
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
  content.push("0.85 0.95 0.90 rg");
  content.push("50 702 Td");
  content.push(`(${escapePdfText("OFFICIAL TUITION PAYMENT RECEIPT")}) Tj`);
  content.push("ET");

  // Receipt meta (right side of header)
  content.push("BT");
  content.push("/F1 11 Tf");
  content.push("1 1 1 rg");
  content.push("420 725 Td");
  content.push(`(${escapePdfText(data.receiptNumber)}) Tj`);
  content.push("ET");

  content.push("BT");
  content.push("/F2 9 Tf");
  content.push("0.85 0.95 0.90 rg");
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
  content.push(`(${escapePdfText("Student & Guardian Details")}) Tj`);
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
  row("Guardian Name:", data.parentName, 555);
  row("Program / Course:", data.courseName, 535);
  row("Invoice Reference:", data.invoiceNumber, 515);

  // Line separator
  content.push("q");
  content.push("0.85 0.88 0.92 RG");
  content.push("54 495 m 522 495 l S");
  content.push("Q");

  // Section 2: Payment Details
  content.push("BT");
  content.push("/F1 12 Tf");
  content.push("0.1 0.15 0.2 rg");
  content.push("54 470 Td");
  content.push(`(${escapePdfText("Payment & Settlement Details")}) Tj`);
  content.push("ET");

  row("Transaction Ref:", data.transactionReference, 445);
  row("Payment Method:", data.paymentMethod.replace("-", " ").toUpperCase(), 425);
  row("Settlement Status:", "SUCCESSFUL / PAID", 405);
  row("Base Amount:", `$${data.amount - (data.taxes || 0)}`, 385);
  row("Tax Included:", `$${data.taxes || 0}`, 365);

  // Total Highlight Box
  content.push("q");
  content.push("0.95 0.98 0.95 rg"); // light emerald fill
  content.push("54 290 468 50 re f");
  content.push("0.05 0.45 0.35 RG");
  content.push("1.5 w");
  content.push("54 290 468 50 re S");
  content.push("Q");

  content.push("BT");
  content.push("/F1 12 Tf");
  content.push("0.05 0.45 0.35 rg");
  content.push("70 310 Td");
  content.push(`(${escapePdfText("TOTAL AMOUNT SETTLED:")}) Tj`);
  content.push("ET");

  content.push("BT");
  content.push("/F1 16 Tf");
  content.push("0.05 0.45 0.35 rg");
  content.push("400 310 Td");
  content.push(`($${data.amount}) Tj`);
  content.push("ET");

  // Section 3: Verification & Security Stamp
  content.push("BT");
  content.push("/F2 8 Tf");
  content.push("0.5 0.55 0.6 rg");
  content.push("54 240 Td");
  content.push(`(${escapePdfText("This is a verified, system-generated payment voucher issued by TrueLern LMS.")}) Tj`);
  content.push("0 -12 Td");
  content.push(`(${escapePdfText("For inquiries or tax verification, contact billing@truelern.com.")}) Tj`);
  content.push("ET");

  const streamContent = content.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");

  // Build standard PDF structure with exact byte-offset xref table
  const pdfHeader = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const obj6 = `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  let offset = Buffer.byteLength(pdfHeader, "utf8");
  const offset1 = offset; offset += Buffer.byteLength(obj1, "utf8");
  const offset2 = offset; offset += Buffer.byteLength(obj2, "utf8");
  const offset3 = offset; offset += Buffer.byteLength(obj3, "utf8");
  const offset4 = offset; offset += Buffer.byteLength(obj4, "utf8");
  const offset5 = offset; offset += Buffer.byteLength(obj5, "utf8");
  const offset6 = offset; offset += Buffer.byteLength(obj6, "utf8");

  const xrefOffset = offset;
  const pad = (n: number) => String(n).padStart(10, "0");

  const xref = `xref\n0 7\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n${pad(offset6)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = pdfHeader + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer;
  return Buffer.from(fullPdf, "utf8");
}
