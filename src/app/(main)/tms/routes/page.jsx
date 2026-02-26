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
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useRoutes } from "@/hooks/tms/useRoutes";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อเส้นทาง", uid: "tmsRouteName", sortable: true },
  { name: "ต้นทาง", uid: "tmsRouteOrigin", sortable: true },
  { name: "ปลายทาง", uid: "tmsRouteDestination", sortable: true },
  { name: "ระยะทาง", uid: "tmsRouteDistanceKm", sortable: true },
  { name: "เวลาโดยประมาณ", uid: "tmsRouteEstimatedMinutes", sortable: true },
  { name: "สถานะ", uid: "tmsRouteStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "ใช้งาน", uid: "active" },
  { name: "ไม่ใช้งาน", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "tmsRouteName",
  "tmsRouteOrigin",
  "tmsRouteDestination",
  "tmsRouteDistanceKm",
  "tmsRouteEstimatedMinutes",
  "tmsRouteStatus",
  "actions",
];

export default function RoutesPage() {
  const {
    routes,
    loading,
    saving,
    editingRoute,
    formData,
    deletingRoute,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useRoutes();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "tmsRouteName":
          return <span className="font-medium">{item.tmsRouteName}</span>;
        case "tmsRouteOrigin":
          return item.tmsRouteOrigin || "-";
        case "tmsRouteDestination":
          return item.tmsRouteDestination || "-";
        case "tmsRouteDistanceKm":
          return item.tmsRouteDistanceKm
            ? `${Number(item.tmsRouteDistanceKm).toLocaleString()} กม.`
            : "-";
        case "tmsRouteEstimatedMinutes": {
          if (!item.tmsRouteEstimatedMinutes) return "-";
          const mins = Number(item.tmsRouteEstimatedMinutes);
          const hours = Math.floor(mins / 60);
          const remaining = mins % 60;
          if (hours > 0 && remaining > 0) return `${hours} ชม. ${remaining} น.`;
          if (hours > 0) return `${hours} ชม.`;
          return `${remaining} น.`;
        }
        case "tmsRouteStatus": {
          const colorMap = {
            active: "success",
            inactive: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.tmsRouteStatus] || "default"}
            >
              {item.tmsRouteStatus}
            </Chip>
          );
        }
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
        data={routes}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsRouteId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อเส้นทาง, ปลายทาง..."
        searchKeys={[
          "tmsRouteName",
          "tmsRouteDestination",
        ]}
        statusField="tmsRouteStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบเส้นทาง"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มเส้นทาง
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
            {editingRoute ? "แก้ไขเส้นทาง" : "เพิ่มเส้นทาง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อเส้นทาง"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อเส้นทาง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsRouteName}
                    onChange={(e) =>
                      updateField("tmsRouteName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ต้นทาง"
                    labelPlacement="outside"
                    placeholder="กรอกต้นทาง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsRouteOrigin}
                    onChange={(e) =>
                      updateField("tmsRouteOrigin", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ปลายทาง"
                    labelPlacement="outside"
                    placeholder="กรอกปลายทาง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsRouteDestination}
                    onChange={(e) =>
                      updateField("tmsRouteDestination", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ระยะทาง (กม.)"
                    labelPlacement="outside"
                    placeholder="กรอกระยะทาง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsRouteDistanceKm}
                    onChange={(e) =>
                      updateField("tmsRouteDistanceKm", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เวลาโดยประมาณ (นาที)"
                    labelPlacement="outside"
                    placeholder="กรอกเวลาโดยประมาณ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsRouteEstimatedMinutes}
                    onChange={(e) =>
                      updateField("tmsRouteEstimatedMinutes", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.tmsRouteStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("tmsRouteStatus", val);
                    }}
                  >
                    <SelectItem key="active">ใช้งาน</SelectItem>
                    <SelectItem key="inactive">ไม่ใช้งาน</SelectItem>
                  </Select>
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="กรอกหมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.tmsRouteNotes}
                  onChange={(e) =>
                    updateField("tmsRouteNotes", e.target.value)
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
              {editingRoute ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบเส้นทาง</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบ{" "}
              <span className="font-semibold">
                {deletingRoute?.tmsRouteName}
              </span>
              หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
