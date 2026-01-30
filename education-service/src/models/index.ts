import mongoose, { Schema, Document } from "mongoose";

// ==================== STUDENT ====================
export interface IStudent extends Document {
  userId: string; // Auth service user ID
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  schoolId: string;
  classId: string;
  enrollmentDate: Date;
  status: "active" | "inactive" | "transferred" | "graduated";
  parentIds: string[]; // Auth service user IDs of parents
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    bloodType?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    schoolId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "inactive", "transferred", "graduated"],
      default: "active",
    },
    parentIds: [{ type: String, index: true }],
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    medicalInfo: {
      allergies: [String],
      conditions: [String],
      bloodType: String,
    },
  },
  { timestamps: true },
);

// ==================== PARENT-STUDENT LINK ====================
export interface IParentStudentLink extends Document {
  parentUserId: string; // Auth service user ID
  studentId: string; // Student document ID
  relationship: "father" | "mother" | "guardian" | "other";
  isPrimary: boolean; // Primary contact
  canPickup: boolean; // Authorized for pickup
  permissions: {
    viewGrades: boolean;
    viewAttendance: boolean;
    viewAssignments: boolean;
    communicateWithTeachers: boolean;
    payFees: boolean;
    trackLocation: boolean;
  };
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParentStudentLinkSchema = new Schema<IParentStudentLink>(
  {
    parentUserId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      required: true,
    },
    isPrimary: { type: Boolean, default: false },
    canPickup: { type: Boolean, default: true },
    permissions: {
      viewGrades: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewAssignments: { type: Boolean, default: true },
      communicateWithTeachers: { type: Boolean, default: true },
      payFees: { type: Boolean, default: true },
      trackLocation: { type: Boolean, default: true },
    },
    verifiedAt: Date,
  },
  { timestamps: true },
);

ParentStudentLinkSchema.index(
  { parentUserId: 1, studentId: 1 },
  { unique: true },
);

// ==================== CLASS ====================
export interface IClass extends Document {
  name: string;
  grade: string;
  section?: string;
  schoolId: string;
  teacherId: string; // Class teacher
  academicYear: string;
  studentCount: number;
  capacity: number;
  subjects: string[];
  schedule?: {
    startTime: string;
    endTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    grade: { type: String, required: true },
    section: String,
    schoolId: { type: String, required: true, index: true },
    teacherId: { type: String, required: true },
    academicYear: { type: String, required: true },
    studentCount: { type: Number, default: 0 },
    capacity: { type: Number, default: 40 },
    subjects: [String],
    schedule: {
      startTime: String,
      endTime: String,
    },
  },
  { timestamps: true },
);

// ==================== ASSIGNMENT ====================
export interface IAssignment extends Document {
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dueDate: Date;
  totalMarks: number;
  attachments?: string[];
  status: "draft" | "published" | "closed";
  submissions: {
    studentId: string;
    submittedAt: Date;
    attachments?: string[];
    grade?: number;
    feedback?: string;
    gradedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    classId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true },
    teacherId: { type: String, required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    attachments: [String],
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    submissions: [
      {
        studentId: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
        attachments: [String],
        grade: Number,
        feedback: String,
        gradedAt: Date,
      },
    ],
  },
  { timestamps: true },
);

// ==================== GRADE ====================
export interface IGrade extends Document {
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  academicYear: string;
  term: string;
  assessments: {
    name: string;
    type: "quiz" | "test" | "exam" | "assignment" | "project" | "participation";
    maxScore: number;
    score: number;
    weight: number;
    date: Date;
    comments?: string;
  }[];
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  letterGrade?: string;
  teacherComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true },
    teacherId: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: String, required: true },
    assessments: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "quiz",
            "test",
            "exam",
            "assignment",
            "project",
            "participation",
          ],
          required: true,
        },
        maxScore: { type: Number, required: true },
        score: { type: Number, required: true },
        weight: { type: Number, default: 1 },
        date: { type: Date, default: Date.now },
        comments: String,
      },
    ],
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    letterGrade: String,
    teacherComments: String,
  },
  { timestamps: true },
);

GradeSchema.index({ studentId: 1, subjectId: 1, academicYear: 1, term: 1 });

// ==================== ATTENDANCE ====================
export interface IAttendance extends Document {
  studentId: string;
  classId: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  markedBy: string; // Teacher ID
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  parentNotified: boolean;
  parentNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    markedBy: { type: String, required: true },
    checkInTime: Date,
    checkOutTime: Date,
    notes: String,
    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: Date,
  },
  { timestamps: true },
);

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// ==================== TIMETABLE ====================
export interface ITimetable extends Document {
  classId: string;
  schoolId: string;
  academicYear: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  schedule: {
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    periods: {
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId: string;
      subjectName: string;
      teacherId: string;
      teacherName: string;
      room?: string;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetable>(
  {
    classId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    academicYear: { type: String, required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    schedule: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
          required: true,
        },
        periods: [
          {
            periodNumber: { type: Number, required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            subjectId: { type: String, required: true },
            subjectName: { type: String, required: true },
            teacherId: { type: String, required: true },
            teacherName: { type: String, required: true },
            room: String,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

// ==================== RESULT (Term/Exam Results) ====================
export interface IResult extends Document {
  studentId: string;
  classId: string;
  academicYear: string;
  term: string;
  examType: "midterm" | "final" | "annual";
  subjects: {
    subjectId: string;
    subjectName: string;
    maxScore: number;
    score: number;
    grade: string;
    teacherRemarks?: string;
  }[];
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  overallGrade: string;
  rank?: number;
  totalStudents?: number;
  principalRemarks?: string;
  classTeacherRemarks?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    studentId: { type: String, required: true, index: true },
    classId: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: String, required: true },
    examType: {
      type: String,
      enum: ["midterm", "final", "annual"],
      required: true,
    },
    subjects: [
      {
        subjectId: { type: String, required: true },
        subjectName: { type: String, required: true },
        maxScore: { type: Number, required: true },
        score: { type: Number, required: true },
        grade: { type: String, required: true },
        teacherRemarks: String,
      },
    ],
    totalScore: { type: Number, required: true },
    maxTotalScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    overallGrade: { type: String, required: true },
    rank: Number,
    totalStudents: Number,
    principalRemarks: String,
    classTeacherRemarks: String,
    publishedAt: Date,
  },
  { timestamps: true },
);

ResultSchema.index({ studentId: 1, academicYear: 1, term: 1, examType: 1 });

// ==================== ANNOUNCEMENT ====================
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: "general" | "urgent" | "event" | "holiday" | "exam";
  schoolId: string;
  targetAudience: ("all" | "teachers" | "students" | "parents")[];
  targetClasses?: string[]; // Specific classes, empty = all
  authorId: string;
  authorName: string;
  attachments?: string[];
  publishAt: Date;
  expiresAt?: Date;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "urgent", "event", "holiday", "exam"],
      default: "general",
    },
    schoolId: { type: String, required: true, index: true },
    targetAudience: [
      { type: String, enum: ["all", "teachers", "students", "parents"] },
    ],
    targetClasses: [String],
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    attachments: [String],
    publishAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ==================== SCHOOL ====================
export interface ISchool extends Document {
  name: string;
  code: string; // Unique school code
  type: "primary" | "secondary" | "high_school" | "international";
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  principal?: string;
  logo?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["primary", "secondary", "high_school", "international"],
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: String,
    },
    principal: String,
    logo: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

// Export models
export const School = mongoose.model<ISchool>("School", SchoolSchema);
export const Student = mongoose.model<IStudent>("Student", StudentSchema);
export const ParentStudentLink = mongoose.model<IParentStudentLink>(
  "ParentStudentLink",
  ParentStudentLinkSchema,
);
export const Class = mongoose.model<IClass>("Class", ClassSchema);
export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  AssignmentSchema,
);
export const Grade = mongoose.model<IGrade>("Grade", GradeSchema);
export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  AttendanceSchema,
);
export const Timetable = mongoose.model<ITimetable>(
  "Timetable",
  TimetableSchema,
);
export const Result = mongoose.model<IResult>("Result", ResultSchema);
export const Announcement = mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema,
);

// Re-export transport models
export {
  TransportRoute,
  StudentTransport,
  TransportSchedule,
  TransportLog,
  Vehicle,
  ITransportRoute,
  IStudentTransport,
  ITransportSchedule,
  ITransportLog,
  IVehicle,
} from "./transportModels";

// Re-export ward models
export {
  WardEnrollmentRequest,
  WardSettings,
  PickupAuthorization,
  IWardEnrollmentRequest,
  IWardSettings,
  IPickupAuthorization,
} from "./wardModels";
