import mongoose, { Schema, Document } from "mongoose";

// ==================== TRANSPORT ROUTE ====================
/**
 * Represents a school bus/van route with all its stops
 */
export interface ITransportRoute extends Document {
  name: string;
  code: string; // e.g., "ROUTE-A", "NORTH-EXPRESS"
  schoolId: string;
  description?: string;
  type: "morning" | "afternoon" | "both";
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  attendantId?: string;
  attendantName?: string;
  attendantPhone?: string;
  capacity: number;
  currentStudentCount: number;
  stops: {
    stopId: string;
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    order: number; // Stop order in the route
    estimatedArrivalTime: string; // e.g., "07:30" for morning pickup
    estimatedDepartureTime: string;
    estimatedDuration: number; // minutes from start of route
    isSchool: boolean; // Is this the school stop?
  }[];
  // Calculated route info
  totalDistance?: number; // km
  estimatedTotalDuration: number; // minutes
  morningDepartureTime: string; // First stop departure time
  afternoonDepartureTime: string; // School departure time for return
  status: "active" | "inactive" | "suspended";
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransportRouteSchema = new Schema<ITransportRoute>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    description: String,
    type: {
      type: String,
      enum: ["morning", "afternoon", "both"],
      default: "both",
    },
    vehicleId: String,
    driverId: { type: String, index: true },
    driverName: String,
    driverPhone: String,
    attendantId: String,
    attendantName: String,
    attendantPhone: String,
    capacity: { type: Number, default: 40 },
    currentStudentCount: { type: Number, default: 0 },
    stops: [
      {
        stopId: { type: String, required: true },
        name: { type: String, required: true },
        address: { type: String, required: true },
        coordinates: {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
        },
        order: { type: Number, required: true },
        estimatedArrivalTime: String,
        estimatedDepartureTime: String,
        estimatedDuration: Number,
        isSchool: { type: Boolean, default: false },
      },
    ],
    totalDistance: Number,
    estimatedTotalDuration: { type: Number, default: 60 },
    morningDepartureTime: { type: String, default: "07:00" },
    afternoonDepartureTime: { type: String, default: "14:30" },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    academicYear: { type: String, required: true },
  },
  { timestamps: true },
);

TransportRouteSchema.index({ schoolId: 1, code: 1 }, { unique: true });

// ==================== STUDENT TRANSPORT ====================
/**
 * Links a student to their transport route and designated stops
 */
export interface IStudentTransport extends Document {
  studentId: string;
  schoolId: string;
  routeId: string;
  pickupStopId: string;
  dropoffStopId: string;
  authorizedPickupPersons: {
    name: string;
    phone: string;
    relationship: string;
    photo?: string;
    verificationCode?: string;
  }[];
  status: "active" | "suspended" | "inactive";
  specialNotes?: string;
  requiresAssistance: boolean;
  assistanceNotes?: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentTransportSchema = new Schema<IStudentTransport>(
  {
    studentId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    routeId: { type: String, required: true, index: true },
    pickupStopId: { type: String, required: true },
    dropoffStopId: { type: String, required: true },
    authorizedPickupPersons: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, required: true },
        photo: String,
        verificationCode: String,
      },
    ],
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    specialNotes: String,
    requiresAssistance: { type: Boolean, default: false },
    assistanceNotes: String,
    academicYear: { type: String, required: true },
  },
  { timestamps: true },
);

StudentTransportSchema.index(
  { studentId: 1, academicYear: 1 },
  { unique: true },
);

// ==================== TRANSPORT SCHEDULE ====================
/**
 * Daily transport schedule - represents actual scheduled trips
 */
export interface ITransportSchedule extends Document {
  routeId: string;
  schoolId: string;
  date: Date;
  tripType: "morning_pickup" | "afternoon_dropoff";
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  driverId: string;
  vehicleId?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "delayed";
  currentStopIndex: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  };
  delay: number; // minutes delayed
  delayReason?: string;
  studentsOnboard: string[]; // studentIds
  completedStops: {
    stopId: string;
    arrivedAt: Date;
    departedAt?: Date;
    studentsBoarded: string[];
    studentsDropped: string[];
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransportScheduleSchema = new Schema<ITransportSchedule>(
  {
    routeId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    tripType: {
      type: String,
      enum: ["morning_pickup", "afternoon_dropoff"],
      required: true,
    },
    scheduledStartTime: { type: Date, required: true },
    scheduledEndTime: { type: Date, required: true },
    actualStartTime: Date,
    actualEndTime: Date,
    driverId: { type: String, required: true },
    vehicleId: String,
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled", "delayed"],
      default: "scheduled",
    },
    currentStopIndex: { type: Number, default: 0 },
    currentLocation: {
      latitude: Number,
      longitude: Number,
      heading: Number,
      speed: Number,
      updatedAt: Date,
    },
    delay: { type: Number, default: 0 },
    delayReason: String,
    studentsOnboard: [String],
    completedStops: [
      {
        stopId: { type: String, required: true },
        arrivedAt: { type: Date, required: true },
        departedAt: Date,
        studentsBoarded: [String],
        studentsDropped: [String],
      },
    ],
    notes: String,
  },
  { timestamps: true },
);

TransportScheduleSchema.index({ routeId: 1, date: 1, tripType: 1 });
TransportScheduleSchema.index({ status: 1, date: 1 });

// ==================== TRANSPORT LOG ====================
/**
 * Detailed log of transport events for a specific student
 */
export interface ITransportLog extends Document {
  studentId: string;
  scheduleId: string;
  routeId: string;
  date: Date;
  tripType: "morning_pickup" | "afternoon_dropoff";
  events: {
    type:
      | "awaiting_pickup"
      | "boarded"
      | "in_transit"
      | "approaching_stop"
      | "arrived_at_stop"
      | "dropped_off"
      | "picked_up_by_parent"
      | "no_show"
      | "absent";
    timestamp: Date;
    location?: {
      latitude: number;
      longitude: number;
    };
    stopId?: string;
    notes?: string;
    recordedBy?: string; // driver/attendant ID
  }[];
  pickupTime?: Date;
  dropoffTime?: Date;
  pickedUpBy?: {
    name: string;
    phone: string;
    relationship: string;
    verifiedAt?: Date;
  };
  status:
    | "awaiting_pickup"
    | "on_bus"
    | "in_transit"
    | "dropped_off"
    | "picked_up"
    | "no_show"
    | "absent";
  parentNotified: boolean;
  parentNotificationTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransportLogSchema = new Schema<ITransportLog>(
  {
    studentId: { type: String, required: true, index: true },
    scheduleId: { type: String, required: true },
    routeId: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    tripType: {
      type: String,
      enum: ["morning_pickup", "afternoon_dropoff"],
      required: true,
    },
    events: [
      {
        type: {
          type: String,
          enum: [
            "awaiting_pickup",
            "boarded",
            "in_transit",
            "approaching_stop",
            "arrived_at_stop",
            "dropped_off",
            "picked_up_by_parent",
            "no_show",
            "absent",
          ],
          required: true,
        },
        timestamp: { type: Date, required: true },
        location: {
          latitude: Number,
          longitude: Number,
        },
        stopId: String,
        notes: String,
        recordedBy: String,
      },
    ],
    pickupTime: Date,
    dropoffTime: Date,
    pickedUpBy: {
      name: String,
      phone: String,
      relationship: String,
      verifiedAt: Date,
    },
    status: {
      type: String,
      enum: [
        "awaiting_pickup",
        "on_bus",
        "in_transit",
        "dropped_off",
        "picked_up",
        "no_show",
        "absent",
      ],
      default: "awaiting_pickup",
    },
    parentNotified: { type: Boolean, default: false },
    parentNotificationTime: Date,
  },
  { timestamps: true },
);

TransportLogSchema.index(
  { studentId: 1, date: 1, tripType: 1 },
  { unique: true },
);

// ==================== VEHICLE ====================
export interface IVehicle extends Document {
  schoolId: string;
  registrationNumber: string;
  type: "bus" | "van" | "car";
  make: string;
  vehicleModel: string; // Renamed from 'model' to avoid conflict with mongoose Document
  year: number;
  capacity: number;
  features: string[];
  gpsDeviceId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt: Date;
  };
  status: "active" | "maintenance" | "inactive";
  insuranceExpiry: Date;
  fitnessExpiry: Date;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    schoolId: { type: String, required: true, index: true },
    registrationNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["bus", "van", "car"], required: true },
    make: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    year: { type: Number, required: true },
    capacity: { type: Number, required: true },
    features: [String],
    gpsDeviceId: String,
    currentLocation: {
      latitude: Number,
      longitude: Number,
      heading: Number,
      speed: Number,
      updatedAt: Date,
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
    insuranceExpiry: { type: Date, required: true },
    fitnessExpiry: { type: Date, required: true },
    lastServiceDate: Date,
    nextServiceDate: Date,
  },
  { timestamps: true },
);

// Export models
export const TransportRoute = mongoose.model<ITransportRoute>(
  "TransportRoute",
  TransportRouteSchema,
);
export const StudentTransport = mongoose.model<IStudentTransport>(
  "StudentTransport",
  StudentTransportSchema,
);
export const TransportSchedule = mongoose.model<ITransportSchedule>(
  "TransportSchedule",
  TransportScheduleSchema,
);
export const TransportLog = mongoose.model<ITransportLog>(
  "TransportLog",
  TransportLogSchema,
);
export const Vehicle = mongoose.model<IVehicle>("Vehicle", VehicleSchema);
