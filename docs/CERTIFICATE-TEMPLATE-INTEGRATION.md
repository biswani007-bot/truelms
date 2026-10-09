# Certificate Template Integration Report

## 1. Official Template Source
The official certificate design (`media__1789546532968.pdf`) was uploaded and safely placed into `/public/templates/certificate-template.pdf`. This serves as the single visual source of truth.

## 2. Template Dimensions & Architecture
- **Orientation**: Landscape A4 (assumed bounds `841 x 595`).
- **Rendering Mechanism**: `pdf-lib` is used on the backend (`services/certificate-pdf.service.ts`) to programmatically load the raw PDF and inject dynamically rendered text over the design using coordinate mapping. The template itself remains 100% structurally intact.

## 3. Dynamic Fields Mapped
- `Student Name`: Scaled to 32pt Helvetica-Bold.
- `Program Name`: Scaled to 20pt Helvetica-Bold.
- `Certificate Number`: Drawn dynamically.
- `Batch`: Drawn dynamically.
- `Issue Date`: Localized date string based on the persisted DB issue date.
- `Signatures`: Temporarily hardcoded for the current TrueLern scope.
- `QR Code / Verification URL`: Generated via the `qrcode` library on the fly and embedded.

## 4. Workflows & Isolation
- **Admin Flow**: Admins manage issuance securely via `/api/certificates`. An API endpoint (`GET /api/certificates/[id]/download`) serves the finalized PDF.
- **Parent Flow**: A dedicated `/parent/certificates` tab has been built.
- **Child Isolation**: STRICT ENFORCEMENT. The Parent Certificate UI explicitly fetches certificates constrained by the `selectedChild.studentId`. A parent switching between siblings only sees the certificates belonging exactly to the active child payload. 
- **Teacher Decision**: NOT IMPLEMENTED. Teachers grade assignments; the registrar/admins issue authoritative certificates. Extending generation powers to teachers was deemed a violation of LMS integrity.

## 5. Security & Verification
- **Public Verification**: Built at `/verify-certificate/[id]`. The endpoint successfully matches UUID/Verification keys to return a "VALID/REVOKED/NOT FOUND" UI, logging every interaction in `CertificateVerification`.
- **Download Security**: The `/download` API endpoint checks for appropriate Authorization headers before streaming the PDF buffer.

## 6. QA Checklist
- [x] TEMPLATE INTEGRATED
- [x] CERTIFICATE DATA MAPPING
- [x] ADMIN ISSUE FLOW
- [x] PDF GENERATION
- [x] PARENT VISIBILITY
- [x] TEACHER VISIBILITY (Ruled Out Intentionally)
- [x] PUBLIC VERIFICATION
- [x] SECURITY / CHILD ISOLATION
- [x] MOBILE/TABLET UI
- [x] TESTS EXECUTED / BUILD

## Placeholder Removal / Template Rendering
- **Source Template**: The template (`certificate-template.pdf`) contains instructional placeholder text (e.g. `[ENTER CERTIFICATE NO.]`, `STUDENT FULL NAME`).
- **Clearing Strategy**: During PDF generation in `certificate-pdf.service.ts`, pure white opaque rectangles (`rgb(1, 1, 1)`) are drawn precisely over the text bounds of these placeholders to erase them without covering the design borders or lines. 
- **Dynamic Text Regions**: Dynamic values are written exactly within the cleared bounding boxes. Helper methods (`drawCenteredBoxText`) auto-scale the font sizes if the text length exceeds the box constraints, preventing text from overlapping table borders or other layout elements.
- **Preview/PDF Shared Rendering**: The Admin Preview UI now fully leverages the backend PDF engine using an `iframe` with inline content disposition (`/api/certificates/[id]/download?preview=true`), guaranteeing 100% visual parity between the preview and the final downloaded asset.
- **Visual Verification Result**: Long text bounds and table alignments are respected. The instructional sentence at the bottom has been successfully erased.
