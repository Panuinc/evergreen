/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/rbac/roles/route";

const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockInsert = jest.fn();

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

describe("API /api/rbac/roles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ order: mockOrder });
  });

  describe("GET", () => {
    it("returns roles with user and permission counts", async () => {
      const roles = [
        {
          roleId: "r1",
          roleName: "Admin",
          userRoles: [{ count: 5 }],
          rolePermissions: [{ count: 10 }],
        },
      ];
      mockOrder.mockResolvedValue({ data: roles, error: null });

      const response = await GET();
      const data = await response.json();

      expect(data).toEqual(roles);
      expect(mockSelect).toHaveBeenCalledWith(
        "*, userRoles:userRoles(count), rolePermissions:rolePermissions(count)"
      );
    });

    it("returns 500 on error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const response = await GET();
      expect(response.status).toBe(500);
    });
  });

  describe("POST", () => {
    it("creates a new role", async () => {
      const newRole = { roleId: "r2", roleName: "Editor" };
      mockInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: newRole, error: null }),
        }),
      });

      const request = new Request("http://localhost/api/rbac/roles", {
        method: "POST",
        body: JSON.stringify({ roleName: "Editor" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.roleName).toBe("Editor");
    });

    it("returns 400 on create error", async () => {
      mockInsert.mockReturnValue({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Duplicate role" },
            }),
        }),
      });

      const request = new Request("http://localhost/api/rbac/roles", {
        method: "POST",
        body: JSON.stringify({ roleName: "Admin" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
