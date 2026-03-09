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
  Tabs,
  Tab,
  Switch,
} from "@heroui/react";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Phone,
  Calendar,
  Mail,
  ClipboardList,
  Power,
} from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ประเภท", uid: "crmActivityType" },
  { name: "หัวข้อ", uid: "crmActivitySubject", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "โอกาสขาย", uid: "opportunity" },
  { name: "ความสำคัญ", uid: "crmActivityPriority" },
  { name: "สถานะ", uid: "crmActivityStatus" },
  { name: "วันครบกำหนด", uid: "crmActivityDueDate" },
  { name: "ผู้รับผิดชอบ", uid: "crmActivityAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "crmActivityType",
  "crmActivitySubject",
  "contact",
  "crmActivityPriority",
  "crmActivityStatus",
  "crmActivityDueDate",
  "actions",
];

const TYPE_ICON_MAP = {
  task: ClipboardList,
  call: Phone,
  meeting: Calendar,
  email: Mail,
};

const PRIORITY_COLOR_MAP = {
  low: "default",
  medium: "warning",
  high: "danger",
};

const STATUS_COLOR_MAP = {
  pending: "primary",
  completed: "success",
  overdue: "danger",
};

export default function ActivitiesView({
  activities,
  loading,
  saving,
  editingActivity,
  formData,
  validationErrors,
  deletingActivity,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  handleToggleComplete,
  confirmDelete,
  handleDelete,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();

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

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmActivityType": {
          const Icon = TYPE_ICON_MAP[item.crmActivityType] || ClipboardList;
          return (
            <div className="flex items-center gap-2">
              <Icon />
              <span className="capitalize">{item.crmActivityType}</span>
            </div>
          );
        }
        case "crmActivitySubject":
          return (
            <span className="font-light">{item.crmActivitySubject || "-"}</span>
          );
        case "contact":
          return item.crmContact
            ? `${item.crmContact.crmContactFirstName} ${item.crmContact.crmContactLastName}`
            : "-";
        case "opportunity":
          return item.salesOpportunity?.crmOpportunityName || "-";
        case "crmActivityPriority": {
          const color = PRIORITY_COLOR_MAP[item.crmActivityPriority] || "default";
          return (
            <Chip variant="flat" size="md" radius="md" color={color}>
              {item.crmActivityPriority}
            </Chip>
          );
        }
        case "crmActivityStatus": {
          const color = STATUS_COLOR_MAP[item.crmActivityStatus] || "default";
          return (
            <Chip variant="flat" size="md" radius="md" color={color}>
              {item.crmActivityStatus}
            </Chip>
          );
        }
        case "crmActivityDueDate": {
          if (!item.crmActivityDueDate) return "-";
          const dueDate = new Date(item.crmActivityDueDate);
          const isOverdue =
            dueDate < new Date() && item.crmActivityStatus !== "completed";
          return (
            <span className={isOverdue ? "text-danger font-light" : ""}>
              {dueDate.toLocaleString("th-TH")}
            </span>
          );
        }
        case "crmActivityAssignedTo":
          return item.crmActivityAssignedTo || "-";
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
                onPress={() => handleToggleComplete(item)}
              >
                <CheckCircle

                  className={
                    item.crmActivityStatus === "completed" ? "text-success" : ""
                  }
                />
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
    [handleOpen, handleToggleComplete, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <Tabs
        selectedKey={typeFilter}
        onSelectionChange={setTypeFilter}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="" title="ทั้งหมด" />
        <Tab key="task" title="งาน" />
        <Tab key="call" title="โทร" />
        <Tab key="meeting" title="ประชุม" />
        <Tab key="email" title="อีเมล" />
      </Tabs>

      <DataTable
        columns={columns}
        data={activities}
        renderCell={renderCell}
        enableCardView
        rowKey="crmActivityId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหากิจกรรม..."
        searchKeys={["crmActivitySubject", "crmActivityAssignedTo"]}
        emptyContent="ไม่พบกิจกรรม"
        actionMenuItems={(item) =>
          [
            { key: "complete", label: item.crmActivityStatus === "completed" ? "ยกเลิกเสร็จสิ้น" : "เสร็จสิ้น", icon: <CheckCircle />, onPress: () => handleToggleComplete(item) },
            { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
            isSuperAdmin
              ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
              : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
          ].filter(Boolean)
        }
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มกิจกรรม
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
            {editingActivity ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภท"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.crmActivityType]}
                    onChange={(e) =>
                      updateField("crmActivityType", e.target.value)
                    }
                  >
                    <SelectItem key="task">งาน</SelectItem>
                    <SelectItem key="call">โทร</SelectItem>
                    <SelectItem key="meeting">ประชุม</SelectItem>
                    <SelectItem key="email">อีเมล</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="หัวข้อ"
                    labelPlacement="outside"
                    placeholder="ใส่หัวข้อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivitySubject}
                    onChange={(e) =>
                      updateField("crmActivitySubject", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.crmActivitySubject}
                    errorMessage={validationErrors?.crmActivitySubject}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="ใส่รายละเอียด"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.crmActivityDescription}
                  onChange={(e) =>
                    updateField("crmActivityDescription", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ความสำคัญ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.crmActivityPriority]}
                    onChange={(e) =>
                      updateField("crmActivityPriority", e.target.value)
                    }
                  >
                    <SelectItem key="low">ต่ำ</SelectItem>
                    <SelectItem key="medium">ปานกลาง</SelectItem>
                    <SelectItem key="high">สูง</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.crmActivityStatus]}
                    onChange={(e) =>
                      updateField("crmActivityStatus", e.target.value)
                    }
                  >
                    <SelectItem key="pending">รอดำเนินการ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันครบกำหนด"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivityDueDate}
                    onChange={(e) =>
                      updateField("crmActivityDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้ติดต่อ"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสผู้ติดต่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivityContactId}
                    onChange={(e) =>
                      updateField("crmActivityContactId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โอกาสขาย"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสโอกาสขาย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivityOpportunityId}
                    onChange={(e) =>
                      updateField("crmActivityOpportunityId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="บัญชี"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสบัญชี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivityAccountId}
                    onChange={(e) =>
                      updateField("crmActivityAccountId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ผู้รับผิดชอบ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmActivityAssignedTo}
                    onChange={(e) =>
                      updateField("crmActivityAssignedTo", e.target.value)
                    }
                  />
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
              {editingActivity ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบกิจกรรม</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingActivity?.crmActivitySubject}
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
