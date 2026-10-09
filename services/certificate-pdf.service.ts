/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import QRCode from "qrcode";

export class CertificatePdfService {
  /**
   * Generates a pristine, professional academic certificate directly as vector PDF.
   * Standard A4 Landscape: width = 841.89 pt, height = 595.28 pt.
   */
  public static async generateCertificatePdf(cert: any): Promise<Buffer> {
    if (!cert) throw new Error("Certificate record is required for PDF generation");

    // 1. Initialize brand-new PDF Document (A4 Landscape)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    // 2. Setup Typography
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Color Palette
    const bgParchment = rgb(0.99, 0.985, 0.975); // Subtle warm academic parchment
    const navyPrimary = rgb(0.06, 0.12, 0.22); // Deep Oxford Navy
    const navyAccent = rgb(0.08, 0.18, 0.36); // Royal Navy
    const goldPrimary = rgb(0.77, 0.63, 0.35); // Regal Antique Gold
    const goldDark = rgb(0.60, 0.47, 0.20); // Darker Gold for accents
    const textCharcoal = rgb(0.18, 0.22, 0.28); // Body Charcoal
    const textSlate = rgb(0.38, 0.43, 0.50); // Secondary Slate
    const textMuted = rgb(0.55, 0.58, 0.64); // Footnote Gray

    // 3. Draw Background & Multi-line Classical Border
    // Base parchment fill
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: bgParchment,
    });

    // Outer Navy Border (Inset 22pt, width 3.5pt)
    page.drawRectangle({
      x: 22,
      y: 22,
      width: width - 44,
      height: height - 44,
      borderColor: navyPrimary,
      borderWidth: 3.5,
    });

    // Inner Gold Border (Inset 28pt, width 1.2pt)
    page.drawRectangle({
      x: 28,
      y: 28,
      width: width - 56,
      height: height - 56,
      borderColor: goldPrimary,
      borderWidth: 1.2,
    });

    // Fine Hairline Inner Border (Inset 33pt, width 0.5pt)
    page.drawRectangle({
      x: 33,
      y: 33,
      width: width - 66,
      height: height - 66,
      borderColor: rgb(0.85, 0.82, 0.76),
      borderWidth: 0.5,
    });

    // Corner Geometric Accents (Gold Corner Diamonds)
    const drawCornerAccent = (cx: number, cy: number) => {
      page.drawRectangle({
        x: cx - 4,
        y: cy - 4,
        width: 8,
        height: 8,
        color: goldPrimary,
      });
    };
    drawCornerAccent(33, 33);
    drawCornerAccent(width - 33, 33);
    drawCornerAccent(33, height - 33);
    drawCornerAccent(width - 33, height - 33);

    // Helpers for Centered and Wrapped Text
    const drawCenteredText = (
      text: string,
      yPos: number,
      size: number,
      textFont: any,
      color: any,
      maxWidth: number = width - 120
    ) => {
      let fontSize = size;
      let textWidth = textFont.widthOfTextAtSize(text, fontSize);
      if (textWidth > maxWidth) {
        fontSize = Math.max(8, size * (maxWidth / textWidth));
        textWidth = textFont.widthOfTextAtSize(text, fontSize);
      }
      const xPos = (width - textWidth) / 2;
      page.drawText(text, {
        x: xPos,
        y: yPos,
        size: fontSize,
        font: textFont,
        color,
      });
      return { x: xPos, y: yPos, width: textWidth, size: fontSize };
    };

    // 4. Authoritative Logo Handling (Embed Exactly Once)
    try {
      const logoPath = path.join(process.cwd(), "public", "TrueLernLogo_horizontal.png");
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const targetWidth = 145;
      const logoAspect = logoImage.height / logoImage.width;
      const targetHeight = targetWidth * logoAspect;
      const logoX = (width - targetWidth) / 2;
      const logoY = height - 88;

      page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: targetWidth,
        height: targetHeight,
      });
    } catch {
      // Graceful typographic institutional banner fallback if image asset is unavailable
      const instName = cert.customization?.institutionName || "TRUELEARN ACADEMY";
      drawCenteredText(instName.toUpperCase(), height - 76, 16, fontBold, navyPrimary);
    }

    // 5. Dynamic Data Extraction & Customization Resolution
    const custom = cert.customization || {};

    // Learner Name
    const studentName = cert.student
      ? `${cert.student.firstName || ""} ${cert.student.lastName || ""}`.trim() || "Student Learner"
      : "Student Learner";

    // Course Title
    const courseTitle =
      custom.courseDisplayName ||
      (cert.course ? (cert.course.courseName || cert.course.name) : "Professional Academic Program") ||
      "Professional Academic Program";

    // Certificate Number & Verification
    const certNumber = cert.certificateNumber || "CRT-000000";
    const verificationCode = cert.verificationCode || "UNKNOWN";

    // Issue Date & Completion Date
    const issueDate = cert.issueDate
      ? new Date(cert.issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Dynamic Instructor Name Resolution:
    // Priority: Custom admin edit -> Populated course instructor user -> Template footerText -> Neutral fallback
    let instructorName = "Course Lead Faculty";
    if (custom.instructorDisplayName && custom.instructorDisplayName.trim()) {
      instructorName = custom.instructorDisplayName.trim();
    } else if (cert.course?.instructors && Array.isArray(cert.course.instructors) && cert.course.instructors.length > 0) {
      const primaryInstructor = cert.course.instructors[0];
      if (primaryInstructor && primaryInstructor.firstName) {
        instructorName = `${primaryInstructor.firstName} ${primaryInstructor.lastName}`.trim();
      }
    } else if (cert.template?.footerText && cert.template.footerText.trim()) {
      instructorName = cert.template.footerText.trim();
    }
    const instructorTitle = custom.instructorTitle || "Course Lead Faculty";

    // Dynamic Signatory Resolution:
    // Priority: Custom admin edit -> Populated approvedBy -> Populated issuedBy -> Template headerText -> Neutral fallback
    let signatoryName = "Office of Academic Registrar";
    if (custom.signatoryDisplayName && custom.signatoryDisplayName.trim()) {
      signatoryName = custom.signatoryDisplayName.trim();
    } else if (cert.approvedBy && cert.approvedBy.firstName) {
      signatoryName = `${cert.approvedBy.firstName} ${cert.approvedBy.lastName}`.trim();
    } else if (cert.issuedBy && cert.issuedBy.firstName) {
      signatoryName = `${cert.issuedBy.firstName} ${cert.issuedBy.lastName}`.trim();
    } else if (cert.template?.headerText && cert.template.headerText.trim()) {
      signatoryName = cert.template.headerText.trim();
    }
    const signatoryTitle = custom.signatoryTitle || "Academic Director";

    // 6. Certificate Title & Presentation Hierarchy
    const certTitle = (custom.title || "CERTIFICATE OF ACHIEVEMENT").toUpperCase();
    drawCenteredText(certTitle, height - 128, 25, fontBold, navyPrimary, width - 160);

    const certSubtitle = (custom.subtitle || "THIS CREDENTIAL IS PROUDLY CONFERRED UPON").toUpperCase();
    drawCenteredText(certSubtitle, height - 154, 9, font, textSlate, width - 200);

    // 7. Student Name (Hero Display)
    const heroNameRes = drawCenteredText(studentName, height - 198, 28, fontBold, navyAccent, width - 220);

    // Gold decorative underline divider below student name
    const divWidth = Math.min(340, Math.max(220, heroNameRes.width + 40));
    page.drawLine({
      start: { x: (width - divWidth) / 2, y: height - 208 },
      end: { x: (width + divWidth) / 2, y: height - 208 },
      thickness: 1.2,
      color: goldPrimary,
    });

    // 8. Achievement Recognition Text
    const achievementWording =
      custom.achievementWording ||
      "for successfully completing the prescribed curriculum, assessments, and academic milestones in";
    drawCenteredText(achievementWording, height - 236, 11, font, textCharcoal, width - 200);

    // 9. Course Name Display
    drawCenteredText(courseTitle, height - 268, 20, fontBold, rgb(0.06, 0.28, 0.42), width - 180);

    // 10. Academic Distinction & Metadata Strip
    const cardW = 540;
    const cardH = 34;
    const cardX = (width - cardW) / 2;
    const cardY = height - 322;

    // Card background & subtle border
    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      color: rgb(0.97, 0.97, 0.96),
      borderColor: rgb(0.86, 0.84, 0.80),
      borderWidth: 0.8,
    });

    // Dividing lines in card
    page.drawLine({
      start: { x: cardX + cardW / 3, y: cardY + 5 },
      end: { x: cardX + cardW / 3, y: cardY + cardH - 5 },
      thickness: 0.6,
      color: rgb(0.86, 0.84, 0.80),
    });
    page.drawLine({
      start: { x: cardX + (2 * cardW) / 3, y: cardY + 5 },
      end: { x: cardX + (2 * cardW) / 3, y: cardY + cardH - 5 },
      thickness: 0.6,
      color: rgb(0.86, 0.84, 0.80),
    });

    // Item 1: Issue Date
    const drawBoxCol = (label: string, val: string, startX: number, colW: number) => {
      const lblW = font.widthOfTextAtSize(label, 7.5);
      page.drawText(label, {
        x: startX + (colW - lblW) / 2,
        y: cardY + 19,
        size: 7.5,
        font,
        color: textSlate,
      });
      const valW = fontBold.widthOfTextAtSize(val, 9.5);
      page.drawText(val, {
        x: startX + (colW - valW) / 2,
        y: cardY + 8,
        size: 9.5,
        font: fontBold,
        color: navyPrimary,
      });
    };

    drawBoxCol("CONFERRED DATE", issueDate, cardX, cardW / 3);
    const gradeStr = cert.grade ? `Grade ${cert.grade}` : "Honors";
    const percentStr = cert.percentage ? ` (${cert.percentage}%)` : "";
    drawBoxCol("ACADEMIC STANDING", `${gradeStr}${percentStr}`, cardX + cardW / 3, cardW / 3);
    drawBoxCol("CREDENTIAL ID", certNumber, cardX + (2 * cardW) / 3, cardW / 3);

    // 11. Signatures & Digital Verification Area (Bottom Grid)
    const sigLineY = 126;
    const colWidth = 190;

    // --- LEFT COLUMN: Course Lead Faculty ---
    const leftColStartX = 70;
    page.drawLine({
      start: { x: leftColStartX, y: sigLineY },
      end: { x: leftColStartX + colWidth, y: sigLineY },
      thickness: 1,
      color: rgb(0.70, 0.73, 0.78),
    });

    const drawColCentered = (txt: string, yPos: number, sz: number, fnt: any, clr: any) => {
      let s = sz;
      let w = fnt.widthOfTextAtSize(txt, s);
      if (w > colWidth) {
        s = sz * (colWidth / w);
        w = fnt.widthOfTextAtSize(txt, s);
      }
      page.drawText(txt, {
        x: leftColStartX + (colWidth - w) / 2,
        y: yPos,
        size: s,
        font: fnt,
        color: clr,
      });
    };
    drawColCentered(instructorName, sigLineY - 15, 11, fontBold, navyPrimary);
    drawColCentered(instructorTitle, sigLineY - 27, 8.5, font, textSlate);

    // --- RIGHT COLUMN: Authorized Signatory ---
    const rightColStartX = width - 70 - colWidth;
    page.drawLine({
      start: { x: rightColStartX, y: sigLineY },
      end: { x: rightColStartX + colWidth, y: sigLineY },
      thickness: 1,
      color: rgb(0.70, 0.73, 0.78),
    });

    const drawRightCentered = (txt: string, yPos: number, sz: number, fnt: any, clr: any) => {
      let s = sz;
      let w = fnt.widthOfTextAtSize(txt, s);
      if (w > colWidth) {
        s = sz * (colWidth / w);
        w = fnt.widthOfTextAtSize(txt, s);
      }
      page.drawText(txt, {
        x: rightColStartX + (colWidth - w) / 2,
        y: yPos,
        size: s,
        font: fnt,
        color: clr,
      });
    };
    drawRightCentered(signatoryName, sigLineY - 15, 11, fontBold, navyPrimary);
    drawRightCentered(signatoryTitle, sigLineY - 27, 8.5, font, textSlate);

    // --- CENTER COLUMN: Official QR Code & Public Verification Badge ---
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-certificate/${verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0F1E36", // Oxford Navy dots
        light: "#FFFFFF",
      },
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes = Buffer.from(qrBase64, "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);

    const qrSize = 62;
    const qrX = (width - qrSize) / 2;
    const qrY = 88;

    // QR Badge decorative border
    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: rgb(1, 1, 1),
      borderColor: goldPrimary,
      borderWidth: 1,
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    // Verification code and instruction under QR
    const verLbl = "DIGITAL VERIFICATION";
    const verLblW = fontBold.widthOfTextAtSize(verLbl, 7);
    page.drawText(verLbl, {
      x: (width - verLblW) / 2,
      y: qrY + qrSize + 8,
      size: 7,
      font: fontBold,
      color: goldDark,
    });

    const codeStr = `Code: ${verificationCode}`;
    const codeW = fontBold.widthOfTextAtSize(codeStr, 8);
    page.drawText(codeStr, {
      x: (width - codeW) / 2,
      y: qrY - 14,
      size: 8,
      font: fontBold,
      color: navyPrimary,
    });

    // 12. Bottom Institutional Footer
    const footerText =
      custom.footerWording ||
      "TrueLern Academy • Learn • Grow • Lead • Cryptographically Secure Credential • Authenticity verifiable at truelern.com";
    drawCenteredText(footerText, 39, 7.5, font, textMuted);

    // 13. Serialize and return as Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
