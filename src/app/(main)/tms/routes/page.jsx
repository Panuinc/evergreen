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
import { useRoutes } from "@/hooks/useRoutes";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อเส้นทาง", uid: "routeName", sortable: true },
  { name: "ต้นทาง", uid: "routeOrigin", sortable: true },
  { name: "ปลายทาง", uid: "routeDestination", sortable: true },
  { name: "ระยะทาง", uid: "routeDistanceKm", sortable: true },
  { name: "เวลาโดยประมาณ", uid: "routeEstimatedMinutes", sortable: true },
  { name: "สถานะ", uid: "routeStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "ใช้งาน", uid: "active" },
  { name: "ไม่ใช้งาน", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "routeName",
  "routeOrigin",
  "routeDestination",
  "routeDistanceKm",
  "routeEstimatedMinutes",
  "routeStatus",
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
        case "routeName":
          return <span className="font-medium">{item.routeName}</span>;
        case "routeOrigin":
          return item.routeOrigin || "-";
        case "routeDestination":
          return item.routeDestination || "-";
        case "routeDistanceKm":
          return item.routeDistanceKm
            ? `${Number(item.routeDistanceKm).toLocaleString()} กม.`
            : "-";
        case "routeEstimatedMinutes": {
          if (!item.routeEstimatedMinutes) return "-";
          const mins = Number(item.routeEstimatedMinutes);
          const hours = Math.floor(mins / 60);
          const remaining = mins % 60;
          if (hours > 0 && remaining > 0) return `${hours} ชม. ${remaining} น.`;
          if (hours > 0) return `${hours} ชม.`;
          return `${remaining} น.`;
        }
        case "routeStatus": {
          const colorMap = {
            active: "success",
            inactive: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.routeStatus] || "default"}
            >
              {item.routeStatus}
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
        rowKey="routeId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อเส้นทาง, ปลายทาง..."
        searchKeys={[
          "routeName",
          "routeDestination",
        ]}
        statusField="routeStatus"
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
                    value={formData.routeName}
                    onChange={(e) =>
                      updateField("routeName", e.target.value)
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
                    value={formData.routeOrigin}
                    onChange={(e) =>
                      updateField("routeOrigin", e.target.value)
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
                    value={formData.routeDestination}
                    onChange={(e) =>
                      updateField("routeDestination", e.target.value)
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
                    value={formData.routeDistanceKm}
                    onChange={(e) =>
                      updateField("routeDistanceKm", e.target.value)
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
                    value={formData.routeEstimatedMinutes}
                    onChange={(e) =>
                      updateField("routeEstimatedMinutes", e.target.value)
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
                    selectedKeys={[formData.routeStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("routeStatus", val);
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
                  value={formData.routeNotes}
                  onChange={(e) =>
                    updateField("routeNotes", e.target.value)
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
                {deletingRoute?.routeName}
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
