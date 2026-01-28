import { Response } from "express";
import axios from "axios";
import prisma from "../models";
import {
  AuthRequest,
  SchoolFeeSummary,
  ChildFeeSummary,
  FeeItem,
} from "../types";

const EDUCATION_SERVICE_URL =
  process.env.EDUCATION_SERVICE_URL || "http://localhost:8001";

/**
 * ParentFeesController - Handles fee-related endpoints for parents
 */
class ParentFeesController {
  /**
   * GET /parent/fees
   * Get all fees for parent's children grouped by school
   */
  async getFeesGroupedBySchool(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { academicYear, status } = req.query;

      // Get children from education service
      const children = await this.getParentChildren(
        parentUserId,
        req.headers.authorization,
      );

      if (!children || children.length === 0) {
        res.json({
          success: true,
          data: [],
          message: "No children linked to this account",
        });
        return;
      }

      // Group children by school
      const schoolMap = new Map<
        string,
        { schoolId: string; schoolName: string; children: typeof children }
      >();

      for (const child of children) {
        if (!schoolMap.has(child.schoolId)) {
          schoolMap.set(child.schoolId, {
            schoolId: child.schoolId,
            schoolName: child.schoolName || "Unknown School",
            children: [],
          });
        }
        schoolMap.get(child.schoolId)!.children.push(child);
      }

      // Get fees for each school
      const schoolFeeSummaries: SchoolFeeSummary[] = [];

      for (const [schoolId, schoolData] of schoolMap) {
        const studentIds = schoolData.children.map((c) => c.id);

        // Build filter
        const where: Record<string, unknown> = {
          studentId: { in: studentIds },
          schoolId,
        };

        if (academicYear) {
          where.academicYear = academicYear;
        }
        if (status) {
          where.status = status;
        }

        const fees = await prisma.studentFee.findMany({ where });

        // Calculate school totals
        let schoolTotalFees = 0;
        let schoolTotalPaid = 0;
        let schoolTotalBalance = 0;

        const childSummaries: ChildFeeSummary[] = schoolData.children.map(
          (child) => {
            const childFees = fees.filter(
              (f) => f.studentId === child.id.toString(),
            );

            const totalFees = childFees.reduce(
              (sum, f) => sum + Number(f.totalAmount),
              0,
            );
            const totalPaid = childFees.reduce(
              (sum, f) => sum + Number(f.paidAmount),
              0,
            );
            const balance = childFees.reduce(
              (sum, f) => sum + Number(f.balance),
              0,
            );
            const pendingItems = childFees.filter(
              (f) => f.status === "pending",
            ).length;
            const overdueItems = childFees.filter(
              (f) => f.status === "overdue",
            ).length;

            schoolTotalFees += totalFees;
            schoolTotalPaid += totalPaid;
            schoolTotalBalance += balance;

            return {
              studentId: child.id.toString(),
              studentName: child.fullName,
              className: child.className,
              totalFees,
              totalPaid,
              balance,
              pendingItems,
              overdueItems,
            };
          },
        );

        schoolFeeSummaries.push({
          schoolId,
          schoolName: schoolData.schoolName,
          totalFees: schoolTotalFees,
          totalPaid: schoolTotalPaid,
          totalBalance: schoolTotalBalance,
          currency: "NGN",
          children: childSummaries,
        });
      }

      res.json({
        success: true,
        data: schoolFeeSummaries,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch fees",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/fees/:studentId
   * Get detailed fees for a specific child
   */
  async getChildFees(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { academicYear, term, status, page = 1, limit = 20 } = req.query;

      // Verify parent has access to this student
      const children = await this.getParentChildren(
        parentUserId,
        req.headers.authorization,
      );
      const child = children?.find((c) => c.id.toString() === studentId);

      if (!child) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this student's fees",
        });
        return;
      }

      // Build filter
      const where: Record<string, unknown> = { studentId };
      if (academicYear) where.academicYear = academicYear;
      if (term) where.term = term;
      if (status) where.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [fees, total] = await Promise.all([
        prisma.studentFee.findMany({
          where,
          orderBy: { dueDate: "asc" },
          skip,
          take: Number(limit),
        }),
        prisma.studentFee.count({ where }),
      ]);

      const feeItems: FeeItem[] = fees.map((fee) => ({
        id: fee.id,
        feeName: fee.feeName,
        feeType: fee.feeType,
        amount: Number(fee.amount),
        discount: Number(fee.discount),
        totalAmount: Number(fee.totalAmount),
        paidAmount: Number(fee.paidAmount),
        balance: Number(fee.balance),
        dueDate: fee.dueDate,
        status: fee.status,
        academicYear: fee.academicYear,
        term: fee.term,
      }));

      // Calculate summary
      const allFees = await prisma.studentFee.findMany({ where: { studentId } });
      const summary = {
        totalFees: allFees.reduce((sum, f) => sum + Number(f.totalAmount), 0),
        totalPaid: allFees.reduce((sum, f) => sum + Number(f.paidAmount), 0),
        totalBalance: allFees.reduce((sum, f) => sum + Number(f.balance), 0),
        pendingCount: allFees.filter((f) => f.status === "pending").length,
        overdueCount: allFees.filter((f) => f.status === "overdue").length,
      };

      res.json({
        success: true,
        data: {
          student: {
            id: child.id,
            name: child.fullName,
            schoolName: child.schoolName,
            className: child.className,
          },
          fees: feeItems,
          summary,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch child fees",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/payments
   * Get payment history for parent
   */
  async getPaymentHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, paymentStatus, page = 1, limit = 20 } = req.query;

      const where: Record<string, unknown> = { parentId: parentUserId };
      if (studentId) where.studentId = studentId;
      if (paymentStatus) where.paymentStatus = paymentStatus;

      const skip = (Number(page) - 1) * Number(limit);

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/receipts
   * Get receipts for parent
   */
  async getReceipts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, page = 1, limit = 20 } = req.query;

      const where: Record<string, unknown> = { parentId: parentUserId };
      if (studentId) where.studentId = studentId;

      const skip = (Number(page) - 1) * Number(limit);

      const [receipts, total] = await Promise.all([
        prisma.receipt.findMany({
          where,
          orderBy: { issuedAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.receipt.count({ where }),
      ]);

      res.json({
        success: true,
        data: receipts.map((r) => ({
          ...r,
          totalAmount: Number(r.totalAmount),
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch receipts",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/receipts/:receiptId
   * Get a specific receipt
   */
  async getReceiptById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { receiptId } = req.params;

      const receipt = await prisma.receipt.findFirst({
        where: {
          id: receiptId,
          parentId: parentUserId,
        },
      });

      if (!receipt) {
        res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          ...receipt,
          totalAmount: Number(receipt.totalAmount),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch receipt",
        error: errorMessage,
      });
    }
  }

  /**
   * Helper: Get parent's children from education service
   */
  private async getParentChildren(
    parentUserId: string,
    authHeader?: string,
  ): Promise<
    | {
        id: string;
        fullName: string;
        schoolId: string;
        schoolName: string;
        className?: string;
      }[]
    | null
  > {
    try {
      const response = await axios.get(
        `${EDUCATION_SERVICE_URL}/api/parent/children`,
        {
          headers: {
            "x-user-id": parentUserId,
            Authorization: authHeader || "",
          },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch {
      console.error("Failed to fetch children from education service");
      return null;
    }
  }
}

export default new ParentFeesController();

        // Calculate school totals
        let schoolTotalFees = 0;
        let schoolTotalPaid = 0;
        let schoolTotalBalance = 0;

        const childSummaries: ChildFeeSummary[] = schoolData.children.map(
          (child) => {
            const childFees = fees.filter(
              (f) => f.studentId === child.id.toString(),
            );

            const totalFees = childFees.reduce(
              (sum, f) => sum + f.totalAmount,
              0,
            );
            const totalPaid = childFees.reduce(
              (sum, f) => sum + f.paidAmount,
              0,
            );
            const balance = childFees.reduce((sum, f) => sum + f.balance, 0);
            const pendingItems = childFees.filter(
              (f) => f.status === "pending",
            ).length;
            const overdueItems = childFees.filter(
              (f) => f.status === "overdue",
            ).length;

            schoolTotalFees += totalFees;
            schoolTotalPaid += totalPaid;
            schoolTotalBalance += balance;

            return {
              studentId: child.id.toString(),
              studentName: child.fullName,
              className: child.className,
              totalFees,
              totalPaid,
              balance,
              pendingItems,
              overdueItems,
            };
          },
        );

        schoolFeeSummaries.push({
          schoolId,
          schoolName: schoolData.schoolName,
          totalFees: schoolTotalFees,
          totalPaid: schoolTotalPaid,
          totalBalance: schoolTotalBalance,
          currency: "NGN",
          children: childSummaries,
        });
      }

      res.json({
        success: true,
        data: schoolFeeSummaries,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch fees",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/fees/:studentId
   * Get detailed fees for a specific child
   */
  async getChildFees(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { academicYear, term, status, page = 1, limit = 20 } = req.query;

      // Verify parent has access to this student
      const children = await this.getParentChildren(
        parentUserId,
        req.headers.authorization,
      );
      const child = children?.find((c) => c.id.toString() === studentId);

      if (!child) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this student's fees",
        });
        return;
      }

      // Build query
      const query: Record<string, unknown> = { studentId };
      if (academicYear) query.academicYear = academicYear;
      if (term) query.term = term;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [fees, total] = await Promise.all([
        StudentFee.find(query)
          .sort({ dueDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        StudentFee.countDocuments(query),
      ]);

      const feeItems: FeeItem[] = fees.map((fee) => ({
        id: fee._id.toString(),
        feeName: fee.feeName,
        feeType: fee.feeType,
        amount: fee.amount,
        discount: fee.discount,
        totalAmount: fee.totalAmount,
        paidAmount: fee.paidAmount,
        balance: fee.balance,
        dueDate: fee.dueDate,
        status: fee.status,
        academicYear: fee.academicYear,
        term: fee.term,
      }));

      // Calculate summary
      const allFees = await StudentFee.find({ studentId });
      const summary = {
        totalFees: allFees.reduce((sum, f) => sum + f.totalAmount, 0),
        totalPaid: allFees.reduce((sum, f) => sum + f.paidAmount, 0),
        totalBalance: allFees.reduce((sum, f) => sum + f.balance, 0),
        pendingCount: allFees.filter((f) => f.status === "pending").length,
        overdueCount: allFees.filter((f) => f.status === "overdue").length,
      };

      res.json({
        success: true,
        data: {
          student: {
            id: child.id,
            name: child.fullName,
            schoolName: child.schoolName,
            className: child.className,
          },
          fees: feeItems,
          summary,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch child fees",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/payments
   * Get payment history for parent
   */
  async getPaymentHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, status, page = 1, limit = 20 } = req.query;

      const query: Record<string, unknown> = { parentUserId };
      if (studentId) query.studentId = studentId;
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const [payments, total] = await Promise.all([
        Payment.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Payment.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/receipts
   * Get receipts for parent
   */
  async getReceipts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, page = 1, limit = 20 } = req.query;

      const query: Record<string, unknown> = { parentUserId };
      if (studentId) query.studentId = studentId;

      const skip = (Number(page) - 1) * Number(limit);

      const [receipts, total] = await Promise.all([
        Receipt.find(query)
          .sort({ issuedAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Receipt.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: receipts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch receipts",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/receipts/:receiptId
   * Get a specific receipt
   */
  async getReceiptById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { receiptId } = req.params;

      const receipt = await Receipt.findOne({
        _id: receiptId,
        parentUserId,
      });

      if (!receipt) {
        res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
        return;
      }

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch receipt",
        error: errorMessage,
      });
    }
  }

  /**
   * Helper: Get parent's children from education service
   */
  private async getParentChildren(
    parentUserId: string,
    authHeader?: string,
  ): Promise<
    | {
        id: string;
        fullName: string;
        schoolId: string;
        schoolName: string;
        className?: string;
      }[]
    | null
  > {
    try {
      const response = await axios.get(
        `${EDUCATION_SERVICE_URL}/api/parent/children`,
        {
          headers: {
            "x-user-id": parentUserId,
            Authorization: authHeader || "",
          },
        },
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch {
      console.error("Failed to fetch children from education service");
      return null;
    }
  }
}

export default new ParentFeesController();
