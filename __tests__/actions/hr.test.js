import * as hr from "@/actions/hr";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("HR Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Employees ====================

  describe("getEmployees", () => {
    it("calls GET /api/hr/employees", async () => {
      apiClient.get.mockResolvedValue([{ id: 1 }]);
      const result = await hr.getEmployees();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/employees");
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe("getEmployeeById", () => {
    it("calls GET /api/hr/employees/:id", async () => {
      apiClient.get.mockResolvedValue({ id: 1 });
      await hr.getEmployeeById(1);
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/employees/1");
    });
  });

  describe("createEmployee", () => {
    it("calls POST /api/hr/employees with data", async () => {
      const data = { employeeFirstName: "John" };
      apiClient.post.mockResolvedValue({ id: 1, ...data });
      await hr.createEmployee(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/hr/employees", data);
    });
  });

  describe("updateEmployee", () => {
    it("calls PUT /api/hr/employees/:id with data", async () => {
      const data = { employeeFirstName: "Jane" };
      apiClient.put.mockResolvedValue(data);
      await hr.updateEmployee(1, data);
      expect(apiClient.put).toHaveBeenCalledWith("/api/hr/employees/1", data);
    });
  });

  describe("deleteEmployee", () => {
    it("calls DELETE /api/hr/employees/:id", async () => {
      apiClient.del.mockResolvedValue({ success: true });
      await hr.deleteEmployee(1);
      expect(apiClient.del).toHaveBeenCalledWith("/api/hr/employees/1");
    });
  });

  describe("searchEmployees", () => {
    it("calls GET with search query param", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.searchEmployees("John");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/hr/employees?search=John"
      );
    });

    it("encodes special characters in search term", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.searchEmployees("John & Jane");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/hr/employees?search=John%20%26%20Jane"
      );
    });
  });

  // ==================== Divisions ====================

  describe("getDivisions", () => {
    it("calls GET /api/hr/divisions", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.getDivisions();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/divisions");
    });
  });

  describe("createDivision", () => {
    it("calls POST /api/hr/divisions", async () => {
      const data = { divisionName: "Engineering" };
      apiClient.post.mockResolvedValue(data);
      await hr.createDivision(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/hr/divisions", data);
    });
  });

  describe("updateDivision", () => {
    it("calls PUT /api/hr/divisions/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await hr.updateDivision(1, { divisionName: "Updated" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/hr/divisions/1", {
        divisionName: "Updated",
      });
    });
  });

  describe("deleteDivision", () => {
    it("calls DELETE /api/hr/divisions/:id", async () => {
      apiClient.del.mockResolvedValue({ success: true });
      await hr.deleteDivision(1);
      expect(apiClient.del).toHaveBeenCalledWith("/api/hr/divisions/1");
    });
  });

  // ==================== Departments ====================

  describe("getDepartments", () => {
    it("calls GET /api/hr/departments", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.getDepartments();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/departments");
    });
  });

  describe("createDepartment", () => {
    it("calls POST /api/hr/departments", async () => {
      const data = { departmentName: "IT" };
      apiClient.post.mockResolvedValue(data);
      await hr.createDepartment(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/hr/departments", data);
    });
  });

  describe("updateDepartment", () => {
    it("calls PUT /api/hr/departments/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await hr.updateDepartment(2, { departmentName: "HR" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/hr/departments/2", {
        departmentName: "HR",
      });
    });
  });

  describe("deleteDepartment", () => {
    it("calls DELETE /api/hr/departments/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await hr.deleteDepartment(2);
      expect(apiClient.del).toHaveBeenCalledWith("/api/hr/departments/2");
    });
  });

  // ==================== Positions ====================

  describe("getPositions", () => {
    it("calls GET /api/hr/positions", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.getPositions();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/positions");
    });
  });

  describe("createPosition", () => {
    it("calls POST /api/hr/positions", async () => {
      const data = { positionName: "Manager" };
      apiClient.post.mockResolvedValue(data);
      await hr.createPosition(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/hr/positions", data);
    });
  });

  describe("updatePosition", () => {
    it("calls PUT /api/hr/positions/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await hr.updatePosition(3, { positionName: "Director" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/hr/positions/3", {
        positionName: "Director",
      });
    });
  });

  describe("deletePosition", () => {
    it("calls DELETE /api/hr/positions/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await hr.deletePosition(3);
      expect(apiClient.del).toHaveBeenCalledWith("/api/hr/positions/3");
    });
  });

  // ==================== User Linking ====================

  describe("getUnlinkedUsers", () => {
    it("calls GET /api/hr/unlinkedUsers", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.getUnlinkedUsers();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/unlinkedUsers");
    });
  });

  describe("getUnlinkedEmployees", () => {
    it("calls GET /api/hr/unlinkedEmployees", async () => {
      apiClient.get.mockResolvedValue([]);
      await hr.getUnlinkedEmployees();
      expect(apiClient.get).toHaveBeenCalledWith("/api/hr/unlinkedEmployees");
    });
  });
});
