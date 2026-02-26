import * as production from "@/actions/production";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("Production Actions", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getBcProductionOrders", () => {
    it("calls GET /api/bc/productionOrders", async () => {
      apiClient.get.mockResolvedValue([]);
      await production.getBcProductionOrders();
      expect(apiClient.get).toHaveBeenCalledWith("/api/bc/productionOrders");
    });
  });

  describe("getBcProduction", () => {
    it("calls GET /api/bc/production", async () => {
      apiClient.get.mockResolvedValue({});
      await production.getBcProduction();
      expect(apiClient.get).toHaveBeenCalledWith("/api/bc/production");
    });
  });

  describe("getProductionDashboard", () => {
    it("calls GET /api/production/dashboard", async () => {
      apiClient.get.mockResolvedValue({});
      await production.getProductionDashboard();
      expect(apiClient.get).toHaveBeenCalledWith("/api/production/dashboard");
    });
  });
});
