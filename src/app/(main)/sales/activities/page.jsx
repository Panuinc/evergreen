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
  Tabs,
  Tab,
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
} from "lucide-react";
import { useCrmActivities } from "@/hooks/sales/useCrmActivities";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ประเภท", uid: "activityType" },
  { name: "หัวข้อ", uid: "activitySubject", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "โอกาสขาย", uid: "opportunity" },
  { name: "ความสำคัญ", uid: "activityPriority" },
  { name: "สถานะ", uid: "activityStatus" },
  { name: "วันครบกำหนด", uid: "activityDueDate" },
  { name: "ผู้รับผิดชอบ", uid: "activityAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "activityType",
  "activitySubject",
  "contact",
  "activityPriority",
  "activityStatus",
  "activityDueDate",
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

export default function ActivitiesPage() {
  const {
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
  } = useCrmActivities();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "activityType": {
          const Icon = TYPE_ICON_MAP[item.activityType] || ClipboardList;
          return (
            <div className="flex items-center gap-2">
              <Icon size={16} />
              <span className="capitalize">{item.activityType}</span>
            </div>
          );
        }
        case "activitySubject":
          return (
            <span className="font-medium">{item.activitySubject || "-"}</span>
          );
        case "contact":
          return item.crmContacts
            ? `${item.crmContacts.contactFirstName} ${item.crmContacts.contactLastName}`
            : "-";
        case "opportunity":
          return item.crmOpportunities?.opportunityName || "-";
        case "activityPriority": {
          const color = PRIORITY_COLOR_MAP[item.activityPriority] || "default";
          return (
            <Chip variant="bordered" size="md" radius="md" color={color}>
              {item.activityPriority}
            </Chip>
          );
        }
        case "activityStatus": {
          const color = STATUS_COLOR_MAP[item.activityStatus] || "default";
          return (
            <Chip variant="bordered" size="md" radius="md" color={color}>
              {item.activityStatus}
            </Chip>
          );
        }
        case "activityDueDate": {
          if (!item.activityDueDate) return "-";
          const dueDate = new Date(item.activityDueDate);
          const isOverdue =
            dueDate < new Date() && item.activityStatus !== "completed";
          return (
            <span className={isOverdue ? "text-danger font-medium" : ""}>
              {dueDate.toLocaleString("th-TH")}
            </span>
          );
        }
        case "activityAssignedTo":
          return item.activityAssignedTo || "-";
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
                  size={16}
                  className={
                    item.activityStatus === "completed" ? "text-success" : ""
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
    [handleOpen, handleToggleComplete, confirmDelete],
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
        rowKey="activityId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหากิจกรรม..."
        searchKeys={["activitySubject", "activityAssignedTo"]}
        emptyContent="ไม่พบกิจกรรม"
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

      {/* Create/Edit Modal */}
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
                    selectedKeys={[formData.activityType]}
                    onChange={(e) =>
                      updateField("activityType", e.target.value)
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
                    value={formData.activitySubject}
                    onChange={(e) =>
                      updateField("activitySubject", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.activitySubject}
                    errorMessage={validationErrors?.activitySubject}
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
                  value={formData.activityDescription}
                  onChange={(e) =>
                    updateField("activityDescription", e.target.value)
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
                    selectedKeys={[formData.activityPriority]}
                    onChange={(e) =>
                      updateField("activityPriority", e.target.value)
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
                    selectedKeys={[formData.activityStatus]}
                    onChange={(e) =>
                      updateField("activityStatus", e.target.value)
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
                    value={formData.activityDueDate}
                    onChange={(e) =>
                      updateField("activityDueDate", e.target.value)
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
                    value={formData.activityContactId}
                    onChange={(e) =>
                      updateField("activityContactId", e.target.value)
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
                    value={formData.activityOpportunityId}
                    onChange={(e) =>
                      updateField("activityOpportunityId", e.target.value)
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
                    value={formData.activityAccountId}
                    onChange={(e) =>
                      updateField("activityAccountId", e.target.value)
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
                    value={formData.activityAssignedTo}
                    onChange={(e) =>
                      updateField("activityAssignedTo", e.target.value)
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบกิจกรรม</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingActivity?.activitySubject}
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
