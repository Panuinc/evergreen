import { get, post, put, del } from "@/lib/apiClient";

// ==================== Vehicles ====================

export async function getVehicles() {
  return get("/api/tms/vehicles");
}

export async function getVehicleById(id) {
  return get(`/api/tms/vehicles/${id}`);
}

export async function createVehicle(data) {
  return post("/api/tms/vehicles", data);
}

export async function updateVehicle(id, data) {
  return put(`/api/tms/vehicles/${id}`, data);
}

export async function deleteVehicle(id) {
  return del(`/api/tms/vehicles/${id}`);
}

// ==================== Drivers ====================

export async function getDrivers() {
  return get("/api/tms/drivers");
}

export async function getDriverById(id) {
  return get(`/api/tms/drivers/${id}`);
}

export async function createDriver(data) {
  return post("/api/tms/drivers", data);
}

export async function updateDriver(id, data) {
  return put(`/api/tms/drivers/${id}`, data);
}

export async function deleteDriver(id) {
  return del(`/api/tms/drivers/${id}`);
}

// ==================== Routes ====================

export async function getRoutes() {
  return get("/api/tms/routes");
}

export async function getRouteById(id) {
  return get(`/api/tms/routes/${id}`);
}

export async function createRoute(data) {
  return post("/api/tms/routes", data);
}

export async function updateRoute(id, data) {
  return put(`/api/tms/routes/${id}`, data);
}

export async function deleteRoute(id) {
  return del(`/api/tms/routes/${id}`);
}

// ==================== Shipments ====================

export async function getShipments() {
  return get("/api/tms/shipments");
}

export async function getShipmentById(id) {
  return get(`/api/tms/shipments/${id}`);
}

export async function createShipment(data) {
  return post("/api/tms/shipments", data);
}

export async function updateShipment(id, data) {
  return put(`/api/tms/shipments/${id}`, data);
}

export async function deleteShipment(id) {
  return del(`/api/tms/shipments/${id}`);
}

export async function updateShipmentStatus(id, status) {
  return put(`/api/tms/shipments/${id}/status`, { status });
}

// ==================== Deliveries ====================

export async function getDeliveries(shipmentId) {
  return get(
    shipmentId
      ? `/api/tms/deliveries?shipmentId=${shipmentId}`
      : "/api/tms/deliveries"
  );
}

export async function getDeliveryById(id) {
  return get(`/api/tms/deliveries/${id}`);
}

export async function createDelivery(data) {
  return post("/api/tms/deliveries", data);
}

export async function updateDelivery(id, data) {
  return put(`/api/tms/deliveries/${id}`, data);
}

export async function deleteDelivery(id) {
  return del(`/api/tms/deliveries/${id}`);
}

// ==================== Fuel Logs ====================

export async function getFuelLogs(vehicleId) {
  return get(
    vehicleId
      ? `/api/tms/fuelLogs?vehicleId=${vehicleId}`
      : "/api/tms/fuelLogs"
  );
}

export async function getFuelLogById(id) {
  return get(`/api/tms/fuelLogs/${id}`);
}

export async function createFuelLog(data) {
  return post("/api/tms/fuelLogs", data);
}

export async function updateFuelLog(id, data) {
  return put(`/api/tms/fuelLogs/${id}`, data);
}

export async function deleteFuelLog(id) {
  return del(`/api/tms/fuelLogs/${id}`);
}

// ==================== Maintenance ====================

export async function getMaintenances(vehicleId) {
  return get(
    vehicleId
      ? `/api/tms/maintenance?vehicleId=${vehicleId}`
      : "/api/tms/maintenance"
  );
}

export async function getMaintenanceById(id) {
  return get(`/api/tms/maintenance/${id}`);
}

export async function createMaintenance(data) {
  return post("/api/tms/maintenance", data);
}

export async function updateMaintenance(id, data) {
  return put(`/api/tms/maintenance/${id}`, data);
}

export async function deleteMaintenance(id) {
  return del(`/api/tms/maintenance/${id}`);
}

// ==================== GPS Logs ====================

export async function getGpsLogs(vehicleId) {
  return get(
    vehicleId
      ? `/api/tms/gpsLogs?vehicleId=${vehicleId}`
      : "/api/tms/gpsLogs"
  );
}

export async function createGpsLog(data) {
  return post("/api/tms/gpsLogs", data);
}

export async function getLatestPositions() {
  return get("/api/tms/gpsLogs/latest");
}

// ==================== Dashboard ====================

export async function getDashboardStats() {
  return get("/api/tms/dashboard");
}

// ==================== Reports ====================

export async function getReportData(type, startDate, endDate) {
  const params = new URLSearchParams({ type, startDate, endDate });
  return get(`/api/tms/reports?${params}`);
}

// ==================== Alerts ====================

export async function getAlerts() {
  return get("/api/tms/alerts");
}
