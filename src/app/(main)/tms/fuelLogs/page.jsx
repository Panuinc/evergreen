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
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useFuelLogs } from "@/hooks/tms/useFuelLogs";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import FileUpload from "@/components/ui/FileUpload";

const fuelCsvColumns = [
  { header: "วันที่", key: "fuelLogDate" },
  { header: "ลิตร", key: "fuelLogLiters" },
  { header: "ราคา/ลิตร", key: "fuelLogPricePerLiter" },
  { header: "ค่าใช้จ่ายรวม", key: "fuelLogTotalCost" },
  { header: "เลขไมล์", key: "fuelLogMileage" },
  { header: "สถานี", key: "fuelLogStation" },
];

const columns = [
  { name: "วันที่", uid: "fuelLogDate", sortable: true },
  { name: "ยานพาหนะ", uid: "vehicleName", sortable: true },
  { name: "ลิตร", uid: "fuelLogLiters", sortable: true },
  { name: "ราคา/ลิตร", uid: "fuelLogPricePerLiter", sortable: true },
  { name: "ค่าใช้จ่ายรวม", uid: "fuelLogTotalCost", sortable: true },
  { name: "เลขไมล์", uid: "fuelLogMileage", sortable: true },
  { name: "สถานี", uid: "fuelLogStation" },
  { name: "จัดการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "fuelLogDate",
  "vehicleName",
  "fuelLogLiters",
  "fuelLogPricePerLiter",
  "fuelLogTotalCost",
  "fuelLogMileage",
  "fuelLogStation",
  "actions",
];

export default function FuelLogsPage() {
  const {
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
  } = useFuelLogs();

  const vehicleOptions = vehicles.map((v) => ({
    name: `${v.vehicleName} (${v.vehiclePlateNumber})`,
    uid: v.vehicleId,
  }));

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "fuelLogDate":
          return (
            <span className="text-default-500">
              {item.fuelLogDate
                ? new Date(item.fuelLogDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "vehicleName": {
          const vehicle = vehicles.find(
            (v) => v.vehicleId === item.fuelLogVehicleId,
          );
          return vehicle
            ? `${vehicle.vehicleName} (${vehicle.vehiclePlateNumber})`
            : "-";
        }
        case "fuelLogLiters":
          return item.fuelLogLiters
            ? Number(item.fuelLogLiters).toLocaleString()
            : "-";
        case "fuelLogPricePerLiter":
          return item.fuelLogPricePerLiter
            ? Number(item.fuelLogPricePerLiter).toLocaleString()
            : "-";
        case "fuelLogTotalCost":
          return item.fuelLogTotalCost
            ? Number(item.fuelLogTotalCost).toLocaleString()
            : "-";
        case "fuelLogMileage":
          return item.fuelLogMileage
            ? Number(item.fuelLogMileage).toLocaleString()
            : "-";
        case "fuelLogStation":
          return item.fuelLogStation || "-";
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
    [handleOpen, confirmDelete, vehicles],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={fuelLogs}
        renderCell={renderCell}
        enableCardView
        rowKey="fuelLogId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อสถานี..."
        searchKeys={["fuelLogStation"]}
        statusField="fuelLogVehicleId"
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
                      formData.fuelLogVehicleId
                        ? [formData.fuelLogVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogVehicleId", val);
                    }}
                    isRequired
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.vehicleId}>
                        {v.vehicleName} ({v.vehiclePlateNumber})
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
                      formData.fuelLogDriverId
                        ? [formData.fuelLogDriverId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogDriverId", val);
                    }}
                  >
                    {drivers.map((d) => (
                      <SelectItem key={d.driverId}>
                        {d.driverFirstName} {d.driverLastName}
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
                    value={formData.fuelLogDate}
                    onChange={(e) =>
                      updateField("fuelLogDate", e.target.value)
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
                      formData.fuelLogFuelType
                        ? [formData.fuelLogFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("fuelLogFuelType", val);
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
                    value={formData.fuelLogLiters}
                    onChange={(e) =>
                      updateField("fuelLogLiters", e.target.value)
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
                    value={formData.fuelLogPricePerLiter}
                    onChange={(e) =>
                      updateField("fuelLogPricePerLiter", e.target.value)
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
                    value={formData.fuelLogTotalCost}
                    onChange={(e) =>
                      updateField("fuelLogTotalCost", e.target.value)
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
                    value={formData.fuelLogMileage}
                    onChange={(e) =>
                      updateField("fuelLogMileage", e.target.value)
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
                    value={formData.fuelLogStation}
                    onChange={(e) =>
                      updateField("fuelLogStation", e.target.value)
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
                    value={formData.fuelLogNotes}
                    onChange={(e) =>
                      updateField("fuelLogNotes", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="p-2">
                <FileUpload
                  label="ใบเสร็จ"
                  accept="image/*,.pdf"
                  multiple={false}
                  value={formData.fuelLogReceiptUrl}
                  onChange={(url) => updateField("fuelLogReceiptUrl", url)}
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
              {deletingFuelLog?.fuelLogDate && (
                <>
                  {" "}
                  จากวันที่{" "}
                  <span className="font-semibold">
                    {new Date(
                      deletingFuelLog.fuelLogDate,
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
