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
  Chip,
  Switch,
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import { get, post, put, del } from "@/lib/apiClient";
import type { HrDivision, DivisionsClientProps, DivisionFormData } from "./types";

const baseColumns = [
  { name: "ชื่อ", uid: "hrDivisionName", sortable: true },
  { name: "รายละเอียด", uid: "hrDivisionDescription" },
  { name: "วันที่สร้าง", uid: "hrDivisionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const baseVisibleColumns = [
  "hrDivisionName",
  "hrDivisionDescription",
  "hrDivisionCreatedAt",
  "actions",
];

const emptyForm: DivisionFormData = {
  hrDivisionName: "",
  hrDivisionDescription: "",
};

export default function DivisionsClient({ initialDivisions }: DivisionsClientProps) {
  const { isSuperAdmin } = useRBAC();
  const [divisions, setDivisions] = useState<HrDivision[]>(initialDivisions);
  const [saving, setSaving] = useState(false);
  const [editingDiv, setEditingDiv] = useState<HrDivision | null>(null);
  const [formData, setFormData] = useState<DivisionFormData>(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDiv, setDeletingDiv] = useState<HrDivision | null>(null);

  const reloadDivisions = useCallback(async () => {
    try {
      const data = await get("/api/hr/divisions");
      setDivisions(data as HrDivision[]);
    } catch {}
  }, []);

  const handleOpen = useCallback((div: HrDivision | null = null) => {
    if (div) {
      setEditingDiv(div);
      setFormData({
        hrDivisionName: div.hrDivisionName || "",
        hrDivisionDescription: div.hrDivisionDescription || "",
      });
    } else {
      setEditingDiv(null);
      setFormData(emptyForm);
    }
    onOpen();
  }, [onOpen]);

  const handleSave = async () => {
    if (!formData.hrDivisionName.trim()) {
      toast.error("กรุณาระบุชื่อฝ่าย");
      return;
    }
    try {
      setSaving(true);
      if (editingDiv) {
        await put(`/api/hr/divisions/${editingDiv.hrDivisionId}`, formData);
        toast.success("อัปเดตฝ่ายสำเร็จ");
      } else {
        await post("/api/hr/divisions", formData);
        toast.success("สร้างฝ่ายสำเร็จ");
      }
      onClose();
      reloadDivisions();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "บันทึกฝ่ายล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = useCallback((div: HrDivision) => {
    setDeletingDiv(div);
    deleteModal.onOpen();
  }, [deleteModal]);

  const handleDelete = async () => {
    if (!deletingDiv) return;
    try {
      await del(`/api/hr/divisions/${deletingDiv.hrDivisionId}`);
      toast.success("ลบฝ่ายสำเร็จ");
      deleteModal.onClose();
      setDeletingDiv(null);
      reloadDivisions();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "ลบฝ่ายล้มเหลว");
    }
  };

  const toggleActive = useCallback(async (item: HrDivision) => {
    try {
      await put(`/api/hr/divisions/${item.hrDivisionId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadDivisions();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  }, [reloadDivisions]);

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
    (div: HrDivision, columnKey: string) => {
      switch (columnKey) {
        case "hrDivisionName":
          return <span className="font-light">{div.hrDivisionName}</span>;
        case "hrDivisionDescription":
          return (
            <span className="text-muted-foreground">
              {div.hrDivisionDescription || "-"}
            </span>
          );
        case "hrDivisionCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(div.hrDivisionCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={div.isActive ? "success" : "danger"}
            >
              {div.isActive ? "Active" : "Inactive"}
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
                onPress={() => handleOpen(div)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={div.isActive}
                  onValueChange={() => toggleActive(div)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(div)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return (div as unknown as Record<string, unknown>)[columnKey]?.toString() || "-";
      }
    },
    [isSuperAdmin, confirmDelete, handleOpen, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={divisions}
        renderCell={renderCell}
        enableCardView
        rowKey="hrDivisionId"
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["hrDivisionName", "hrDivisionDescription"]}
        emptyContent="ไม่พบฝ่าย"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มฝ่าย
          </Button>
        }
        actionMenuItems={(item: HrDivision) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDiv ? "แก้ไขฝ่าย" : "เพิ่มฝ่าย"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น ฝ่ายปฏิบัติการ, ฝ่ายบริหาร, ฝ่ายสนับสนุน"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDivisionName}
                  onChange={(e) =>
                    setFormData({ ...formData, hrDivisionName: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับฝ่ายนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDivisionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hrDivisionDescription: e.target.value,
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
              {editingDiv ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบฝ่าย</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingDiv?.hrDivisionName}
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
