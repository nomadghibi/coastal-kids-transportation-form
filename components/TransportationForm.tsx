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

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-end gap-1 mb-1">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs whitespace-nowrap shrink-0 leading-4">
      {children}
    </span>
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

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
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
    } catch {
      // ignore
    }
  }, [reset]);

  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));
      alert("Draft saved locally.");
    } catch {
      // ignore
    }
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
    () => {
      alert("Please fill in all required fields before downloading.");
    }
  );

  const hasErr = (field: keyof FormValues) => !!errors[field];

  const btnBase = "px-4 py-2 text-sm rounded";

  return (
    <div>
      {/* ── Buttons top ──────────────────────────────────────────── */}
      <div className="no-print flex flex-wrap gap-2 justify-center mb-3">
        <button type="button" onClick={saveDraft} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Save Draft</button>
        <button type="button" onClick={() => handleDownloadPDF()} className={`${btnBase} bg-black text-white hover:bg-gray-800`}>Download PDF</button>
        <button type="button" onClick={() => window.print()} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Print</button>
        <button type="button" onClick={clearForm} className={`${btnBase} border border-red-400 text-red-600 bg-white hover:bg-red-50`}>Clear Form</button>
      </div>

      <p className="no-print text-center text-xs text-gray-500 mb-3">
        This form is processed locally in your browser. No information is stored on a server.
      </p>

      {/* ── Paper form (letter size) ──────────────────────────────── */}
      {/* Scale wrapper keeps document proportions on small screens */}
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
        {/* TITLE */}
        <div className="text-center font-bold text-sm mb-1 border border-black py-1" style={{ letterSpacing: "0.02em" }}>
          Transportation Agreement / Field Trip Permission
        </div>

        {/* TAGLINE */}
        <p className="text-center font-bold italic text-xs mb-1">
          &ldquo;At Coastal Kids, Safety Comes Before We Have Fun!!&rdquo;
        </p>

        {/* INTRO */}
        <p className="text-xs mb-2 leading-snug">
          To ensure the safety and well-being of children during transportation, Coastal Kids Academy requires all parents/guardians to review and acknowledge the following transportation policies and procedures.
        </p>

        <hr className="border-t border-black mb-2" />

        {/* ── CHILD INFORMATION ─────────────────────────────────── */}
        <section className="mb-2">
          <span className="section-heading">Child Information</span>
          <FieldRow>
            <Label>Child&apos;s Name:</Label>
            <LineInput type="text" {...register("childName")} aria-label="Child's Name" />
          </FieldRow>
          {hasErr("childName") && <p className="error-msg -mt-0.5 mb-1">{errors.childName?.message}</p>}
          <div className="flex gap-3">
            <FieldRow>
              <Label>DOB:</Label>
              <LineInput type="text" grow={false} width="130px" {...register("dob")} aria-label="Date of Birth" placeholder="MM/DD/YYYY" />
            </FieldRow>
            {hasErr("dob") && <p className="error-msg">{errors.dob?.message}</p>}
            <FieldRow>
              <Label>Classroom:</Label>
              <LineInput type="text" grow={false} width="160px" {...register("classroom")} aria-label="Classroom" />
            </FieldRow>
          </div>
        </section>

        <hr className="border-t border-black mb-2" />

        {/* ── PARENT / GUARDIAN ─────────────────────────────────── */}
        <section className="mb-2">
          <span className="section-heading">Parent/Guardian Information</span>
          <FieldRow>
            <Label>Parent/Guardian Name:</Label>
            <LineInput type="text" {...register("guardianName")} aria-label="Parent/Guardian Name" />
          </FieldRow>
          {hasErr("guardianName") && <p className="error-msg -mt-0.5 mb-1">{errors.guardianName?.message}</p>}
          <div className="flex gap-3">
            <FieldRow>
              <Label>Primary Phone:</Label>
              <LineInput type="tel" grow={false} width="150px" {...register("primaryPhone")} aria-label="Primary Phone" />
            </FieldRow>
            {hasErr("primaryPhone") && <p className="error-msg">{errors.primaryPhone?.message}</p>}
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

        {/* ── EMERGENCY CONTACT ─────────────────────────────────── */}
        <section className="mb-2">
          <span className="section-heading">Emergency Contact Information</span>
          <FieldRow>
            <Label>Emergency Contact Name:</Label>
            <LineInput type="text" {...register("emergencyContactName")} aria-label="Emergency Contact Name" />
          </FieldRow>
          {hasErr("emergencyContactName") && <p className="error-msg -mt-0.5 mb-1">{errors.emergencyContactName?.message}</p>}
          <div className="flex gap-3">
            <FieldRow>
              <Label>Phone:</Label>
              <LineInput type="tel" grow={false} width="150px" {...register("emergencyPhone")} aria-label="Emergency Phone" />
            </FieldRow>
            {hasErr("emergencyPhone") && <p className="error-msg">{errors.emergencyPhone?.message}</p>}
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

        {/* ── MEDICAL INFORMATION ───────────────────────────────── */}
        <section className="mb-2">
          <span className="section-heading">Medical Information</span>
          <p className="text-xs mb-1 leading-snug">
            Please list any allergies, medical conditions, medications, dietary restrictions, or special instructions:
          </p>
          <div className="flex gap-3 mb-1">
            <FieldRow>
              <Label>Physician Name:</Label>
              <LineInput type="text" grow={false} width="180px" {...register("physicianName")} aria-label="Physician Name" />
            </FieldRow>
            <FieldRow>
              <Label>Phone:</Label>
              <LineInput type="tel" grow={false} width="150px" {...register("physicianPhone")} aria-label="Physician Phone" />
            </FieldRow>
          </div>
          <textarea
            {...register("medicalNotes")}
            aria-label="Medical Notes"
            rows={3}
            className="form-line-textarea"
            style={{
              background: "repeating-linear-gradient(transparent, transparent 21px, #000 21px, #000 22px)",
              lineHeight: "22px",
              paddingTop: "3px",
            }}
          />
        </section>

        <hr className="border-t border-black mb-2" />

        {/* ── TRANSPORTATION AGREEMENT ──────────────────────────── */}
        <section className="mb-2">
          <span className="section-heading">Transportation Agreement</span>
          <div className="text-xs leading-snug space-y-1">
            <p>
              I authorize Coastal Kids Academy to transport my child for field trips, school transportation, emergency relocation, walking trips, community outings, and approved center activities.
            </p>
            <p>
              I understand Coastal Kids Academy will take reasonable precautions to provide a safe and supervised environment during transportation and off-site activities. I acknowledge that participation may involve normal risks associated with travel and children&apos;s activities.
            </p>
            <p>
              I agree to not hold Coastal Kids Academy, its owners, employees, and agents responsible for injuries, accidents, or lost personal belongings resulting from participation in approved activities, except in cases of gross negligence or willful misconduct.
            </p>
          </div>
        </section>

        <hr className="border-t border-black mb-2" />

        {/* ── SIGNATURE ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <p className="text-xs mb-1">Parent/Guardian Signature:</p>
              <SignatureField ref={sigRef} />
              <div className="border-t border-black mt-1" />
            </div>
            <div>
              <FieldRow>
                <Label>Date:</Label>
                <LineInput type="text" grow={false} width="140px" {...register("signatureDate")} aria-label="Signature Date" placeholder="MM/DD/YYYY" />
              </FieldRow>
              {hasErr("signatureDate") && <p className="error-msg">{errors.signatureDate?.message}</p>}
            </div>
          </div>
        </section>
      </form>
      </div>

      {/* ── Buttons bottom ───────────────────────────────────────── */}
      <div className="no-print flex flex-wrap gap-2 justify-center mt-4 mb-8">
        <button type="button" onClick={saveDraft} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Save Draft</button>
        <button type="button" onClick={() => handleDownloadPDF()} className={`${btnBase} bg-black text-white hover:bg-gray-800`}>Download PDF</button>
        <button type="button" onClick={() => window.print()} className={`${btnBase} border border-gray-600 bg-white hover:bg-gray-50`}>Print</button>
        <button type="button" onClick={clearForm} className={`${btnBase} border border-red-400 text-red-600 bg-white hover:bg-red-50`}>Clear Form</button>
      </div>

      <p className="no-print text-center text-xs text-gray-500 mb-6">
        This form is processed locally in your browser. No information is stored on a server.
      </p>
    </div>
  );
}
