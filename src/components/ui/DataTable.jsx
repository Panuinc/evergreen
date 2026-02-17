"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Card,
  CardBody,
  CardFooter,
} from "@heroui/react";
import { Search, ChevronDown, LayoutGrid, TableProperties } from "lucide-react";

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export default function DataTable({
  columns = [],
  data = [],
  renderCell,
  rowKey = "id",
  isLoading = false,
  initialVisibleColumns,
  searchPlaceholder = "Search...",
  searchKeys = [],
  statusField,
  statusOptions = [],
  filterLabel = "Status",
  topEndContent,
  defaultRowsPerPage = 10,
  defaultSortDescriptor,
  emptyContent = "No data found",
  enableCardView = false,
}) {
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(initialVisibleColumns || columns.map((c) => c.uid)),
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [sortDescriptor, setSortDescriptor] = useState(
    defaultSortDescriptor || {},
  );
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");

  const hasSearchFilter = Boolean(filterValue);

  const noColumn = { name: "No.", uid: "_no", sortable: false };

  const headerColumns = useMemo(() => {
    const visible =
      visibleColumns === "all"
        ? columns
        : columns.filter((column) =>
            Array.from(visibleColumns).includes(column.uid),
          );
    return [noColumn, ...visible];
  }, [columns, visibleColumns]);

  const filteredItems = useMemo(() => {
    let filtered = [...data];

    if (hasSearchFilter && searchKeys.length > 0) {
      const term = filterValue.toLowerCase();
      filtered = filtered.filter((item) =>
        searchKeys.some((key) =>
          String(item[key] || "")
            .toLowerCase()
            .includes(term),
        ),
      );
    }

    if (
      statusField &&
      statusFilter !== "all" &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filtered = filtered.filter((item) =>
        Array.from(statusFilter).includes(item[statusField]),
      );
    }

    return filtered;
  }, [
    data,
    filterValue,
    statusFilter,
    searchKeys,
    statusField,
    statusOptions,
    hasSearchFilter,
  ]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    if (!sortDescriptor.column) return items;
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const cardColumns = useMemo(() => {
    const visible = columns.filter(
      (c) => c.uid !== "actions" && initialVisibleColumns?.includes(c.uid),
    );
    return {
      title: visible[0] || null,
      fields: visible.slice(1),
      hasActions: columns.some((c) => c.uid === "actions"),
    };
  }, [columns, initialVisibleColumns]);

  const viewToggle = useMemo(
    () =>
      enableCardView ? (
        <div className="flex gap-1">
          <Button
            variant={view === "table" ? "solid" : "bordered"}
            size="md"
            radius="md"
            isIconOnly
            onPress={() => setView("table")}
          >
            <TableProperties size={18} />
          </Button>
          <Button
            variant={view === "card" ? "solid" : "bordered"}
            size="md"
            radius="md"
            isIconOnly
            onPress={() => setView("card")}
          >
            <LayoutGrid size={18} />
          </Button>
        </div>
      ) : null,
    [enableCardView, view],
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          {searchKeys.length > 0 ? (
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder={searchPlaceholder}
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Search />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={onSearchChange}
            />
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            {statusField && statusOptions.length > 0 && (
              <Dropdown>
                <DropdownTrigger className="hidden sm:flex">
                  <Button
                    variant="bordered"
                    size="md"
                    radius="md"
                    endContent={<ChevronDown />}
                  >
                    {filterLabel}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Status Filter"
                  closeOnSelect={false}
                  selectedKeys={statusFilter}
                  selectionMode="multiple"
                  onSelectionChange={setStatusFilter}
                >
                  {statusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {capitalize(status.name)}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
            {view === "table" && (
              <Dropdown>
                <DropdownTrigger className="hidden sm:flex">
                  <Button
                    variant="bordered"
                    size="md"
                    radius="md"
                    endContent={<ChevronDown />}
                  >
                    Columns
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Table Columns"
                  closeOnSelect={false}
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                >
                  {columns
                    .filter((c) => c.uid !== "actions")
                    .map((column) => (
                      <DropdownItem key={column.uid} className="capitalize">
                        {capitalize(column.name)}
                      </DropdownItem>
                    ))}
                </DropdownMenu>
              </Dropdown>
            )}
            {topEndContent}
            {viewToggle}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {filteredItems.length} records
          </span>
          <label className="flex items-center text-default-400 text-small gap-1">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small cursor-pointer"
              value={rowsPerPage}
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    visibleColumns,
    rowsPerPage,
    filteredItems.length,
    onSearchChange,
    onRowsPerPageChange,
    columns,
    searchKeys,
    searchPlaceholder,
    statusField,
    statusOptions,
    filterLabel,
    topEndContent,
    view,
    viewToggle,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400" />
        <Pagination
          isCompact
          showControls
          showShadow
          color="default"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            isDisabled={pages === 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            isDisabled={pages === 1}
            onPress={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [page, pages]);

  if (view === "card" && enableCardView) {
    return (
      <div className="flex flex-col gap-4">
        {topContent}
        {isLoading ? (
          <div className="flex items-center justify-center w-full py-12">
            <Spinner />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex items-center justify-center w-full py-12 text-default-400">
            {emptyContent}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item, idx) => (
              <Card
                key={item[rowKey] ?? `card-${idx}`}
                variant="bordered"
                radius="md"
                shadow="none"
                className="border-2 border-default"
              >
                <CardBody className="gap-3">
                  {cardColumns.title && (
                    <div className="font-semibold text-lg">
                      {renderCell(item, cardColumns.title.uid)}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-sm">
                    {cardColumns.fields.map((col) => (
                      <div key={col.uid} className="flex justify-between">
                        <span className="text-default-400">{col.name}</span>
                        <span>{renderCell(item, col.uid)}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
                {cardColumns.hasActions && (
                  <CardFooter className="gap-1 justify-end">
                    {renderCell(item, "actions")}
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
        {bottomContent}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
    <Table
      isHeaderSticky
      aria-label="Data table"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSortChange={setSortDescriptor}
      shadow="none"
      classNames={{
        th: "border-b-2 border-r-2 border-default last:border-r-0",
        td: "border-b-2 border-r-2 border-default last:border-r-0",
        table: "min-w-[600px]",
      }}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={emptyContent}
        items={sortedItems}
        isLoading={isLoading}
        loadingContent={<Spinner />}
      >
        {(item) => (
          <TableRow key={item[rowKey] ?? `row-${sortedItems.indexOf(item)}`}>
            {(columnKey) => (
              <TableCell>
                {columnKey === "_no"
                  ? (page - 1) * rowsPerPage + sortedItems.indexOf(item) + 1
                  : renderCell(item, columnKey)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
    </div>
  );
}
