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
  Textarea,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useItSecurity } from "@/hooks/it/useItSecurity";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "หัวข้อ", uid: "incidentTitle", sortable: true },
  { name: "ประเภท", uid: "incidentType", sortable: true },
  { name: "ความรุนแรง", uid: "incidentSeverity", sortable: true },
  { name: "สถานะ", uid: "incidentStatus", sortable: true },
  { name: "รายงานโดย", uid: "incidentReportedBy" },
  { name: "ผู้รับผิดชอบ", uid: "incidentAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิด", uid: "open" },
  { name: "กำลังสอบสวน", uid: "investigating" },
  { name: "แก้ไขแล้ว", uid: "resolved" },
  { name: "ปิด", uid: "closed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "incidentTitle",
  "incidentType",
  "incidentSeverity",
  "incidentStatus",
  "incidentAssignedTo",
  "actions",
];

export default function SecurityPage() {
  const {
    incidents,
    loading,
    saving,
    editingIncident,
    formData,
    validationErrors,
    deletingIncident,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSecurity();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "incidentTitle":
          return <span className="font-medium">{item.incidentTitle}</span>;
        case "incidentType":
          return item.incidentType || "-";
        case "incidentSeverity": {
          const colorMap = {
            low: "default",
            medium: "primary",
            high: "warning",
            critical: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.incidentSeverity] || "default"}
            >
              {item.incidentSeverity}
            </Chip>
          );
        }
        case "incidentStatus": {
          const colorMap = {
            open: "warning",
            investigating: "primary",
            resolved: "success",
            closed: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.incidentStatus] || "default"}
            >
              {item.incidentStatus}
            </Chip>
          );
        }
        case "incidentReportedBy":
          return item.incidentReportedBy || "-";
        case "incidentAssignedTo":
          return item.incidentAssignedTo || "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={incidents}
        renderCell={renderCell}
        enableCardView
        rowKey="incidentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามหัวข้อ, รายงานโดย, ผู้รับผิดชอบ..."
        searchKeys={[
          "incidentTitle",
          "incidentReportedBy",
          "incidentAssignedTo",
        ]}
        statusField="incidentStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบเหตุการณ์ด้านความปลอดภัย"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            รายงานเหตุการณ์
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
            {editingIncident ? "แก้ไขเหตุการณ์" : "รายงานเหตุการณ์"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="หัวข้อ"
                    labelPlacement="outside"
                    placeholder="ใส่หัวข้อเหตุการณ์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.incidentTitle}
                    onChange={(e) => updateField("incidentTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.incidentTitle}
                    errorMessage={validationErrors?.incidentTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภท"
                    labelPlacement="outside"
                    placeholder="เลือกประเภท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.incidentType ? [formData.incidentType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("incidentType", val);
                    }}
                  >
                    <SelectItem key="malware">มัลแวร์</SelectItem>
                    <SelectItem key="phishing">ฟิชชิ่ง</SelectItem>
                    <SelectItem key="unauthorized_access">เข้าถึงโดยไม่ได้รับอนุญาต</SelectItem>
                    <SelectItem key="data_breach">ข้อมูลรั่วไหล</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ความรุนแรง"
                    labelPlacement="outside"
                    placeholder="เลือกความรุนแรง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.incidentSeverity ? [formData.incidentSeverity] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("incidentSeverity", val);
                    }}
                  >
                    <SelectItem key="low">ต่ำ</SelectItem>
                    <SelectItem key="medium">ปานกลาง</SelectItem>
                    <SelectItem key="high">สูง</SelectItem>
                    <SelectItem key="critical">วิกฤต</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.incidentStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "open";
                      updateField("incidentStatus", val);
                    }}
                  >
                    <SelectItem key="open">เปิด</SelectItem>
                    <SelectItem key="investigating">กำลังสอบสวน</SelectItem>
                    <SelectItem key="resolved">แก้ไขแล้ว</SelectItem>
                    <SelectItem key="closed">ปิด</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รายงานโดย"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้รายงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.incidentReportedBy}
                    onChange={(e) => updateField("incidentReportedBy", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อผู้รับผิดชอบ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.incidentAssignedTo}
                    onChange={(e) => updateField("incidentAssignedTo", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเหตุการณ์..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.incidentDescription}
                  onChange={(e) => updateField("incidentDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="การแก้ไข"
                  labelPlacement="outside"
                  placeholder="อธิบายการแก้ไข..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.incidentResolution}
                  onChange={(e) => updateField("incidentResolution", e.target.value)}
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
              {editingIncident ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบเหตุการณ์</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingIncident?.incidentTitle}
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
