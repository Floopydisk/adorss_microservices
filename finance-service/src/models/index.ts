import mongoose, { Schema, Document } from "mongoose";

// ==================== FEE STRUCTURE ====================
export interface IFeeStructure extends Document {
  schoolId: string;
  name: string;
  description?: string;
  academicYear: string;
  term?: string;
  grade?: string; // If specific to a grade
  classId?: string; // If specific to a class
  feeType:
    | "tuition"
    | "registration"
    | "exam"
    | "transport"
    | "uniform"
    | "books"
    | "activity"
    | "meal"
    | "other";
  amount: number;
  currency: string;
  dueDate?: Date;
  isRecurring: boolean;
  recurringPeriod?: "monthly" | "quarterly" | "termly" | "annually";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    academicYear: { type: String, required: true },
    term: String,
    grade: String,
    classId: String,
    feeType: {
      type: String,
      enum: [
        "tuition",
        "registration",
        "exam",
        "transport",
        "uniform",
        "books",
        "activity",
        "meal",
        "other",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    dueDate: Date,
    isRecurring: { type: Boolean, default: false },
    recurringPeriod: {
      type: String,
      enum: ["monthly", "quarterly", "termly", "annually"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

FeeStructureSchema.index({ schoolId: 1, academicYear: 1, feeType: 1 });

// ==================== STUDENT FEE ====================
export interface IStudentFee extends Document {
  studentId: string;
  studentUserId: string; // Auth service user ID
  schoolId: string;
  feeStructureId: string;
  academicYear: string;
  term?: string;
  feeName: string;
  feeType: string;
  amount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  dueDate?: Date;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  createdAt: Date;
  updatedAt: Date;
}

const StudentFeeSchema = new Schema<IStudentFee>(
  {
    studentId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    feeStructureId: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: String,
    feeName: { type: String, required: true },
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    dueDate: Date,
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue", "waived"],
      default: "pending",
    },
  },
  { timestamps: true },
);

StudentFeeSchema.index({ studentId: 1, academicYear: 1 });
StudentFeeSchema.index({ schoolId: 1, status: 1 });

// ==================== PAYMENT ====================
export interface IPayment extends Document {
  studentFeeId: string;
  studentId: string;
  studentUserId: string;
  parentUserId: string; // Who made the payment
  schoolId: string;
  amount: number;
  currency: string;
  paymentMethod: "cash" | "card" | "bank_transfer" | "mobile_money" | "online";
  transactionRef: string;
  gatewayRef?: string; // Payment gateway reference
  gateway?: string; // e.g., "paystack", "flutterwave"
  status: "pending" | "success" | "failed" | "refunded";
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentFeeId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true },
    parentUserId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "mobile_money", "online"],
      required: true,
    },
    transactionRef: { type: String, required: true, unique: true },
    gatewayRef: String,
    gateway: String,
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

PaymentSchema.index({ parentUserId: 1, status: 1 });
PaymentSchema.index({ transactionRef: 1 });

// ==================== RECEIPT ====================
export interface IReceipt extends Document {
  paymentId: string;
  receiptNumber: string;
  studentId: string;
  studentUserId: string;
  parentUserId: string;
  schoolId: string;
  studentName: string;
  schoolName: string;
  items: {
    description: string;
    amount: number;
  }[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paidAt: Date;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    paymentId: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentUserId: { type: String, required: true },
    parentUserId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    studentName: { type: String, required: true },
    schoolName: { type: String, required: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    paymentMethod: { type: String, required: true },
    paidAt: { type: Date, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

ReceiptSchema.index({ parentUserId: 1 });
ReceiptSchema.index({ receiptNumber: 1 });

// Export models
export const FeeStructure = mongoose.model<IFeeStructure>(
  "FeeStructure",
  FeeStructureSchema,
);
export const StudentFee = mongoose.model<IStudentFee>(
  "StudentFee",
  StudentFeeSchema,
);
export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
export const Receipt = mongoose.model<IReceipt>("Receipt", ReceiptSchema);
