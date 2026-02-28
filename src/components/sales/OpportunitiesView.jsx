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
import { Plus, Edit, Trash2, LayoutList, Columns3 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

const KANBAN_STAGES = [
  { key: "prospecting", name: "สำรวจ", color: "#6366f1" },
  { key: "qualification", name: "คัดกรอง", color: "#3b82f6" },
  { key: "proposal", name: "เสนอ", color: "#f59e0b" },
  { key: "negotiation", name: "เจรจา", color: "#f97316" },
];

const columns = [
  { name: "เลขที่", uid: "crmOpportunityNo", sortable: true },
  { name: "ชื่อ", uid: "crmOpportunityName", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "ขั้นตอน", uid: "crmOpportunityStage" },
  { name: "มูลค่า", uid: "crmOpportunityAmount" },
  { name: "ความน่าจะเป็น", uid: "crmOpportunityProbability" },
  { name: "มูลค่าถ่วงน้ำหนัก", uid: "weightedValue" },
  { name: "คาดว่าปิดเมื่อ", uid: "crmOpportunityExpectedCloseDate" },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "สำรวจ", uid: "prospecting" },
  { name: "คัดกรอง", uid: "qualification" },
  { name: "เสนอ", uid: "proposal" },
  { name: "เจรจา", uid: "negotiation" },
  { name: "ปิดชนะ", uid: "closed_won" },
  { name: "ปิดแพ้", uid: "closed_lost" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "crmOpportunityNo",
  "crmOpportunityName",
  "contact",
  "crmOpportunityStage",
  "crmOpportunityAmount",
  "crmOpportunityProbability",
  "actions",
];

export default function OpportunitiesView({
  opportunities,
  loading,
  saving,
  editingOpp,
  formData,
  validationErrors,
  deletingOpp,
  viewMode,
  setViewMode,
  lostReason,
  setLostReason,
  lostReasonModal,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  handleStageChange,
  handleCloseLost,
  confirmDelete,
  handleDelete,
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "crmOpportunityNo":
          return (
            <span className="text-default-500">
              {item.crmOpportunityNo || "-"}
            </span>
          );
        case "crmOpportunityName":
          return (
            <span className="font-medium">{item.crmOpportunityName}</span>
          );
        case "contact":
          return item.crmContact
            ? `${item.crmContact.crmContactFirstName} ${item.crmContact.crmContactLastName}`
            : "-";
        case "account":
          return item.crmAccount?.crmAccountName || "-";
        case "crmOpportunityStage": {
          const colorMap = {
            prospecting: "default",
            qualification: "primary",
            proposal: "warning",
            negotiation: "secondary",
            closed_won: "success",
            closed_lost: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.crmOpportunityStage] || "default"}
            >
              {item.crmOpportunityStage}
            </Chip>
          );
        }
        case "crmOpportunityAmount":
          return item.crmOpportunityAmount
            ? `฿${Number(item.crmOpportunityAmount).toLocaleString()}`
            : "-";
        case "crmOpportunityProbability":
          return item.crmOpportunityProbability != null
            ? `${item.crmOpportunityProbability}%`
            : "-";
        case "weightedValue": {
          const amount = Number(item.crmOpportunityAmount) || 0;
          const probability = Number(item.crmOpportunityProbability) || 0;
          const weighted = (amount * probability) / 100;
          return `฿${weighted.toLocaleString()}`;
        }
        case "crmOpportunityExpectedCloseDate":
          return item.crmOpportunityExpectedCloseDate || "-";
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
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={opportunities}
          renderCell={renderCell}
          enableCardView
          rowKey="crmOpportunityId"
          isLoading={loading}
          initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
          searchPlaceholder="ค้นหาโอกาสขาย..."
          searchKeys={["crmOpportunityName", "crmOpportunityAssignedTo"]}
          statusField="crmOpportunityStage"
          statusOptions={statusOptions}
          emptyContent="ไม่พบโอกาสขาย"
          topEndContent={
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("table")}
              >
                <LayoutList size={18} />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("kanban")}
              >
                <Columns3 size={18} />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                startContent={<Plus />}
                onPress={() => handleOpen()}
              >
                เพิ่มโอกาสขาย
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("table")}
              >
                <LayoutList size={18} />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("kanban")}
              >
                <Columns3 size={18} />
              </Button>
            </div>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Plus />}
              onPress={() => handleOpen()}
            >
              Add Opportunity
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_STAGES.map((stage) => {
              const stageOpps = opportunities.filter(
                (opp) => opp.crmOpportunityStage === stage.key,
              );
              const totalValue = stageOpps.reduce(
                (sum, opp) => sum + (Number(opp.crmOpportunityAmount) || 0),
                0,
              );
              return (
                <div
                  key={stage.key}
                  className="flex flex-col min-w-[280px] w-[280px] bg-default-50 rounded-lg"
                >
                  <div
                    className="flex items-center justify-between p-3 rounded-t-lg"
                    style={{ borderTop: `3px solid ${stage.color}` }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {stage.name}
                      </span>
                      <span className="text-xs text-default-500">
                        {stageOpps.length} ดีล &middot; ฿
                        {totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-240px)]">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.crmOpportunityId}
                        className="flex flex-col gap-1 p-3 bg-background rounded-md border border-default-200 cursor-pointer hover:border-default-400 transition-colors"
                        onClick={() => handleOpen(opp)}
                      >
                        <span className="font-medium text-sm">
                          {opp.crmOpportunityName}
                        </span>
                        <span className="text-xs text-default-500">
                          {opp.crmContact
                            ? `${opp.crmContact.crmContactFirstName} ${opp.crmContact.crmContactLastName}`
                            : "-"}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium">
                            ฿
                            {Number(
                              opp.crmOpportunityAmount || 0,
                            ).toLocaleString()}
                          </span>
                          <span className="text-xs text-default-500">
                            {opp.crmOpportunityProbability != null
                              ? `${opp.crmOpportunityProbability}%`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="text-center text-xs text-default-400 py-4">
                        ไม่มีโอกาสขาย
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingOpp ? "แก้ไขโอกาสขาย" : "เพิ่มโอกาสขาย"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อโอกาสขาย"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อโอกาสขาย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmOpportunityName}
                    onChange={(e) =>
                      updateField("crmOpportunityName", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.crmOpportunityName}
                    errorMessage={validationErrors?.crmOpportunityName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ขั้นตอน"
                    labelPlacement="outside"
                    placeholder="เลือกขั้นตอน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.crmOpportunityStage
                        ? [formData.crmOpportunityStage]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmOpportunityStage", val);
                    }}
                  >
                    <SelectItem key="prospecting">สำรวจ</SelectItem>
                    <SelectItem key="qualification">คัดกรอง</SelectItem>
                    <SelectItem key="proposal">เสนอ</SelectItem>
                    <SelectItem key="negotiation">เจรจา</SelectItem>
                    <SelectItem key="closed_won">ปิดชนะ</SelectItem>
                    <SelectItem key="closed_lost">ปิดแพ้</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="มูลค่า"
                    labelPlacement="outside"
                    placeholder="ใส่มูลค่า"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmOpportunityAmount}
                    onChange={(e) =>
                      updateField("crmOpportunityAmount", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ความน่าจะเป็น %"
                    labelPlacement="outside"
                    placeholder="ใส่ความน่าจะเป็น"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmOpportunityProbability}
                    onChange={(e) =>
                      updateField("crmOpportunityProbability", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่คาดว่าจะปิด"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmOpportunityExpectedCloseDate}
                    onChange={(e) =>
                      updateField(
                        "crmOpportunityExpectedCloseDate",
                        e.target.value,
                      )
                    }
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
                    selectedKeys={
                      formData.crmOpportunitySource
                        ? [formData.crmOpportunitySource]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("crmOpportunitySource", val);
                    }}
                  >
                    <SelectItem key="website">เว็บไซต์</SelectItem>
                    <SelectItem key="referral">แนะนำ</SelectItem>
                    <SelectItem key="social">โซเชียล</SelectItem>
                    <SelectItem key="event">อีเวนต์</SelectItem>
                    <SelectItem key="cold_call">โทรเสนอ</SelectItem>
                    <SelectItem key="partner">พาร์ทเนอร์</SelectItem>
                    <SelectItem key="existing_customer">
                      ลูกค้าเดิม
                    </SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้ติดต่อ"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสผู้ติดต่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.crmOpportunityContactId}
                    onChange={(e) =>
                      updateField("crmOpportunityContactId", e.target.value)
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
                    value={formData.crmOpportunityAccountId}
                    onChange={(e) =>
                      updateField("crmOpportunityAccountId", e.target.value)
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
                    value={formData.crmOpportunityAssignedTo}
                    onChange={(e) =>
                      updateField("crmOpportunityAssignedTo", e.target.value)
                    }
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
                  value={formData.crmOpportunityNotes}
                  onChange={(e) =>
                    updateField("crmOpportunityNotes", e.target.value)
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
              {editingOpp ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบโอกาสขาย</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingOpp?.crmOpportunityName}
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

      {/* Lost Reason Modal */}
      <Modal isOpen={lostReasonModal.isOpen} onClose={lostReasonModal.onClose}>
        <ModalContent>
          <ModalHeader>ปิดเป็นแพ้</ModalHeader>
          <ModalBody>
            <Input
              label="เหตุผลที่แพ้"
              labelPlacement="outside"
              placeholder="เหตุผลที่โอกาสขายนี้แพ้?"
              variant="bordered"
              size="md"
              radius="md"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={lostReasonModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleCloseLost}
            >
              ยืนยันแพ้
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
