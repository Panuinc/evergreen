import { get, post, put, del } from "@/lib/apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("get", () => {
    it("makes GET request and returns data", async () => {
      const mockData = [{ id: 1, name: "Test" }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await get("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual(mockData);
    });

    it("throws error on non-ok response", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      });

      await expect(get("/api/missing")).rejects.toThrow("Not found");
    });

    it("throws generic error when no error message in response", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(get("/api/fail")).rejects.toThrow(
        "Request failed with status 500"
      );
    });
  });

  describe("post", () => {
    it("makes POST request with JSON body", async () => {
      const body = { name: "New Item" };
      const mockResponse = { id: 1, ...body };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await post("/api/items", body);

      expect(global.fetch).toHaveBeenCalledWith("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("put", () => {
    it("makes PUT request with JSON body", async () => {
      const body = { name: "Updated" };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(body),
      });

      const result = await put("/api/items/1", body);

      expect(global.fetch).toHaveBeenCalledWith("/api/items/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(result).toEqual(body);
    });
  });

  describe("del", () => {
    it("makes DELETE request", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await del("/api/items/1");

      expect(global.fetch).toHaveBeenCalledWith("/api/items/1", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
