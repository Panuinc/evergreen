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
  Progress,
  Divider,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, GitBranch, Clock, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";
import Loading from "@/components/ui/Loading";

const baseColumns = [
  { name: "เลขที่", uid: "mktWorkOrderNo", sortable: true },
  { name: "หัวข้อ", uid: "mktWorkOrderTitle", sortable: true },
  { name: "ประเภทงาน", uid: "mktWorkOrderType", sortable: true },
  { name: "ร้องขอโดย", uid: "mktWorkOrderRequestedBy" },
  { name: "ผู้รับผิดชอบ", uid: "mktWorkOrderAssignedTo" },
  { name: "ความสำคัญ", uid: "mktWorkOrderPriority", sortable: true },
  { name: "ความคืบหน้า", uid: "mktWorkOrderProgress", sortable: true },
  { name: "สถานะ", uid: "mktWorkOrderStatus", sortable: true },
  { name: "วันครบกำหนด", uid: "mktWorkOrderDueDate", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "รอดำเนินการ", uid: "pending" },
  { name: "อนุมัติแล้ว", uid: "approved" },
  { name: "กำลังดำเนินการ", uid: "in_progress" },
  { name: "กำลังตรวจสอบ", uid: "review" },
  { name: "เสร็จสิ้น", uid: "completed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const workOrderTypes = [
  { key: "design", label: "ออกแบบ" },
  { key: "content", label: "เนื้อหา" },
  { key: "event", label: "อีเวนท์" },
  { key: "promotion", label: "โปรโมชั่น" },
  { key: "social_media", label: "โซเชียลมีเดีย" },
  { key: "print", label: "สิ่งพิมพ์" },
  { key: "other", label: "อื่นๆ" },
];

const typeLabels = Object.fromEntries(workOrderTypes.map((t) => [t.key, t.label]));

const BASE_VISIBLE_COLUMNS = [
  "mktWorkOrderNo",
  "mktWorkOrderTitle",
  "mktWorkOrderType",
  "mktWorkOrderRequestedBy",
  "mktWorkOrderAssignedTo",
  "mktWorkOrderPriority",
  "mktWorkOrderProgress",
  "mktWorkOrderStatus",
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

export default function WorkOrdersView({
  workOrders,
  employees = [],
  loading,
  saving,
  editingWorkOrder,
  formData,
  validationErrors,
  deletingWorkOrder,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  progressModal,
  selectedWorkOrder,
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
        case "mktWorkOrderNo":
          return <span className="font-light">{item.mktWorkOrderNo || "-"}</span>;
        case "mktWorkOrderTitle":
          return <span className="font-light">{item.mktWorkOrderTitle}</span>;
        case "mktWorkOrderType": {
          const typeColorMap = {
            design: "secondary",
            content: "primary",
            event: "warning",
            promotion: "success",
            social_media: "primary",
            print: "default",
            other: "default",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={typeColorMap[item.mktWorkOrderType] || "default"}
            >
              {typeLabels[item.mktWorkOrderType] || item.mktWorkOrderType || "-"}
            </Chip>
          );
        }
        case "mktWorkOrderRequestedBy":
          return item.mktWorkOrderRequestedBy || "-";
        case "mktWorkOrderAssignedTo":
          return item.mktWorkOrderAssignedTo || "-";
        case "mktWorkOrderPriority": {
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
              color={colorMap[item.mktWorkOrderPriority] || "default"}
            >
              {item.mktWorkOrderPriority}
            </Chip>
          );
        }
        case "mktWorkOrderProgress": {
          const progress = item.mktWorkOrderProgress || 0;
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
                size="md"
                value={progress}
                color={color}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {progress}%
              </span>
            </div>
          );
        }
        case "mktWorkOrderStatus": {
          const colorMap = {
            pending: "default",
            approved: "primary",
            in_progress: "warning",
            review: "secondary",
            completed: "success",
            cancelled: "danger",
          };
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.mktWorkOrderStatus] || "default"}
            >
              {item.mktWorkOrderStatus}
            </Chip>
          );
        }
        case "mktWorkOrderDueDate":
          return formatDate(item.mktWorkOrderDueDate);
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
                  size="md"
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
        data={workOrders}
        renderCell={renderCell}
        enableCardView
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามเลขที่, หัวข้อ, ร้องขอโดย..."
        searchKeys={[
          "mktWorkOrderNo",
          "mktWorkOrderTitle",
          "mktWorkOrderRequestedBy",
          "mktWorkOrderAssignedTo",
        ]}
        statusField="mktWorkOrderStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบใบสั่งงาน"
        actionMenuItems={(item) => [
          { key: "progress", label: "อัปเดตความคืบหน้า", icon: <GitBranch />, onPress: () => openProgress(item) },
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            ใบสั่งงานใหม่
          </Button>
        }
      />

      {}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingWorkOrder
              ? `แก้ไข ${editingWorkOrder.mktWorkOrderNo || "ใบสั่งงาน"}`
              : "ใบสั่งงานใหม่"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2 md:col-span-2">
                  <Input
                    label="ชื่องาน"
                    labelPlacement="outside"
                    placeholder="ระบุชื่องาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.mktWorkOrderTitle}
                    onChange={(e) => updateField("mktWorkOrderTitle", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.mktWorkOrderTitle}
                    errorMessage={validationErrors?.mktWorkOrderTitle}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภทงาน"
                    labelPlacement="outside"
                    placeholder="เลือกประเภทงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.mktWorkOrderType ? [formData.mktWorkOrderType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("mktWorkOrderType", val);
                    }}
                  >
                    {workOrderTypes.map((type) => (
                      <SelectItem key={type.key}>{type.label}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ร้องขอโดย"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.mktWorkOrderRequestedBy}
                    isReadOnly
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
                      formData.mktWorkOrderPriority
                        ? [formData.mktWorkOrderPriority]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("mktWorkOrderPriority", val);
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
                    selectedKeys={[formData.mktWorkOrderStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "pending";
                      updateField("mktWorkOrderStatus", val);
                    }}
                  >
                    <SelectItem key="pending">รอดำเนินการ</SelectItem>
                    <SelectItem key="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem key="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem key="review">กำลังตรวจสอบ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem key="cancelled">ยกเลิก</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="เลือกพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.mktWorkOrderAssignedTo ? [formData.mktWorkOrderAssignedTo] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("mktWorkOrderAssignedTo", val);
                    }}
                  >
                    {employees.map((emp) => (
                      <SelectItem key={`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}`} textValue={`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}`}>
                        {emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}
                      </SelectItem>
                    ))}
                  </Select>
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
                    value={formData.mktWorkOrderStartDate}
                    onChange={(e) =>
                      updateField("mktWorkOrderStartDate", e.target.value)
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
                    value={formData.mktWorkOrderDueDate}
                    onChange={(e) =>
                      updateField("mktWorkOrderDueDate", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายรายละเอียดของงาน..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  minRows={3}
                  value={formData.mktWorkOrderDescription}
                  onChange={(e) =>
                    updateField("mktWorkOrderDescription", e.target.value)
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
                  value={formData.mktWorkOrderNotes}
                  onChange={(e) => updateField("mktWorkOrderNotes", e.target.value)}
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
              {editingWorkOrder ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal
        isOpen={progressModal.isOpen}
        onClose={progressModal.onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>
              {selectedWorkOrder?.mktWorkOrderNo} - {selectedWorkOrder?.mktWorkOrderTitle}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Progress
                size="md"
                value={selectedWorkOrder?.mktWorkOrderProgress || 0}
                color={
                  (selectedWorkOrder?.mktWorkOrderProgress || 0) >= 100
                    ? "success"
                    : (selectedWorkOrder?.mktWorkOrderProgress || 0) >= 50
                      ? "primary"
                      : "warning"
                }
                className="flex-1"
              />
              <span className="text-xs font-light text-muted-foreground">
                {selectedWorkOrder?.mktWorkOrderProgress || 0}%
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {}
              <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-default-50">
                <p className="text-xs font-light">เพิ่มการอัปเดตความคืบหน้า</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Textarea
                      placeholder="อธิบายสิ่งที่ทำ..."
                      variant="bordered"
                      size="md"
                      radius="md"
                      minRows={2}
                      value={progressForm.mktWorkOrderProgressLogDescription}
                      onChange={(e) =>
                        updateProgressField("mktWorkOrderProgressLogDescription", e.target.value)
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
                    value={progressForm.mktWorkOrderProgressLogProgress}
                    onChange={(e) =>
                      updateProgressField("mktWorkOrderProgressLogProgress", e.target.value)
                    }
                  />
                  <Select
                    label="อัปเดตโดย"
                    labelPlacement="outside"
                    placeholder="เลือกพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={progressForm.mktWorkOrderProgressLogCreatedBy ? [progressForm.mktWorkOrderProgressLogCreatedBy] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateProgressField("mktWorkOrderProgressLogCreatedBy", val);
                    }}
                  >
                    {employees.map((emp) => (
                      <SelectItem key={`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}`} textValue={`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}`}>
                        {emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}
                      </SelectItem>
                    ))}
                  </Select>
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

              {}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-light">ประวัติความคืบหน้า</p>
                {progressLoading ? (
                  <div className="flex justify-center py-6">
                    <Loading />
                  </div>
                ) : progressLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    ยังไม่มีการอัปเดตความคืบหน้า
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    {progressLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex gap-3 p-3 rounded-lg border border-border"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <GitBranch className="text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-light">
                              {log.mktWorkOrderProgressLogCreatedBy || "ไม่ทราบ"}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock />
                              {formatDateTime(log.mktWorkOrderProgressLogCreatedAt)}
                            </div>
                          </div>
                          <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">
                            {log.mktWorkOrderProgressLogDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress
                              size="md"
                              value={log.mktWorkOrderProgressLogProgress || 0}
                              color={
                                (log.mktWorkOrderProgressLogProgress || 0) >= 100
                                  ? "success"
                                  : "primary"
                              }
                              className="flex-1 max-w-[200px]"
                            />
                            <span className="text-xs text-muted-foreground">
                              {log.mktWorkOrderProgressLogProgress}%
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

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบใบสั่งงาน</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingWorkOrder?.mktWorkOrderNo} - {deletingWorkOrder?.mktWorkOrderTitle}
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
