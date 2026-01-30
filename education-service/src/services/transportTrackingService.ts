import {
  TransportRoute,
  TransportSchedule,
  TransportLog,
  StudentTransport,
  Vehicle,
  ITransportRoute,
  ITransportSchedule,
  ITransportLog,
} from "../models/transportModels";
import { ParentStudentLink } from "../models";

/**
 * TransportTrackingService
 *
 * Handles all transport-related calculations and tracking logic:
 * - Real-time route tracking
 * - ETA calculations using IRT (Intelligent Route Tracking)
 * - Status management
 * - Parent notifications
 */
class TransportTrackingService {
  // Average speeds for ETA calculation (km/h)
  private readonly AVERAGE_SPEEDS = {
    urban: 25, // City traffic
    suburban: 40, // Residential areas
    highway: 60, // Major roads
    school_zone: 15, // Near schools
  };

  // Buffer times (minutes)
  private readonly BUFFERS = {
    stop_time: 2, // Time at each stop
    traffic_buffer: 5, // General traffic buffer
    loading_buffer: 1, // Per student boarding time
  };

  /**
   * Get current transport status for a student
   */
  async getStudentTransportStatus(
    studentId: string,
    parentUserId: string,
  ): Promise<StudentTransportStatus> {
    // Verify parent has access
    const hasAccess = await this.verifyParentAccess(parentUserId, studentId);
    if (!hasAccess) {
      throw new Error("Unauthorized access to student transport information");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get student transport assignment
    const studentTransport = await StudentTransport.findOne({
      studentId,
      status: "active",
    });

    if (!studentTransport) {
      return {
        hasTransport: false,
        message: "No transport service assigned to this student",
        status: "no_service",
      };
    }

    // Get the route
    const route = await TransportRoute.findById(studentTransport.routeId);
    if (!route) {
      return {
        hasTransport: true,
        message: "Transport route not found",
        status: "error",
      };
    }

    // Determine current trip type based on time
    const currentHour = new Date().getHours();
    const tripType = currentHour < 12 ? "morning_pickup" : "afternoon_dropoff";

    // Get today's schedule
    const schedule = await TransportSchedule.findOne({
      routeId: route._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      tripType,
    });

    // Get today's transport log for this student
    const transportLog = await TransportLog.findOne({
      studentId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      tripType,
    });

    // Build response
    const pickupStop = route.stops.find(
      (s) => s.stopId === studentTransport.pickupStopId,
    );
    const dropoffStop = route.stops.find(
      (s) => s.stopId === studentTransport.dropoffStopId,
    );

    // If no active schedule for today
    if (!schedule) {
      return {
        hasTransport: true,
        status: "no_scheduled_trip",
        message: this.getNoTripMessage(tripType),
        route: {
          id: route._id.toString(),
          name: route.name,
          code: route.code,
        },
        pickupLocation: pickupStop
          ? {
              name: pickupStop.name,
              address: pickupStop.address,
              coordinates: pickupStop.coordinates,
              scheduledTime:
                tripType === "morning_pickup"
                  ? pickupStop.estimatedArrivalTime
                  : undefined,
            }
          : undefined,
        dropoffLocation: dropoffStop
          ? {
              name: dropoffStop.name,
              address: dropoffStop.address,
              coordinates: dropoffStop.coordinates,
              scheduledTime:
                tripType === "afternoon_dropoff"
                  ? dropoffStop.estimatedArrivalTime
                  : undefined,
            }
          : undefined,
        driver: route.driverName
          ? {
              name: route.driverName,
              phone: route.driverPhone,
            }
          : undefined,
      };
    }

    // Calculate ETA based on current status
    const etaInfo = await this.calculateETA(
      schedule,
      route,
      tripType === "morning_pickup"
        ? studentTransport.pickupStopId
        : studentTransport.dropoffStopId,
    );

    // Get student's current status
    const studentStatus = this.getStudentStatus(
      schedule,
      transportLog,
      tripType,
    );

    return {
      hasTransport: true,
      status: studentStatus.status,
      message: studentStatus.message,
      route: {
        id: route._id.toString(),
        name: route.name,
        code: route.code,
      },
      schedule: {
        id: schedule._id.toString(),
        tripType,
        status: schedule.status,
        scheduledStartTime: schedule.scheduledStartTime,
        actualStartTime: schedule.actualStartTime,
        delay: schedule.delay,
        delayReason: schedule.delayReason,
      },
      currentLocation: schedule.currentLocation
        ? {
            latitude: schedule.currentLocation.latitude,
            longitude: schedule.currentLocation.longitude,
            heading: schedule.currentLocation.heading,
            speed: schedule.currentLocation.speed,
            updatedAt: schedule.currentLocation.updatedAt,
          }
        : undefined,
      pickupLocation: pickupStop
        ? {
            name: pickupStop.name,
            address: pickupStop.address,
            coordinates: pickupStop.coordinates,
            scheduledTime: pickupStop.estimatedArrivalTime,
            isCompleted: this.isStopCompleted(schedule, pickupStop.stopId),
          }
        : undefined,
      dropoffLocation: dropoffStop
        ? {
            name: dropoffStop.name,
            address: dropoffStop.address,
            coordinates: dropoffStop.coordinates,
            scheduledTime: dropoffStop.estimatedArrivalTime,
            isCompleted: this.isStopCompleted(schedule, dropoffStop.stopId),
          }
        : undefined,
      eta: etaInfo,
      driver: route.driverName
        ? {
            name: route.driverName,
            phone: route.driverPhone,
          }
        : undefined,
      attendant: route.attendantName
        ? {
            name: route.attendantName,
            phone: route.attendantPhone,
          }
        : undefined,
      studentOnBus: schedule.studentsOnboard.includes(studentId),
      events: transportLog?.events.slice(-5) || [],
    };
  }

  /**
   * Calculate ETA using Intelligent Route Tracking
   */
  async calculateETA(
    schedule: ITransportSchedule,
    route: ITransportRoute,
    targetStopId: string,
  ): Promise<ETAInfo | null> {
    // If trip not started or completed
    if (schedule.status === "scheduled" || schedule.status === "completed") {
      const targetStop = route.stops.find((s) => s.stopId === targetStopId);
      if (targetStop) {
        return {
          estimatedArrival: this.parseTimeToDate(
            targetStop.estimatedArrivalTime,
          ),
          source: "scheduled",
          confidence: "high",
          minutesAway: null,
          stopsAway: null,
        };
      }
      return null;
    }

    // If cancelled
    if (schedule.status === "cancelled") {
      return null;
    }

    // Find target stop in route
    const targetStop = route.stops.find((s) => s.stopId === targetStopId);
    if (!targetStop) return null;

    // If target stop is already completed
    const targetCompleted = schedule.completedStops.find(
      (cs) => cs.stopId === targetStopId,
    );
    if (targetCompleted) {
      return {
        estimatedArrival: targetCompleted.arrivedAt,
        actualArrival: targetCompleted.arrivedAt,
        source: "actual",
        confidence: "confirmed",
        minutesAway: 0,
        stopsAway: 0,
      };
    }

    // Calculate based on current position
    const currentStopIndex = schedule.currentStopIndex;
    const targetStopIndex = route.stops.findIndex(
      (s) => s.stopId === targetStopId,
    );

    if (targetStopIndex < currentStopIndex) {
      // Target stop already passed
      return null;
    }

    const stopsAway = targetStopIndex - currentStopIndex;

    // Calculate time based on:
    // 1. Remaining stops and their scheduled times
    // 2. Current delay
    // 3. Historical data (if available)
    // 4. Current speed if available

    let estimatedMinutes = 0;

    // If we have current location and speed, use real-time calculation
    if (schedule.currentLocation && schedule.currentLocation.speed) {
      const speed =
        schedule.currentLocation.speed || this.AVERAGE_SPEEDS.suburban;

      // Calculate distance to target stop
      const distanceToTarget = this.calculateDistanceToStop(
        schedule.currentLocation,
        targetStop.coordinates,
        route.stops.slice(currentStopIndex, targetStopIndex + 1),
      );

      // Time = distance / speed (converted to minutes)
      estimatedMinutes = (distanceToTarget / speed) * 60;

      // Add stop times for intermediate stops
      estimatedMinutes += stopsAway * this.BUFFERS.stop_time;

      // Add current delay
      estimatedMinutes += schedule.delay;
    } else {
      // Use scheduled times with delay adjustment
      const scheduledTime = targetStop.estimatedDuration;
      const currentStop = route.stops[currentStopIndex];
      const elapsedScheduled = currentStop ? currentStop.estimatedDuration : 0;

      estimatedMinutes = scheduledTime - elapsedScheduled + schedule.delay;
    }

    const eta = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    // Determine confidence level
    let confidence: "high" | "medium" | "low" = "medium";
    if (stopsAway <= 2 && schedule.currentLocation) {
      confidence = "high";
    } else if (stopsAway > 5 || schedule.delay > 15) {
      confidence = "low";
    }

    return {
      estimatedArrival: eta,
      source: schedule.currentLocation ? "real_time" : "calculated",
      confidence,
      minutesAway: Math.round(estimatedMinutes),
      stopsAway,
      delayAdjusted: schedule.delay > 0,
    };
  }

  /**
   * Get real-time route tracking data
   */
  async getRouteTracking(
    studentId: string,
    parentUserId: string,
  ): Promise<RouteTrackingData | null> {
    // Verify access
    const hasAccess = await this.verifyParentAccess(parentUserId, studentId);
    if (!hasAccess) {
      throw new Error("Unauthorized access");
    }

    const studentTransport = await StudentTransport.findOne({
      studentId,
      status: "active",
    });

    if (!studentTransport) return null;

    const route = await TransportRoute.findById(studentTransport.routeId);
    if (!route) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentHour = new Date().getHours();
    const tripType = currentHour < 12 ? "morning_pickup" : "afternoon_dropoff";

    const schedule = await TransportSchedule.findOne({
      routeId: route._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      tripType,
      status: { $in: ["in_progress", "delayed"] },
    });

    if (!schedule) {
      return null; // No active trip
    }

    // Get vehicle info if available
    let vehicle = null;
    if (schedule.vehicleId) {
      vehicle = await Vehicle.findById(schedule.vehicleId);
    }

    // Build stop progress
    const stopProgress = route.stops.map((stop, index) => {
      const completed = schedule.completedStops.find(
        (cs) => cs.stopId === stop.stopId,
      );

      let status: "pending" | "approaching" | "arrived" | "completed" =
        "pending";
      if (completed?.departedAt) {
        status = "completed";
      } else if (completed?.arrivedAt) {
        status = "arrived";
      } else if (index === schedule.currentStopIndex) {
        status = "approaching";
      }

      return {
        stopId: stop.stopId,
        name: stop.name,
        order: stop.order,
        scheduledTime: stop.estimatedArrivalTime,
        actualArrival: completed?.arrivedAt,
        actualDeparture: completed?.departedAt,
        status,
        isStudentStop:
          stop.stopId === studentTransport.pickupStopId ||
          stop.stopId === studentTransport.dropoffStopId,
      };
    });

    return {
      route: {
        id: route._id.toString(),
        name: route.name,
        code: route.code,
        stops: route.stops.map((s) => ({
          stopId: s.stopId,
          name: s.name,
          coordinates: s.coordinates,
          order: s.order,
        })),
      },
      schedule: {
        id: schedule._id.toString(),
        tripType,
        status: schedule.status,
        startedAt: schedule.actualStartTime,
        delay: schedule.delay,
      },
      currentLocation: schedule.currentLocation || null,
      vehicle: vehicle
        ? {
            registrationNumber: vehicle.registrationNumber,
            type: vehicle.type,
            make: vehicle.make,
            model: vehicle.vehicleModel,
          }
        : null,
      stopProgress,
      studentsOnboard: schedule.studentsOnboard.length,
      studentIsOnboard: schedule.studentsOnboard.includes(studentId),
    };
  }

  /**
   * Get transport history for a student
   */
  async getTransportHistory(
    studentId: string,
    parentUserId: string,
    options: { startDate?: Date; endDate?: Date; limit?: number } = {},
  ): Promise<TransportHistoryEntry[]> {
    const hasAccess = await this.verifyParentAccess(parentUserId, studentId);
    if (!hasAccess) {
      throw new Error("Unauthorized access");
    }

    const query: Record<string, unknown> = { studentId };

    if (options.startDate || options.endDate) {
      query.date = {};
      if (options.startDate) {
        (query.date as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.date as Record<string, Date>).$lte = options.endDate;
      }
    }

    const logs = await TransportLog.find(query)
      .sort({ date: -1 })
      .limit(options.limit || 30);

    return logs.map((log) => ({
      date: log.date,
      tripType: log.tripType,
      status: log.status,
      pickupTime: log.pickupTime,
      dropoffTime: log.dropoffTime,
      pickedUpBy: log.pickedUpBy,
      events: log.events,
    }));
  }

  /**
   * Helper: Calculate distance between points considering route path
   */
  private calculateDistanceToStop(
    currentLocation: { latitude: number; longitude: number },
    targetCoordinates: { latitude: number; longitude: number },
    intermediateStops: {
      coordinates: { latitude: number; longitude: number };
    }[],
  ): number {
    let totalDistance = 0;
    let prevPoint = currentLocation;

    for (const stop of intermediateStops) {
      totalDistance += this.haversineDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        stop.coordinates.latitude,
        stop.coordinates.longitude,
      );
      prevPoint = stop.coordinates;
    }

    return totalDistance;
  }

  /**
   * Helper: Haversine distance formula (km)
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Helper: Parse time string to Date
   */
  private parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Helper: Check if a stop has been completed
   */
  private isStopCompleted(
    schedule: ITransportSchedule,
    stopId: string,
  ): boolean {
    return schedule.completedStops.some(
      (cs) => cs.stopId === stopId && cs.departedAt,
    );
  }

  /**
   * Helper: Get message for no scheduled trip
   */
  private getNoTripMessage(tripType: string): string {
    const now = new Date();
    const hour = now.getHours();

    if (tripType === "morning_pickup" && hour < 6) {
      return "Morning pickup has not started yet. Check back closer to pickup time.";
    } else if (tripType === "morning_pickup" && hour > 9) {
      return "Morning pickup has ended. Next scheduled trip is afternoon dropoff.";
    } else if (tripType === "afternoon_dropoff" && hour < 14) {
      return "Afternoon dropoff has not started yet.";
    } else if (tripType === "afternoon_dropoff" && hour > 18) {
      return "No more scheduled trips for today.";
    }

    return "No transport scheduled at this time.";
  }

  /**
   * Helper: Determine student's current status
   */
  private getStudentStatus(
    schedule: ITransportSchedule,
    transportLog: ITransportLog | null,
    tripType: string,
  ): { status: string; message: string } {
    if (!transportLog) {
      if (schedule.status === "scheduled") {
        return {
          status: "awaiting_trip_start",
          message: "Trip has not started yet",
        };
      }
      return {
        status: "awaiting_pickup",
        message:
          tripType === "morning_pickup"
            ? "Awaiting pickup. Bus is on the way."
            : "Waiting at school for departure.",
      };
    }

    switch (transportLog.status) {
      case "awaiting_pickup":
        return {
          status: "awaiting_pickup",
          message: "Bus is on the way to pickup location",
        };
      case "on_bus":
      case "in_transit":
        return {
          status: "in_transit",
          message:
            tripType === "morning_pickup"
              ? "Student is on the bus, heading to school"
              : "Student is on the bus, heading home",
        };
      case "dropped_off":
        return {
          status: "dropped_off",
          message:
            tripType === "morning_pickup"
              ? "Student has arrived at school"
              : "Student has been dropped off",
        };
      case "picked_up":
        return {
          status: "picked_up",
          message: "Student has been picked up by authorized person",
        };
      case "no_show":
        return {
          status: "no_show",
          message: "Student was not at pickup location",
        };
      case "absent":
        return {
          status: "absent",
          message: "Student marked absent for today",
        };
      default:
        return {
          status: "unknown",
          message: "Status unknown",
        };
    }
  }

  /**
   * Helper: Verify parent access to student
   */
  private async verifyParentAccess(
    parentUserId: string,
    studentId: string,
  ): Promise<boolean> {
    const link = await ParentStudentLink.findOne({
      parentUserId,
      studentId,
      verifiedAt: { $ne: null },
    });

    if (!link) return false;
    return link.permissions.trackLocation;
  }
}

// Type definitions
export interface StudentTransportStatus {
  hasTransport: boolean;
  status: string;
  message: string;
  route?: {
    id: string;
    name: string;
    code: string;
  };
  schedule?: {
    id: string;
    tripType: string;
    status: string;
    scheduledStartTime: Date;
    actualStartTime?: Date;
    delay: number;
    delayReason?: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  };
  pickupLocation?: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    scheduledTime?: string;
    isCompleted?: boolean;
  };
  dropoffLocation?: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    scheduledTime?: string;
    isCompleted?: boolean;
  };
  eta?: ETAInfo | null;
  driver?: {
    name: string;
    phone?: string;
  };
  attendant?: {
    name: string;
    phone?: string;
  };
  studentOnBus?: boolean;
  events?: ITransportLog["events"];
}

export interface ETAInfo {
  estimatedArrival: Date;
  actualArrival?: Date;
  source: "scheduled" | "real_time" | "calculated" | "actual";
  confidence: "high" | "medium" | "low" | "confirmed";
  minutesAway: number | null;
  stopsAway: number | null;
  delayAdjusted?: boolean;
}

export interface RouteTrackingData {
  route: {
    id: string;
    name: string;
    code: string;
    stops: {
      stopId: string;
      name: string;
      coordinates: { latitude: number; longitude: number };
      order: number;
    }[];
  };
  schedule: {
    id: string;
    tripType: string;
    status: string;
    startedAt?: Date;
    delay: number;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  } | null;
  vehicle: {
    registrationNumber: string;
    type: string;
    make: string;
    model: string;
  } | null;
  stopProgress: {
    stopId: string;
    name: string;
    order: number;
    scheduledTime: string;
    actualArrival?: Date;
    actualDeparture?: Date;
    status: "pending" | "approaching" | "arrived" | "completed";
    isStudentStop: boolean;
  }[];
  studentsOnboard: number;
  studentIsOnboard: boolean;
}

export interface TransportHistoryEntry {
  date: Date;
  tripType: string;
  status: string;
  pickupTime?: Date;
  dropoffTime?: Date;
  pickedUpBy?: {
    name: string;
    phone: string;
    relationship: string;
  };
  events: ITransportLog["events"];
}

export default new TransportTrackingService();
