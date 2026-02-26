import React from "react";
import { render, screen } from "@testing-library/react";

// Mock dependencies
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/components/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "admin@test.com" },
    signOut: jest.fn(),
  }),
}));

// Mock HeroUI components
jest.mock("@heroui/react", () => ({
  Avatar: ({ src, className }) => (
    <img data-testid="avatar" src={src} className={className} />
  ),
  Dropdown: ({ children }) => <div>{children}</div>,
  DropdownTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownItem: ({ children, onPress }) => (
    <button onClick={onPress}>{children}</button>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Settings: () => <span>Settings</span>,
  Sun: () => <span>Sun</span>,
  Moon: () => <span>Moon</span>,
  Bell: () => <span>Bell</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  Menu: () => <span>Menu</span>,
}));

import Header from "@/components/layout/Header";

describe("Header", () => {
  it("renders the app name", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByText(/Evergreen/)).toBeInTheDocument();
  });

  it("displays user email prefix", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders theme toggle button (Moon icon in light mode)", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByText("Moon")).toBeInTheDocument();
  });

  it("renders notification and message badges", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument(); // notification count
    expect(screen.getByText("5")).toBeInTheDocument(); // message count
  });

  it("renders avatar", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("renders user menu items", () => {
    render(<Header onMobileMenuToggle={jest.fn()} />);
    expect(screen.getByText("โปรไฟล์ของฉัน")).toBeInTheDocument();
    expect(screen.getByText("ตั้งค่า")).toBeInTheDocument();
    expect(screen.getByText("ออกจากระบบ")).toBeInTheDocument();
  });
});
