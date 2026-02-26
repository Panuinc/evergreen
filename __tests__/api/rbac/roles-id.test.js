/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from "@/app/api/rbac/roles/[id]/route";

const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  })),
};

jest.mock("@/app/api/_lib/auth", () => ({
  withAuth: jest.fn(() =>
    Promise.resolve({ supabase: mockSupabase, session: { user: { id: "u1" } } })
  ),
}));

describe("API /api/rbac/roles/[id]", () => {
  const makeParams = (id) => ({ params: Promise.resolve({ id }) });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  describe("GET", () => {
    it("returns a role by ID", async () => {
      const role = { rbacRoleId: "r1", rbacRoleName: "Admin" };
      mockSingle.mockResolvedValue({ data: role, error: null });

      const request = new Request("http://localhost/api/rbac/roles/r1");
      const response = await GET(request, makeParams("r1"));
      const data = await response.json();

      expect(data.rbacRoleName).toBe("Admin");
      expect(mockEq).toHaveBeenCalledWith("rbacRoleId", "r1");
    });

    it("returns 404 when not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const request = new Request("http://localhost/api/rbac/roles/missing");
      const response = await GET(request, makeParams("missing"));

      expect(response.status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates a role", async () => {
      const updatedRole = { rbacRoleId: "r1", rbacRoleName: "Super Admin" };
      mockUpdate.mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updatedRole, error: null }),
          }),
        }),
      });

      const request = new Request("http://localhost/api/rbac/roles/r1", {
        method: "PUT",
        body: JSON.stringify({ rbacRoleName: "Super Admin" }),
      });
      const response = await PUT(request, makeParams("r1"));
      const data = await response.json();

      expect(data.rbacRoleName).toBe("Super Admin");
    });

    it("returns 400 on update error", async () => {
      mockUpdate.mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: "Update failed" },
              }),
          }),
        }),
      });

      const request = new Request("http://localhost/api/rbac/roles/r1", {
        method: "PUT",
        body: JSON.stringify({ rbacRoleName: "" }),
      });
      const response = await PUT(request, makeParams("r1"));

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("deletes a role", async () => {
      mockDelete.mockReturnValue({
        eq: () => Promise.resolve({ error: null }),
      });

      const request = new Request("http://localhost/api/rbac/roles/r1", {
        method: "DELETE",
      });
      const response = await DELETE(request, makeParams("r1"));
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it("returns 400 on delete error", async () => {
      mockDelete.mockReturnValue({
        eq: () => Promise.resolve({ error: { message: "Cannot delete" } }),
      });

      const request = new Request("http://localhost/api/rbac/roles/r1", {
        method: "DELETE",
      });
      const response = await DELETE(request, makeParams("r1"));

      expect(response.status).toBe(400);
    });
  });
});
