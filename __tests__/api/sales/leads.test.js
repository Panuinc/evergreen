/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/sales/leads/route";

const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockInsert = jest.fn();
const mockOr = jest.fn();

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  })),
};

jest.mock("@/app/api/_lib/auth", () => ({
  withAuth: jest.fn(() =>
    Promise.resolve({ supabase: mockSupabase, session: { user: { id: "u1" } } })
  ),
}));

describe("API /api/sales/leads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder, or: mockOr });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOr.mockReturnValue({ order: mockOrder });
  });

  describe("GET", () => {
    it("returns leads list", async () => {
      const leads = [{ id: 1, leadName: "Prospect A" }];
      mockOrder.mockResolvedValue({ data: leads, error: null });

      const request = new Request("http://localhost/api/sales/leads");
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual(leads);
      expect(mockSupabase.from).toHaveBeenCalledWith("crmLeads");
    });

    it("filters by search", async () => {
      const request = new Request(
        "http://localhost/api/sales/leads?search=Acme"
      );
      await GET(request);

      expect(mockOr).toHaveBeenCalledWith(
        expect.stringContaining("leadName.ilike.%Acme%")
      );
    });

    it("returns 500 on error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "DB fail" },
      });

      const request = new Request("http://localhost/api/sales/leads");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("creates a new lead", async () => {
      const newLead = { id: 1, leadName: "New Lead" };
      mockInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: newLead, error: null }),
        }),
      });

      const request = new Request("http://localhost/api/sales/leads", {
        method: "POST",
        body: JSON.stringify({ leadName: "New Lead" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it("returns 400 on error", async () => {
      mockInsert.mockReturnValue({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Missing field" },
            }),
        }),
      });

      const request = new Request("http://localhost/api/sales/leads", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
