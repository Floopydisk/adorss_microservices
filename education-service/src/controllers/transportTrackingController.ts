import { Response } from "express";
import { ParentStudentLink, Student, IStudent } from "../models";
import {
  TransportRoute,
  TransportSchedule,
  TransportLog,
  StudentTransport,
} from "../models/transportModels";
import { AuthRequest } from "../types";
import transportTrackingService from "../services/transportTrackingService";

/**
 * TransportTrackingController - Handles all transport tracking features for parents
 *
 * Parents can:
 * - View real-time location of their ward's school bus
 * - Get ETA for pickup/dropoff
 * - View transport history
 * - Get route information
 * - Receive transport status updates
 */
class TransportTrackingController {
  /**
   * GET /parent/wards/:studentId/transport/status
   * Get current transport status for a ward
   * Returns: current status, location, ETA, driver info
   */
  async getTransportStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      const status = await transportTrackingService.getStudentTransportStatus(
        studentId,
        parentUserId,
      );

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to track this ward's transport",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch transport status",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/transport/track
   * Get real-time route tracking data (for map display)
   */
  async getRouteTracking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      const trackingData = await transportTrackingService.getRouteTracking(
        studentId,
        parentUserId,
      );

      if (!trackingData) {
        res.json({
          success: true,
          data: null,
          message: "No active transport trip at this time",
        });
        return;
      }

      res.json({
        success: true,
        data: trackingData,
      });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to track this ward's transport",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch route tracking data",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/transport/eta
   * Get ETA for current trip
   */
  async getETA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { tripType } = req.query;

      // Verify access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "trackLocation",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to track this ward's transport",
        });
        return;
      }

      const studentTransport = await StudentTransport.findOne({
        studentId,
        status: "active",
      });

      if (!studentTransport) {
        res.json({
          success: true,
          data: null,
          message: "No transport service assigned to this ward",
        });
        return;
      }

      const route = await TransportRoute.findById(studentTransport.routeId);
      if (!route) {
        res.json({
          success: true,
          data: null,
          message: "Transport route not found",
        });
        return;
      }

      // Determine trip type
      const currentHour = new Date().getHours();
      const determinedTripType =
        (tripType as string) ||
        (currentHour < 12 ? "morning_pickup" : "afternoon_dropoff");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedule = await TransportSchedule.findOne({
        routeId: route._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        tripType: determinedTripType,
      });

      if (!schedule) {
        // Return scheduled times from route
        const targetStop =
          determinedTripType === "morning_pickup"
            ? route.stops.find(
                (s) => s.stopId === studentTransport.pickupStopId,
              )
            : route.stops.find(
                (s) => s.stopId === studentTransport.dropoffStopId,
              );

        res.json({
          success: true,
          data: {
            hasActiveTrip: false,
            scheduledTime: targetStop?.estimatedArrivalTime,
            stopName: targetStop?.name,
            tripType: determinedTripType,
            message: "No active trip. Showing scheduled time.",
          },
        });
        return;
      }

      // Calculate ETA
      const targetStopId =
        determinedTripType === "morning_pickup"
          ? studentTransport.pickupStopId
          : studentTransport.dropoffStopId;

      const eta = await transportTrackingService.calculateETA(
        schedule,
        route,
        targetStopId,
      );

      res.json({
        success: true,
        data: {
          hasActiveTrip: true,
          tripType: determinedTripType,
          tripStatus: schedule.status,
          eta,
          delay: schedule.delay,
          delayReason: schedule.delayReason,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to calculate ETA",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/transport/history
   * Get transport history for a ward
   */
  async getTransportHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { startDate, endDate, limit } = req.query;

      const options: { startDate?: Date; endDate?: Date; limit?: number } = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (limit) options.limit = Number(limit);

      const history = await transportTrackingService.getTransportHistory(
        studentId,
        parentUserId,
        options,
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this ward's transport history",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch transport history",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/transport/route
   * Get route information for a ward
   */
  async getRouteInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      // Verify access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "trackLocation",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this ward's transport information",
        });
        return;
      }

      const studentTransport = await StudentTransport.findOne({
        studentId,
        status: "active",
      });

      if (!studentTransport) {
        res.json({
          success: true,
          data: null,
          message: "No transport service assigned to this ward",
        });
        return;
      }

      const route = await TransportRoute.findById(studentTransport.routeId);
      if (!route) {
        res.json({
          success: true,
          data: null,
          message: "Route not found",
        });
        return;
      }

      // Find pickup and dropoff stops
      const pickupStop = route.stops.find(
        (s) => s.stopId === studentTransport.pickupStopId,
      );
      const dropoffStop = route.stops.find(
        (s) => s.stopId === studentTransport.dropoffStopId,
      );
      const schoolStop = route.stops.find((s) => s.isSchool);

      res.json({
        success: true,
        data: {
          route: {
            id: route._id,
            name: route.name,
            code: route.code,
            description: route.description,
            type: route.type,
            status: route.status,
          },
          driver: route.driverId
            ? {
                name: route.driverName,
                phone: route.driverPhone,
              }
            : null,
          attendant: route.attendantId
            ? {
                name: route.attendantName,
                phone: route.attendantPhone,
              }
            : null,
          schedule: {
            morningDeparture: route.morningDepartureTime,
            afternoonDeparture: route.afternoonDepartureTime,
            estimatedDuration: route.estimatedTotalDuration,
          },
          studentStop: {
            pickup: pickupStop
              ? {
                  name: pickupStop.name,
                  address: pickupStop.address,
                  coordinates: pickupStop.coordinates,
                  scheduledTime: pickupStop.estimatedArrivalTime,
                  order: pickupStop.order,
                }
              : null,
            dropoff: dropoffStop
              ? {
                  name: dropoffStop.name,
                  address: dropoffStop.address,
                  coordinates: dropoffStop.coordinates,
                  scheduledTime: dropoffStop.estimatedArrivalTime,
                  order: dropoffStop.order,
                }
              : null,
          },
          school: schoolStop
            ? {
                name: schoolStop.name,
                coordinates: schoolStop.coordinates,
                arrivalTime: schoolStop.estimatedArrivalTime,
              }
            : null,
          allStops: route.stops.map((stop) => ({
            stopId: stop.stopId,
            name: stop.name,
            order: stop.order,
            scheduledTime: stop.estimatedArrivalTime,
            isStudentStop:
              stop.stopId === studentTransport.pickupStopId ||
              stop.stopId === studentTransport.dropoffStopId,
            isSchool: stop.isSchool,
          })),
          transportSettings: {
            authorizedPickupPersons: studentTransport.authorizedPickupPersons,
            requiresAssistance: studentTransport.requiresAssistance,
            specialNotes: studentTransport.specialNotes,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch route information",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/wards/:studentId/transport/today
   * Get today's transport summary for a ward
   */
  async getTodayTransport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;

      // Verify access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "trackLocation",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "You do not have permission to view this ward's transport",
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const studentTransport = await StudentTransport.findOne({
        studentId,
        status: "active",
      });

      if (!studentTransport) {
        res.json({
          success: true,
          data: {
            hasTransport: false,
            message: "No transport service assigned to this ward",
          },
        });
        return;
      }

      // Get today's logs
      const logs = await TransportLog.find({
        studentId,
        date: { $gte: today, $lt: tomorrow },
      });

      // Get today's schedules
      const schedules = await TransportSchedule.find({
        routeId: studentTransport.routeId,
        date: { $gte: today, $lt: tomorrow },
      });

      const route = await TransportRoute.findById(studentTransport.routeId);

      const morningLog = logs.find((l) => l.tripType === "morning_pickup");
      const afternoonLog = logs.find((l) => l.tripType === "afternoon_dropoff");
      const morningSchedule = schedules.find(
        (s) => s.tripType === "morning_pickup",
      );
      const afternoonSchedule = schedules.find(
        (s) => s.tripType === "afternoon_dropoff",
      );

      res.json({
        success: true,
        data: {
          hasTransport: true,
          route: route
            ? {
                name: route.name,
                code: route.code,
              }
            : null,
          morning: {
            scheduled: !!morningSchedule,
            scheduleStatus: morningSchedule?.status,
            studentStatus: morningLog?.status || "not_started",
            pickupTime: morningLog?.pickupTime,
            dropoffTime: morningLog?.dropoffTime,
            events: morningLog?.events || [],
            delay: morningSchedule?.delay || 0,
          },
          afternoon: {
            scheduled: !!afternoonSchedule,
            scheduleStatus: afternoonSchedule?.status,
            studentStatus: afternoonLog?.status || "not_started",
            pickupTime: afternoonLog?.pickupTime,
            dropoffTime: afternoonLog?.dropoffTime,
            pickedUpBy: afternoonLog?.pickedUpBy,
            events: afternoonLog?.events || [],
            delay: afternoonSchedule?.delay || 0,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch today's transport summary",
        error: error.message,
      });
    }
  }

  /**
   * POST /parent/wards/:studentId/transport/notify-absence
   * Notify that ward won't be using transport today
   */
  async notifyAbsence(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);
      const { studentId } = req.params;
      const { date, tripType, reason } = req.body;

      // Verify access
      const hasAccess = await this.verifyParentAccess(
        parentUserId,
        studentId,
        "trackLocation",
      );
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message:
            "You do not have permission to update transport for this ward",
        });
        return;
      }

      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      const studentTransport = await StudentTransport.findOne({
        studentId,
        status: "active",
      });

      if (!studentTransport) {
        res.status(404).json({
          success: false,
          message: "No transport service assigned to this ward",
        });
        return;
      }

      // Create or update transport log with absence status
      const tripTypes = tripType
        ? [tripType]
        : ["morning_pickup", "afternoon_dropoff"];

      for (const type of tripTypes) {
        await TransportLog.findOneAndUpdate(
          {
            studentId,
            date: {
              $gte: targetDate,
              $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
            },
            tripType: type,
          },
          {
            $set: {
              studentId,
              routeId: studentTransport.routeId,
              date: targetDate,
              tripType: type,
              status: "absent",
              parentNotified: true,
              parentNotificationTime: new Date(),
            },
            $push: {
              events: {
                type: "absent",
                timestamp: new Date(),
                notes: reason || "Parent notified absence",
              },
            },
          },
          { upsert: true },
        );
      }

      res.json({
        success: true,
        message: "Absence notification recorded successfully",
        data: {
          date: targetDate,
          tripTypes,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to record absence notification",
        error: error.message,
      });
    }
  }

  /**
   * GET /parent/transport/overview
   * Get transport overview for all wards
   */
  async getTransportOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parentUserId = String(req.user?.sub);

      // Get all linked students
      const links = await ParentStudentLink.find({
        parentUserId,
        verifiedAt: { $ne: null },
        "permissions.trackLocation": true,
      });

      if (links.length === 0) {
        res.json({
          success: true,
          data: [],
          message: "No wards with transport tracking permission",
        });
        return;
      }

      const studentIds = links.map((l) => l.studentId);
      const students = await Student.find({ _id: { $in: studentIds } });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const overviews = await Promise.all(
        students.map(async (student: IStudent) => {
          const transport = await StudentTransport.findOne({
            studentId: student._id,
            status: "active",
          });

          if (!transport) {
            return {
              studentId: student._id,
              studentName: `${student.firstName} ${student.lastName}`,
              hasTransport: false,
            };
          }

          const route = await TransportRoute.findById(transport.routeId);
          const todayLog = await TransportLog.findOne({
            studentId: student._id,
            date: { $gte: today, $lt: tomorrow },
          }).sort({ updatedAt: -1 });

          const currentHour = new Date().getHours();
          const tripType =
            currentHour < 12 ? "morning_pickup" : "afternoon_dropoff";

          const schedule = await TransportSchedule.findOne({
            routeId: transport.routeId,
            date: { $gte: today, $lt: tomorrow },
            tripType,
          });

          return {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            hasTransport: true,
            route: route
              ? {
                  name: route.name,
                  code: route.code,
                }
              : null,
            currentStatus: todayLog?.status || "no_trip",
            tripStatus: schedule?.status || "no_scheduled_trip",
            isOnBus: schedule?.studentsOnboard.includes(student._id.toString()),
            delay: schedule?.delay || 0,
          };
        }),
      );

      res.json({
        success: true,
        data: overviews,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch transport overview",
        error: error.message,
      });
    }
  }

  // ==================== HELPER METHODS ====================

  private async verifyParentAccess(
    parentUserId: string,
    studentId: string,
    permission?: string,
  ): Promise<boolean> {
    const link = await ParentStudentLink.findOne({
      parentUserId,
      studentId,
      verifiedAt: { $ne: null },
    });

    if (!link) return false;

    if (
      permission &&
      !(link.permissions as Record<string, boolean>)[permission]
    ) {
      return false;
    }

    return true;
  }
}

export default new TransportTrackingController();
