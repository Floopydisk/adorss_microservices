/**
 * Mock Data for Mobility Service
 *
 * This file contains static mock data that will be returned by the service
 * until real implementations are built. The data structures match the types
 * defined in types/index.ts.
 *
 * TODO: Replace with actual database queries and real-time GPS data
 */

import {
  Driver,
  Vehicle,
  Route,
  RouteStop,
  Trip,
  TripTracking,
  Passenger,
  PassengerTripLog,
  ETAInfo,
  Organization,
} from "../types";

// ==========================================
// Mock Organizations
// ==========================================

export const mockOrganizations: Organization[] = [
  {
    id: "org-school-001",
    name: "Lekki High School",
    type: "school",
    address: "123 Lekki Phase 1, Lagos",
    phone: "+2348012345678",
    email: "info@lekkihigh.edu.ng",
    logo: "https://example.com/logo.png",
    settings: {
      allowPublicRides: false,
      requireDriverApproval: true,
      trackingEnabled: true,
      notificationsEnabled: true,
      maxVehicles: 10,
      maxDrivers: 15,
    },
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ==========================================
// Mock Drivers
// ==========================================

export const mockDrivers: Driver[] = [
  {
    id: "driver-001",
    userId: "user-driver-001",
    organizationId: "org-school-001",
    firstName: "Adebayo",
    lastName: "Okonkwo",
    phone: "+2348023456789",
    email: "adebayo.driver@email.com",
    photo: "https://example.com/driver1.jpg",
    licenseNumber: "LAG-DRV-12345",
    licenseExpiry: "2027-06-30",
    status: "on_trip",
    verificationStatus: "verified",
    rating: 4.8,
    totalTrips: 1250,
    currentLocation: {
      latitude: 6.4541,
      longitude: 3.4218,
      heading: 180,
      speed: 25,
      accuracy: 10,
      updatedAt: new Date().toISOString(),
    },
    currentVehicleId: "vehicle-001",
    documents: [
      {
        type: "license",
        url: "https://example.com/docs/license.pdf",
        verificationStatus: "verified",
        expiryDate: "2027-06-30",
        uploadedAt: "2024-01-15T00:00:00Z",
        verifiedAt: "2024-01-16T00:00:00Z",
      },
    ],
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "driver-002",
    userId: "user-driver-002",
    organizationId: "org-school-001",
    firstName: "Chukwuemeka",
    lastName: "Nnamdi",
    phone: "+2348034567890",
    email: "chukwuemeka.driver@email.com",
    photo: "https://example.com/driver2.jpg",
    licenseNumber: "LAG-DRV-67890",
    licenseExpiry: "2026-12-31",
    status: "available",
    verificationStatus: "verified",
    rating: 4.6,
    totalTrips: 890,
    currentLocation: {
      latitude: 6.4298,
      longitude: 3.4201,
      heading: 90,
      speed: 0,
      accuracy: 5,
      updatedAt: new Date().toISOString(),
    },
    currentVehicleId: "vehicle-002",
    documents: [],
    createdAt: "2023-08-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// Mock Vehicles
// ==========================================

export const mockVehicles: Vehicle[] = [
  {
    id: "vehicle-001",
    organizationId: "org-school-001",
    registrationNumber: "LAG-123-ABC",
    vehicleModel: "Coaster",
    make: "Toyota",
    year: 2022,
    type: "bus",
    capacity: 30,
    color: "Yellow",
    features: ["air_conditioning", "gps_tracking", "cctv", "first_aid_kit"],
    status: "active",
    currentDriverId: "driver-001",
    currentLocation: {
      latitude: 6.4541,
      longitude: 3.4218,
      heading: 180,
      speed: 25,
      accuracy: 10,
      updatedAt: new Date().toISOString(),
    },
    fuelType: "diesel",
    insuranceExpiry: "2026-12-31",
    lastMaintenanceDate: "2025-12-15",
    nextMaintenanceDate: "2026-03-15",
    photo: "https://example.com/bus1.jpg",
    createdAt: "2022-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "vehicle-002",
    organizationId: "org-school-001",
    registrationNumber: "LAG-456-DEF",
    vehicleModel: "Hiace",
    make: "Toyota",
    year: 2023,
    type: "van",
    capacity: 15,
    color: "White",
    features: ["air_conditioning", "gps_tracking"],
    status: "active",
    currentDriverId: "driver-002",
    currentLocation: {
      latitude: 6.4298,
      longitude: 3.4201,
      heading: 90,
      speed: 0,
      accuracy: 5,
      updatedAt: new Date().toISOString(),
    },
    fuelType: "diesel",
    insuranceExpiry: "2026-06-30",
    lastMaintenanceDate: "2025-11-20",
    nextMaintenanceDate: "2026-02-20",
    photo: "https://example.com/van1.jpg",
    createdAt: "2023-03-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// Mock Route Stops
// ==========================================

const route1Stops: RouteStop[] = [
  {
    id: "stop-001",
    index: 0,
    name: "Depot - Admiralty Way",
    address: "Admiralty Way, Lekki Phase 1",
    location: { latitude: 6.4298, longitude: 3.4201 },
    scheduledArrivalTime: "06:30",
    scheduledDepartureTime: "06:35",
    estimatedWaitTime: 5,
    passengersToPickup: 0,
    isDepot: true,
  },
  {
    id: "stop-002",
    index: 1,
    name: "Chevron Estate Gate",
    address: "Chevron Estate, Lekki",
    location: { latitude: 6.4355, longitude: 3.4512 },
    scheduledArrivalTime: "06:50",
    scheduledDepartureTime: "06:55",
    estimatedWaitTime: 5,
    passengersToPickup: 4,
  },
  {
    id: "stop-003",
    index: 2,
    name: "Ikate Bus Stop",
    address: "Ikate, Lekki",
    location: { latitude: 6.4428, longitude: 3.4589 },
    scheduledArrivalTime: "07:05",
    scheduledDepartureTime: "07:10",
    estimatedWaitTime: 5,
    passengersToPickup: 6,
  },
  {
    id: "stop-004",
    index: 3,
    name: "Jakande Junction",
    address: "Jakande, Lekki",
    location: { latitude: 6.4541, longitude: 3.4698 },
    scheduledArrivalTime: "07:20",
    scheduledDepartureTime: "07:25",
    estimatedWaitTime: 5,
    passengersToPickup: 5,
  },
  {
    id: "stop-005",
    index: 4,
    name: "VGC Gate",
    address: "Victoria Garden City",
    location: { latitude: 6.4612, longitude: 3.5012 },
    scheduledArrivalTime: "07:35",
    scheduledDepartureTime: "07:40",
    estimatedWaitTime: 5,
    passengersToPickup: 3,
  },
  {
    id: "stop-006",
    index: 5,
    name: "Lekki High School",
    address: "123 Lekki Phase 1, Lagos",
    location: { latitude: 6.445, longitude: 3.475 },
    scheduledArrivalTime: "07:55",
    estimatedWaitTime: 0,
    passengersToDropoff: 18,
    isSchool: true,
  },
];

// ==========================================
// Mock Routes
// ==========================================

export const mockRoutes: Route[] = [
  {
    id: "route-001",
    organizationId: "org-school-001",
    name: "Lekki Route A - Morning",
    description: "Morning pickup route covering Chevron to VGC",
    type: "school",
    status: "active",
    vehicleId: "vehicle-001",
    driverId: "driver-001",
    stops: route1Stops,
    schedule: {
      type: "weekdays",
      operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      morningDepartureTime: "06:35",
      effectiveFrom: "2026-01-06",
      effectiveTo: "2026-07-15",
    },
    polyline: "encoded_polyline_string_here", // Google encoded polyline
    totalDistance: 15.5,
    estimatedDuration: 80,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "route-002",
    organizationId: "org-school-001",
    name: "Lekki Route A - Afternoon",
    description: "Afternoon dropoff route covering VGC to Chevron",
    type: "school",
    status: "active",
    vehicleId: "vehicle-001",
    driverId: "driver-001",
    stops: [...route1Stops].reverse().map((stop, idx) => ({
      ...stop,
      index: idx,
      scheduledArrivalTime: `${15 + Math.floor(idx * 0.25)}:${(idx * 15) % 60 < 10 ? "0" : ""}${(idx * 15) % 60}`,
    })),
    schedule: {
      type: "weekdays",
      operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      afternoonDepartureTime: "15:00",
      effectiveFrom: "2026-01-06",
      effectiveTo: "2026-07-15",
    },
    polyline: "encoded_polyline_string_here",
    totalDistance: 15.5,
    estimatedDuration: 85,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// Mock Trips (Today's trips)
// ==========================================

const today = new Date().toISOString().split("T")[0];

export const mockTrips: Trip[] = [
  {
    id: "trip-001",
    routeId: "route-001",
    vehicleId: "vehicle-001",
    driverId: "driver-001",
    type: "morning_pickup",
    status: "in_progress",
    date: today,
    scheduledStartTime: "06:35",
    actualStartTime: "06:38",
    scheduledEndTime: "07:55",
    currentStopIndex: 3,
    completedStops: [0, 1, 2],
    skippedStops: [],
    totalPassengers: 18,
    currentPassengers: 10,
    delayMinutes: 3,
    createdAt: `${today}T06:30:00Z`,
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// Mock Trip Tracking
// ==========================================

export const mockTripTracking: TripTracking = {
  tripId: "trip-001",
  routeId: "route-001",
  vehicleId: "vehicle-001",
  status: "in_progress",
  currentLocation: {
    latitude: 6.4541,
    longitude: 3.4218,
    heading: 180,
    speed: 25,
    accuracy: 10,
    updatedAt: new Date().toISOString(),
  },
  currentStopIndex: 3,
  nextStop: {
    ...route1Stops[3],
    status: "approaching",
    eta: "07:23",
  },
  progress: {
    completedStops: 3,
    totalStops: 6,
    percentComplete: 50,
    distanceRemaining: 7.8,
    distanceUnit: "km",
  },
  delay: {
    isDelayed: true,
    delayMinutes: 3,
    reason: "Minor traffic on Lekki-Epe Expressway",
  },
  eta: {
    stopId: "stop-004",
    stopName: "Jakande Junction",
    scheduledTime: "07:20",
    estimatedTime: "07:23",
    minutesAway: 8,
    confidence: "high",
    factors: {
      traffic: "normal",
      weather: "clear",
      currentDelay: 3,
      distanceRemaining: 2.5,
      stopsRemaining: 3,
    },
    calculatedAt: new Date().toISOString(),
  },
  lastUpdated: new Date().toISOString(),
};

// ==========================================
// Mock Passengers (School Transport)
// ==========================================

export const mockPassengers: Passenger[] = [
  {
    id: "passenger-001",
    studentId: "student-001", // Links to Education Service
    organizationId: "org-school-001",
    routeId: "route-001",
    stopId: "stop-003",
    pickupStopId: "stop-003",
    dropoffStopId: "stop-003",
    status: "active",
    transportType: "both",
    guardians: [
      {
        parentId: "parent-001",
        name: "Mrs. Adaeze Okafor",
        phone: "+2348045678901",
        email: "adaeze.okafor@email.com",
        relationship: "Mother",
        canAuthorizePickup: true,
      },
      {
        parentId: "parent-002",
        name: "Mr. Chinedu Okafor",
        phone: "+2348056789012",
        relationship: "Father",
        canAuthorizePickup: true,
      },
    ],
    specialInstructions: "Child has mild asthma, inhaler in bag",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "passenger-002",
    studentId: "student-002",
    organizationId: "org-school-001",
    routeId: "route-001",
    stopId: "stop-004",
    pickupStopId: "stop-004",
    dropoffStopId: "stop-004",
    status: "active",
    transportType: "both",
    guardians: [
      {
        parentId: "parent-003",
        name: "Mrs. Folake Adekunle",
        phone: "+2348067890123",
        relationship: "Mother",
        canAuthorizePickup: true,
      },
    ],
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

// ==========================================
// Mock Passenger Trip Logs
// ==========================================

export const mockPassengerTripLogs: PassengerTripLog[] = [
  {
    id: "log-001",
    passengerId: "passenger-001",
    tripId: "trip-001",
    date: today,
    tripType: "morning_pickup",
    status: "boarded",
    boardedAt: "07:12",
    boardedAtStopId: "stop-003",
  },
];

// ==========================================
// Mock ETA Data
// ==========================================

export const mockETAForStop = (stopId: string): ETAInfo => {
  const stop = route1Stops.find((s) => s.id === stopId);
  const now = new Date();
  const minutesAway = Math.floor(Math.random() * 15) + 5; // 5-20 minutes

  return {
    stopId,
    stopName: stop?.name || "Unknown Stop",
    scheduledTime: stop?.scheduledArrivalTime || "07:30",
    estimatedTime: `${now.getHours()}:${String(now.getMinutes() + minutesAway).padStart(2, "0")}`,
    minutesAway,
    confidence: "high",
    factors: {
      traffic: "normal",
      weather: "clear",
      currentDelay: 3,
      distanceRemaining: minutesAway * 0.5, // Rough estimate
      stopsRemaining: Math.max(
        1,
        6 - route1Stops.findIndex((s) => s.id === stopId),
      ),
    },
    calculatedAt: now.toISOString(),
  };
};

// ==========================================
// Helper Functions
// ==========================================

export function getDriverById(id: string): Driver | undefined {
  return mockDrivers.find((d) => d.id === id);
}

export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find((v) => v.id === id);
}

export function getRouteById(id: string): Route | undefined {
  return mockRoutes.find((r) => r.id === id);
}

export function getPassengerByStudentId(
  studentId: string,
): Passenger | undefined {
  return mockPassengers.find((p) => p.studentId === studentId);
}

export function getTripByRouteAndDate(
  routeId: string,
  date: string,
): Trip | undefined {
  return mockTrips.find((t) => t.routeId === routeId && t.date === date);
}

export function getPassengerTripLog(
  passengerId: string,
  date: string,
  tripType: string,
): PassengerTripLog | undefined {
  return mockPassengerTripLogs.find(
    (log) =>
      log.passengerId === passengerId &&
      log.date === date &&
      log.tripType === tripType,
  );
}
