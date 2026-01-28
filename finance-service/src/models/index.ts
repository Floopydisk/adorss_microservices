import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;

// Type exports for controllers (re-export from Prisma)
export type FeeStructure = typeof prisma.feeStructure;
export type StudentFee = typeof prisma.studentFee;
export type Payment = typeof prisma.payment;
export type Receipt = typeof prisma.receipt;
