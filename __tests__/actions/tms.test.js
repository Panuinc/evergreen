import * as tms from "@/actions/tms";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("TMS Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Vehicles ====================

  describe("vehicles", () => {
    it("getVehicles calls GET /api/tms/vehicles", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getVehicles();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/vehicles");
    });

    it("getVehicleById calls GET /api/tms/vehicles/:id", async () => {
      apiClient.get.mockResolvedValue({});
      await tms.getVehicleById("v1");
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/vehicles/v1");
    });

    it("createVehicle calls POST", async () => {
      const data = { plateNumber: "กก-1234" };
      apiClient.post.mockResolvedValue(data);
      await tms.createVehicle(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/vehicles", data);
    });

    it("updateVehicle calls PUT", async () => {
      apiClient.put.mockResolvedValue({});
      await tms.updateVehicle("v1", { plateNumber: "ขข-5678" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/tms/vehicles/v1", {
        plateNumber: "ขข-5678",
      });
    });

    it("deleteVehicle calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await tms.deleteVehicle("v1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/tms/vehicles/v1");
    });
  });

  // ==================== Drivers ====================

  describe("drivers", () => {
    it("getDrivers calls GET /api/tms/drivers", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getDrivers();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/drivers");
    });

    it("createDriver calls POST", async () => {
      const data = { name: "Driver A" };
      apiClient.post.mockResolvedValue(data);
      await tms.createDriver(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/drivers", data);
    });

    it("deleteDriver calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await tms.deleteDriver("d1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/tms/drivers/d1");
    });
  });

  // ==================== Routes ====================

  describe("routes", () => {
    it("getRoutes calls GET /api/tms/routes", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getRoutes();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/routes");
    });

    it("createRoute calls POST", async () => {
      const data = { name: "Route A" };
      apiClient.post.mockResolvedValue(data);
      await tms.createRoute(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/routes", data);
    });

    it("deleteRoute calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await tms.deleteRoute("r1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/tms/routes/r1");
    });
  });

  // ==================== Shipments ====================

  describe("shipments", () => {
    it("getShipments calls GET /api/tms/shipments", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getShipments();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/shipments");
    });

    it("createShipment calls POST", async () => {
      const data = { origin: "A", destination: "B" };
      apiClient.post.mockResolvedValue(data);
      await tms.createShipment(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/shipments", data);
    });

    it("updateShipmentStatus calls PUT with status", async () => {
      apiClient.put.mockResolvedValue({});
      await tms.updateShipmentStatus("s1", "delivered");
      expect(apiClient.put).toHaveBeenCalledWith(
        "/api/tms/shipments/s1/status",
        { status: "delivered" }
      );
    });

    it("deleteShipment calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await tms.deleteShipment("s1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/tms/shipments/s1");
    });
  });

  // ==================== Deliveries ====================

  describe("deliveries", () => {
    it("getDeliveries calls GET /api/tms/deliveries", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getDeliveries();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/deliveries");
    });

    it("getDeliveries with shipmentId adds query param", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getDeliveries("s1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/tms/deliveries?shipmentId=s1"
      );
    });

    it("createDelivery calls POST", async () => {
      const data = { shipmentId: "s1" };
      apiClient.post.mockResolvedValue(data);
      await tms.createDelivery(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/deliveries", data);
    });
  });

  // ==================== Fuel Logs ====================

  describe("fuel logs", () => {
    it("getFuelLogs without vehicleId", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getFuelLogs();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/fuelLogs");
    });

    it("getFuelLogs with vehicleId", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getFuelLogs("v1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/tms/fuelLogs?vehicleId=v1"
      );
    });

    it("createFuelLog calls POST", async () => {
      const data = { liters: 50 };
      apiClient.post.mockResolvedValue(data);
      await tms.createFuelLog(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/fuelLogs", data);
    });
  });

  // ==================== Maintenance ====================

  describe("maintenance", () => {
    it("getMaintenances without vehicleId", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getMaintenances();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/maintenance");
    });

    it("getMaintenances with vehicleId", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getMaintenances("v1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/tms/maintenance?vehicleId=v1"
      );
    });
  });

  // ==================== GPS ====================

  describe("GPS logs", () => {
    it("createGpsLog calls POST", async () => {
      const data = { lat: 13.75, lng: 100.5 };
      apiClient.post.mockResolvedValue(data);
      await tms.createGpsLog(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/tms/gpsLogs", data);
    });

    it("getLatestPositions calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getLatestPositions();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/gpsLogs/latest");
    });
  });

  // ==================== Dashboard & Reports ====================

  describe("dashboard", () => {
    it("getDashboardStats calls GET", async () => {
      apiClient.get.mockResolvedValue({});
      await tms.getDashboardStats();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/dashboard");
    });
  });

  describe("reports", () => {
    it("getReportData calls GET with params", async () => {
      apiClient.get.mockResolvedValue({});
      await tms.getReportData("fuel", "2025-01-01", "2025-01-31");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/tms/reports?type=fuel&startDate=2025-01-01&endDate=2025-01-31"
      );
    });
  });

  describe("alerts", () => {
    it("getAlerts calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await tms.getAlerts();
      expect(apiClient.get).toHaveBeenCalledWith("/api/tms/alerts");
    });
  });
});
