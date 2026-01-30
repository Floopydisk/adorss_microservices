/**
 * Mobility Service Client
 *
 * HTTP client for communicating with the Mobility Service.
 * Used by Education Service to get transport tracking data for parents.
 */

const MOBILITY_SERVICE_URL =
  process.env.MOBILITY_SERVICE_URL || "http://localhost:8003";

interface MobilityApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Types matching Mobility Service responses
export interface PassengerStatusResponse {
  passenger: {
    id: string;
    studentId: string;
    routeId: string;
    stopId: string;
    status: string;
    transportType: string;
    guardians: Array<{
      parentId: string;
      name: string;
      phone: string;
      relationship: string;
    }>;
  } | null;
  route: {
    id: string;
    name: string;
    stops: RouteStop[];
    vehicleId?: string;
    driverId?: string;
    totalDistance: number;
    estimatedDuration: number;
  } | null;
  currentTrip: {
    id: string;
    status: string;
    type: string;
    currentStopIndex: number;
    delayMinutes: number;
  } | null;
  tracking: TripTracking | null;
  todayLog: {
    status: string;
    boardedAt?: string;
    droppedOffAt?: string;
  } | null;
  status:
    | "no_service"
    | "awaiting_pickup"
    | "vehicle_approaching"
    | "on_vehicle"
    | "dropped_off"
    | "picked_up_early"
    | "absent"
    | "no_trip_scheduled"
    | "trip_completed";
}

export interface RouteStop {
  id: string;
  index: number;
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  scheduledArrivalTime: string;
  scheduledDepartureTime?: string;
  estimatedWaitTime: number;
  isSchool?: boolean;
  isDepot?: boolean;
  status?: string;
  eta?: string;
}

export interface TripTracking {
  tripId: string;
  routeId: string;
  vehicleId: string;
  status: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: string;
  };
  currentStopIndex: number;
  nextStop?: RouteStop;
  progress: {
    completedStops: number;
    totalStops: number;
    percentComplete: number;
    distanceRemaining: number;
    distanceUnit: string;
  };
  delay: {
    isDelayed: boolean;
    delayMinutes: number;
    reason?: string;
  };
  eta?: ETAInfo;
  lastUpdated: string;
}

export interface ETAInfo {
  stopId?: string;
  stopName?: string;
  scheduledTime: string;
  estimatedTime: string;
  minutesAway: number;
  confidence: "high" | "medium" | "low";
  factors: {
    traffic: string;
    weather: string;
    currentDelay: number;
    distanceRemaining: number;
    stopsRemaining: number;
  };
  calculatedAt: string;
}

export interface RouteTrackingResponse {
  tracking: TripTracking | null;
  route: {
    id: string;
    name: string;
    stops: RouteStop[];
    polyline?: string;
    totalDistance: number;
    estimatedDuration: number;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleModel: string;
    type: string;
    capacity: number;
    features: string[];
    currentLocation?: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      updatedAt: string;
    };
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    photo?: string;
    rating: number;
  };
  isActive: boolean;
}

export interface ETAResponse {
  eta: ETAInfo;
  vehicle?: {
    id: string;
    distanceAway: number;
    stopsAway: number;
  };
}

export interface TransportHistoryResponse {
  history: Array<{
    id: string;
    date: string;
    tripType: string;
    status: string;
    boardedAt?: string;
    droppedOffAt?: string;
    boardedAtStopId?: string;
    droppedOffAtStopId?: string;
    notes?: string;
  }>;
  summary: {
    totalTrips: number;
    completedTrips: number;
    missedTrips: number;
    onTimePercentage: number;
  };
}

export interface NotifyAbsenceResponse {
  success: boolean;
  notificationId: string;
  acknowledged: boolean;
}

class MobilityServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${MOBILITY_SERVICE_URL}/api/mobility/internal`;
  }

  /**
   * Get transport status for a student
   */
  async getPassengerStatus(
    studentId: string,
    date?: string,
  ): Promise<PassengerStatusResponse> {
    const url = new URL(`${this.baseUrl}/passengers/${studentId}/status`);
    if (date) {
      url.searchParams.set("date", date);
    }

    const response = await fetch(url.toString());
    const result =
      (await response.json()) as MobilityApiResponse<PassengerStatusResponse>;

    if (!result.success || !result.data) {
      throw new Error(
        result.error?.message || "Failed to get passenger status",
      );
    }

    return result.data;
  }

  /**
   * Get route tracking data
   */
  async getRouteTracking(
    routeId: string,
    includeStops = true,
    includeVehicle = true,
  ): Promise<RouteTrackingResponse> {
    const url = new URL(`${this.baseUrl}/routes/${routeId}/tracking`);
    url.searchParams.set("includeStops", String(includeStops));
    url.searchParams.set("includeVehicle", String(includeVehicle));

    const response = await fetch(url.toString());
    const result =
      (await response.json()) as MobilityApiResponse<RouteTrackingResponse>;

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "Failed to get route tracking");
    }

    return result.data;
  }

  /**
   * Get ETA for a specific stop
   */
  async getETA(
    routeId: string,
    stopId: string,
    tripType?: "morning_pickup" | "afternoon_dropoff",
  ): Promise<ETAResponse> {
    const url = new URL(`${this.baseUrl}/routes/${routeId}/eta`);
    url.searchParams.set("stopId", stopId);
    if (tripType) {
      url.searchParams.set("tripType", tripType);
    }

    const response = await fetch(url.toString());
    const result = (await response.json()) as MobilityApiResponse<ETAResponse>;

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "Failed to get ETA");
    }

    return result.data;
  }

  /**
   * Get transport history for a student
   */
  async getPassengerHistory(
    studentId: string,
    startDate?: string,
    endDate?: string,
    tripType?: "morning" | "afternoon",
  ): Promise<TransportHistoryResponse> {
    const url = new URL(`${this.baseUrl}/passengers/${studentId}/history`);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);
    if (tripType) url.searchParams.set("tripType", tripType);

    const response = await fetch(url.toString());
    const result =
      (await response.json()) as MobilityApiResponse<TransportHistoryResponse>;

    if (!result.success || !result.data) {
      throw new Error(
        result.error?.message || "Failed to get passenger history",
      );
    }

    return result.data;
  }

  /**
   * Notify that a student will be absent from transport
   */
  async notifyAbsence(
    studentId: string,
    date: string,
    tripType: "morning" | "afternoon" | "both",
    reason?: string,
    notifiedBy?: string,
  ): Promise<NotifyAbsenceResponse> {
    const response = await fetch(
      `${this.baseUrl}/passengers/${studentId}/notify-absence`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          tripType,
          reason,
          notifiedBy,
        }),
      },
    );

    const result =
      (await response.json()) as MobilityApiResponse<NotifyAbsenceResponse>;

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "Failed to notify absence");
    }

    return result.data;
  }

  /**
   * Check if mobility service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${MOBILITY_SERVICE_URL}/health`);
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    } catch {
      return false;
    }
  }
}

export default new MobilityServiceClient();
