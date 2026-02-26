/**
 * @jest-environment node
 */
// Mock dependencies before importing
const mockGetUser = jest.fn();
const mockCreateClient = jest.fn();
const mockHeaders = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

jest.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn((url, key, options) => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: "token-user" } },
          error: null,
        })
      ),
    },
  })),
}));

import { withAuth } from "@/app/api/_lib/auth";

describe("withAuth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "test-key";
  });

  it("returns supabase and session for authenticated cookie user", async () => {
    const mockSupabase = {
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "u1", email: "test@test.com" } },
            error: null,
          }),
      },
    };
    mockCreateClient.mockReturnValue(mockSupabase);

    const result = await withAuth();

    expect(result.supabase).toBe(mockSupabase);
    expect(result.session.user.id).toBe("u1");
    expect(result.error).toBeUndefined();
  });

  it("returns 401 when no auth is available", async () => {
    const mockSupabase = {
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: null },
            error: new Error("Not authenticated"),
          }),
      },
    };
    mockCreateClient.mockReturnValue(mockSupabase);
    mockHeaders.mockReturnValue({
      get: () => null,
    });

    const result = await withAuth();

    expect(result.error).toBeDefined();
    const errorResponse = result.error;
    const data = await errorResponse.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("falls back to Bearer token when cookie auth fails", async () => {
    const mockSupabase = {
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: null },
            error: new Error("No session"),
          }),
      },
    };
    mockCreateClient.mockReturnValue(mockSupabase);
    mockHeaders.mockReturnValue({
      get: (name) =>
        name === "authorization" ? "Bearer test-token-123" : null,
    });

    const result = await withAuth();

    // Should attempt token-based auth
    expect(result.supabase).toBeDefined();
    expect(result.session.user.id).toBe("token-user");
  });
});
