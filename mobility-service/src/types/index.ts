import { Request } from "express";

// ==========================================
// Common Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==========================================
// User & Auth Types
// ==========================================

export type UserRole =
  | "admin"
  | "organization_admin"
  | "driver"
  | "rider"
  | "parent"
  | "student";

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  name: string;
  organizationId?: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

// ==========================================
// Location & GPS Types
// ==========================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeoLocationWithDetails extends GeoLocation {
  address?: string;
  accuracy?: number;
  heading?: number; // 0-360 degrees
  speed?: number; // km/h
  altitude?: number;
  updatedAt: string; // ISO date
}

// ==========================================
// Organization Types
// ==========================================

export type OrganizationType = "school" | "corporate" | "logistics" | "public";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  settings: OrganizationSettings;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  allowPublicRides: boolean;
  requireDriverApproval: boolean;
  trackingEnabled: boolean;
  notificationsEnabled: boolean;
  maxVehicles: number;
  maxDrivers: number;
}

// ==========================================
// Driver Types
// ==========================================

export type DriverStatus = "available" | "busy" | "offline" | "on_trip";
export type DriverVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export interface Driver {
  id: string;
  userId: string;
  organizationId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  photo?: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  verificationStatus: DriverVerificationStatus;
  rating: number;
  totalTrips: number;
  currentLocation?: GeoLocationWithDetails;
  currentVehicleId?: string;
  documents: DriverDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface DriverDocument {
  type:
    | "license"
    | "insurance"
    | "background_check"
    | "vehicle_registration"
    | "photo_id";
  url: string;
  verificationStatus: DriverVerificationStatus;
  expiryDate?: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface DriverEarnings {
  driverId: string;
  period: "daily" | "weekly" | "monthly" | "all_time";
  totalEarnings: number;
  totalTrips: number;
  currency: string;
  breakdown?: {
    date: string;
    earnings: number;
    trips: number;
  }[];
}

// ==========================================
// Vehicle Types
// ==========================================

export type VehicleType = "bus" | "van" | "car" | "motorcycle";
export type VehicleStatus =
  | "active"
  | "maintenance"
  | "inactive"
  | "decommissioned";

export interface Vehicle {
  id: string;
  organizationId?: string;
  registrationNumber: string;
  vehicleModel: string;
  make: string;
  year: number;
  type: VehicleType;
  capacity: number;
  color: string;
  features: VehicleFeature[];
  status: VehicleStatus;
  currentDriverId?: string;
  currentLocation?: GeoLocationWithDetails;
  fuelType: "petrol" | "diesel" | "electric" | "hybrid";
  insuranceExpiry: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleFeature =
  | "air_conditioning"
  | "gps_tracking"
  | "cctv"
  | "wifi"
  | "wheelchair_accessible"
  | "child_seats"
  | "first_aid_kit";

export interface VehicleTracking {
  vehicleId: string;
  location: GeoLocationWithDetails;
  status: "moving" | "stopped" | "idle" | "offline";
  isOnRoute: boolean;
  currentRouteId?: string;
  batteryLevel?: number; // GPS device battery
  signalStrength?: "strong" | "medium" | "weak";
}

// ==========================================
// Route Types
// ==========================================

export type RouteType = "school" | "corporate" | "public" | "custom";
export type RouteStatus = "active" | "inactive" | "completed" | "cancelled";

export interface Route {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: RouteType;
  status: RouteStatus;
  vehicleId?: string;
  driverId?: string;
  assistantId?: string;
  stops: RouteStop[];
  schedule: RouteScheduleConfig;
  polyline?: string; // Encoded polyline for map rendering
  totalDistance: number; // km
  estimatedDuration: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface RouteStop {
  id: string;
  index: number;
  name: string;
  address: string;
  location: GeoLocation;
  scheduledArrivalTime: string; // HH:mm format
  scheduledDepartureTime?: string;
  estimatedWaitTime: number; // minutes
  passengersToPickup?: number;
  passengersToDropoff?: number;
  isSchool?: boolean;
  isDepot?: boolean;
}

export interface RouteScheduleConfig {
  type: "daily" | "weekdays" | "weekends" | "custom";
  operatingDays: DayOfWeek[];
  morningDepartureTime?: string; // HH:mm
  afternoonDepartureTime?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// ==========================================
// Trip & Tracking Types
// ==========================================

export type TripType = "morning_pickup" | "afternoon_dropoff" | "on_demand";
export type TripStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "delayed";

export interface Trip {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  type: TripType;
  status: TripStatus;
  date: string;
  scheduledStartTime: string;
  actualStartTime?: string;
  scheduledEndTime: string;
  actualEndTime?: string;
  currentStopIndex: number;
  completedStops: number[];
  skippedStops: number[];
  totalPassengers: number;
  currentPassengers: number;
  delayMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripTracking {
  tripId: string;
  routeId: string;
  vehicleId: string;
  status: TripStatus;
  currentLocation: GeoLocationWithDetails;
  currentStopIndex: number;
  nextStop?: RouteStopStatus;
  progress: TripProgress;
  delay: TripDelay;
  eta?: ETAInfo;
  lastUpdated: string;
}

export interface RouteStopStatus extends RouteStop {
  status: "pending" | "approaching" | "arrived" | "completed" | "skipped";
  actualArrivalTime?: string;
  actualDepartureTime?: string;
  eta?: string;
}

export interface TripProgress {
  completedStops: number;
  totalStops: number;
  percentComplete: number;
  distanceRemaining: number;
  distanceUnit: "km" | "miles";
}

export interface TripDelay {
  isDelayed: boolean;
  delayMinutes: number;
  reason?: string;
}

export interface ETAInfo {
  stopId?: string;
  stopName?: string;
  scheduledTime: string;
  estimatedTime: string;
  minutesAway: number;
  confidence: "high" | "medium" | "low";
  factors: ETAFactors;
  calculatedAt: string;
}

export interface ETAFactors {
  traffic: "light" | "normal" | "heavy";
  weather: "clear" | "rain" | "fog" | "storm";
  currentDelay: number;
  distanceRemaining: number;
  stopsRemaining: number;
}

// ==========================================
// Ride Request Types (Uber-like)
// ==========================================

export type RideRequestStatus =
  | "pending"
  | "searching"
  | "accepted"
  | "driver_arriving"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface RideRequest {
  id: string;
  riderId: string;
  organizationId?: string;
  pickup: RideLocation;
  dropoff: RideLocation;
  stops?: RideLocation[];
  vehicleType: VehicleType;
  status: RideRequestStatus;
  driverId?: string;
  vehicleId?: string;
  fare?: RideFare;
  scheduledTime?: string; // For scheduled rides
  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  rating?: number;
  feedback?: string;
}

export interface RideLocation {
  address: string;
  location: GeoLocation;
  name?: string;
  instructions?: string;
}

export interface RideFare {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgePricing?: number;
  discount?: number;
  total: number;
  currency: string;
  estimatedDistance: number;
  estimatedDuration: number;
}

// ==========================================
// Passenger Types (for school transport)
// ==========================================

export interface Passenger {
  id: string;
  studentId: string; // Links to Education Service
  organizationId: string;
  routeId: string;
  stopId: string;
  pickupStopId?: string;
  dropoffStopId?: string;
  status: "active" | "inactive" | "suspended";
  transportType: "morning" | "afternoon" | "both";
  guardians: PassengerGuardian[];
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerGuardian {
  parentId: string; // Links to Auth Service
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  canAuthorizePickup: boolean;
}

export interface PassengerTripLog {
  id: string;
  passengerId: string;
  tripId: string;
  date: string;
  tripType: TripType;
  status: "boarded" | "dropped_off" | "absent" | "picked_up_early";
  boardedAt?: string;
  droppedOffAt?: string;
  boardedAtStopId?: string;
  droppedOffAtStopId?: string;
  pickedUpBy?: {
    name: string;
    relationship: string;
    verificationCode?: string;
  };
  notes?: string;
}

// ==========================================
// Notification Types
// ==========================================

export type NotificationType =
  | "trip_started"
  | "approaching_stop"
  | "arrived_at_stop"
  | "passenger_boarded"
  | "passenger_dropped"
  | "trip_completed"
  | "trip_delayed"
  | "driver_assigned"
  | "vehicle_changed"
  | "route_changed"
  | "emergency";

export interface TransportNotification {
  id: string;
  type: NotificationType;
  recipientId: string;
  recipientType: "parent" | "driver" | "admin";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  sentAt: string;
  readAt?: string;
}

// ==========================================
// Service-to-Service Types
// ==========================================

/**
 * Types for inter-service communication
 * Education Service will use these to call Mobility Service
 */

export interface GetRouteTrackingRequest {
  routeId: string;
  includeStops?: boolean;
  includeVehicle?: boolean;
}

export interface GetRouteTrackingResponse {
  tracking: TripTracking | null;
  route: Route;
  vehicle?: Vehicle;
  driver?: Driver;
  isActive: boolean;
}

export interface GetETARequest {
  routeId: string;
  stopId: string;
  tripType?: TripType;
}

export interface GetETAResponse {
  eta: ETAInfo;
  vehicle?: {
    id: string;
    distanceAway: number;
    stopsAway: number;
  };
}

export interface GetPassengerStatusRequest {
  studentId: string;
  date?: string; // YYYY-MM-DD, defaults to today
}

export interface GetPassengerStatusResponse {
  passenger: Passenger | null;
  route: Route | null;
  currentTrip: Trip | null;
  tracking: TripTracking | null;
  todayLog: PassengerTripLog | null;
  status: PassengerTransportStatus;
}

export type PassengerTransportStatus =
  | "no_service"
  | "awaiting_pickup"
  | "vehicle_approaching"
  | "on_vehicle"
  | "dropped_off"
  | "picked_up_early"
  | "absent"
  | "no_trip_scheduled"
  | "trip_completed";

export interface NotifyAbsenceRequest {
  studentId: string;
  date: string;
  tripType: "morning" | "afternoon" | "both";
  reason?: string;
  notifiedBy: string;
}

export interface NotifyAbsenceResponse {
  success: boolean;
  notificationId: string;
  acknowledged: boolean;
}
