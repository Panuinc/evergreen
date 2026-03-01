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
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import FileUpload from "@/components/ui/FileUpload";
import { useRBAC } from "@/contexts/RBACContext";

const fuelCsvColumns = [
  { header: "วันที่", key: "tmsFuelLogDate" },
  { header: "ลิตร", key: "tmsFuelLogLiters" },
  { header: "ราคา/ลิตร", key: "tmsFuelLogPricePerLiter" },
  { header: "ค่าใช้จ่ายรวม", key: "tmsFuelLogTotalCost" },
  { header: "เลขไมล์", key: "tmsFuelLogMileage" },
  { header: "สถานี", key: "tmsFuelLogStation" },
];

const baseColumns = [
  { name: "วันที่", uid: "tmsFuelLogDate", sortable: true },
  { name: "ยานพาหนะ", uid: "tmsVehicleName", sortable: true },
  { name: "ลิตร", uid: "tmsFuelLogLiters", sortable: true },
  { name: "ราคา/ลิตร", uid: "tmsFuelLogPricePerLiter", sortable: true },
  { name: "ค่าใช้จ่ายรวม", uid: "tmsFuelLogTotalCost", sortable: true },
  { name: "เลขไมล์", uid: "tmsFuelLogMileage", sortable: true },
  { name: "สถานี", uid: "tmsFuelLogStation" },
  { name: "จัดการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "tmsFuelLogDate",
  "tmsVehicleName",
  "tmsFuelLogLiters",
  "tmsFuelLogPricePerLiter",
  "tmsFuelLogTotalCost",
  "tmsFuelLogMileage",
  "tmsFuelLogStation",
  "actions",
];

export default function FuelLogsView({
  fuelLogs,
  vehicles,
  drivers,
  loading,
  saving,
  editingFuelLog,
  formData,
  deletingFuelLog,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
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

  const vehicleOptions = vehicles.map((v) => ({
    name: `${v.tmsVehicleName} (${v.tmsVehiclePlateNumber})`,
    uid: v.tmsVehicleId,
  }));

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "tmsFuelLogDate":
          return (
            <span className="text-default-500">
              {item.tmsFuelLogDate
                ? new Date(item.tmsFuelLogDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "tmsVehicleName": {
          const vehicle = vehicles.find(
            (v) => v.tmsVehicleId === item.tmsFuelLogVehicleId,
          );
          return vehicle
            ? `${vehicle.tmsVehicleName} (${vehicle.tmsVehiclePlateNumber})`
            : "-";
        }
        case "tmsFuelLogLiters":
          return item.tmsFuelLogLiters
            ? Number(item.tmsFuelLogLiters).toLocaleString()
            : "-";
        case "tmsFuelLogPricePerLiter":
          return item.tmsFuelLogPricePerLiter
            ? Number(item.tmsFuelLogPricePerLiter).toLocaleString()
            : "-";
        case "tmsFuelLogTotalCost":
          return item.tmsFuelLogTotalCost
            ? Number(item.tmsFuelLogTotalCost).toLocaleString()
            : "-";
        case "tmsFuelLogMileage":
          return item.tmsFuelLogMileage
            ? Number(item.tmsFuelLogMileage).toLocaleString()
            : "-";
        case "tmsFuelLogStation":
          return item.tmsFuelLogStation || "-";
        case "isActive":
          return (
            <Chip
              variant="bordered"
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
    [handleOpen, confirmDelete, toggleActive, isSuperAdmin, vehicles],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={fuelLogs}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsFuelLogId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยชื่อสถานี..."
        searchKeys={["tmsFuelLogStation"]}
        statusField="tmsFuelLogVehicleId"
        statusOptions={vehicleOptions}
        filterLabel="ยานพาหนะ"
        emptyContent="ไม่พบบันทึกน้ำมัน"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("fuel-logs.csv", fuelCsvColumns, fuelLogs)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              เพิ่มบันทึกน้ำมัน
            </Button>
          </div>
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
            {editingFuelLog ? "แก้ไขบันทึกน้ำมัน" : "เพิ่มบันทึกน้ำมัน"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ยานพาหนะ"
                    labelPlacement="outside"
                    placeholder="เลือกยานพาหนะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsFuelLogVehicleId
                        ? [formData.tmsFuelLogVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsFuelLogVehicleId", val);
                    }}
                    isRequired
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.tmsVehicleId}>
                        {v.tmsVehicleName} ({v.tmsVehiclePlateNumber})
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="พนักงานขับรถ"
                    labelPlacement="outside"
                    placeholder="เลือกพนักงานขับรถ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsFuelLogDriverId
                        ? [formData.tmsFuelLogDriverId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsFuelLogDriverId", val);
                    }}
                  >
                    {drivers.map((d) => (
                      <SelectItem key={d.tmsDriverId}>
                        {d.tmsDriverFirstName} {d.tmsDriverLastName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogDate}
                    onChange={(e) =>
                      updateField("tmsFuelLogDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ชนิดเชื้อเพลิง"
                    labelPlacement="outside"
                    placeholder="เลือกชนิดเชื้อเพลิง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsFuelLogFuelType
                        ? [formData.tmsFuelLogFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsFuelLogFuelType", val);
                    }}
                  >
                    <SelectItem key="diesel">ดีเซล</SelectItem>
                    <SelectItem key="gasoline">เบนซิน</SelectItem>
                    <SelectItem key="ngv">NGV</SelectItem>
                    <SelectItem key="electric">ไฟฟ้า</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ลิตร"
                    labelPlacement="outside"
                    placeholder="กรอกจำนวนลิตร"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogLiters}
                    onChange={(e) =>
                      updateField("tmsFuelLogLiters", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ราคา/ลิตร"
                    labelPlacement="outside"
                    placeholder="กรอกราคาต่อลิตร"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogPricePerLiter}
                    onChange={(e) =>
                      updateField("tmsFuelLogPricePerLiter", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ค่าใช้จ่ายรวม"
                    labelPlacement="outside"
                    placeholder="กรอกค่าใช้จ่ายรวม"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogTotalCost}
                    onChange={(e) =>
                      updateField("tmsFuelLogTotalCost", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogMileage}
                    onChange={(e) =>
                      updateField("tmsFuelLogMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="สถานี"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อสถานี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogStation}
                    onChange={(e) =>
                      updateField("tmsFuelLogStation", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="หมายเหตุ"
                    labelPlacement="outside"
                    placeholder="กรอกหมายเหตุ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsFuelLogNotes}
                    onChange={(e) =>
                      updateField("tmsFuelLogNotes", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="p-2">
                <FileUpload
                  label="ใบเสร็จ"
                  accept="image/*,.pdf"
                  multiple={false}
                  value={formData.tmsFuelLogReceiptUrl}
                  onChange={(url) => updateField("tmsFuelLogReceiptUrl", url)}
                  folder="fuel-receipts"
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
              {editingFuelLog ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบบันทึกน้ำมัน</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบบันทึกน้ำมันนี้
              {deletingFuelLog?.tmsFuelLogDate && (
                <>
                  {" "}
                  จากวันที่{" "}
                  <span className="font-semibold">
                    {new Date(
                      deletingFuelLog.tmsFuelLogDate,
                    ).toLocaleDateString("th-TH")}
                  </span>
                </>
              )}
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
