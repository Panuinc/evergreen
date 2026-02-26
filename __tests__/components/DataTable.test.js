import React from "react";
import { render, screen } from "@testing-library/react";

// Mock HeroUI components
jest.mock("@heroui/react", () => ({
  Table: ({ children, topContent, bottomContent, ...props }) => (
    <div>
      {topContent}
      <table data-testid="data-table">
        {children}
      </table>
      {bottomContent}
    </div>
  ),
  TableHeader: ({ children, columns }) => (
    <thead>
      <tr>{columns.map((col) => children(col))}</tr>
    </thead>
  ),
  TableColumn: ({ children, key: k }) => <th key={k}>{children}</th>,
  TableBody: ({ children, items, emptyContent, isLoading, loadingContent }) => {
    if (isLoading) return <tbody><tr><td>{loadingContent}</td></tr></tbody>;
    if (!items || items.length === 0)
      return <tbody><tr><td>{emptyContent}</td></tr></tbody>;
    return <tbody>{items.map((item) => children(item))}</tbody>;
  },
  TableRow: ({ children, key: k }) => <tr key={k}>{children}</tr>,
  TableCell: ({ children }) => <td>{children}</td>,
  Input: ({ placeholder, value, onValueChange, onClear, ...props }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="search-input"
    />
  ),
  Button: ({ children, onPress, ...props }) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Dropdown: ({ children }) => <div>{children}</div>,
  DropdownTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownItem: ({ children }) => <div>{children}</div>,
  Pagination: ({ page, total }) => (
    <div data-testid="pagination">
      Page {page} of {total}
    </div>
  ),
  Spinner: () => <div data-testid="spinner">Loading...</div>,
  Card: ({ children }) => <div>{children}</div>,
  CardBody: ({ children }) => <div>{children}</div>,
  CardFooter: ({ children }) => <div>{children}</div>,
}));

jest.mock("lucide-react", () => ({
  Search: () => <span>Search</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  LayoutGrid: () => <span>Grid</span>,
  TableProperties: () => <span>Table</span>,
}));

import DataTable from "@/components/ui/DataTable";

describe("DataTable", () => {
  const columns = [
    { uid: "name", name: "Name", sortable: true },
    { uid: "email", name: "Email", sortable: true },
    { uid: "actions", name: "Actions" },
  ];

  const data = [
    { id: 1, name: "Alice", email: "alice@test.com" },
    { id: 2, name: "Bob", email: "bob@test.com" },
    { id: 3, name: "Charlie", email: "charlie@test.com" },
  ];

  const renderCell = (item, columnKey) => {
    if (columnKey === "actions") return <button>Edit</button>;
    return item[columnKey];
  };

  it("renders the table element", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        searchKeys={["name", "email"]}
      />
    );

    expect(screen.getByTestId("data-table")).toBeInTheDocument();
  });

  it("renders search input when searchKeys provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        searchKeys={["name"]}
      />
    );

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows empty content when no data", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        renderCell={renderCell}
        emptyContent="ไม่พบข้อมูล"
      />
    );

    expect(screen.getByText("ไม่พบข้อมูล")).toBeInTheDocument();
  });

  it("shows spinner when loading", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        renderCell={renderCell}
        isLoading={true}
      />
    );

    expect(screen.getAllByTestId("spinner").length).toBeGreaterThan(0);
  });

  it("displays total count", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
      />
    );

    expect(screen.getByText(/ทั้งหมด 3 รายการ/)).toBeInTheDocument();
  });

  it("renders rows per page selector", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
      />
    );

    expect(screen.getByText(/แถวต่อหน้า/)).toBeInTheDocument();
  });

  it("renders column names", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
      />
    );

    // Column names appear in the header and column visibility dropdown
    expect(screen.getAllByText("Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Email").length).toBeGreaterThanOrEqual(1);
  });

  it("renders row number column", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
      />
    );

    expect(screen.getByText("ลำดับ")).toBeInTheDocument();
  });
});
