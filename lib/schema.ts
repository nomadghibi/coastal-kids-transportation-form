import { z } from "zod";

export const formSchema = z.object({
  childName: z.string().min(1, "Child's name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  classroom: z.string().optional(),

  guardianName: z.string().min(1, "Parent/Guardian name is required"),
  primaryPhone: z.string().min(1, "Primary phone is required"),
  secondaryPhone: z.string().optional(),
  email: z.string().optional(),

  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyPhone: z.string().min(1, "Emergency phone is required"),
  emergencyRelationship: z.string().optional(),
  additionalContact1: z.string().optional(),
  additionalPhone1: z.string().optional(),
  additionalContact2: z.string().optional(),
  additionalPhone2: z.string().optional(),

  physicianName: z.string().optional(),
  physicianPhone: z.string().optional(),
  medicalNotes: z.string().optional(),

  signatureDate: z.string().min(1, "Date is required"),
});

export type FormValues = z.infer<typeof formSchema>;

export const defaultValues: FormValues = {
  childName: "",
  dob: "",
  classroom: "",
  guardianName: "",
  primaryPhone: "",
  secondaryPhone: "",
  email: "",
  emergencyContactName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  additionalContact1: "",
  additionalPhone1: "",
  additionalContact2: "",
  additionalPhone2: "",
  physicianName: "",
  physicianPhone: "",
  medicalNotes: "",
  signatureDate: "",
};
