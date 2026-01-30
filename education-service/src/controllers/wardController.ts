import { Response } from "express";
import { Student, ParentStudentLink, School, Class } from "../models";
import {
  WardEnrollmentRequest,
  WardSettings,
  PickupAuthorization,
} from "../models/wardModels";
import { StudentTransport, TransportRoute } from "../models/transportModels";
import { AuthRequest } from "../types";
import crypto from "crypto";

/**
 * WardController - Handles all ward (child) management features for parents
 *
 * Parents can:
 * - View their wards
 * - Submit enrollment requests for new wards
 * - Manage ward settings and preferences
 * - Manage pickup authorizations
 * - View and update ward information
 */
class WardController {
  /**
   * GET /parent/wards
   * Get all wards (linked children) with detailed information
   */
  async getWards(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);

      // Get all linked students
      const links = await ParentStudentLink.find({
        parentUserId,
        verifiedAt: { $ne: null },
      });

      if (links.length === 0) {
        res.json({
          success: true,
          data: [],
          message: "No wards linked to this account",
        });
        return;
      }

      const studentIds = links.map((l) => l.studentId);
      const students = await Student.find({
        _id: { $in: studentIds },
      });

      // Get related data
      const classIds = [...new Set(students.map((s) => s.classId))];
      const schoolIds = [...new Set(students.map((s) => s.schoolId))];

      const [classes, schools, transportAssignments, wardSettings] =
        await Promise.all([
          Class.find({ _id: { $in: classIds } }),
          School.find({ _id: { $in: schoolIds } }),
          StudentTransport.find({ studentId: { $in: studentIds } }),
          WardSettings.find({
            parentUserId,
            studentId: { $in: studentIds },
          }),
        ]);

      const classMap = new Map(classes.map((c) => [c._id.toString(), c]));
      const schoolMap = new Map(schools.map((s) => [s._id.toString(), s]));
      const transportMap = new Map(
        transportAssignments.map((t) => [t.studentId.toString(), t]),
      );
      const settingsMap = new Map(
        wardSettings.map((s) => [s.studentId.toString(), s]),
      );

      const wards = await Promise.all(
        students.map(async (student) => {
          const link = links.find(
            (l) => l.studentId === student._id.toString(),
          );
          const studentClass = classMap.get(student.classId);
          const studentSchool = schoolMap.get(student.schoolId);
          const transport = transportMap.get(student._id.toString());
          const settings = settingsMap.get(student._id.toString());

          // Get transport route if assigned
          let transportRoute = null;
          if (transport) {
            transportRoute = await TransportRoute.findById(transport.routeId);
          }

          return {
            id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName,
            fullName: `${student.firstName} ${student.lastName}`,
            dateOfBirth: student.dateOfBirth,
            age: this.calculateAge(student.dateOfBirth),
            gender: student.gender,
            status: student.status,
            // School info
            school: studentSchool
              ? {
                  id: studentSchool._id,
                  name: studentSchool.name,
                  code: studentSchool.code,
                  type: studentSchool.type,
                }
              : null,
            // Class info
            class: studentClass
              ? {
                  id: studentClass._id,
                  name: studentClass.name,
                  grade: studentClass.grade,
                  section: studentClass.section,
                }
              : null,
            // Relationship and permissions
            relationship: link?.relationship,
            isPrimary: link?.isPrimary,
            canPickup: link?.canPickup,
            permissions: link?.permissions,
            // Transport info
            transport: transport
              ? {
                  hasTransport: true,
                  routeId: transport.routeId,
                  routeName: transportRoute?.name,
                  routeCode: transportRoute?.code,
                  status: transport.status,
                }
              : {
                  hasTransport: false,
                },
            // Emergency contact
            emergencyContact: student.emergencyContact,
            // Medical info (if permitted)
            medicalInfo: link?.permissions.viewGrades
              ? student.medicalInfo
              : undefined,
            // Settings
            hasCustomSettings: !!settings,
            enrollmentDate: student.enrollmentDate,
          };
        }),
      );

      res.json({
        success: true,
        data: wards,
        total: wards.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch wards",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId
   * Get detailed information for a specific ward
   */
  async getWardDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      // Verify access
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this ward",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Ward not found",
        });
        return;
      }

      const [studentClass, school, transport, settings, authorizations] =
        await Promise.all([
          Class.findById(student.classId),
          School.findById(student.schoolId),
          StudentTransport.findOne({ studentId, status: "active" }),
          WardSettings.findOne({ parentUserId, studentId }),
          PickupAuthorization.find({
            studentId,
            parentUserId,
            status: "active",
          }),
        ]);

      let transportRoute = null;
      let pickupStop = null;
      let dropoffStop = null;

      if (transport) {
        transportRoute = await TransportRoute.findById(transport.routeId);
        if (transportRoute) {
          pickupStop = transportRoute.stops.find(
            (s) => s.stopId === transport.pickupStopId,
          );
          dropoffStop = transportRoute.stops.find(
            (s) => s.stopId === transport.dropoffStopId,
          );
        }
      }

      // Get all parents linked to this student
      const allParentLinks = await ParentStudentLink.find({
        studentId,
        verifiedAt: { $ne: null },
      });

      res.json({
        success: true,
        data: {
          student: {
            id: student._id,
            userId: student.userId,
            firstName: student.firstName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            age: this.calculateAge(student.dateOfBirth),
            gender: student.gender,
            status: student.status,
            enrollmentDate: student.enrollmentDate,
            emergencyContact: student.emergencyContact,
            medicalInfo: student.medicalInfo,
          },
          school: school
            ? {
                id: school._id,
                name: school.name,
                code: school.code,
                type: school.type,
                address: school.address,
                contact: school.contact,
              }
            : null,
          class: studentClass
            ? {
                id: studentClass._id,
                name: studentClass.name,
                grade: studentClass.grade,
                section: studentClass.section,
                teacherId: studentClass.teacherId,
                schedule: studentClass.schedule,
              }
            : null,
          myRelationship: {
            relationship: link.relationship,
            isPrimary: link.isPrimary,
            canPickup: link.canPickup,
            permissions: link.permissions,
          },
          otherParents: allParentLinks
            .filter((p) => p.parentUserId !== parentUserId)
            .map((p) => ({
              relationship: p.relationship,
              isPrimary: p.isPrimary,
              canPickup: p.canPickup,
            })),
          transport: transport
            ? {
                id: transport._id,
                status: transport.status,
                route: transportRoute
                  ? {
                      id: transportRoute._id,
                      name: transportRoute.name,
                      code: transportRoute.code,
                      driverName: transportRoute.driverName,
                      driverPhone: transportRoute.driverPhone,
                    }
                  : null,
                pickupStop: pickupStop
                  ? {
                      name: pickupStop.name,
                      address: pickupStop.address,
                      coordinates: pickupStop.coordinates,
                      estimatedTime: pickupStop.estimatedArrivalTime,
                    }
                  : null,
                dropoffStop: dropoffStop
                  ? {
                      name: dropoffStop.name,
                      address: dropoffStop.address,
                      coordinates: dropoffStop.coordinates,
                      estimatedTime: dropoffStop.estimatedArrivalTime,
                    }
                  : null,
                authorizedPickupPersons: transport.authorizedPickupPersons,
                requiresAssistance: transport.requiresAssistance,
                specialNotes: transport.specialNotes,
              }
            : null,
          settings: settings || this.getDefaultSettings(),
          activeAuthorizations: authorizations,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch ward details",
        error: error.message,
      });
    }
  }

  /**
   * POST /parent/enrollment-requests
   * Submit a new ward enrollment request
   */
  async submitEnrollmentRequest(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const {
        schoolId,
        academicYear,
        requestedClass,
        ward,
        emergencyContact,
        medicalInfo,
        transportRequired,
        transportDetails,
        documents,
      } = req.body;

      // Validate required fields
      if (!schoolId || !ward || !emergencyContact) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: schoolId, ward, emergencyContact",
        });
        return;
      }

      // Check if school exists
      const school = await School.findById(schoolId);
      if (!school) {
        res.status(404).json({
          success: false,
          message: "School not found",
        });
        return;
      }

      // Check for duplicate pending requests
      const existingRequest = await WardEnrollmentRequest.findOne({
        parentUserId,
        schoolId,
        "ward.firstName": ward.firstName,
        "ward.lastName": ward.lastName,
        "ward.dateOfBirth": new Date(ward.dateOfBirth),
        status: { $nin: ["rejected", "enrolled"] },
      });

      if (existingRequest) {
        res.status(409).json({
          success: false,
          message:
            "An enrollment request for this child at this school already exists",
          data: {
            requestId: existingRequest._id,
            status: existingRequest.status,
          },
        });
        return;
      }

      // Create enrollment request
      const enrollmentRequest = new WardEnrollmentRequest({
        parentUserId,
        schoolId,
        academicYear: academicYear || this.getCurrentAcademicYear(),
        requestedClass,
        ward: {
          ...ward,
          dateOfBirth: new Date(ward.dateOfBirth),
        },
        emergencyContact,
        medicalInfo,
        transportRequired: transportRequired || false,
        transportDetails,
        documents: documents || [],
        status: "draft",
        statusHistory: [
          {
            status: "draft",
            timestamp: new Date(),
            notes: "Application created",
          },
        ],
      });

      await enrollmentRequest.save();

      res.status(201).json({
        success: true,
        message: "Enrollment request created successfully",
        data: {
          requestId: enrollmentRequest._id,
          status: enrollmentRequest.status,
          schoolName: school.name,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create enrollment request",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /parent/enrollment-requests/:requestId/submit
   * Submit a draft enrollment request for review
   */
  async submitDraftRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { requestId } = req.params;

      const request = await WardEnrollmentRequest.findOne({
        _id: requestId,
        parentUserId,
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: "Enrollment request not found",
        });
        return;
      }

      if (request.status !== "draft") {
        res.status(400).json({
          success: false,
          message: "Only draft requests can be submitted",
        });
        return;
      }

      // Validate required documents/information
      const validationErrors = this.validateEnrollmentRequest(request);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Please complete all required information before submitting",
          errors: validationErrors,
        });
        return;
      }

      // Update status
      request.status = "submitted";
      request.submittedAt = new Date();
      request.statusHistory.push({
        status: "submitted",
        timestamp: new Date(),
        notes: "Application submitted for review",
      });

      await request.save();

      res.json({
        success: true,
        message: "Enrollment request submitted successfully",
        data: {
          requestId: request._id,
          status: request.status,
          submittedAt: request.submittedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to submit enrollment request",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/enrollment-requests
   * Get all enrollment requests for this parent
   */
  async getEnrollmentRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { status, page = 1, limit = 20 } = req.query;

      const query: Record<string, unknown> = { parentUserId };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [requests, total] = await Promise.all([
        WardEnrollmentRequest.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        WardEnrollmentRequest.countDocuments(query),
      ]);

      // Get school names
      const schoolIds = [...new Set(requests.map((r) => r.schoolId))];
      const schools = await School.find({ _id: { $in: schoolIds } });
      const schoolMap = new Map(schools.map((s) => [s._id.toString(), s]));

      const data = requests.map((request) => {
        const school = schoolMap.get(request.schoolId);
        return {
          id: request._id,
          schoolId: request.schoolId,
          schoolName: school?.name || "Unknown",
          wardName: `${request.ward.firstName} ${request.ward.lastName}`,
          requestedClass: request.requestedClass,
          status: request.status,
          submittedAt: request.submittedAt,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        };
      });

      res.json({
        success: true,
        data,
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
        message: "Failed to fetch enrollment requests",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/enrollment-requests/:requestId
   * Get details of a specific enrollment request
   */
  async getEnrollmentRequestDetails(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { requestId } = req.params;

      const request = await WardEnrollmentRequest.findOne({
        _id: requestId,
        parentUserId,
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: "Enrollment request not found",
        });
        return;
      }

      const school = await School.findById(request.schoolId);

      res.json({
        success: true,
        data: {
          ...request.toObject(),
          school: school
            ? {
                name: school.name,
                code: school.code,
                type: school.type,
                address: school.address,
              }
            : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch enrollment request details",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /parent/enrollment-requests/:requestId
   * Update a draft enrollment request
   */
  async updateEnrollmentRequest(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { requestId } = req.params;
      const updates = req.body;

      const request = await WardEnrollmentRequest.findOne({
        _id: requestId,
        parentUserId,
      });

      if (!request) {
        res.status(404).json({
          success: false,
          message: "Enrollment request not found",
        });
        return;
      }

      // Only allow updates if status is draft or documents_required
      if (!["draft", "documents_required"].includes(request.status)) {
        res.status(400).json({
          success: false,
          message: "This request cannot be updated in its current status",
        });
        return;
      }

      // Update allowed fields
      const allowedFields = [
        "requestedClass",
        "ward",
        "emergencyContact",
        "medicalInfo",
        "transportRequired",
        "transportDetails",
        "documents",
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          (request as any)[field] = updates[field];
        }
      }

      await request.save();

      res.json({
        success: true,
        message: "Enrollment request updated successfully",
        data: request,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update enrollment request",
        error: error.message,
      });
    }
  }

  /**
   * PUT /parent/wards/:studentId/settings
   * Update ward settings and preferences
   */
  async updateWardSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const settings = req.body;

      // Verify access
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this ward",
        });
        return;
      }

      // Upsert settings
      const wardSettings = await WardSettings.findOneAndUpdate(
        { parentUserId, studentId },
        { $set: settings },
        { new: true, upsert: true },
      );

      res.json({
        success: true,
        message: "Ward settings updated successfully",
        data: wardSettings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update ward settings",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/settings
   * Get ward settings
   */
  async getWardSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      // Verify access
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this ward",
        });
        return;
      }

      const settings = await WardSettings.findOne({ parentUserId, studentId });

      res.json({
        success: true,
        data: settings || this.getDefaultSettings(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch ward settings",
        error: error.message,
      });
    }
  }

  /**
   * POST /parent/wards/:studentId/pickup-authorizations
   * Create a new pickup authorization
   */
  async createPickupAuthorization(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const {
        authorizedPerson,
        type,
        validFrom,
        validUntil,
        specificDates,
        recurringDays,
        notes,
      } = req.body;

      // Verify access and pickup permission
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
        canPickup: true,
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to create pickup authorizations for this ward",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Ward not found",
        });
        return;
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();

      const authorization = new PickupAuthorization({
        studentId,
        parentUserId,
        schoolId: student.schoolId,
        authorizedPerson,
        type: type || "one_time",
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        specificDates: specificDates?.map((d: string) => new Date(d)),
        recurringDays,
        verificationCode,
        notes,
        status: "active",
      });

      await authorization.save();

      res.status(201).json({
        success: true,
        message: "Pickup authorization created successfully",
        data: {
          id: authorization._id,
          verificationCode: authorization.verificationCode,
          validFrom: authorization.validFrom,
          validUntil: authorization.validUntil,
          authorizedPerson: authorization.authorizedPerson,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to create pickup authorization",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/pickup-authorizations
   * Get all pickup authorizations for a ward
   */
  async getPickupAuthorizations(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { status } = req.query;

      // Verify access
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message: "You do not have access to this ward",
        });
        return;
      }

      const query: Record<string, unknown> = { studentId, parentUserId };
      if (status) {
        query.status = status;
      }

      const authorizations = await PickupAuthorization.find(query).sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        data: authorizations,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch pickup authorizations",
        error: error.message,
      });
    }
  }

  /**
   * DELETE /parent/wards/:studentId/pickup-authorizations/:authId
   * Cancel a pickup authorization
   */
  async cancelPickupAuthorization(
    req: AuthRequest,
    res: Response,
  ): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId, authId } = req.params;

      const authorization = await PickupAuthorization.findOne({
        _id: authId,
        studentId,
        parentUserId,
      });

      if (!authorization) {
        res.status(404).json({
          success: false,
          message: "Pickup authorization not found",
        });
        return;
      }

      if (authorization.status !== "active") {
        res.status(400).json({
          success: false,
          message: "Only active authorizations can be cancelled",
        });
        return;
      }

      authorization.status = "cancelled";
      await authorization.save();

      res.json({
        success: true,
        message: "Pickup authorization cancelled successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to cancel pickup authorization",
        error: error.message,
      });
    }
  }

  /**
   * PATCH /parent/wards/:studentId/emergency-contact
   * Update emergency contact for a ward (if permitted)
   */
  async updateEmergencyContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { emergencyContact } = req.body;

      // Verify access - only primary parents can update emergency contact
      const link = await ParentStudentLink.findOne({
        parentUserId,
        studentId,
        verifiedAt: { $ne: null },
        isPrimary: true,
      });

      if (!link) {
        res.status(403).json({
          success: false,
          message:
            "Only primary guardians can update emergency contact information",
        });
        return;
      }

      const student = await Student.findByIdAndUpdate(
        studentId,
        { emergencyContact },
        { new: true },
      );

      if (!student) {
        res.status(404).json({
          success: false,
          message: "Ward not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Emergency contact updated successfully",
        data: { emergencyContact: student.emergencyContact },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update emergency contact",
        error: error.message,
      });
    }
  }

  // ==================== HELPER METHODS ====================

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return age;
  }

  private getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Academic year typically starts in August/September
    if (month >= 8) {
      return `${year}/${year + 1}`;
    }
    return `${year - 1}/${year}`;
  }

  private validateEnrollmentRequest(request: any): string[] {
    const errors: string[] = [];

    if (!request.ward.firstName || !request.ward.lastName) {
      errors.push("Ward name is required");
    }
    if (!request.ward.dateOfBirth) {
      errors.push("Ward date of birth is required");
    }
    if (!request.emergencyContact.name || !request.emergencyContact.phone) {
      errors.push("Emergency contact information is required");
    }
    // Add more validation as needed

    return errors;
  }

  private getDefaultSettings() {
    return {
      notifications: {
        attendance: true,
        grades: true,
        assignments: true,
        announcements: true,
        transport: true,
        fees: true,
        emergencies: true,
      },
      transportAlerts: {
        busArriving: true,
        busArrivingThreshold: 10,
        pickupConfirmation: true,
        dropoffConfirmation: true,
        delayAlerts: true,
        routeChanges: true,
      },
      attendanceAlerts: {
        markAbsent: true,
        markLate: true,
        weeklyReport: false,
        monthlyReport: true,
      },
      gradeAlerts: {
        newGrade: true,
        lowGradeThreshold: 50,
        resultPublished: true,
      },
      preferredContactMethod: "push",
      quietHoursEnabled: false,
    };
  }

  private generateVerificationCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
  }
}

export default new WardController();
