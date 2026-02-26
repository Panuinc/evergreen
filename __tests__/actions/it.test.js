import * as itActions from "@/actions/it";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("IT Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Assets ====================

  describe("assets", () => {
    it("getAssets calls GET /api/it/assets", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getAssets();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/assets");
    });

    it("createAsset calls POST", async () => {
      const data = { assetName: "Laptop" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createAsset(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/assets", data);
    });

    it("updateAsset calls PUT", async () => {
      apiClient.put.mockResolvedValue({});
      await itActions.updateAsset("a1", { assetName: "Desktop" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/it/assets/a1", {
        assetName: "Desktop",
      });
    });

    it("deleteAsset calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await itActions.deleteAsset("a1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/it/assets/a1");
    });
  });

  // ==================== Tickets ====================

  describe("tickets", () => {
    it("getTickets calls GET /api/it/tickets", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getTickets();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/tickets");
    });

    it("createTicket calls POST", async () => {
      const data = { subject: "Need help" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createTicket(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/tickets", data);
    });

    it("updateTicket calls PUT", async () => {
      apiClient.put.mockResolvedValue({});
      await itActions.updateTicket("t1", { status: "resolved" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/it/tickets/t1", {
        status: "resolved",
      });
    });

    it("deleteTicket calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await itActions.deleteTicket("t1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/it/tickets/t1");
    });
  });

  // ==================== System Access ====================

  describe("system access", () => {
    it("getSystemAccess calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getSystemAccess();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/systemAccess");
    });

    it("createSystemAccess calls POST", async () => {
      const data = { system: "ERP" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createSystemAccess(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/it/systemAccess",
        data
      );
    });
  });

  // ==================== Network ====================

  describe("network devices", () => {
    it("getNetworkDevices calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getNetworkDevices();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/network");
    });

    it("createNetworkDevice calls POST", async () => {
      const data = { deviceName: "Switch" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createNetworkDevice(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/network", data);
    });
  });

  // ==================== Software ====================

  describe("software", () => {
    it("getSoftware calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getSoftware();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/software");
    });

    it("createSoftware calls POST", async () => {
      const data = { name: "VS Code" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createSoftware(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/software", data);
    });
  });

  // ==================== Security ====================

  describe("security incidents", () => {
    it("getSecurityIncidents calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getSecurityIncidents();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/security");
    });

    it("createSecurityIncident calls POST", async () => {
      const data = { type: "breach" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createSecurityIncident(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/security", data);
    });
  });

  // ==================== Dev Requests ====================

  describe("dev requests", () => {
    it("getDevRequests calls GET", async () => {
      apiClient.get.mockResolvedValue([]);
      await itActions.getDevRequests();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/devRequests");
    });

    it("createDevRequest calls POST", async () => {
      const data = { title: "New feature" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createDevRequest(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/it/devRequests", data);
    });

    it("createProgressLog calls POST", async () => {
      const data = { note: "50% done" };
      apiClient.post.mockResolvedValue(data);
      await itActions.createProgressLog("req1", data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/it/devRequests/req1/progress",
        data
      );
    });
  });

  // ==================== Dashboard ====================

  describe("dashboard", () => {
    it("getItDashboardStats calls GET", async () => {
      apiClient.get.mockResolvedValue({});
      await itActions.getItDashboardStats();
      expect(apiClient.get).toHaveBeenCalledWith("/api/it/dashboard");
    });
  });
});
