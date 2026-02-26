import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Mock contexts
let mockAuthValue = { user: { id: "u1" }, loading: false };
let mockRbacValue = {
  hasPermission: jest.fn(() => true),
  hasModuleAccess: jest.fn(() => true),
  rbacLoading: false,
};

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

jest.mock("@/contexts/RBACContext", () => ({
  useRBAC: () => mockRbacValue,
}));

jest.mock("@/actions/rbac", () => ({
  logAccess: jest.fn(),
}));

// Mock Loading and Forbidden
jest.mock("@/components/ui/Loading", () => {
  return function MockLoading() {
    return <div data-testid="loading">Loading...</div>;
  };
});

jest.mock("@/app/forbidden", () => {
  return function MockForbidden() {
    return <div data-testid="forbidden">Forbidden</div>;
  };
});

import PermissionGuard from "@/components/guards/PermissionGuard";
import { logAccess } from "@/actions/rbac";

describe("PermissionGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthValue = { user: { id: "u1" }, loading: false };
    mockRbacValue = {
      hasPermission: jest.fn(() => true),
      hasModuleAccess: jest.fn(() => true),
      rbacLoading: false,
    };
  });

  it("renders children when user has permission", () => {
    render(
      <PermissionGuard permission="hr:read">
        <div data-testid="child">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(mockRbacValue.hasPermission).toHaveBeenCalledWith("hr:read");
  });

  it("renders children when user has module access", () => {
    render(
      <PermissionGuard moduleId="hr">
        <div data-testid="child">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(mockRbacValue.hasModuleAccess).toHaveBeenCalledWith("hr");
  });

  it("renders children when no permission or moduleId specified", () => {
    render(
      <PermissionGuard>
        <div data-testid="child">Public Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows Loading when auth is loading", () => {
    mockAuthValue = { user: null, loading: true };

    render(
      <PermissionGuard permission="hr:read">
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("shows Loading when rbac is loading", () => {
    mockRbacValue = { ...mockRbacValue, rbacLoading: true };

    render(
      <PermissionGuard permission="hr:read">
        <div>Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("shows Forbidden when user lacks permission", () => {
    mockRbacValue.hasPermission.mockReturnValue(false);

    render(
      <PermissionGuard permission="admin:delete">
        <div>Secret</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("forbidden")).toBeInTheDocument();
  });

  it("shows Forbidden when user lacks module access", () => {
    mockRbacValue.hasModuleAccess.mockReturnValue(false);

    render(
      <PermissionGuard moduleId="admin">
        <div>Secret</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId("forbidden")).toBeInTheDocument();
  });

  it("logs access when user and loading are resolved", async () => {
    jest.useFakeTimers();

    render(
      <PermissionGuard permission="hr:read">
        <div>Content</div>
      </PermissionGuard>
    );

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(logAccess).toHaveBeenCalledWith("u1", "hr:read", "access", true);
    });

    jest.useRealTimers();
  });
});
