import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signOut: jest.fn() }),
}));

jest.mock("@/contexts/RBACContext", () => ({
  useRBAC: () => ({
    hasModuleAccess: jest.fn((moduleId) => {
      // Simulate access to some modules only
      return ["overview", "hr", "sales", "rbac"].includes(moduleId);
    }),
    rbacLoading: false,
  }),
}));

// Mock lucide-react
jest.mock("lucide-react", () => {
  const MockIcon = ({ children }) => <span>{children}</span>;
  return new Proxy(
    {},
    {
      get: (target, name) => {
        if (name === "__esModule") return false;
        return MockIcon;
      },
    }
  );
});

import Sidebar from "@/components/layout/Sidebar";
import { menuData } from "@/config/menu";

describe("Sidebar", () => {
  const defaultProps = {
    activeMenu: menuData[0],
    isCollapsed: false,
    onMenuSelect: jest.fn(),
    onToggleCollapse: jest.fn(),
  };

  it("renders menu items based on RBAC", () => {
    render(<Sidebar {...defaultProps} />);
    // Overview should always be visible
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
    // HR should be visible (has access)
    expect(screen.getByText("ทรัพยากรบุคคล")).toBeInTheDocument();
    // Sales should be visible
    expect(screen.getByText("การขาย")).toBeInTheDocument();
  });

  it("renders collapse toggle", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("ย่อเมนู")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("ออกจากระบบ")).toBeInTheDocument();
  });

  it("calls onMenuSelect when menu item is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("ภาพรวม"));
    expect(defaultProps.onMenuSelect).toHaveBeenCalledWith("overview");
  });

  it("calls onToggleCollapse when collapse button is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("ย่อเมนู"));
    expect(defaultProps.onToggleCollapse).toHaveBeenCalled();
  });

  it("hides menu names when collapsed", () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />);
    expect(screen.queryByText("ภาพรวม")).not.toBeInTheDocument();
    expect(screen.queryByText("ย่อเมนู")).not.toBeInTheDocument();
  });
});
