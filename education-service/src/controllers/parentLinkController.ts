import { Response } from "express";
import { Student, ParentStudentLink } from "../models";
import { AuthRequest } from "../types";

/**
 * ParentLinkController - Administrative endpoints for managing parent-student links
 *
 * These endpoints are typically used by:
 * - School admins to set up initial parent-child relationships
 * - Parents to request linking to their children (with verification)
 */
class ParentLinkController {
  /**
   * POST /admin/parent-links
   * Create a new parent-student link (admin only)
   */
  async createLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        parentUserId,
        studentId,
        relationship,
        isPrimary = false,
        canPickup = true,
        permissions = {},
      } = req.body;

      // Validate required fields
      if (!parentUserId || !studentId || !relationship) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: parentUserId, studentId, relationship",
        });
        return;
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      // Check if link already exists
      const existingLink = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
      });

      if (existingLink) {
        res.status(409).json({
          success: false,
          message: "Parent-student link already exists",
        });
        return;
      }

      // Create the link
      const link = new ParentStudentLink({
        parentUserId,
        studentId,
        relationship,
        isPrimary,
        canPickup,
        permissions: {
          viewGrades: permissions.viewGrades ?? true,
          viewAttendance: permissions.viewAttendance ?? true,
          viewAssignments: permissions.viewAssignments ?? true,
          communicateWithTeachers: permissions.communicateWithTeachers ?? true,
          payFees: permissions.payFees ?? true,
          trackLocation: permissions.trackLocation ?? true,
        },
        verifiedAt: new Date(), // Admin-created links are auto-verified
      });

      await link.save();

      // Also add parent to student's parentIds array
      if (!student.parentIds.includes(parentUserId)) {
        student.parentIds.push(parentUserId);
        await student.save();
      }

      res.status(201).json({
        success: true,
        message: "Parent-student link created successfully",
        data: link,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create parent-student link",
        error: error.message,
      });
    }
  }

  /**
   * POST /parent/link-request
   * Parent requests to link with a child (requires verification)
   */
  async requestLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, relationship } = req.body;
      // verificationCode can be used for future verification logic

      if (!studentId || !relationship) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: studentId, relationship",
        });
        return;
      }

      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      // Check if link already exists
      const existingLink = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
      });

      if (existingLink) {
        if (existingLink.verifiedAt) {
          res.status(409).json({
            success: false,
            message: "You are already linked to this student",
          });
        } else {
          res.status(409).json({
            success: false,
            message: "A link request is already pending for this student",
          });
        }
        return;
      }

      // TODO: Implement verification code validation
      // For now, create unverified link that requires admin approval
      const link = new ParentStudentLink({
        parentUserId,
        studentId,
        relationship,
        isPrimary: false,
        canPickup: false, // Requires explicit approval
        permissions: {
          viewGrades: true,
          viewAttendance: true,
          viewAssignments: true,
          communicateWithTeachers: true,
          payFees: false, // Requires explicit approval
          trackLocation: false, // Requires explicit approval
        },
        // verifiedAt is null - requires admin verification
      });

      await link.save();

      res.status(201).json({
        success: true,
        message:
          "Link request submitted. Awaiting verification by school administrator.",
        data: {
          linkId: link._id,
          status: "pending_verification",
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to submit link request",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /admin/parent-links/:linkId/verify
   * Verify a pending parent-student link (admin only)
   */
  async verifyLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;
      const { approve = true, isPrimary, canPickup, permissions } = req.body;

      const link = await ParentStudentLink.findById(linkId);

      if (!link) {
        res.status(404).json({
          success: false,
          message: "Link not found",
        });
        return;
      }

      if (link.verifiedAt) {
        res.status(400).json({
          success: false,
          message: "Link is already verified",
        });
        return;
      }

      if (!approve) {
        // Reject and delete the link request
        await ParentStudentLink.findByIdAndDelete(linkId);

        res.json({
          success: true,
          message: "Link request rejected and removed",
        });
        return;
      }

      // Approve the link
      link.verifiedAt = new Date();

      if (isPrimary !== undefined) link.isPrimary = isPrimary;
      if (canPickup !== undefined) link.canPickup = canPickup;
      if (permissions) {
        Object.assign(link.permissions, permissions);
      }

      await link.save();

      // Add parent to student's parentIds
      const student = await Student.findById(link.studentId);
      if (student && !student.parentIds.includes(link.parentUserId)) {
        student.parentIds.push(link.parentUserId);
        await student.save();
      }

      res.json({
        success: true,
        message: "Parent-student link verified successfully",
        data: link,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to verify link",
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/parent-links
   * Get all parent-student links (admin)
   */
  async getAllLinks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { schoolId, verified, page = 1, limit = 20 } = req.query;

      const query: any = {};

      if (verified === "true") {
        query.verifiedAt = { $ne: null };
      } else if (verified === "false") {
        query.verifiedAt = null;
      }

      // If schoolId provided, filter by students in that school
      if (schoolId) {
        const students = await Student.find({ schoolId }, "_id");
        const studentIds = students.map((s) => s._id.toString());
        query.studentId = { $in: studentIds };
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [links, total] = await Promise.all([
        ParentStudentLink.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        ParentStudentLink.countDocuments(query),
      ]);

      // Enrich with student info
      const studentIds = [...new Set(links.map((l) => l.studentId))];
      const students = await Student.find({ _id: { $in: studentIds } });
      const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

      const enrichedLinks = links.map((link) => {
        const student = studentMap.get(link.studentId);
        return {
          ...link.toObject(),
          student: student
            ? {
                id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                classId: student.classId,
              }
            : null,
        };
      });

      res.json({
        success: true,
        data: enrichedLinks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch parent-student links",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /admin/parent-links/:linkId
   * Remove a parent-student link (admin only)
   */
  async deleteLink(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;

      const link = await ParentStudentLink.findById(linkId);

      if (!link) {
        res.status(404).json({
          success: false,
          message: "Link not found",
        });
        return;
      }

      // Remove from student's parentIds
      const student = await Student.findById(link.studentId);
      if (student) {
        student.parentIds = student.parentIds.filter(
          (id) => id !== link.parentUserId,
        );
        await student.save();
      }

      await ParentStudentLink.findByIdAndDelete(linkId);

      res.json({
        success: true,
        message: "Parent-student link removed successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete link",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /parent/links/:linkId/permissions
   * Update permissions on a link (parent can reduce their own permissions)
   */
  async updateMyLinkPermissions(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { linkId } = req.params;
      const { permissions } = req.body;

      const link = await ParentStudentLink.findById(linkId);

      if (!link) {
        res.status(404).json({
          success: false,
          message: "Link not found",
        });
        return;
      }

      if (link.parentUserId !== parentUserId) {
        res.status(403).json({
          success: false,
          message: "You can only update your own links",
        });
        return;
      }

      // Parents can only disable permissions, not enable new ones
      if (permissions) {
        for (const [key, value] of Object.entries(permissions)) {
          if (key in link.permissions && value === false) {
            (link.permissions as any)[key] = false;
          }
        }
      }

      await link.save();

      res.json({
        success: true,
        message: "Link permissions updated",
        data: link,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update link permissions",
        error: error.message,
      });
    }
  }
}

export default new ParentLinkController();
