"use client";

import { useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useEmployees } from "@/hooks/hr/useEmployees";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "อีเมล", uid: "employeeEmail", sortable: true },
  { name: "โทรศัพท์", uid: "employeePhone" },
  { name: "ฝ่าย", uid: "employeeDivision", sortable: true },
  { name: "แผนก", uid: "employeeDepartment", sortable: true },
  { name: "ตำแหน่ง", uid: "employeePosition", sortable: true },
  { name: "สถานะ", uid: "employeeStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "active" },
  { name: "ปิดใช้งาน", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "employeeEmail",
  "employeeDivision",
  "employeeDepartment",
  "employeePosition",
  "employeeStatus",
  "actions",
];

export default function EmployeesPage() {
  const {
    employees,
    divisions,
    departments,
    positions,
    loading,
    saving,
    editingEmployee,
    formData,
    deletingEmployee,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useEmployees();

  const renderCell = useCallback(
    (emp, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-medium">
              {emp.employeeFirstName} {emp.employeeLastName}
            </span>
          );
        case "employeeEmail":
          return (
            <span className="text-default-500">{emp.employeeEmail || "-"}</span>
          );
        case "employeePhone":
          return (
            <span className="text-default-500">{emp.employeePhone || "-"}</span>
          );
        case "employeeDivision":
          return emp.employeeDivision || "-";
        case "employeeDepartment":
          return emp.employeeDepartment || "-";
        case "employeePosition":
          return emp.employeePosition || "-";
        case "employeeStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={emp.employeeStatus === "active" ? "success" : "default"}
            >
              {emp.employeeStatus}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(emp)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(emp)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return emp[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={employees}
        renderCell={renderCell}
        enableCardView
        rowKey="employeeId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, อีเมล, แผนก, ตำแหน่ง..."
        searchKeys={[
          "employeeFirstName",
          "employeeLastName",
          "employeeEmail",
          "employeePhone",
          "employeeDivision",
          "employeeDepartment",
          "employeePosition",
        ]}
        statusField="employeeStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบพนักงาน"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มพนักงาน
          </Button>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingEmployee ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeeFirstName}
                    onChange={(e) =>
                      updateField("employeeFirstName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="นามสกุล"
                    labelPlacement="outside"
                    placeholder="ใส่นามสกุล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeeLastName}
                    onChange={(e) =>
                      updateField("employeeLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="email"
                    label="อีเมล"
                    labelPlacement="outside"
                    placeholder="ใส่อีเมล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeeEmail}
                    onChange={(e) =>
                      updateField("employeeEmail", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="ใส่เบอร์โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.employeePhone}
                    onChange={(e) =>
                      updateField("employeePhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ฝ่าย"
                    labelPlacement="outside"
                    placeholder="เลือกฝ่าย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.employeeDivision
                        ? [formData.employeeDivision]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("employeeDivision", val);
                      updateField("employeeDepartment", "");
                      updateField("employeePosition", "");
                    }}
                  >
                    {divisions.map((div) => (
                      <SelectItem key={div.divisionName}>
                        {div.divisionName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="แผนก"
                    labelPlacement="outside"
                    placeholder={formData.employeeDivision ? "เลือกแผนก" : "เลือกฝ่ายก่อน"}
                    variant="bordered"
                    size="md"
                    radius="md"
                    isDisabled={!formData.employeeDivision}
                    selectedKeys={
                      formData.employeeDepartment
                        ? [formData.employeeDepartment]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("employeeDepartment", val);
                      updateField("employeePosition", "");
                    }}
                  >
                    {departments
                      .filter((dept) => dept.departmentDivision === formData.employeeDivision)
                      .map((dept) => (
                        <SelectItem key={dept.departmentName}>
                          {dept.departmentName}
                        </SelectItem>
                      ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder={formData.employeeDepartment ? "เลือกตำแหน่ง" : "เลือกแผนกก่อน"}
                    variant="bordered"
                    size="md"
                    radius="md"
                    isDisabled={!formData.employeeDepartment}
                    selectedKeys={
                      formData.employeePosition
                        ? [formData.employeePosition]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("employeePosition", val);
                    }}
                  >
                    {positions
                      .filter((pos) => pos.positionDepartment === formData.employeeDepartment)
                      .map((pos) => (
                        <SelectItem key={pos.positionTitle}>
                          {pos.positionTitle}
                        </SelectItem>
                      ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.employeeStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("employeeStatus", val);
                    }}
                  >
                    <SelectItem key="active">เปิดใช้งาน</SelectItem>
                    <SelectItem key="inactive">ปิดใช้งาน</SelectItem>
                  </Select>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              {editingEmployee ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบพนักงาน</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingEmployee?.employeeFirstName}{" "}
                {deletingEmployee?.employeeLastName}
              </span>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
