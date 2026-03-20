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
  Select,
  SelectItem,
  Textarea,
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
  { name: "ชื่อตำแหน่ง", uid: "hrPositionTitle", sortable: true },
  { name: "แผนก", uid: "hrPositionHrDepartmentId", sortable: true },
  { name: "รายละเอียด", uid: "hrPositionDescription" },
  { name: "วันที่สร้าง", uid: "hrPositionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const baseVisibleColumns = [
  "hrPositionTitle",
  "hrPositionHrDepartmentId",
  "hrPositionDescription",
  "actions",
];

const emptyForm = {
  hrPositionTitle: "",
  hrPositionDescription: "",
  hrPositionHrDepartmentId: "",
};

export default function PositionsClient({ initialPositions, initialDepartments }) {
  const { isSuperAdmin } = useRBAC();
  const [positions, setPositions] = useState(initialPositions);
  const [departments] = useState(initialDepartments);
  const [saving, setSaving] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingPos, setDeletingPos] = useState(null);

  const reloadPositions = useCallback(async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/hr/positions");
      setPositions(data);
    } catch {}
  }, []);

  const handleOpen = useCallback((pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        hrPositionTitle: pos.hrPositionTitle || "",
        hrPositionDescription: pos.hrPositionDescription || "",
        hrPositionHrDepartmentId: pos.hrPositionHrDepartmentId || "",
      });
    } else {
      setEditingPos(null);
      setFormData(emptyForm);
    }
    onOpen();
  }, [onOpen]);

  const handleSave = async () => {
    if (!formData.hrPositionTitle.trim()) {
      toast.error("กรุณาระบุชื่อตำแหน่ง");
      return;
    }
    try {
      setSaving(true);
      if (editingPos) {
        await put(`/api/hr/positions/${editingPos.hrPositionId}`, formData);
        toast.success("อัปเดตตำแหน่งสำเร็จ");
      } else {
        await post("/api/hr/positions", formData);
        toast.success("สร้างตำแหน่งสำเร็จ");
      }
      onClose();
      reloadPositions();
    } catch (error) {
      toast.error(error.message || "บันทึกตำแหน่งล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = useCallback((pos) => {
    setDeletingPos(pos);
    deleteModal.onOpen();
  }, [deleteModal]);

  const handleDelete = async () => {
    if (!deletingPos) return;
    try {
      await del(`/api/hr/positions/${deletingPos.hrPositionId}`);
      toast.success("ลบตำแหน่งสำเร็จ");
      deleteModal.onClose();
      setDeletingPos(null);
      reloadPositions();
    } catch (error) {
      toast.error(error.message || "ลบตำแหน่งล้มเหลว");
    }
  };

  const toggleActive = useCallback(async (item) => {
    try {
      await put(`/api/hr/positions/${item.hrPositionId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadPositions();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  }, [reloadPositions]);

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

  const deptOptions = departments.map((d) => ({
    name: d.hrDepartmentName,
    uid: d.hrDepartmentId,
  }));

  const renderCell = useCallback(
    (pos, columnKey) => {
      switch (columnKey) {
        case "hrPositionTitle":
          return <span className="font-light">{pos.hrPositionTitle}</span>;
        case "hrPositionHrDepartmentId": {
          const dept = departments.find((d) => d.hrDepartmentId === pos.hrPositionHrDepartmentId);
          return dept ? dept.hrDepartmentName : "-";
        }
        case "hrPositionDescription":
          return (
            <span className="text-muted-foreground">
              {pos.hrPositionDescription || "-"}
            </span>
          );
        case "hrPositionCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(pos.hrPositionCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={pos.isActive ? "success" : "danger"}
            >
              {pos.isActive ? "Active" : "Inactive"}
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
                onPress={() => handleOpen(pos)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={pos.isActive}
                  onValueChange={() => toggleActive(pos)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(pos)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return pos[columnKey] || "-";
      }
    },
    [isSuperAdmin, confirmDelete, departments, handleOpen, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={positions}
        renderCell={renderCell}
        enableCardView
        rowKey="hrPositionId"
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อตำแหน่ง, แผนก, รายละเอียด..."
        searchKeys={[
          "hrPositionTitle",
          "hrPositionDescription",
        ]}
        statusField="hrPositionHrDepartmentId"
        statusOptions={deptOptions}
        filterLabel="แผนก"
        emptyContent="ไม่พบตำแหน่ง"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มตำแหน่ง
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
            {editingPos ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่ง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="แผนก"
                  labelPlacement="outside"
                  placeholder="เลือกแผนก"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.hrPositionHrDepartmentId
                      ? [formData.hrPositionHrDepartmentId]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "";
                    setFormData({ ...formData, hrPositionHrDepartmentId: val });
                  }}
                  isRequired
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept.hrDepartmentId}>
                      {dept.hrDepartmentName}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อตำแหน่ง"
                  labelPlacement="outside"
                  placeholder="เช่น วิศวกรซอฟต์แวร์, ผู้จัดการฝ่ายบุคคล"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrPositionTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, hrPositionTitle: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับตำแหน่งนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrPositionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hrPositionDescription: e.target.value,
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
              {editingPos ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบตำแหน่ง</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingPos?.hrPositionTitle}
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
