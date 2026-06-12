"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, defaultValues, type FormValues } from "@/lib/schema";
import SignatureField, {
  type SignatureFieldHandle,
} from "@/components/SignatureField";
import { generatePDF } from "@/lib/generatePDF";

const DRAFT_KEY = "coastal-kids-transport-draft";

// ─── Desktop paper-form helpers ──────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-end gap-1 mb-1">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs whitespace-nowrap shrink-0 leading-4">{children}</span>
  );
}

interface LineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  grow?: boolean;
  width?: string;
}
function LineInput({ grow = true, width, className = "", ...props }: LineInputProps) {
  return (
    <input
      {...props}
      className={`form-line-input ${grow ? "flex-1" : ""} ${className}`}
      style={width ? { width } : undefined}
    />
  );
}

// ─── Mobile helpers ───────────────────────────────────────────────────────────

function MField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function MInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
    />
  );
}

function MSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-bold text-sm underline underline-offset-2 mb-3">{title}</h2>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransportationForm() {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const sigRef = useRef<SignatureFieldHandle | null>(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      setIsMobile(vw < 640);
      setScale(Math.min(1, (vw - 16) / 816));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormValues>;
        reset({ ...defaultValues, ...saved });
      }
    } catch { /* ignore */ }
  }, [reset]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));
      alert("Draft saved locally.");
    } catch { /* ignore */ }
  }, [getValues]);

  const clearForm = useCallback(() => {
    if (!confirm("Clear all form data?")) return;
    localStorage.removeItem(DRAFT_KEY);
    reset(defaultValues);
    sigRef.current?.clear();
  }, [reset]);

  const handleDownloadPDF = handleSubmit(
    (data) => {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        alert("Please add your signature before downloading.");
        return;
      }
      generatePDF(data, sigRef.current.toDataURL());
    },
    () => { alert("Please fill in all required fields before downloading."); }
  );

  const hasErr = (field: keyof FormValues) => !!errors[field];
  const errMsg = (field: keyof FormValues) => errors[field]?.message as string | undefined;

  const btnBase = "px-4 py-2 text-sm rounded";

  const actionButtons = (
    <div className="no-print flex flex-wrap gap-2 justify-center">
      <button type="button" onClick={saveDraft} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Save Draft</button>
      <button type="button" onClick={() => handleDownloadPDF()} className={`${btnBase} bg-black text-white hover:bg-gray-800`}>Download PDF</button>
      <button type="button" onClick={() => window.print()} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Print</button>
      <button type="button" onClick={clearForm} className={`${btnBase} border border-red-400 text-red-600 bg-white hover:bg-red-50`}>Clear Form</button>
    </div>
  );

  const privacyNote = (
    <p className="no-print text-center text-xs text-gray-500">
      This form is processed locally in your browser. No information is stored on a server.
    </p>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="max-w-lg mx-auto px-3 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="border border-black bg-white px-3 py-2 mb-2">
            <p className="font-bold text-sm">Transportation Agreement / Field Trip Permission</p>
          </div>
          <p className="font-bold italic text-xs text-gray-700">
            &ldquo;At Coastal Kids, Safety Comes Before We Have Fun!!&rdquo;
          </p>
          <p className="text-xs text-gray-600 mt-1 leading-snug">
            To ensure the safety and well-being of children during transportation, Coastal Kids Academy requires all parents/guardians to review and acknowledge the following transportation policies and procedures.
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>

          {/* Child Information */}
          <MSection title="Child Information">
            <MField label="Child's Name" required error={errMsg("childName")}>
              <MInput type="text" {...register("childName")} placeholder="Full name" />
            </MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Date of Birth" required error={errMsg("dob")}>
                <MInput type="text" {...register("dob")} placeholder="MM/DD/YYYY" />
              </MField>
              <MField label="Classroom">
                <MInput type="text" {...register("classroom")} placeholder="Room" />
              </MField>
            </div>
          </MSection>

          {/* Parent / Guardian */}
          <MSection title="Parent/Guardian Information">
            <MField label="Parent/Guardian Name" required error={errMsg("guardianName")}>
              <MInput type="text" {...register("guardianName")} placeholder="Full name" />
            </MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Primary Phone" required error={errMsg("primaryPhone")}>
                <MInput type="tel" {...register("primaryPhone")} placeholder="(000) 000-0000" />
              </MField>
              <MField label="Secondary Phone">
                <MInput type="tel" {...register("secondaryPhone")} placeholder="(000) 000-0000" />
              </MField>
            </div>
            <MField label="Email">
              <MInput type="email" {...register("email")} placeholder="email@example.com" />
            </MField>
          </MSection>

          {/* Emergency Contact */}
          <MSection title="Emergency Contact Information">
            <MField label="Emergency Contact Name" required error={errMsg("emergencyContactName")}>
              <MInput type="text" {...register("emergencyContactName")} placeholder="Full name" />
            </MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Phone" required error={errMsg("emergencyPhone")}>
                <MInput type="tel" {...register("emergencyPhone")} placeholder="(000) 000-0000" />
              </MField>
              <MField label="Relationship">
                <MInput type="text" {...register("emergencyRelationship")} placeholder="e.g. Aunt" />
              </MField>
            </div>
            <MField label="Additional Emergency Contact">
              <MInput type="text" {...register("additionalContact1")} placeholder="Full name" />
            </MField>
            <MField label="Phone">
              <MInput type="tel" {...register("additionalPhone1")} placeholder="(000) 000-0000" />
            </MField>
            <MField label="Additional Emergency Contact">
              <MInput type="text" {...register("additionalContact2")} placeholder="Full name" />
            </MField>
            <MField label="Phone">
              <MInput type="tel" {...register("additionalPhone2")} placeholder="(000) 000-0000" />
            </MField>
          </MSection>

          {/* Medical Information */}
          <MSection title="Medical Information">
            <p className="text-xs text-gray-600 mb-2">
              Please list any allergies, medical conditions, medications, dietary restrictions, or special instructions:
            </p>
            <MField label="Medical Notes">
              <textarea
                {...register("medicalNotes")}
                rows={4}
                placeholder="Allergies, conditions, medications, dietary restrictions..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
              />
            </MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Physician Name">
                <MInput type="text" {...register("physicianName")} placeholder="Dr. Name" />
              </MField>
              <MField label="Physician Phone">
                <MInput type="tel" {...register("physicianPhone")} placeholder="(000) 000-0000" />
              </MField>
            </div>
          </MSection>

          {/* Transportation Agreement */}
          <MSection title="Transportation Agreement">
            <div className="text-xs text-gray-700 leading-relaxed space-y-2 bg-gray-50 rounded p-3 mb-1">
              <p>I authorize Coastal Kids Academy to transport my child for field trips, school transportation, emergency relocation, walking trips, community outings, and approved center activities.</p>
              <p>I understand Coastal Kids Academy will take reasonable precautions to provide a safe and supervised environment during transportation and off-site activities. I acknowledge that participation may involve normal risks associated with travel and children&apos;s activities.</p>
              <p>I agree to not hold Coastal Kids Academy, its owners, employees, and agents responsible for injuries, accidents, or lost personal belongings resulting from participation in approved activities, except in cases of gross negligence or willful misconduct.</p>
            </div>
          </MSection>

          {/* Signature */}
          <div className="mb-5 bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-bold text-sm underline underline-offset-2 mb-3">Signature</h2>
            <MField label="Date" required error={errMsg("signatureDate")}>
              <MInput type="text" {...register("signatureDate")} placeholder="MM/DD/YYYY" />
            </MField>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Parent/Guardian Signature <span className="text-red-500">*</span>
            </p>
            <SignatureField ref={sigRef} />
            <p className="text-gray-500 italic mt-2" style={{ fontSize: "10px", lineHeight: "1.3" }}>
              This digital signature is legally binding and equivalent to a handwritten signature under the E-SIGN Act and UETA.
            </p>
          </div>

        </form>

        <div className="mb-3">{actionButtons}</div>
        {privacyNote}
      </div>
    );
  }

  // ── DESKTOP / TABLET PAPER LAYOUT ─────────────────────────────────────────
  return (
    <div>
      <div className="no-print mb-3">{actionButtons}</div>
      <div className="no-print mb-3">{privacyNote}</div>

      {/* Scale wrapper */}
      <div
        className="mx-auto no-print-scale-wrapper"
        style={{
          width: `${816 * scale}px`,
          height: scale < 1 ? `${1056 * scale}px` : undefined,
          overflow: "visible",
        }}
      >
        <form
          onSubmit={(e) => e.preventDefault()}
          className="print-page bg-white"
          style={{
            width: "816px",
            minHeight: "1056px",
            padding: "28px 48px 24px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
            transformOrigin: "top left",
            transform: scale < 1 ? `scale(${scale})` : undefined,
          }}
        >
          <div className="text-center font-bold text-sm mb-1 border border-black py-1" style={{ letterSpacing: "0.02em" }}>
            Transportation Agreement / Field Trip Permission
          </div>
          <p className="text-center font-bold italic text-xs mb-1">
            &ldquo;At Coastal Kids, Safety Comes Before We Have Fun!!&rdquo;
          </p>
          <p className="text-xs mb-2 leading-snug">
            To ensure the safety and well-being of children during transportation, Coastal Kids Academy requires all parents/guardians to review and acknowledge the following transportation policies and procedures.
          </p>
          <hr className="border-t border-black mb-2" />

          {/* Child Information */}
          <section className="mb-2">
            <span className="section-heading">Child Information</span>
            <FieldRow>
              <Label>Child&apos;s Name:</Label>
              <LineInput type="text" {...register("childName")} aria-label="Child's Name" />
            </FieldRow>
            {hasErr("childName") && <p className="error-msg -mt-0.5 mb-1">{errMsg("childName")}</p>}
            <div className="flex gap-3">
              <FieldRow>
                <Label>DOB:</Label>
                <LineInput type="text" grow={false} width="130px" {...register("dob")} aria-label="Date of Birth" placeholder="MM/DD/YYYY" />
              </FieldRow>
              {hasErr("dob") && <p className="error-msg">{errMsg("dob")}</p>}
              <FieldRow>
                <Label>Classroom:</Label>
                <LineInput type="text" grow={false} width="160px" {...register("classroom")} aria-label="Classroom" />
              </FieldRow>
            </div>
          </section>
          <hr className="border-t border-black mb-2" />

          {/* Parent / Guardian */}
          <section className="mb-2">
            <span className="section-heading">Parent/Guardian Information</span>
            <FieldRow>
              <Label>Parent/Guardian Name:</Label>
              <LineInput type="text" {...register("guardianName")} aria-label="Parent/Guardian Name" />
            </FieldRow>
            {hasErr("guardianName") && <p className="error-msg -mt-0.5 mb-1">{errMsg("guardianName")}</p>}
            <div className="flex gap-3">
              <FieldRow>
                <Label>Primary Phone:</Label>
                <LineInput type="tel" grow={false} width="150px" {...register("primaryPhone")} aria-label="Primary Phone" />
              </FieldRow>
              {hasErr("primaryPhone") && <p className="error-msg">{errMsg("primaryPhone")}</p>}
              <FieldRow>
                <Label>Secondary Phone:</Label>
                <LineInput type="tel" grow={false} width="150px" {...register("secondaryPhone")} aria-label="Secondary Phone" />
              </FieldRow>
            </div>
            <FieldRow>
              <Label>Email:</Label>
              <LineInput type="email" {...register("email")} aria-label="Email" />
            </FieldRow>
          </section>
          <hr className="border-t border-black mb-2" />

          {/* Emergency Contact */}
          <section className="mb-2">
            <span className="section-heading">Emergency Contact Information</span>
            <FieldRow>
              <Label>Emergency Contact Name:</Label>
              <LineInput type="text" {...register("emergencyContactName")} aria-label="Emergency Contact Name" />
            </FieldRow>
            {hasErr("emergencyContactName") && <p className="error-msg -mt-0.5 mb-1">{errMsg("emergencyContactName")}</p>}
            <div className="flex gap-3">
              <FieldRow>
                <Label>Phone:</Label>
                <LineInput type="tel" grow={false} width="150px" {...register("emergencyPhone")} aria-label="Emergency Phone" />
              </FieldRow>
              {hasErr("emergencyPhone") && <p className="error-msg">{errMsg("emergencyPhone")}</p>}
              <FieldRow>
                <Label>Relationship:</Label>
                <LineInput type="text" grow={false} width="160px" {...register("emergencyRelationship")} aria-label="Relationship" />
              </FieldRow>
            </div>
            <FieldRow>
              <Label>Additional Emergency Contact:</Label>
              <LineInput type="text" {...register("additionalContact1")} aria-label="Additional Emergency Contact 1" />
            </FieldRow>
            <FieldRow>
              <Label>Phone:</Label>
              <LineInput type="tel" grow={false} width="200px" {...register("additionalPhone1")} aria-label="Additional Phone 1" />
            </FieldRow>
            <FieldRow>
              <Label>Additional Emergency Contact:</Label>
              <LineInput type="text" {...register("additionalContact2")} aria-label="Additional Emergency Contact 2" />
            </FieldRow>
            <FieldRow>
              <Label>Phone:</Label>
              <LineInput type="tel" grow={false} width="200px" {...register("additionalPhone2")} aria-label="Additional Phone 2" />
            </FieldRow>
          </section>
          <hr className="border-t border-black mb-2" />

          {/* Medical Information */}
          <section className="mb-2">
            <span className="section-heading">Medical Information</span>
            <p className="text-xs mb-1 leading-snug">
              Please list any allergies, medical conditions, medications, dietary restrictions, or special instructions:
            </p>
            <textarea
              {...register("medicalNotes")}
              aria-label="Medical Notes"
              rows={3}
              className="form-line-textarea mb-1"
              style={{
                background: "repeating-linear-gradient(transparent, transparent 21px, #000 21px, #000 22px)",
                lineHeight: "22px",
                paddingTop: "3px",
              }}
            />
            <div className="flex gap-3">
              <FieldRow>
                <Label>Physician Name:</Label>
                <LineInput type="text" grow={false} width="180px" {...register("physicianName")} aria-label="Physician Name" />
              </FieldRow>
              <FieldRow>
                <Label>Phone:</Label>
                <LineInput type="tel" grow={false} width="150px" {...register("physicianPhone")} aria-label="Physician Phone" />
              </FieldRow>
            </div>
          </section>
          <hr className="border-t border-black mb-2" />

          {/* Transportation Agreement */}
          <section className="mb-2">
            <span className="section-heading">Transportation Agreement</span>
            <div className="text-xs leading-snug space-y-1">
              <p>I authorize Coastal Kids Academy to transport my child for field trips, school transportation, emergency relocation, walking trips, community outings, and approved center activities.</p>
              <p>I understand Coastal Kids Academy will take reasonable precautions to provide a safe and supervised environment during transportation and off-site activities. I acknowledge that participation may involve normal risks associated with travel and children&apos;s activities.</p>
              <p>I agree to not hold Coastal Kids Academy, its owners, employees, and agents responsible for injuries, accidents, or lost personal belongings resulting from participation in approved activities, except in cases of gross negligence or willful misconduct.</p>
            </div>
          </section>
          <hr className="border-t border-black mb-2" />

          {/* Signature */}
          <section>
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <p className="text-xs mb-1">Parent/Guardian Signature:</p>
                <SignatureField ref={sigRef} />
                <div className="flex flex-wrap items-start gap-3 mt-1">
                  <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs text-gray-500 underline cursor-pointer shrink-0">Clear signature</button>
                  <p className="text-gray-500 italic" style={{ fontSize: "10px", lineHeight: "1.3" }}>
                    This digital signature is legally binding and equivalent to a handwritten signature under the E-SIGN Act and UETA.
                  </p>
                </div>
                <div className="border-t border-black mt-1" />
              </div>
              <div>
                <FieldRow>
                  <Label>Date:</Label>
                  <LineInput type="text" grow={false} width="140px" {...register("signatureDate")} aria-label="Signature Date" placeholder="MM/DD/YYYY" />
                </FieldRow>
                {hasErr("signatureDate") && <p className="error-msg">{errMsg("signatureDate")}</p>}
              </div>
            </div>
          </section>
        </form>
      </div>

      <div className="no-print mt-4 mb-3">{actionButtons}</div>
      <div className="no-print mb-6">{privacyNote}</div>
    </div>
  );
}
