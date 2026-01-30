/**
 * Transport Tracking Controller
 *
 * Handles HTTP requests for transport tracking.
 * These endpoints are called by the Education Service internally
 * and by the API Gateway for parent-facing features.
 */

import { Response } from "express";
import { AuthRequest, ApiResponse } from "../types";
import transportTrackingService from "../services/transportTrackingService";
import {
  mockDrivers,
  mockVehicles,
  mockRoutes,
  getDriverById,
  getVehicleById,
  getRouteById,
} from "../data/mockData";

class TransportTrackingController {
  /**
   * Get passenger transport status
   * GET /api/mobility/internal/passengers/:studentId/status
   *
   * Called by Education Service to get transport status for a student
   */
  async getPassengerStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { date } = req.query;

      const result = await transportTrackingService.getPassengerStatus(
        studentId,
        date as string,
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting passenger status:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get passenger status",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get route tracking data
   * GET /api/mobility/internal/routes/:routeId/tracking
   *
   * Called by Education Service to get real-time tracking for a route
   */
  async getRouteTracking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const { includeStops, includeVehicle } = req.query;

      const result = await transportTrackingService.getRouteTracking(
        routeId,
        includeStops !== "false",
        includeVehicle !== "false",
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting route tracking:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get route tracking",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get ETA for a stop
   * GET /api/mobility/internal/routes/:routeId/eta
   *
   * Called by Education Service to get ETA for a student's stop
   */
  async getETA(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const { stopId, tripType } = req.query;

      if (!stopId) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "stopId query parameter is required",
          },
        } as ApiResponse);
        return;
      }

      const result = await transportTrackingService.getETA(
        routeId,
        stopId as string,
        tripType as "morning_pickup" | "afternoon_dropoff" | undefined,
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting ETA:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get ETA",
        },
      } as ApiResponse);
    }
  }

  /**
   * Notify passenger absence
   * POST /api/mobility/internal/passengers/:studentId/notify-absence
   *
   * Called by Education Service when parent notifies absence
   */
  async notifyAbsence(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { date, tripType, reason, notifiedBy } = req.body;

      if (!date || !tripType) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "date and tripType are required",
          },
        } as ApiResponse);
        return;
      }

      const result = await transportTrackingService.notifyAbsence(
        studentId,
        date,
        tripType,
        reason,
        notifiedBy,
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Error notifying absence:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to notify absence",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get passenger transport history
   * GET /api/mobility/internal/passengers/:studentId/history
   */
  async getPassengerHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, tripType, page, limit } = req.query;

      // Default to last 7 days if not specified
      const end = (endDate as string) || new Date().toISOString().split("T")[0];
      const start =
        (startDate as string) ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

      const result = await transportTrackingService.getPassengerHistory(
        studentId,
        start,
        end,
        tripType as "morning" | "afternoon" | undefined,
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting passenger history:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get passenger history",
        },
      } as ApiResponse);
    }
  }

  // ==========================================
  // Public API Endpoints (for drivers, admins)
  // ==========================================

  /**
   * Get all routes for an organization
   * GET /api/mobility/routes
   */
  async getRoutes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { organizationId, status, type } = req.query;

      let routes = [...mockRoutes];

      if (organizationId) {
        routes = routes.filter((r) => r.organizationId === organizationId);
      }
      if (status) {
        routes = routes.filter((r) => r.status === status);
      }
      if (type) {
        routes = routes.filter((r) => r.type === type);
      }

      res.json({
        success: true,
        data: {
          routes,
          total: routes.length,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting routes:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get routes",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get route by ID
   * GET /api/mobility/routes/:routeId
   */
  async getRouteById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const route = getRouteById(routeId);

      if (!route) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Route not found",
          },
        } as ApiResponse);
        return;
      }

      // Include driver and vehicle info
      const driver = route.driverId ? getDriverById(route.driverId) : null;
      const vehicle = route.vehicleId ? getVehicleById(route.vehicleId) : null;

      res.json({
        success: true,
        data: {
          route,
          driver,
          vehicle,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting route:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get route",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get all drivers
   * GET /api/mobility/drivers
   */
  async getDrivers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { organizationId, status } = req.query;

      let drivers = [...mockDrivers];

      if (organizationId) {
        drivers = drivers.filter((d) => d.organizationId === organizationId);
      }
      if (status) {
        drivers = drivers.filter((d) => d.status === status);
      }

      res.json({
        success: true,
        data: {
          drivers,
          total: drivers.length,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting drivers:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get drivers",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get driver by ID
   * GET /api/mobility/drivers/:driverId
   */
  async getDriverById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const driver = getDriverById(driverId);

      if (!driver) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Driver not found",
          },
        } as ApiResponse);
        return;
      }

      // Include current vehicle if assigned
      const vehicle = driver.currentVehicleId
        ? getVehicleById(driver.currentVehicleId)
        : null;

      res.json({
        success: true,
        data: {
          driver,
          vehicle,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting driver:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get driver",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get all vehicles
   * GET /api/mobility/vehicles
   */
  async getVehicles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { organizationId, status, type } = req.query;

      let vehicles = [...mockVehicles];

      if (organizationId) {
        vehicles = vehicles.filter((v) => v.organizationId === organizationId);
      }
      if (status) {
        vehicles = vehicles.filter((v) => v.status === status);
      }
      if (type) {
        vehicles = vehicles.filter((v) => v.type === type);
      }

      res.json({
        success: true,
        data: {
          vehicles,
          total: vehicles.length,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting vehicles:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get vehicles",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get vehicle by ID
   * GET /api/mobility/vehicles/:vehicleId
   */
  async getVehicleById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const vehicle = getVehicleById(vehicleId);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Vehicle not found",
          },
        } as ApiResponse);
        return;
      }

      // Include current driver if assigned
      const driver = vehicle.currentDriverId
        ? getDriverById(vehicle.currentDriverId)
        : null;

      res.json({
        success: true,
        data: {
          vehicle,
          driver,
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting vehicle:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get vehicle",
        },
      } as ApiResponse);
    }
  }

  /**
   * Get vehicle tracking
   * GET /api/mobility/vehicles/:vehicleId/tracking
   */
  async getVehicleTracking(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const vehicle = getVehicleById(vehicleId);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Vehicle not found",
          },
        } as ApiResponse);
        return;
      }

      // Return mock tracking data
      res.json({
        success: true,
        data: {
          vehicleId: vehicle.id,
          location: vehicle.currentLocation || null,
          status: vehicle.currentDriverId ? "moving" : "idle",
          isOnRoute: !!vehicle.currentDriverId,
          lastUpdated: new Date().toISOString(),
        },
      } as ApiResponse);
    } catch (error) {
      console.error("Error getting vehicle tracking:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get vehicle tracking",
        },
      } as ApiResponse);
    }
  }
}

export default new TransportTrackingController();
