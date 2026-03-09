"use client";

import { useCallback, useMemo } from "react";
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
  Progress,  Divider,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, GitBranch, Clock, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";
import Loading from "@/components/ui/Loading";

const baseColumns = [
  { name: "เลขที่คำขอ", uid: "itDevRequestNo", sortable: true },
  { name: "หัวข้อ", uid: "itDevRequestTitle", sortable: true },
  { name: "ร้องขอโดย", uid: "itDevRequestRequestedBy" },
  { name: "ความสำคัญ", uid: "itDevRequestPriority", sortable: true },
  { name: "ผู้รับผิดชอบ", uid: "itDevRequestAssignedTo" },
  { name: "ความคืบหน้า", uid: "itDevRequestProgress", sortable: true },
  { name: "สถานะ", uid: "itDevRequestStatus", sortable: true },
  { name: "วันครบกำหนด", uid: "itDevRequestDueDate", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "อนุมัติแล้ว", uid: "approved" },
  { name: "กำลังดำเนินการ", uid: "in_progress" },
  { name: "กำลังทดสอบ", uid: "testing" },
  { name: "เสร็จสิ้น", uid: "completed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const BASE_VISIBLE_COLUMNS = [
  "itDevRequestNo",
  "itDevRequestTitle",
  "itDevRequestRequestedBy",
  "itDevRequestPriority",
  "itDevRequestAssignedTo",
  "itDevRequestProgress",
  "itDevRequestStatus",
  "actions",
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DevelopmentView({
  requests,
  loading,
  saving,
  editingRequest,
  formData,
  validationErrors,
  deletingRequest,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  progressModal,
  selectedRequest,
  progressLogs,
  progressLoading,
  progressSaving,
  progressForm,
  openProgress,
  handleAddProgress,
  updateProgressField,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
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
    (item, columnKey) => {
      switch (columnKey) {
        case "itDevRequestNo":
          return <span className="font-light">{item.itDevRequestNo || "-"}</span>;
        case "itDevRequestTitle":
          return <span className="font-light">{item.itDevRequestTitle}</span>;
        case "itDevRequestRequestedBy":
          return item.itDevRequestRequestedBy || "-";
        case "itDevRequestPriority": {
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
              color={colorMap[item.itDevRequestPriority] || "default"}
            >
              {item.itDevRequestPriority}
            </Chip>
          );
        }
        case "itDevRequestAssignedTo":
          return item.itDevRequestAssignedTo || "-";
        case "itDevRequestProgress": {
          const progress = item.itDevRequestProgress || 0;
          const color =
            progress >= 100
              ? "success"
              : progress >= 50
                ? "primary"
                : progress > 0
                  ? "warning"
                  : "default";
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <Progress
                size="sm"
                value={progress}
                color={color}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-8 text-right">
                {progress}%
              </span>
            </div>
          );
        }
        case "itDevRequestStatus": {
          const colorMap = {
            pending: "default",
            approved: "primary",
            in_progress: "warning",
            testing: "secondary",
            completed: "success",
            cancelled: "danger",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.itDevRequestStatus] || "default"}
            >
              {item.itDevRequestStatus}
            </Chip>
          );
        }
        case "itDevRequestDueDate":
          return formatDate(item.itDevRequestDueDate);
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={item.isActive ? "success" : "danger"}
            >
              {item.isActive ? "Active" : "Inactive"}
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
                onPress={() => openProgress(item)}
                title="อัปเดตความคืบหน้า"
              >
                <GitBranch />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="sm"
                  isSelected={item.isActive}
                  onValueChange={() => toggleActive(item)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(item)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete, openProgress, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={requests}
        renderCell={renderCell}
        enableCardView
        rowKey="itDevRequestId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามเลขที่คำขอ, หัวข้อ, ร้องขอโดย..."
        searchKeys={[
          "itDevRequestNo",
          "itDevRequestTitle",
          "itDevRequestRequestedBy",
          "itDevRequestAssignedTo",
        ]}
        statusField="itDevRequestStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบคำขอพัฒนา"
        actionMenuItems={(item) => [
          { key: "progress", label: "อัปเดตความคืบหน้า", icon: <GitBranch size={16} />, onPress: () => openProgress(item) },
          { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power size={16} />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            คำขอใหม่
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
            {editingRequest
              ? `แก้ไข ${editingRequest.itDevRequestNo || "คำขอ"}`
              : "คำขอพัฒนาใหม่"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="หัวข้อ"
                    labelPlacement="outside"
                    placeholder="ชื่อระบบหรือฟีเจอร์ที่ต้องการพัฒนา"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.itDevRequestTitle}
                    onChange={(e) => updateField("itDevRequestTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itDevRequestTitle}
                    errorMessage={validationErrors?.itDevRequestTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ร้องขอโดย"
                    labelPlacement="outside"
                    placeholder="ชื่อผู้แจ้ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.itDevRequestRequestedBy}
                    onChange={(e) =>
                      updateField("itDevRequestRequestedBy", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ความสำคัญ"
                    labelPlacement="outside"
                    placeholder="เลือกความสำคัญ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.itDevRequestPriority
                        ? [formData.itDevRequestPriority]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itDevRequestPriority", val);
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
                    selectedKeys={[formData.itDevRequestStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("itDevRequestStatus", val);
                    }}
                  >
                    <SelectItem key="pending">รอดำเนินการ</SelectItem>
                    <SelectItem key="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem key="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem key="testing">กำลังทดสอบ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem key="cancelled">ยกเลิก</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ชื่อ Developer"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.itDevRequestAssignedTo}
                    onChange={(e) =>
                      updateField("itDevRequestAssignedTo", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่เริ่มต้น"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.itDevRequestStartDate}
                    onChange={(e) =>
                      updateField("itDevRequestStartDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันครบกำหนด"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.itDevRequestDueDate}
                    onChange={(e) =>
                      updateField("itDevRequestDueDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายรายละเอียดของระบบที่ต้องการพัฒนา..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  minRows={3}
                  value={formData.itDevRequestDescription}
                  onChange={(e) =>
                    updateField("itDevRequestDescription", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="หมายเหตุเพิ่มเติม"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.itDevRequestNotes}
                  onChange={(e) => updateField("itDevRequestNotes", e.target.value)}
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
              {editingRequest ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Progress Modal */}
      <Modal
        isOpen={progressModal.isOpen}
        onClose={progressModal.onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>
              {selectedRequest?.itDevRequestNo} - {selectedRequest?.itDevRequestTitle}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                size="md"
                value={selectedRequest?.itDevRequestProgress || 0}
                color={
                  (selectedRequest?.itDevRequestProgress || 0) >= 100
                    ? "success"
                    : (selectedRequest?.itDevRequestProgress || 0) >= 50
                      ? "primary"
                      : "warning"
                }
                className="flex-1"
              />
              <span className="text-sm font-light text-muted-foreground">
                {selectedRequest?.itDevRequestProgress || 0}%
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {/* Add Progress Form */}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-default-50">
                <p className="text-sm font-light">เพิ่มการอัปเดตความคืบหน้า</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Textarea
                      placeholder="อธิบายสิ่งที่ทำ..."
                      variant="bordered"
                      size="md"
                      radius="md"
                      minRows={2}
                      value={progressForm.itDevProgressLogDescription}
                      onChange={(e) =>
                        updateProgressField("itDevProgressLogDescription", e.target.value)
                      }
                    />
                  </div>
                  <Input
                    type="number"
                    label="ความคืบหน้า %"
                    labelPlacement="outside"
                    placeholder="0-100"
                    variant="bordered"
                    size="md"
                    radius="md"
                    min={0}
                    max={100}
                    value={progressForm.itDevProgressLogProgress}
                    onChange={(e) =>
                      updateProgressField("itDevProgressLogProgress", e.target.value)
                    }
                  />
                  <Input
                    label="อัปเดตโดย"
                    labelPlacement="outside"
                    placeholder="ชื่อ Developer"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={progressForm.itDevProgressLogCreatedBy}
                    onChange={(e) =>
                      updateProgressField("itDevProgressLogCreatedBy", e.target.value)
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="bordered"
                    size="md"
                    radius="md"
                    onPress={handleAddProgress}
                    isLoading={progressSaving}
                  >
                    เพิ่มอัปเดต
                  </Button>
                </div>
              </div>

              <Divider />

              {/* Progress History */}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-light">ประวัติความคืบหน้า</p>
                {progressLoading ? (
                  <div className="flex justify-center py-6">
                    <Loading />
                  </div>
                ) : progressLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    ยังไม่มีการอัปเดตความคืบหน้า
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    {progressLogs.map((log) => (
                      <div
                        key={log.itDevProgressLogId}
                        className="flex gap-3 p-3 rounded-lg border border-border"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <GitBranch size={14} className="text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-light">
                              {log.itDevProgressLogCreatedBy || "ไม่ทราบ"}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock size={12} />
                              {formatDateTime(log.itDevProgressLogCreatedAt)}
                            </div>
                          </div>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                            {log.itDevProgressLogDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              size="sm"
                              value={log.itDevProgressLogProgress || 0}
                              color={
                                (log.itDevProgressLogProgress || 0) >= 100
                                  ? "success"
                                  : "primary"
                              }
                              className="flex-1 max-w-[200px]"
                            />
                            <span className="text-sm text-muted-foreground">
                              {log.itDevProgressLogProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={progressModal.onClose}
            >
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบคำขอ</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingRequest?.itDevRequestNo} - {deletingRequest?.itDevRequestTitle}
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
