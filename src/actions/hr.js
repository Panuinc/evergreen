import { get, post, put, del } from "@/lib/apiClient";

// ==================== HR Employee CRUD ====================

export async function getEmployees() {
  return get("/api/hr/employees");
}

export async function getEmployeeById(id) {
  return get(`/api/hr/employees/${id}`);
}

export async function createEmployee(employeeData) {
  return post("/api/hr/employees", employeeData);
}

export async function updateEmployee(id, employeeData) {
  return put(`/api/hr/employees/${id}`, employeeData);
}

export async function deleteEmployee(id) {
  return del(`/api/hr/employees/${id}`);
}

export async function searchEmployees(searchTerm) {
  return get(`/api/hr/employees?search=${encodeURIComponent(searchTerm)}`);
}

// ==================== User Linking ====================

export async function getUnlinkedUsers() {
  return get("/api/hr/unlinkedUsers");
}

export async function getUnlinkedEmployees() {
  return get("/api/hr/unlinkedEmployees");
}

// ==================== Departments ====================

export async function getDepartments() {
  return get("/api/hr/departments");
}

export async function createDepartment(departmentData) {
  return post("/api/hr/departments", departmentData);
}

export async function updateDepartment(id, departmentData) {
  return put(`/api/hr/departments/${id}`, departmentData);
}

export async function deleteDepartment(id) {
  return del(`/api/hr/departments/${id}`);
}

// ==================== Positions ====================

export async function getPositions() {
  return get("/api/hr/positions");
}

export async function createPosition(positionData) {
  return post("/api/hr/positions", positionData);
}

export async function updatePosition(id, positionData) {
  return put(`/api/hr/positions/${id}`, positionData);
}

export async function deletePosition(id) {
  return del(`/api/hr/positions/${id}`);
}
