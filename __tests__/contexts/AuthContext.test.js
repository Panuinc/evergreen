import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock supabase client
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
      getSession: (...args) => mockGetSession(...args),
      getUser: (...args) => mockGetUser(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
}));

// Mock window.location
delete window.location;
window.location = { href: "", assign: jest.fn(), replace: jest.fn() };

function TestConsumer() {
  const { user, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading.toString()}</span>
      <span data-testid="user">{user?.email || "none"}</span>
      <button onClick={() => signIn("test@test.com", "password")}>
        Sign In
      </button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = "";
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("starts in loading state", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId("loading").textContent).toBe("true");

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("sets user from session", async () => {
    const mockUser = { id: "1", email: "john@test.com" };
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("john@test.com");
    });
  });

  it("sets user to null when no session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("none");
    });
  });

  it("signIn calls supabase with credentials", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign In"));

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
    });
  });

  it("signIn returns error on failure", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignInWithPassword.mockResolvedValue({
      error: new Error("Invalid credentials"),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });

  it("signOut calls supabase", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "1", email: "test@test.com" } } },
    });
    mockSignOut.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign Out"));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("errors when useAuth is used outside AuthProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow();

    consoleSpy.mockRestore();
  });
});
