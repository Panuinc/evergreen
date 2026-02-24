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
import { Plus, Edit, Trash2, ArrowRightLeft } from "lucide-react";
import { useCrmLeads } from "@/hooks/useCrmLeads";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ลีด", uid: "leadNo", sortable: true },
  { name: "ชื่อ", uid: "leadName", sortable: true },
  { name: "บริษัท", uid: "leadCompany" },
  { name: "อีเมล", uid: "leadEmail" },
  { name: "โทรศัพท์", uid: "leadPhone" },
  { name: "แหล่งที่มา", uid: "leadSource" },
  { name: "คะแนน", uid: "leadScore" },
  { name: "สถานะ", uid: "leadStatus" },
  { name: "ผู้รับผิดชอบ", uid: "leadAssignedTo" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "ใหม่", uid: "new" },
  { name: "ติดต่อแล้ว", uid: "contacted" },
  { name: "ผ่านคุณสมบัติ", uid: "qualified" },
  { name: "แปลงแล้ว", uid: "converted" },
  { name: "สูญเสีย", uid: "lost" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "leadNo",
  "leadName",
  "leadCompany",
  "leadSource",
  "leadScore",
  "leadStatus",
  "actions",
];

export default function LeadsPage() {
  const {
    leads,
    loading,
    saving,
    editingLead,
    formData,
    validationErrors,
    deletingLead,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleConvert,
  } = useCrmLeads();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "leadNo":
          return <span className="text-default-500">{item.leadNo || "-"}</span>;
        case "leadName":
          return <span className="font-medium">{item.leadName}</span>;
        case "leadCompany":
          return item.leadCompany || "-";
        case "leadEmail":
          return item.leadEmail || "-";
        case "leadPhone":
          return item.leadPhone || "-";
        case "leadSource":
          return item.leadSource ? (
            <Chip variant="bordered" size="md" radius="md">
              {item.leadSource}
            </Chip>
          ) : (
            "-"
          );
        case "leadScore": {
          const scoreColorMap = {
            hot: "danger",
            warm: "warning",
            cold: "primary",
          };
          return item.leadScore ? (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={scoreColorMap[item.leadScore] || "default"}
            >
              {item.leadScore}
            </Chip>
          ) : (
            "-"
          );
        }
        case "leadStatus": {
          const statusColorMap = {
            new: "primary",
            contacted: "warning",
            qualified: "success",
            converted: "secondary",
            lost: "danger",
          };
          return item.leadStatus ? (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={statusColorMap[item.leadStatus] || "default"}
            >
              {item.leadStatus}
            </Chip>
          ) : (
            "-"
          );
        }
        case "leadAssignedTo":
          return item.leadAssignedTo || "-";
        case "actions":
          return (
            <div className="flex items-center gap-1">
              {item.leadStatus === "qualified" && (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleConvert(item)}
                >
                  <ArrowRightLeft />
                </Button>
              )}
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
    [handleOpen, confirmDelete, handleConvert],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={leads}
        renderCell={renderCell}
        enableCardView
        rowKey="leadId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาลีด..."
        searchKeys={[
          "leadName",
          "leadCompany",
          "leadEmail",
          "leadPhone",
        ]}
        statusField="leadStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบลีด"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มลีด
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
            {editingLead ? "แก้ไขลีด" : "เพิ่มลีด"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadName}
                    onChange={(e) => updateField("leadName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.leadName}
                    errorMessage={validationErrors?.leadName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="อีเมล"
                    labelPlacement="outside"
                    placeholder="ใส่อีเมล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadEmail}
                    onChange={(e) => updateField("leadEmail", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="ใส่โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadPhone}
                    onChange={(e) => updateField("leadPhone", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="บริษัท"
                    labelPlacement="outside"
                    placeholder="ใส่บริษัท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadCompany}
                    onChange={(e) => updateField("leadCompany", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder="ใส่ตำแหน่ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadPosition}
                    onChange={(e) => updateField("leadPosition", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="แหล่งที่มา"
                    labelPlacement="outside"
                    placeholder="เลือกแหล่งที่มา"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadSource ? [formData.leadSource] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadSource", val);
                    }}
                  >
                    <SelectItem key="website">เว็บไซต์</SelectItem>
                    <SelectItem key="referral">แนะนำ</SelectItem>
                    <SelectItem key="social">โซเชียล</SelectItem>
                    <SelectItem key="event">อีเวนต์</SelectItem>
                    <SelectItem key="cold_call">โทรเสนอ</SelectItem>
                    <SelectItem key="advertisement">โฆษณา</SelectItem>
                    <SelectItem key="partner">พาร์ทเนอร์</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="คะแนน"
                    labelPlacement="outside"
                    placeholder="เลือกคะแนน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadScore ? [formData.leadScore] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadScore", val);
                    }}
                  >
                    <SelectItem key="hot">ร้อน</SelectItem>
                    <SelectItem key="warm">อุ่น</SelectItem>
                    <SelectItem key="cold">เย็น</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    placeholder="เลือกสถานะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.leadStatus ? [formData.leadStatus] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("leadStatus", val);
                    }}
                  >
                    <SelectItem key="new">ใหม่</SelectItem>
                    <SelectItem key="contacted">ติดต่อแล้ว</SelectItem>
                    <SelectItem key="qualified">ผ่านคุณสมบัติ</SelectItem>
                    <SelectItem key="converted">แปลงแล้ว</SelectItem>
                    <SelectItem key="lost">สูญเสีย</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ผู้รับผิดชอบ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.leadAssignedTo}
                    onChange={(e) => updateField("leadAssignedTo", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="ใส่หมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.leadNotes}
                  onChange={(e) => updateField("leadNotes", e.target.value)}
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
              {editingLead ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบลีด</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingLead?.leadName}
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
