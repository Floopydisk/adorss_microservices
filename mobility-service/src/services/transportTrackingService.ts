/**
 * Transport Tracking Service
 *
 * Handles all transport tracking operations for school transport.
 * This service is called by the Education Service to get transport status,
 * ETA, and tracking information for students.
 *
 * TODO: Replace mock data with actual database queries and GPS integration
 */

import {
  GetPassengerStatusResponse,
  GetRouteTrackingResponse,
  GetETAResponse,
  PassengerTransportStatus,
  PassengerTripLog,
  NotifyAbsenceResponse,
  TripType,
} from "../types";
import {
  mockPassengers,
  mockTrips,
  mockTripTracking,
  mockPassengerTripLogs,
  getPassengerByStudentId,
  getRouteById,
  getDriverById,
  getVehicleById,
  mockETAForStop,
} from "../data/mockData";

class TransportTrackingService {
  /**
   * Get passenger transport status by student ID
   * Called by Education Service: GET /api/mobility/internal/passengers/:studentId/status
   */
  async getPassengerStatus(
    studentId: string,
    date?: string,
  ): Promise<GetPassengerStatusResponse> {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Find passenger by student ID
    const passenger = getPassengerByStudentId(studentId);

    if (!passenger) {
      return {
        passenger: null,
        route: null,
        currentTrip: null,
        tracking: null,
        todayLog: null,
        status: "no_service",
      };
    }

    // Get the route
    const route = getRouteById(passenger.routeId);

    // Determine trip type based on time of day
    const currentHour = new Date().getHours();
    const tripType: TripType =
      currentHour < 12 ? "morning_pickup" : "afternoon_dropoff";

    // Find today's trip
    const currentTrip = mockTrips.find(
      (t) =>
        t.routeId === passenger.routeId &&
        t.date === targetDate &&
        t.type === tripType,
    );

    // Get tracking data if trip is active
    const tracking =
      currentTrip?.status === "in_progress" ? mockTripTracking : null;

    // Get today's log for this passenger
    const todayLog = mockPassengerTripLogs.find(
      (log) =>
        log.passengerId === passenger.id &&
        log.date === targetDate &&
        log.tripType === tripType,
    );

    // Determine status
    const status = this.determinePassengerStatus(
      passenger,
      currentTrip,
      todayLog,
      tracking,
    );

    return {
      passenger,
      route: route || null,
      currentTrip: currentTrip || null,
      tracking,
      todayLog: todayLog || null,
      status,
    };
  }

  /**
   * Get route tracking data
   * Called by Education Service: GET /api/mobility/internal/routes/:routeId/tracking
   */
  async getRouteTracking(
    routeId: string,
    includeStops = true,
    includeVehicle = true,
  ): Promise<GetRouteTrackingResponse> {
    const route = getRouteById(routeId);

    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }

    // Check if there's an active trip on this route
    const today = new Date().toISOString().split("T")[0];
    const activeTrip = mockTrips.find(
      (t) =>
        t.routeId === routeId && t.date === today && t.status === "in_progress",
    );

    const tracking = activeTrip ? mockTripTracking : null;

    let vehicle = undefined;
    let driver = undefined;

    if (includeVehicle && route.vehicleId) {
      vehicle = getVehicleById(route.vehicleId);
    }

    if (route.driverId) {
      driver = getDriverById(route.driverId);
    }

    return {
      tracking,
      route: includeStops ? route : { ...route, stops: [] },
      vehicle,
      driver,
      isActive: !!activeTrip,
    };
  }

  /**
   * Get ETA for a specific stop
   * Called by Education Service: GET /api/mobility/internal/routes/:routeId/eta
   */
  async getETA(
    routeId: string,
    stopId: string,
    _tripType?: TripType,
  ): Promise<GetETAResponse> {
    const route = getRouteById(routeId);

    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new Error(`Stop not found: ${stopId}`);
    }

    const eta = mockETAForStop(stopId);

    // Get vehicle info if route has a vehicle
    let vehicleInfo = undefined;
    if (route.vehicleId) {
      const vehicle = getVehicleById(route.vehicleId);
      if (vehicle) {
        vehicleInfo = {
          id: vehicle.id,
          distanceAway: eta.factors.distanceRemaining,
          stopsAway: eta.factors.stopsRemaining,
        };
      }
    }

    return {
      eta,
      vehicle: vehicleInfo,
    };
  }

  /**
   * Notify absence for a passenger
   * Called by Education Service: POST /api/mobility/internal/passengers/:studentId/notify-absence
   */
  async notifyAbsence(
    studentId: string,
    date: string,
    tripType: "morning" | "afternoon" | "both",
    reason?: string,
    notifiedBy?: string,
  ): Promise<NotifyAbsenceResponse> {
    const passenger = getPassengerByStudentId(studentId);

    if (!passenger) {
      throw new Error(`Passenger not found for student: ${studentId}`);
    }

    // TODO: Actually store this notification and update trip planning
    // For now, just return mock success

    console.log(
      `[MOCK] Absence notification received for student ${studentId}`,
      {
        date,
        tripType,
        reason,
        notifiedBy,
      },
    );

    return {
      success: true,
      notificationId: `notif-${Date.now()}`,
      acknowledged: false,
    };
  }

  /**
   * Get transport history for a passenger
   */
  async getPassengerHistory(
    studentId: string,
    startDate: string,
    endDate: string,
    tripType?: "morning" | "afternoon",
  ): Promise<{
    history: PassengerTripLog[];
    summary: {
      totalTrips: number;
      completedTrips: number;
      missedTrips: number;
      onTimePercentage: number;
    };
  }> {
    const passenger = getPassengerByStudentId(studentId);

    if (!passenger) {
      return {
        history: [],
        summary: {
          totalTrips: 0,
          completedTrips: 0,
          missedTrips: 0,
          onTimePercentage: 0,
        },
      };
    }

    // Filter logs by date range and trip type
    let history = mockPassengerTripLogs.filter(
      (log) =>
        log.passengerId === passenger.id &&
        log.date >= startDate &&
        log.date <= endDate,
    );

    if (tripType) {
      const tripTypeMap = {
        morning: "morning_pickup",
        afternoon: "afternoon_dropoff",
      };
      history = history.filter((log) => log.tripType === tripTypeMap[tripType]);
    }

    // Calculate summary (mock data)
    const completedTrips = history.filter(
      (log) => log.status === "boarded" || log.status === "dropped_off",
    ).length;
    const missedTrips = history.filter((log) => log.status === "absent").length;

    return {
      history,
      summary: {
        totalTrips: history.length,
        completedTrips,
        missedTrips,
        onTimePercentage:
          history.length > 0
            ? Math.round((completedTrips / history.length) * 100)
            : 0,
      },
    };
  }

  /**
   * Determine the current transport status for a passenger
   */
  private determinePassengerStatus(
    passenger: (typeof mockPassengers)[0],
    trip: (typeof mockTrips)[0] | undefined,
    log: PassengerTripLog | undefined,
    tracking: typeof mockTripTracking | null,
  ): PassengerTransportStatus {
    // No trip scheduled for today
    if (!trip) {
      return "no_trip_scheduled";
    }

    // Trip completed
    if (trip.status === "completed") {
      return "trip_completed";
    }

    // Trip cancelled
    if (trip.status === "cancelled") {
      return "no_trip_scheduled";
    }

    // Check log status
    if (log) {
      switch (log.status) {
        case "absent":
          return "absent";
        case "picked_up_early":
          return "picked_up_early";
        case "dropped_off":
          return "dropped_off";
        case "boarded":
          return "on_vehicle";
      }
    }

    // Trip is in progress
    if (trip.status === "in_progress" && tracking) {
      // Find passenger's stop index
      const route = getRouteById(trip.routeId);
      if (route) {
        const passengerStopIndex = route.stops.findIndex(
          (s) => s.id === passenger.stopId,
        );

        // Vehicle has passed passenger's stop
        if (tracking.currentStopIndex > passengerStopIndex) {
          // If morning trip and passenger hasn't boarded, they missed it
          if (trip.type === "morning_pickup" && !log) {
            return "absent";
          }
          return "dropped_off";
        }

        // Vehicle is at or approaching passenger's stop
        if (tracking.currentStopIndex === passengerStopIndex - 1) {
          return "vehicle_approaching";
        }
      }
    }

    // Default: waiting for pickup
    return "awaiting_pickup";
  }
}

export default new TransportTrackingService();
