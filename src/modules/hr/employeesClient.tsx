"use client";

import { useState, useCallback } from "react";
import {
  Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Select, SelectItem, Chip, Switch, useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import { get, post, put, del } from "@/lib/apiClient";
import type {
  HrEmployee,
  HrDivision,
  HrDepartment,
  HrPosition,
  EmployeesClientProps,
  EmployeeFormData,
} from "./types";

const columns = [
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "อีเมล", uid: "hrEmployeeEmail", sortable: true },
  { name: "โทรศัพท์", uid: "hrEmployeePhone" },
  { name: "ฝ่าย", uid: "hrEmployeeHrDivisionId", sortable: true },
  { name: "แผนก", uid: "hrEmployeeHrDepartmentId", sortable: true },
  { name: "ตำแหน่ง", uid: "hrEmployeeHrPositionId", sortable: true },
  { name: "สถานะ", uid: "isActive", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "true" },
  { name: "ปิดใช้งาน", uid: "false" },
];

const emptyForm: EmployeeFormData = {
  hrEmployeeFirstName: "", hrEmployeeLastName: "", hrEmployeeEmail: "",
  hrEmployeePhone: "", hrEmployeeHrDivisionId: "", hrEmployeeHrDepartmentId: "", hrEmployeeHrPositionId: "",
};

export default function EmployeesClient({
  initialEmployees,
  initialDivisions,
  initialDepartments,
  initialPositions,
}: EmployeesClientProps) {
  const { isSuperAdmin } = useRBAC();
  const [employees, setEmployees] = useState<HrEmployee[]>(initialEmployees);
  const [divisions] = useState<HrDivision[]>(initialDivisions);
  const [departments] = useState<HrDepartment[]>(initialDepartments);
  const [positions] = useState<HrPosition[]>(initialPositions);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<HrEmployee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingEmployee, setDeletingEmployee] = useState<HrEmployee | null>(null);

  const updateField = (field: keyof EmployeeFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleOpen = useCallback((employee: HrEmployee | null = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        hrEmployeeFirstName: employee.hrEmployeeFirstName || "",
        hrEmployeeLastName: employee.hrEmployeeLastName || "",
        hrEmployeeEmail: employee.hrEmployeeEmail || "",
        hrEmployeePhone: employee.hrEmployeePhone || "",
        hrEmployeeHrDivisionId: employee.hrEmployeeHrDivisionId || "",
        hrEmployeeHrDepartmentId: employee.hrEmployeeHrDepartmentId || "",
        hrEmployeeHrPositionId: employee.hrEmployeeHrPositionId || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData(emptyForm);
    }
    onOpen();
  }, [onOpen]);

  const reloadEmployees = useCallback(async () => {
    try {
      const data = await get("/api/hr/employees");
      setEmployees(data as HrEmployee[]);
    } catch {}
  }, []);

  const handleSave = async () => {
    if (!formData.hrEmployeeFirstName.trim() || !formData.hrEmployeeLastName.trim()) {
      toast.error("กรุณาระบุชื่อและนามสกุล");
      return;
    }
    try {
      setSaving(true);
      if (editingEmployee) {
        await put(`/api/hr/employees/${editingEmployee.hrEmployeeId}`, formData);
        toast.success("อัปเดตพนักงานสำเร็จ");
      } else {
        await post("/api/hr/employees", formData);
        toast.success("สร้างพนักงานสำเร็จ");
      }
      onClose();
      reloadEmployees();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "บันทึกพนักงานล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = useCallback((employee: HrEmployee) => {
    setDeletingEmployee(employee);
    deleteModal.onOpen();
  }, [deleteModal]);

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await del(`/api/hr/employees/${deletingEmployee.hrEmployeeId}`);
      toast.success("ลบพนักงานสำเร็จ");
      deleteModal.onClose();
      setDeletingEmployee(null);
      reloadEmployees();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "ลบพนักงานล้มเหลว");
    }
  };

  const toggleActive = useCallback(async (item: HrEmployee) => {
    try {
      await put(`/api/hr/employees/${item.hrEmployeeId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadEmployees();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  }, [reloadEmployees]);

  const renderCell = useCallback((emp: HrEmployee, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <span className="font-light">{emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}</span>;
      case "hrEmployeeEmail":
        return <span className="text-muted-foreground">{emp.hrEmployeeEmail || "-"}</span>;
      case "hrEmployeePhone":
        return <span className="text-muted-foreground">{emp.hrEmployeePhone || "-"}</span>;
      case "hrEmployeeHrDivisionId":
        // hrDivisionName comes from JOIN in backend — raw column name from hrDivision table
        return emp.hrDivisionName || "-";
      case "hrEmployeeHrDepartmentId":
        // hrDepartmentName comes from JOIN in backend — raw column name from hrDepartment table
        return emp.hrDepartmentName || "-";
      case "hrEmployeeHrPositionId":
        // hrPositionTitle comes from JOIN in backend — raw column name from hrPosition table
        return emp.hrPositionTitle || "-";
      case "isActive":
        return <Chip variant="flat" size="md" radius="md" color={emp.isActive ? "success" : "default"}>{emp.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Chip>;
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <Button variant="bordered" size="md" radius="md" isIconOnly onPress={() => handleOpen(emp)}><Edit /></Button>
            {isSuperAdmin
              ? <Switch size="md" isSelected={emp.isActive} onValueChange={() => toggleActive(emp)} />
              : <Button variant="bordered" size="md" radius="md" isIconOnly onPress={() => confirmDelete(emp)}><Trash2 /></Button>}
          </div>
        );
      default:
        return (emp as unknown as Record<string, unknown>)[columnKey]?.toString() || "-";
    }
  }, [isSuperAdmin, confirmDelete, handleOpen, toggleActive]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns} data={employees} renderCell={renderCell} enableCardView
        rowKey="hrEmployeeId" initialVisibleColumns={["name","hrEmployeeEmail","hrEmployeeHrDivisionId","hrEmployeeHrDepartmentId","hrEmployeeHrPositionId","isActive","actions"]}
        searchPlaceholder="ค้นหาตามชื่อ, อีเมล, แผนก, ตำแหน่ง..."
        searchKeys={["hrEmployeeFirstName","hrEmployeeLastName","hrEmployeeEmail","hrEmployeePhone"]}
        statusField="isActive" statusOptions={statusOptions} emptyContent="ไม่พบพนักงาน"
        topEndContent={<Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>เพิ่มพนักงาน</Button>}
        actionMenuItems={(item: HrEmployee) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingEmployee ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2"><Input label="ชื่อ" labelPlacement="outside" placeholder="ใส่ชื่อ" variant="bordered" size="md" radius="md" value={formData.hrEmployeeFirstName} onChange={(e) => updateField("hrEmployeeFirstName", e.target.value)} isRequired /></div>
              <div className="p-2"><Input label="นามสกุล" labelPlacement="outside" placeholder="ใส่นามสกุล" variant="bordered" size="md" radius="md" value={formData.hrEmployeeLastName} onChange={(e) => updateField("hrEmployeeLastName", e.target.value)} isRequired /></div>
              <div className="p-2"><Input type="email" label="อีเมล" labelPlacement="outside" placeholder="ใส่อีเมล" variant="bordered" size="md" radius="md" value={formData.hrEmployeeEmail} onChange={(e) => updateField("hrEmployeeEmail", e.target.value)} /></div>
              <div className="p-2"><Input label="โทรศัพท์" labelPlacement="outside" placeholder="ใส่เบอร์โทรศัพท์" variant="bordered" size="md" radius="md" value={formData.hrEmployeePhone} onChange={(e) => updateField("hrEmployeePhone", e.target.value)} /></div>
              <div className="p-2">
                <Select label="ฝ่าย" labelPlacement="outside" placeholder="เลือกฝ่าย" variant="bordered" size="md" radius="md"
                  selectedKeys={formData.hrEmployeeHrDivisionId ? [formData.hrEmployeeHrDivisionId] : []}
                  onSelectionChange={(keys) => { updateField("hrEmployeeHrDivisionId", Array.from(keys)[0] as string || ""); updateField("hrEmployeeHrDepartmentId", ""); updateField("hrEmployeeHrPositionId", ""); }}>
                  {divisions.map((d) => <SelectItem key={d.hrDivisionId}>{d.hrDivisionName}</SelectItem>)}
                </Select>
              </div>
              <div className="p-2">
                <Select label="แผนก" labelPlacement="outside" placeholder={formData.hrEmployeeHrDivisionId ? "เลือกแผนก" : "เลือกฝ่ายก่อน"} variant="bordered" size="md" radius="md"
                  isDisabled={!formData.hrEmployeeHrDivisionId}
                  selectedKeys={formData.hrEmployeeHrDepartmentId ? [formData.hrEmployeeHrDepartmentId] : []}
                  onSelectionChange={(keys) => { updateField("hrEmployeeHrDepartmentId", Array.from(keys)[0] as string || ""); updateField("hrEmployeeHrPositionId", ""); }}>
                  {departments.filter((d) => d.hrDepartmentHrDivisionId === formData.hrEmployeeHrDivisionId).map((d) => <SelectItem key={d.hrDepartmentId}>{d.hrDepartmentName}</SelectItem>)}
                </Select>
              </div>
              <div className="p-2">
                <Select label="ตำแหน่ง" labelPlacement="outside" placeholder={formData.hrEmployeeHrDepartmentId ? "เลือกตำแหน่ง" : "เลือกแผนกก่อน"} variant="bordered" size="md" radius="md"
                  isDisabled={!formData.hrEmployeeHrDepartmentId}
                  selectedKeys={formData.hrEmployeeHrPositionId ? [formData.hrEmployeeHrPositionId] : []}
                  onSelectionChange={(keys) => updateField("hrEmployeeHrPositionId", Array.from(keys)[0] as string || "")}>
                  {positions.filter((p) => p.hrPositionHrDepartmentId === formData.hrEmployeeHrDepartmentId).map((p) => <SelectItem key={p.hrPositionId}>{p.hrPositionTitle}</SelectItem>)}
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleSave} isLoading={saving}>{editingEmployee ? "อัปเดต" : "สร้าง"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบพนักงาน</ModalHeader>
          <ModalBody>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-light">{deletingEmployee?.hrEmployeeFirstName} {deletingEmployee?.hrEmployeeLastName}</span>? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={deleteModal.onClose}>ยกเลิก</Button>
            <Button variant="bordered" size="md" radius="md" onPress={handleDelete}>ลบ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
