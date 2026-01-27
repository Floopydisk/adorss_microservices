import { Response } from "express";
import {
  Student,
  ParentStudentLink,
  Assignment,
  Grade,
  Attendance,
  Timetable,
  Result,
  Announcement,
  Class,
  School,
} from "../models";
import {
  AuthRequest,
  ChildSummary,
  ParentDashboard,
  AttendanceStats,
  GradeReport,
} from "../types";

/**
 * ParentController - Handles all parent-specific education features
 *
 * Parents can:
 * - View their linked children
 * - View assignments, grades, attendance for their children
 * - View timetables and results
 * - Receive announcements
 * - Track child location (via mobility service - separate)
 */
class ParentController {
  /**
   * GET /parent/children
   * Get all children linked to this parent
   */
  async getChildren(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);

      // Get all linked students
      const links = await ParentStudentLink.find({
        parentUserId,
        verifiedAt: { $ne: null }, // Only verified links
      });

      if (links.length === 0) {
        res.json({
          success: true,
          data: [],
          message: "No children linked to this account",
        });
        return;
      }

      const studentIds = links.map((l) => l.studentId);
      const students = await Student.find({
        _id: { $in: studentIds },
        status: "active",
      });

      // Get class info for each student
      const classIds = students.map((s) => s.classId);
      const classes = await Class.find({ _id: { $in: classIds } });
      const classMap = new Map(classes.map((c) => [c._id.toString(), c]));

      // Get school info for each student
      const schoolIds = [...new Set(students.map((s) => s.schoolId))];
      const schools = await School.find({ _id: { $in: schoolIds } });
      const schoolMap = new Map(schools.map((s) => [s._id.toString(), s]));

      const children = students.map((student) => {
        const link = links.find((l) => l.studentId === student._id.toString());
        const studentClass = classMap.get(student.classId);
        const studentSchool = schoolMap.get(student.schoolId);

        return {
          id: student._id,
          userId: student.userId,
          firstName: student.firstName,
          lastName: student.lastName,
          fullName: `${student.firstName} ${student.lastName}`,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          schoolId: student.schoolId,
          schoolName: studentSchool?.name || "Unknown",
          schoolCode: studentSchool?.code,
          className: studentClass?.name || "Unknown",
          grade: studentClass?.grade || "Unknown",
          section: studentClass?.section,
          relationship: link?.relationship,
          isPrimary: link?.isPrimary,
          permissions: link?.permissions,
          enrollmentDate: student.enrollmentDate,
        };
      });

      res.json({
        success: true,
        data: children,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch children",
        error: errorMessage,
      });
    }
  }

  /**
   * GET /parent/dashboard
   * Get parent dashboard with summary of all children
   */
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get linked children
      const links = await ParentStudentLink.find({
        parentUserId,
        verifiedAt: { $ne: null },
      });

      const studentIds = links.map((l) => l.studentId);
      const students = await Student.find({
        _id: { $in: studentIds },
        status: "active",
      });

      // Get classes
      const classIds = [...new Set(students.map((s) => s.classId))];
      const classes = await Class.find({ _id: { $in: classIds } });
      const classMap = new Map(classes.map((c) => [c._id.toString(), c]));

      // Build child summaries
      const childSummaries: ChildSummary[] = await Promise.all(
        students.map(async (student) => {
          const link = links.find(
            (l) => l.studentId === student._id.toString(),
          );
          const studentClass = classMap.get(student.classId);

          // Today's attendance
          const attendanceToday = await Attendance.findOne({
            studentId: student._id,
            date: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          });

          // Pending assignments (due in next 7 days, not submitted)
          const pendingAssignments = await Assignment.countDocuments({
            classId: student.classId,
            status: "published",
            dueDate: {
              $gte: today,
              $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
            },
            "submissions.studentId": { $ne: student._id.toString() },
          });

          // Recent grades (last 5)
          const recentGrades = await Grade.find({
            studentId: student._id.toString(),
          })
            .sort({ updatedAt: -1 })
            .limit(5);

          return {
            studentId: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            className: studentClass?.name || "Unknown",
            grade: studentClass?.grade || "Unknown",
            relationship: link?.relationship || "guardian",
            attendanceToday: attendanceToday
              ? {
                  status: attendanceToday.status,
                  checkInTime: attendanceToday.checkInTime,
                }
              : undefined,
            pendingAssignments,
            upcomingExams: 0, // TODO: Connect to exam schedule
            recentGrades: recentGrades
              .flatMap((g) =>
                g.assessments.slice(-2).map((a) => ({
                  subject: g.subjectId,
                  score: a.score,
                  maxScore: a.maxScore,
                  date: a.date,
                })),
              )
              .slice(0, 5),
          };
        }),
      );

      // Get recent announcements for parent audience
      const schoolIds = [...new Set(students.map((s) => s.schoolId))];
      const announcements = await Announcement.find({
        schoolId: { $in: schoolIds },
        targetAudience: { $in: ["all", "parents"] },
        publishAt: { $lte: new Date() },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
        .sort({ isPinned: -1, publishAt: -1 })
        .limit(5);

      const dashboard: ParentDashboard = {
        children: childSummaries,
        recentAnnouncements: announcements,
        upcomingEvents: [], // TODO: Connect to events
        unreadMessages: 0, // TODO: Connect to messaging service
      };

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/assignments
   * Get assignments for a specific child
   */
  async getChildAssignments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      // Verify parent has access to this student
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "viewAssignments",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this student's assignments",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      // Build query
      const query: any = { classId: student.classId };
      if (status) {
        query.status = status;
      } else {
        query.status = { $in: ["published", "closed"] }; // Don't show drafts to parents
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [assignments, total] = await Promise.all([
        Assignment.find(query)
          .sort({ dueDate: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Assignment.countDocuments(query),
      ]);

      // Add submission status for this student
      const assignmentsWithStatus = assignments.map((assignment) => {
        const submission = assignment.submissions.find(
          (s) => s.studentId === studentId,
        );
        return {
          id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          subjectId: assignment.subjectId,
          dueDate: assignment.dueDate,
          totalMarks: assignment.totalMarks,
          status: assignment.status,
          isOverdue: assignment.dueDate < new Date() && !submission,
          submission: submission
            ? {
                submittedAt: submission.submittedAt,
                grade: submission.grade,
                feedback: submission.feedback,
                gradedAt: submission.gradedAt,
              }
            : null,
        };
      });

      res.json({
        success: true,
        data: assignmentsWithStatus,
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
        message: "Failed to fetch assignments",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/grades
   * Get grades for a specific child
   */
  async getChildGrades(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { academicYear, term, subjectId } = req.query;

      // Verify parent has access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "viewGrades",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to view this student's grades",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      // Build query
      const query: any = { studentId };
      if (academicYear) query.academicYear = academicYear;
      if (term) query.term = term;
      if (subjectId) query.subjectId = subjectId;

      const grades = await Grade.find(query).sort({ updatedAt: -1 });

      // Calculate summary
      const summary = {
        totalSubjects: new Set(grades.map((g) => g.subjectId)).size,
        overallPercentage:
          grades.length > 0
            ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
            : 0,
        assessmentCount: grades.reduce(
          (sum, g) => sum + g.assessments.length,
          0,
        ),
      };

      res.json({
        success: true,
        data: {
          grades,
          summary,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch grades",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/attendance
   * Get attendance records for a specific child
   */
  async getChildAttendance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { startDate, endDate, month, year } = req.query;

      // Verify parent has access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "viewAttendance",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this student's attendance",
        });
        return;
      }

      // Build date range
      let dateQuery: any = {};

      if (startDate && endDate) {
        dateQuery = {
          date: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        };
      } else if (month && year) {
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
        dateQuery = { date: { $gte: start, $lte: end } };
      } else {
        // Default to current month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
        );
        dateQuery = { date: { $gte: start, $lte: end } };
      }

      const attendance = await Attendance.find({
        studentId,
        ...dateQuery,
      }).sort({ date: -1 });

      // Calculate stats
      const stats: AttendanceStats = {
        totalDays: attendance.length,
        present: attendance.filter((a) => a.status === "present").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        late: attendance.filter((a) => a.status === "late").length,
        excused: attendance.filter((a) => a.status === "excused").length,
        attendanceRate: 0,
      };

      stats.attendanceRate =
        stats.totalDays > 0
          ? Math.round(
              ((stats.present + stats.late) / stats.totalDays) * 100 * 10,
            ) / 10
          : 0;

      res.json({
        success: true,
        data: {
          records: attendance,
          stats,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch attendance",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/timetable
   * Get timetable for a specific child
   */
  async getChildTimetable(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      // Verify parent has access
      const hasAccess = await this.verifyParentAccess(parentUserId, studentId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this student's timetable",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      // Get current timetable
      const timetable = await Timetable.findOne({
        classId: student.classId,
        effectiveFrom: { $lte: new Date() },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gt: new Date() } }],
      });

      if (!timetable) {
        res.json({
          success: true,
          data: null,
          message: "No timetable found for this class",
        });
        return;
      }

      res.json({
        success: true,
        data: timetable,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch timetable",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/results
   * Get exam results for a specific child
   */
  async getChildResults(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { academicYear, term, examType } = req.query;

      // Verify parent has access
      const hasAccess = await this.verifyParentAccess(parentUserId, studentId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to view this student's results",
        });
        return;
      }

      // Build query
      const query: any = {
        studentId,
        publishedAt: { $ne: null }, // Only show published results
      };
      if (academicYear) query.academicYear = academicYear;
      if (term) query.term = term;
      if (examType) query.examType = examType;

      const results = await Result.find(query).sort({ publishedAt: -1 });

      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch results",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/announcements
   * Get all announcements relevant to the parent
   */
  async getAnnouncements(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { page = 1, limit = 20, type } = req.query;

      // Get linked children to find schools and classes
      const links = await ParentStudentLink.find({
        parentUserId,
        verifiedAt: { $ne: null },
      });

      const studentIds = links.map((l) => l.studentId);
      const students = await Student.find({ _id: { $in: studentIds } });

      const schoolIds = [...new Set(students.map((s) => s.schoolId))];
      const classIds = [...new Set(students.map((s) => s.classId))];

      // Build query using $and to combine multiple $or conditions
      const query: Record<string, unknown> = {
        schoolId: { $in: schoolIds },
        targetAudience: { $in: ["all", "parents"] },
        publishAt: { $lte: new Date() },
        $and: [
          {
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          },
          {
            $or: [
              { targetClasses: { $size: 0 } }, // For all classes
              { targetClasses: { $in: classIds } }, // Or specific classes
            ],
          },
        ],
      };

      if (type) {
        query.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [announcements, total] = await Promise.all([
        Announcement.find(query)
          .sort({ isPinned: -1, publishAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Announcement.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: announcements,
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
        message: "Failed to fetch announcements",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/children/:studentId/report
   * Get comprehensive grade report for a child
   */
  async getChildReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { academicYear, term } = req.query;

      // Verify parent has access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "viewGrades",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to view this student's report",
        });
        return;
      }

      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          message: "Student not found",
        });
        return;
      }

      const studentClass = await Class.findById(student.classId);

      // Get grades
      const query: any = { studentId };
      if (academicYear) query.academicYear = academicYear;
      if (term) query.term = term;

      const grades = await Grade.find(query);

      // Build report
      const subjectMap = new Map<string, any>();

      for (const grade of grades) {
        if (!subjectMap.has(grade.subjectId)) {
          subjectMap.set(grade.subjectId, {
            name: grade.subjectId, // TODO: Get subject name from subjects collection
            currentGrade:
              grade.letterGrade || this.calculateLetterGrade(grade.percentage),
            percentage: grade.percentage,
            trend: "stable" as const,
            assessments: [],
          });
        }

        const subject = subjectMap.get(grade.subjectId)!;
        subject.assessments.push(
          ...grade.assessments.map((a) => ({
            name: a.name,
            score: a.score,
            maxScore: a.maxScore,
            date: a.date,
          })),
        );
      }

      const subjects = Array.from(subjectMap.values());
      const overallPercentage =
        subjects.length > 0
          ? subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length
          : 0;

      const report: GradeReport = {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        className: studentClass?.name || "Unknown",
        academicYear:
          (academicYear as string) || new Date().getFullYear().toString(),
        term: (term as string) || "Current",
        subjects,
        overallPercentage,
        overallGrade: this.calculateLetterGrade(overallPercentage),
      };

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: error.message,
      });
    }
  }

  /**
   * Helper: Verify parent has access to a student
   */
  private async verifyParentAccess(
    parentUserId: string,
    studentId: string,
    permission?: keyof IParentStudentLink["permissions"],
  ): Promise<boolean> {
    const link = await ParentStudentLink.findOne({
      parentUserId,
      studentId,
      verifiedAt: { $ne: null },
    });

    if (!link) return false;

    if (permission && !link.permissions[permission]) {
      return false;
    }

    return true;
  }

  /**
   * Helper: Calculate letter grade from percentage
   */
  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 90) return "A+";
    if (percentage >= 85) return "A";
    if (percentage >= 80) return "A-";
    if (percentage >= 75) return "B+";
    if (percentage >= 70) return "B";
    if (percentage >= 65) return "B-";
    if (percentage >= 60) return "C+";
    if (percentage >= 55) return "C";
    if (percentage >= 50) return "C-";
    if (percentage >= 45) return "D";
    return "F";
  }
}

// Import the interface for type checking
import { IParentStudentLink } from "../models";

export default new ParentController();
