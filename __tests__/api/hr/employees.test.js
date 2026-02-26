/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/hr/employees/route";

// Mock auth
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

describe("API /api/hr/employees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder, or: mockOr });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockOr.mockReturnValue({ order: mockOrder });
  });

  describe("GET", () => {
    it("returns employees list", async () => {
      const employees = [{ id: 1, employeeFirstName: "John" }];
      mockOrder.mockResolvedValue({ data: employees, error: null });

      const request = new Request("http://localhost/api/hr/employees");
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual(employees);
      expect(mockSupabase.from).toHaveBeenCalledWith("employees");
    });

    it("filters by search term", async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      const request = new Request(
        "http://localhost/api/hr/employees?search=John"
      );
      await GET(request);

      expect(mockOr).toHaveBeenCalledWith(
        expect.stringContaining("employeeFirstName.ilike.%John%")
      );
    });

    it("returns 500 on database error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const request = new Request("http://localhost/api/hr/employees");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("DB error");
    });
  });

  describe("POST", () => {
    it("creates a new employee", async () => {
      const newEmployee = { id: 1, employeeFirstName: "Alice" };
      mockInsert.mockReturnValue({
        select: () => ({ single: () => Promise.resolve({ data: newEmployee, error: null }) }),
      });

      const request = new Request("http://localhost/api/hr/employees", {
        method: "POST",
        body: JSON.stringify({ employeeFirstName: "Alice" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.employeeFirstName).toBe("Alice");
    });

    it("returns 400 on insert error", async () => {
      mockInsert.mockReturnValue({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Duplicate entry" },
            }),
        }),
      });

      const request = new Request("http://localhost/api/hr/employees", {
        method: "POST",
        body: JSON.stringify({ employeeFirstName: "Dup" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
