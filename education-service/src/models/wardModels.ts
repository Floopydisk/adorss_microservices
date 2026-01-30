import mongoose, { Schema, Document } from "mongoose";

// ==================== WARD ENROLLMENT REQUEST ====================
/**
 * When a parent requests to enroll their ward (child) at a school
 * This tracks the enrollment application process
 */
export interface IWardEnrollmentRequest extends Document {
  parentUserId: string; // Parent making the request
  schoolId: string;
  academicYear: string;
  requestedClass?: string; // Grade/class level requested
  // Ward (child) information
  ward: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: "male" | "female" | "other";
    previousSchool?: string;
    transferCertificate?: string; // URL to uploaded document
    birthCertificate?: string;
    medicalRecords?: string;
    photo?: string;
  };
  // Contact information
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  // Medical information
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    bloodType?: string;
    medications?: string[];
    specialNeeds?: string;
  };
  // Transport requirements
  transportRequired: boolean;
  transportDetails?: {
    pickupAddress: string;
    pickupCoordinates?: {
      latitude: number;
      longitude: number;
    };
    preferredPickupTime?: string;
  };
  // Application documents
  documents: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
  }[];
  // Application status
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "documents_required"
    | "interview_scheduled"
    | "approved"
    | "rejected"
    | "waitlisted"
    | "enrolled";
  statusHistory: {
    status: string;
    timestamp: Date;
    changedBy?: string;
    notes?: string;
  }[];
  // Review information
  reviewedBy?: string;
  reviewNotes?: string;
  interviewDate?: Date;
  interviewNotes?: string;
  // If approved
  assignedClassId?: string;
  enrolledStudentId?: string;
  enrollmentDate?: Date;
  // Fee information
  applicationFee?: {
    amount: number;
    currency: string;
    paid: boolean;
    paidAt?: Date;
    transactionId?: string;
  };
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WardEnrollmentRequestSchema = new Schema<IWardEnrollmentRequest>(
  {
    parentUserId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    academicYear: { type: String, required: true },
    requestedClass: String,
    ward: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
      previousSchool: String,
      transferCertificate: String,
      birthCertificate: String,
      medicalRecords: String,
      photo: String,
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    medicalInfo: {
      allergies: [String],
      conditions: [String],
      bloodType: String,
      medications: [String],
      specialNeeds: String,
    },
    transportRequired: { type: Boolean, default: false },
    transportDetails: {
      pickupAddress: String,
      pickupCoordinates: {
        latitude: Number,
        longitude: Number,
      },
      preferredPickupTime: String,
    },
    documents: [
      {
        type: { type: String, required: true },
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verifiedBy: String,
        verifiedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "documents_required",
        "interview_scheduled",
        "approved",
        "rejected",
        "waitlisted",
        "enrolled",
      ],
      default: "draft",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changedBy: String,
        notes: String,
      },
    ],
    reviewedBy: String,
    reviewNotes: String,
    interviewDate: Date,
    interviewNotes: String,
    assignedClassId: String,
    enrolledStudentId: String,
    enrollmentDate: Date,
    applicationFee: {
      amount: Number,
      currency: { type: String, default: "NGN" },
      paid: { type: Boolean, default: false },
      paidAt: Date,
      transactionId: String,
    },
    submittedAt: Date,
  },
  { timestamps: true },
);

WardEnrollmentRequestSchema.index({ parentUserId: 1, status: 1 });
WardEnrollmentRequestSchema.index({ schoolId: 1, status: 1, academicYear: 1 });

// ==================== WARD SETTINGS ====================
/**
 * Parent-specific settings for each ward
 */
export interface IWardSettings extends Document {
  parentUserId: string;
  studentId: string;
  // Notification preferences
  notifications: {
    attendance: boolean;
    grades: boolean;
    assignments: boolean;
    announcements: boolean;
    transport: boolean;
    fees: boolean;
    emergencies: boolean;
  };
  // Transport notification preferences
  transportAlerts: {
    busArriving: boolean; // Alert when bus is X minutes away
    busArrivingThreshold: number; // minutes
    pickupConfirmation: boolean;
    dropoffConfirmation: boolean;
    delayAlerts: boolean;
    routeChanges: boolean;
  };
  // Attendance alerts
  attendanceAlerts: {
    markAbsent: boolean;
    markLate: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  // Grade alerts
  gradeAlerts: {
    newGrade: boolean;
    lowGradeThreshold: number; // Alert if grade below this percentage
    resultPublished: boolean;
  };
  // Communication preferences
  preferredContactMethod: "push" | "sms" | "email" | "all";
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // e.g., "22:00"
  quietHoursEnd?: string; // e.g., "07:00"
  createdAt: Date;
  updatedAt: Date;
}

const WardSettingsSchema = new Schema<IWardSettings>(
  {
    parentUserId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    notifications: {
      attendance: { type: Boolean, default: true },
      grades: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      transport: { type: Boolean, default: true },
      fees: { type: Boolean, default: true },
      emergencies: { type: Boolean, default: true },
    },
    transportAlerts: {
      busArriving: { type: Boolean, default: true },
      busArrivingThreshold: { type: Number, default: 10 },
      pickupConfirmation: { type: Boolean, default: true },
      dropoffConfirmation: { type: Boolean, default: true },
      delayAlerts: { type: Boolean, default: true },
      routeChanges: { type: Boolean, default: true },
    },
    attendanceAlerts: {
      markAbsent: { type: Boolean, default: true },
      markLate: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false },
      monthlyReport: { type: Boolean, default: true },
    },
    gradeAlerts: {
      newGrade: { type: Boolean, default: true },
      lowGradeThreshold: { type: Number, default: 50 },
      resultPublished: { type: Boolean, default: true },
    },
    preferredContactMethod: {
      type: String,
      enum: ["push", "sms", "email", "all"],
      default: "push",
    },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: String,
    quietHoursEnd: String,
  },
  { timestamps: true },
);

WardSettingsSchema.index({ parentUserId: 1, studentId: 1 }, { unique: true });

// ==================== PICKUP AUTHORIZATION ====================
/**
 * Temporary or one-time pickup authorization for someone other than registered persons
 */
export interface IPickupAuthorization extends Document {
  studentId: string;
  parentUserId: string; // Parent who created this authorization
  schoolId: string;
  // Authorized person
  authorizedPerson: {
    name: string;
    phone: string;
    relationship: string;
    idNumber?: string;
    photo?: string;
  };
  // Authorization details
  type: "one_time" | "recurring" | "temporary";
  validFrom: Date;
  validUntil: Date;
  specificDates?: Date[]; // For specific date authorizations
  recurringDays?: number[]; // 0=Sunday, 6=Saturday
  // Verification
  verificationCode: string;
  usedAt?: Date;
  verifiedBy?: string;
  // Status
  status: "active" | "used" | "expired" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PickupAuthorizationSchema = new Schema<IPickupAuthorization>(
  {
    studentId: { type: String, required: true, index: true },
    parentUserId: { type: String, required: true },
    schoolId: { type: String, required: true },
    authorizedPerson: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, required: true },
      idNumber: String,
      photo: String,
    },
    type: {
      type: String,
      enum: ["one_time", "recurring", "temporary"],
      default: "one_time",
    },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    specificDates: [Date],
    recurringDays: [Number],
    verificationCode: { type: String, required: true },
    usedAt: Date,
    verifiedBy: String,
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
    },
    notes: String,
  },
  { timestamps: true },
);

PickupAuthorizationSchema.index({ studentId: 1, status: 1 });
PickupAuthorizationSchema.index({ verificationCode: 1 });

// Export models
export const WardEnrollmentRequest = mongoose.model<IWardEnrollmentRequest>(
  "WardEnrollmentRequest",
  WardEnrollmentRequestSchema,
);
export const WardSettings = mongoose.model<IWardSettings>(
  "WardSettings",
  WardSettingsSchema,
);
export const PickupAuthorization = mongoose.model<IPickupAuthorization>(
  "PickupAuthorization",
  PickupAuthorizationSchema,
);
