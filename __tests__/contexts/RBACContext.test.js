import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { RBACProvider, useRBAC } from "@/contexts/RBACContext";

// Mock AuthContext
const mockUser = { id: "user-1" };
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock RBAC actions
const mockGetUserPermissions = jest.fn();
jest.mock("@/actions/rbac", () => ({
  getUserPermissions: (...args) => mockGetUserPermissions(...args),
}));

function TestConsumer() {
  const {
    permissions,
    isSuperAdmin,
    rbacLoading,
    hasPermission,
    hasModuleAccess,
    hasAnyPermission,
  } = useRBAC();

  return (
    <div>
      <span data-testid="loading">{rbacLoading.toString()}</span>
      <span data-testid="superadmin">{isSuperAdmin.toString()}</span>
      <span data-testid="permissions">{permissions.join(",")}</span>
      <span data-testid="has-hr-read">
        {hasPermission("hr:read").toString()}
      </span>
      <span data-testid="has-hr-module">
        {hasModuleAccess("hr").toString()}
      </span>
      <span data-testid="has-any">
        {hasAnyPermission(["it:write", "hr:read"]).toString()}
      </span>
    </div>
  );
}

describe("RBACContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads permissions for authenticated user", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "hr:read", isSuperadmin: false },
      { permission: "hr:write", isSuperadmin: false },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("permissions").textContent).toBe(
      "hr:read,hr:write"
    );
    expect(screen.getByTestId("superadmin").textContent).toBe("false");
  });

  it("detects super admin", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "__superadmin__", isSuperadmin: true },
      { permission: "hr:read", isSuperadmin: true },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("superadmin").textContent).toBe("true");
    });

    // Super admin permissions should exclude __superadmin__ string
    expect(screen.getByTestId("permissions").textContent).toBe("hr:read");
  });

  it("hasPermission works correctly", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "hr:read", isSuperadmin: false },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("has-hr-read").textContent).toBe("true");
    });
  });

  it("hasModuleAccess returns true when user has any permission in module", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "hr:read", isSuperadmin: false },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("has-hr-module").textContent).toBe("true");
    });
  });

  it("hasAnyPermission returns true when user has at least one", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "hr:read", isSuperadmin: false },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("has-any").textContent).toBe("true");
    });
  });

  it("super admin has all permissions", async () => {
    mockGetUserPermissions.mockResolvedValue([
      { permission: "__superadmin__", isSuperadmin: true },
    ]);

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("has-hr-read").textContent).toBe("true");
      expect(screen.getByTestId("has-hr-module").textContent).toBe("true");
      expect(screen.getByTestId("has-any").textContent).toBe("true");
    });
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetUserPermissions.mockRejectedValue(new Error("API Error"));

    render(
      <RBACProvider>
        <TestConsumer />
      </RBACProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("permissions").textContent).toBe("");
    expect(screen.getByTestId("superadmin").textContent).toBe("false");
    consoleSpy.mockRestore();
  });

  it("errors when useRBAC is used outside RBACProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // The default context value is {}, so methods will be undefined
    // causing a runtime error when the consumer tries to use them
    expect(() => {
      render(<TestConsumer />);
    }).toThrow();

    consoleSpy.mockRestore();
  });
});
