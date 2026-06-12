import { jsPDF } from "jspdf";
import type { FormValues } from "./schema";

const MARGIN = 40; // pt from edge
const PAGE_W = 612; // letter width in pt
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 14; // default line height pt
const FIELD_GAP = 11; // gap between fields

function addHRule(doc: jsPDF, y: number) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function fieldLine(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  lineEnd: number
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, x, y);
  const lw = doc.getTextWidth(label);
  // value text
  if (value) {
    doc.text(value, x + lw + 2, y);
  }
  // underline from after label to lineEnd
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.line(x + lw, y + 1.5, lineEnd, y + 1.5);
}

export function generatePDF(
  data: FormValues,
  signatureDataUrl: string | null
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  let y = MARGIN;

  // ── Title box ──────────────────────────────────────────────
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.rect(MARGIN, y, CONTENT_W, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    "Transportation Agreement / Field Trip Permission",
    PAGE_W / 2,
    y + 14,
    { align: "center" }
  );
  y += 30;

  // ── Tagline ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.text(
    "“At Coastal Kids, Safety Comes Before We Have Fun!!”",
    PAGE_W / 2,
    y,
    { align: "center" }
  );
  y += 14;

  // ── Intro paragraph ─────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const intro =
    "To ensure the safety and well-being of children during transportation, Coastal Kids Academy requires all " +
    "parents/guardians to review and acknowledge the following transportation policies and procedures.";
  const introLines = doc.splitTextToSize(intro, CONTENT_W);
  doc.text(introLines, MARGIN, y);
  y += introLines.length * 11 + 8;

  addHRule(doc, y);
  y += 10;

  // ── Section heading helper ───────────────────────────────────
  function sectionHeading(title: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, MARGIN, y);
    const tw = doc.getTextWidth(title);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y + 1.5, MARGIN + tw, y + 1.5);
    y += LINE_H + 2;
  }

  // ── CHILD INFORMATION ────────────────────────────────────────
  sectionHeading("Child Information");
  fieldLine(doc, "Child’s Name:", data.childName, MARGIN, y, PAGE_W - MARGIN);
  y += FIELD_GAP;
  // DOB and Classroom on same row
  fieldLine(doc, "DOB:", data.dob, MARGIN, y, MARGIN + 160);
  fieldLine(
    doc,
    "Classroom:",
    data.classroom ?? "",
    MARGIN + 170,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP + 6;

  // ── PARENT / GUARDIAN INFORMATION ───────────────────────────
  sectionHeading("Parent/Guardian Information");
  fieldLine(
    doc,
    "Parent/Guardian Name:",
    data.guardianName,
    MARGIN,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(doc, "Primary Phone:", data.primaryPhone, MARGIN, y, MARGIN + 200);
  fieldLine(
    doc,
    "Secondary Phone:",
    data.secondaryPhone ?? "",
    MARGIN + 210,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(doc, "Email:", data.email ?? "", MARGIN, y, PAGE_W - MARGIN);
  y += FIELD_GAP + 6;

  // ── EMERGENCY CONTACT INFORMATION ───────────────────────────
  sectionHeading("Emergency Contact Information");
  fieldLine(
    doc,
    "Emergency Contact Name:",
    data.emergencyContactName,
    MARGIN,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(doc, "Phone:", data.emergencyPhone, MARGIN, y, MARGIN + 160);
  fieldLine(
    doc,
    "Relationship:",
    data.emergencyRelationship ?? "",
    MARGIN + 170,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(
    doc,
    "Additional Emergency Contact:",
    data.additionalContact1 ?? "",
    MARGIN,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(
    doc,
    "Phone:",
    data.additionalPhone1 ?? "",
    MARGIN,
    y,
    MARGIN + 200
  );
  y += FIELD_GAP;
  fieldLine(
    doc,
    "Additional Emergency Contact:",
    data.additionalContact2 ?? "",
    MARGIN,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP;
  fieldLine(
    doc,
    "Phone:",
    data.additionalPhone2 ?? "",
    MARGIN,
    y,
    MARGIN + 200
  );
  y += FIELD_GAP + 6;

  // ── MEDICAL INFORMATION ──────────────────────────────────────
  sectionHeading("Medical Information");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const medInstruction =
    "Please list any allergies, medical conditions, medications, dietary restrictions, or special instructions:";
  const medLines = doc.splitTextToSize(medInstruction, CONTENT_W);
  doc.text(medLines, MARGIN, y);
  y += medLines.length * 11 + 4;

  // Medical notes lines first
  if (data.medicalNotes) {
    const noteLines = doc.splitTextToSize(data.medicalNotes, CONTENT_W);
    noteLines.forEach((line: string) => {
      doc.setFontSize(9);
      doc.text(line, MARGIN, y);
      addHRule(doc, y + 2);
      y += LINE_H;
    });
    const remaining = Math.max(0, 4 - noteLines.length);
    for (let i = 0; i < remaining; i++) {
      addHRule(doc, y + 2);
      y += LINE_H;
    }
  } else {
    for (let i = 0; i < 4; i++) {
      addHRule(doc, y + 2);
      y += LINE_H;
    }
  }
  y += 4;

  // Physician name / phone below lines
  fieldLine(doc, "Physician Name:", data.physicianName ?? "", MARGIN, y, MARGIN + 230);
  fieldLine(
    doc,
    "Phone:",
    data.physicianPhone ?? "",
    MARGIN + 240,
    y,
    PAGE_W - MARGIN
  );
  y += FIELD_GAP + 6;

  // ── TRANSPORTATION AGREEMENT ─────────────────────────────────
  sectionHeading("Transportation Agreement");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const agreementParagraphs = [
    "I authorize Coastal Kids Academy to transport my child for field trips, school transportation, emergency relocation, walking trips, community outings, and approved center activities.",
    "I understand Coastal Kids Academy will take reasonable precautions to provide a safe and supervised environment during transportation and off-site activities. I acknowledge that participation may involve normal risks associated with travel and children’s activities.",
    "I agree to not hold Coastal Kids Academy, its owners, employees, and agents responsible for injuries, accidents, or lost personal belongings resulting from participation in approved activities, except in cases of gross negligence or willful misconduct.",
  ];

  agreementParagraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 10.5 + 5;
  });

  y += 4;
  addHRule(doc, y);
  y += 14;

  // ── SIGNATURE AREA ───────────────────────────────────────────
  const sigLineEnd = PAGE_W - MARGIN - 160;
  const dateLineStart = sigLineEnd + 12;

  // Labels
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Parent/Guardian Signature:", MARGIN, y + 12);
  doc.text("Date:", dateLineStart, y + 12);

  // Underlines
  doc.setLineWidth(0.5);
  const sigLabelW = doc.getTextWidth("Parent/Guardian Signature:");
  doc.line(MARGIN + sigLabelW + 2, y + 12 + 1.5, sigLineEnd, y + 12 + 1.5);
  const dateLabelW = doc.getTextWidth("Date:");
  doc.line(
    dateLineStart + dateLabelW + 2,
    y + 12 + 1.5,
    PAGE_W - MARGIN,
    y + 12 + 1.5
  );

  // Signature image
  if (signatureDataUrl) {
    try {
      doc.addImage(signatureDataUrl, "PNG", MARGIN + sigLabelW + 4, y - 8, 130, 24);
    } catch {
      // skip if image fails
    }
  }

  // Date value
  if (data.signatureDate) {
    doc.text(data.signatureDate, dateLineStart + dateLabelW + 4, y + 12);
  }

  // ── Footer ───────────────────────────────────────────────────
  y = 792 - 20;
  doc.setFontSize(7);
  doc.setTextColor(100);
  const now = new Date().toLocaleString();
  doc.text(`Generated: ${now} — Coastal Kids Academy`, PAGE_W / 2, y, {
    align: "center",
  });

  // ── Save ─────────────────────────────────────────────────────
  const nameSlug = data.childName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const dateSlug = data.signatureDate.replace(/\//g, "-").replace(/\s/g, "");
  const filename = `coastal-kids-transportation-permission-${nameSlug}-${dateSlug || "unsigned"}.pdf`;
  doc.save(filename);
}
