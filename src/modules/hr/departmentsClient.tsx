"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Switch,
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import { post, put, del } from "@/lib/apiClient";

const baseColumns = [
  { name: "ชื่อ", uid: "hrDepartmentName", sortable: true },
  { name: "ฝ่าย", uid: "hrDepartmentHrDivisionId", sortable: true },
  { name: "รายละเอียด", uid: "hrDepartmentDescription" },
  { name: "วันที่สร้าง", uid: "hrDepartmentCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const baseVisibleColumns = [
  "hrDepartmentName",
  "hrDepartmentHrDivisionId",
  "hrDepartmentDescription",
  "hrDepartmentCreatedAt",
  "actions",
];

const emptyForm = {
  hrDepartmentName: "",
  hrDepartmentDescription: "",
  hrDepartmentHrDivisionId: "",
};

export default function DepartmentsClient({ initialDepartments, initialDivisions }) {
  const { isSuperAdmin } = useRBAC();
  const [departments, setDepartments] = useState(initialDepartments);
  const [divisions] = useState(initialDivisions);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDept, setDeletingDept] = useState(null);

  const reloadDepartments = useCallback(async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/hr/departments");
      setDepartments(data);
    } catch {}
  }, []);

  const handleOpen = useCallback((dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        hrDepartmentName: dept.hrDepartmentName || "",
        hrDepartmentDescription: dept.hrDepartmentDescription || "",
        hrDepartmentHrDivisionId: dept.hrDepartmentHrDivisionId || "",
      });
    } else {
      setEditingDept(null);
      setFormData(emptyForm);
    }
    onOpen();
  }, [onOpen]);

  const handleSave = async () => {
    if (!formData.hrDepartmentName.trim()) {
      toast.error("กรุณาระบุชื่อแผนก");
      return;
    }
    try {
      setSaving(true);
      if (editingDept) {
        await put(`/api/hr/departments/${editingDept.hrDepartmentId}`, formData);
        toast.success("อัปเดตแผนกสำเร็จ");
      } else {
        await post("/api/hr/departments", formData);
        toast.success("สร้างแผนกสำเร็จ");
      }
      onClose();
      reloadDepartments();
    } catch (error) {
      toast.error(error.message || "บันทึกแผนกล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = useCallback((dept) => {
    setDeletingDept(dept);
    deleteModal.onOpen();
  }, [deleteModal]);

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await del(`/api/hr/departments/${deletingDept.hrDepartmentId}`);
      toast.success("ลบแผนกสำเร็จ");
      deleteModal.onClose();
      setDeletingDept(null);
      reloadDepartments();
    } catch (error) {
      toast.error(error.message || "ลบแผนกล้มเหลว");
    }
  };

  const toggleActive = useCallback(async (item) => {
    try {
      await put(`/api/hr/departments/${item.hrDepartmentId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadDepartments();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  }, [reloadDepartments]);

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...baseVisibleColumns, "isActive"];
    }
    return baseVisibleColumns;
  }, [isSuperAdmin]);

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      const actionsCol = baseColumns[baseColumns.length - 1];
      return [
        ...baseColumns.slice(0, -1),
        { name: "สถานะใช้งาน", uid: "isActive" },
        actionsCol,
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (dept, columnKey) => {
      switch (columnKey) {
        case "hrDepartmentName":
          return <span className="font-light">{dept.hrDepartmentName}</span>;
        case "hrDepartmentHrDivisionId": {
          const div = divisions.find((d) => d.hrDivisionId === dept.hrDepartmentHrDivisionId);
          return div ? div.hrDivisionName : "-";
        }
        case "hrDepartmentDescription":
          return (
            <span className="text-muted-foreground">
              {dept.hrDepartmentDescription || "-"}
            </span>
          );
        case "hrDepartmentCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(dept.hrDepartmentCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={dept.isActive ? "success" : "danger"}
            >
              {dept.isActive ? "Active" : "Inactive"}
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
                onPress={() => handleOpen(dept)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={dept.isActive}
                  onValueChange={() => toggleActive(dept)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(dept)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return dept[columnKey] || "-";
      }
    },
    [isSuperAdmin, confirmDelete, divisions, handleOpen, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={departments}
        renderCell={renderCell}
        enableCardView
        rowKey="hrDepartmentId"
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, ฝ่าย, รายละเอียด..."
        searchKeys={["hrDepartmentName", "hrDepartmentDescription"]}
        emptyContent="ไม่พบแผนก"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มแผนก
          </Button>
        }
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDept ? "แก้ไขแผนก" : "เพิ่มแผนก"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="ฝ่าย"
                  labelPlacement="outside"
                  placeholder="เลือกฝ่าย"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.hrDepartmentHrDivisionId
                      ? [formData.hrDepartmentHrDivisionId]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = String(Array.from(keys)[0] || "");
                    setFormData({ ...formData, hrDepartmentHrDivisionId: val });
                  }}
                >
                  {divisions.map((div) => (
                    <SelectItem key={div.hrDivisionId}>
                      {div.hrDivisionName}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น IT, HR, การเงิน"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDepartmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, hrDepartmentName: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับแผนกนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDepartmentDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hrDepartmentDescription: e.target.value,
                    })
                  }
                />
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
              {editingDept ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบแผนก</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingDept?.hrDepartmentName}
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
