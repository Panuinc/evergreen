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
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "หัวข้อ", uid: "itSecurityIncidentTitle", sortable: true },
  { name: "ประเภท", uid: "itSecurityIncidentType", sortable: true },
  { name: "ความรุนแรง", uid: "itSecurityIncidentSeverity", sortable: true },
  { name: "สถานะ", uid: "itSecurityIncidentStatus", sortable: true },
  { name: "รายงานโดย", uid: "itSecurityIncidentReportedBy" },
  { name: "ผู้รับผิดชอบ", uid: "itSecurityIncidentAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิด", uid: "open" },
  { name: "กำลังสอบสวน", uid: "investigating" },
  { name: "แก้ไขแล้ว", uid: "resolved" },
  { name: "ปิด", uid: "closed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "itSecurityIncidentTitle",
  "itSecurityIncidentType",
  "itSecurityIncidentSeverity",
  "itSecurityIncidentStatus",
  "itSecurityIncidentAssignedTo",
  "actions",
];

export default function SecurityView({
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
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "itSecurityIncidentTitle":
          return <span className="font-light">{item.itSecurityIncidentTitle}</span>;
        case "itSecurityIncidentType":
          return item.itSecurityIncidentType || "-";
        case "itSecurityIncidentSeverity": {
          const colorMap = {
            low: "default",
            medium: "primary",
            high: "warning",
            critical: "danger",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.itSecurityIncidentSeverity] || "default"}
            >
              {item.itSecurityIncidentSeverity}
            </Chip>
          );
        }
        case "itSecurityIncidentStatus": {
          const colorMap = {
            open: "warning",
            investigating: "primary",
            resolved: "success",
            closed: "default",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.itSecurityIncidentStatus] || "default"}
            >
              {item.itSecurityIncidentStatus}
            </Chip>
          );
        }
        case "itSecurityIncidentReportedBy":
          return item.itSecurityIncidentReportedBy || "-";
        case "itSecurityIncidentAssignedTo":
          return item.itSecurityIncidentAssignedTo || "-";
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
        rowKey="itSecurityIncidentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามหัวข้อ, รายงานโดย, ผู้รับผิดชอบ..."
        searchKeys={[
          "itSecurityIncidentTitle",
          "itSecurityIncidentReportedBy",
          "itSecurityIncidentAssignedTo",
        ]}
        statusField="itSecurityIncidentStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบเหตุการณ์ด้านความปลอดภัย"
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ]}
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
                    value={formData.itSecurityIncidentTitle}
                    onChange={(e) => updateField("itSecurityIncidentTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itSecurityIncidentTitle}
                    errorMessage={validationErrors?.itSecurityIncidentTitle}
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
                    selectedKeys={formData.itSecurityIncidentType ? [formData.itSecurityIncidentType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itSecurityIncidentType", val);
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
                    selectedKeys={formData.itSecurityIncidentSeverity ? [formData.itSecurityIncidentSeverity] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itSecurityIncidentSeverity", val);
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
                    selectedKeys={[formData.itSecurityIncidentStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "open";
                      updateField("itSecurityIncidentStatus", val);
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
                    value={formData.itSecurityIncidentReportedBy}
                    onChange={(e) => updateField("itSecurityIncidentReportedBy", e.target.value)}
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
                    value={formData.itSecurityIncidentAssignedTo}
                    onChange={(e) => updateField("itSecurityIncidentAssignedTo", e.target.value)}
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
                  value={formData.itSecurityIncidentDescription}
                  onChange={(e) => updateField("itSecurityIncidentDescription", e.target.value)}
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
                  value={formData.itSecurityIncidentResolution}
                  onChange={(e) => updateField("itSecurityIncidentResolution", e.target.value)}
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
              <span className="font-light">
                {deletingIncident?.itSecurityIncidentTitle}
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
