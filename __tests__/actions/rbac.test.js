import * as rbac from "@/actions/rbac";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("RBAC Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Roles ====================

  describe("getRoles", () => {
    it("calls GET /api/rbac/roles", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getRoles();
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/roles");
    });
  });

  describe("getRoleById", () => {
    it("calls GET /api/rbac/roles/:id", async () => {
      apiClient.get.mockResolvedValue({ roleId: "r1" });
      await rbac.getRoleById("r1");
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/roles/r1");
    });
  });

  describe("createRole", () => {
    it("calls POST /api/rbac/roles", async () => {
      const data = { roleName: "Admin" };
      apiClient.post.mockResolvedValue(data);
      await rbac.createRole(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/rbac/roles", data);
    });
  });

  describe("updateRole", () => {
    it("calls PUT /api/rbac/roles/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await rbac.updateRole("r1", { roleName: "Super Admin" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/rbac/roles/r1", {
        roleName: "Super Admin",
      });
    });
  });

  describe("deleteRole", () => {
    it("calls DELETE /api/rbac/roles/:id", async () => {
      apiClient.del.mockResolvedValue({ success: true });
      await rbac.deleteRole("r1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/rbac/roles/r1");
    });
  });

  // ==================== Resources ====================

  describe("getResources", () => {
    it("calls GET /api/rbac/resources", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getResources();
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/resources");
    });
  });

  describe("createResource", () => {
    it("calls POST /api/rbac/resources", async () => {
      const data = { resourceName: "users" };
      apiClient.post.mockResolvedValue(data);
      await rbac.createResource(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/rbac/resources", data);
    });
  });

  describe("updateResource", () => {
    it("calls PUT /api/rbac/resources/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await rbac.updateResource("res1", { resourceName: "updated" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/rbac/resources/res1", {
        resourceName: "updated",
      });
    });
  });

  describe("deleteResource", () => {
    it("calls DELETE /api/rbac/resources/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await rbac.deleteResource("res1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/rbac/resources/res1");
    });
  });

  // ==================== Actions ====================

  describe("getActions", () => {
    it("calls GET /api/rbac/actions", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getActions();
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/actions");
    });
  });

  describe("createAction", () => {
    it("calls POST /api/rbac/actions", async () => {
      const data = { actionName: "read" };
      apiClient.post.mockResolvedValue(data);
      await rbac.createAction(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/rbac/actions", data);
    });
  });

  describe("updateAction", () => {
    it("calls PUT /api/rbac/actions/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await rbac.updateAction("a1", { actionName: "write" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/rbac/actions/a1", {
        actionName: "write",
      });
    });
  });

  describe("deleteAction", () => {
    it("calls DELETE /api/rbac/actions/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await rbac.deleteAction("a1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/rbac/actions/a1");
    });
  });

  // ==================== Permissions ====================

  describe("getPermissions", () => {
    it("calls GET /api/rbac/permissions", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getPermissions();
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/permissions");
    });
  });

  describe("createPermission", () => {
    it("calls POST /api/rbac/permissions", async () => {
      const data = { permissionKey: "users:read" };
      apiClient.post.mockResolvedValue(data);
      await rbac.createPermission(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/rbac/permissions",
        data
      );
    });
  });

  describe("deletePermission", () => {
    it("calls DELETE /api/rbac/permissions/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await rbac.deletePermission("p1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/rbac/permissions/p1");
    });
  });

  // ==================== Role Permissions ====================

  describe("getRolePermissions", () => {
    it("calls GET /api/rbac/rolePermissions/:roleId", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getRolePermissions("r1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/rbac/rolePermissions/r1"
      );
    });
  });

  describe("assignPermissionToRole", () => {
    it("calls POST with permission ID", async () => {
      apiClient.post.mockResolvedValue({});
      await rbac.assignPermissionToRole("r1", "p1");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/rbac/rolePermissions/r1",
        { rbacRolePermissionPermissionId: "p1" }
      );
    });
  });

  describe("removePermissionFromRole", () => {
    it("calls DELETE with query param", async () => {
      apiClient.del.mockResolvedValue({});
      await rbac.removePermissionFromRole("r1", "p1");
      expect(apiClient.del).toHaveBeenCalledWith(
        "/api/rbac/rolePermissions/r1?rbacRolePermissionPermissionId=p1"
      );
    });
  });

  // ==================== User Roles ====================

  describe("getUserRoles", () => {
    it("calls GET /api/rbac/userRoles/:userId", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getUserRoles("u1");
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/userRoles/u1");
    });
  });

  describe("assignRoleToUser", () => {
    it("calls POST with roleId", async () => {
      apiClient.post.mockResolvedValue({});
      await rbac.assignRoleToUser("u1", "r1");
      expect(apiClient.post).toHaveBeenCalledWith("/api/rbac/userRoles/u1", {
        rbacUserRoleRoleId: "r1",
      });
    });
  });

  describe("removeRoleFromUser", () => {
    it("calls DELETE with query param", async () => {
      apiClient.del.mockResolvedValue({});
      await rbac.removeRoleFromUser("u1", "r1");
      expect(apiClient.del).toHaveBeenCalledWith(
        "/api/rbac/userRoles/u1?rbacUserRoleRoleId=r1"
      );
    });
  });

  // ==================== User Permissions ====================

  describe("getUserPermissions", () => {
    it("calls GET /api/rbac/userPermissions/:userId", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getUserPermissions("u1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/rbac/userPermissions/u1"
      );
    });
  });

  // ==================== Create User ====================

  describe("createUser", () => {
    it("calls POST /api/admin/createUser", async () => {
      const data = { email: "test@test.com", password: "pass123" };
      apiClient.post.mockResolvedValue({ id: "u1" });
      await rbac.createUser(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/admin/createUser",
        data
      );
    });
  });

  // ==================== Access Logs ====================

  describe("getAccessLogs", () => {
    it("calls GET /api/rbac/accessLogs", async () => {
      apiClient.get.mockResolvedValue([]);
      await rbac.getAccessLogs();
      expect(apiClient.get).toHaveBeenCalledWith("/api/rbac/accessLogs");
    });
  });

  describe("logAccess", () => {
    it("calls POST /api/rbac/accessLogs", async () => {
      apiClient.post.mockResolvedValue({});
      await rbac.logAccess("u1", "hr:employees", "access", true);
      expect(apiClient.post).toHaveBeenCalledWith("/api/rbac/accessLogs", {
        rbacAccessLogUserId: "u1",
        rbacAccessLogResource: "hr:employees",
        rbacAccessLogAction: "access",
        rbacAccessLogGranted: true,
        rbacAccessLogMetadata: null,
      });
    });

    it("does not throw on error", async () => {
      apiClient.post.mockRejectedValue(new Error("Network error"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await rbac.logAccess("u1", "resource", "action", false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
