import * as warehouse from "@/actions/warehouse";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("Warehouse Actions", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getWarehouseInventory", () => {
    it("calls GET /api/warehouse/inventory without group", async () => {
      apiClient.get.mockResolvedValue([]);
      await warehouse.getWarehouseInventory();
      expect(apiClient.get).toHaveBeenCalledWith("/api/warehouse/inventory");
    });

    it("calls GET with group query param", async () => {
      apiClient.get.mockResolvedValue([]);
      await warehouse.getWarehouseInventory("raw-materials");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/warehouse/inventory?group=raw-materials"
      );
    });

    it("encodes special characters in group", async () => {
      apiClient.get.mockResolvedValue([]);
      await warehouse.getWarehouseInventory("group A & B");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/warehouse/inventory?group=group%20A%20%26%20B"
      );
    });
  });
});
