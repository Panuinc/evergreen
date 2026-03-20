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
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, LayoutList, Columns3, Power } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";

const kanbanStages = [
  { key: "prospecting", name: "สำรวจ", color: "#6366f1" },
  { key: "qualification", name: "คัดกรอง", color: "#3b82f6" },
  { key: "proposal", name: "เสนอ", color: "#f59e0b" },
  { key: "negotiation", name: "เจรจา", color: "#f97316" },
];

const baseColumns = [
  { name: "เลขที่", uid: "salesOpportunityNo", sortable: true },
  { name: "ชื่อ", uid: "salesOpportunityName", sortable: true },
  { name: "ผู้ติดต่อ", uid: "contact" },
  { name: "บัญชี", uid: "account" },
  { name: "ขั้นตอน", uid: "salesOpportunityStage" },
  { name: "มูลค่า", uid: "salesOpportunityAmount" },
  { name: "ความน่าจะเป็น", uid: "salesOpportunityProbability" },
  { name: "มูลค่าถ่วงน้ำหนัก", uid: "weightedValue" },
  { name: "คาดว่าปิดเมื่อ", uid: "salesOpportunityExpectedCloseDate" },
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

const baseVisibleColumns = [
  "salesOpportunityNo",
  "salesOpportunityName",
  "contact",
  "salesOpportunityStage",
  "salesOpportunityAmount",
  "salesOpportunityProbability",
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
      return [...baseVisibleColumns, "isActive"];
    }
    return baseVisibleColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "salesOpportunityNo":
          return (
            <span className="text-muted-foreground">
              {item.salesOpportunityNo || "-"}
            </span>
          );
        case "salesOpportunityName":
          return (
            <span className="font-light">{item.salesOpportunityName}</span>
          );
        case "contact":
          return item.salesContact
            ? `${item.salesContact.salesContactFirstName} ${item.salesContact.salesContactLastName}`
            : "-";
        case "account":
          return item.salesAccount?.salesAccountName || "-";
        case "salesOpportunityStage": {
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
              variant="flat"
              size="md"
              radius="md"
              color={colorMap[item.salesOpportunityStage] || "default"}
            >
              {item.salesOpportunityStage}
            </Chip>
          );
        }
        case "salesOpportunityAmount":
          return item.salesOpportunityAmount
            ? `฿${Number(item.salesOpportunityAmount).toLocaleString()}`
            : "-";
        case "salesOpportunityProbability":
          return item.salesOpportunityProbability != null
            ? `${item.salesOpportunityProbability}%`
            : "-";
        case "weightedValue": {
          const amount = Number(item.salesOpportunityAmount) || 0;
          const probability = Number(item.salesOpportunityProbability) || 0;
          const weighted = (amount * probability) / 100;
          return `฿${weighted.toLocaleString()}`;
        }
        case "salesOpportunityExpectedCloseDate":
          return item.salesOpportunityExpectedCloseDate || "-";
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
    [handleOpen, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={opportunities}
          renderCell={renderCell}
          enableCardView
          rowKey="salesOpportunityId"
          isLoading={loading}
          initialVisibleColumns={initialVisibleColumns}
          searchPlaceholder="ค้นหาโอกาสขาย..."
          searchKeys={["salesOpportunityName", "salesOpportunityAssignedTo"]}
          statusField="salesOpportunityStage"
          statusOptions={statusOptions}
          emptyContent="ไม่พบโอกาสขาย"
          actionMenuItems={(item) =>
            [
              { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
              isSuperAdmin
                ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
                : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
            ].filter(Boolean)
          }
          topEndContent={
            <div className="flex gap-2">
              <Button
                variant={viewMode === "table" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("table")}
              >
                <LayoutList />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("kanban")}
              >
                <Columns3 />
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
                <LayoutList />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "solid" : "bordered"}
                size="md"
                radius="md"
                isIconOnly
                onPress={() => setViewMode("kanban")}
              >
                <Columns3 />
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
            {kanbanStages.map((stage) => {
              const stageOpps = opportunities.filter(
                (opp) => opp.salesOpportunityStage === stage.key,
              );
              const totalValue = stageOpps.reduce(
                (sum, opp) => sum + (Number(opp.salesOpportunityAmount) || 0),
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
                      <span className="font-light text-xs">
                        {stage.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stageOpps.length} ดีล &middot; ฿
                        {totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-240px)]">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.salesOpportunityId}
                        className="flex flex-col gap-1 p-3 bg-background rounded-md border border-border cursor-pointer hover:border-border transition-colors"
                        onClick={() => handleOpen(opp)}
                      >
                        <span className="font-light text-xs">
                          {opp.salesOpportunityName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {opp.salesContact
                            ? `${opp.salesContact.salesContactFirstName} ${opp.salesContact.salesContactLastName}`
                            : "-"}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-light">
                            ฿
                            {Number(
                              opp.salesOpportunityAmount || 0,
                            ).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {opp.salesOpportunityProbability != null
                              ? `${opp.salesOpportunityProbability}%`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-4">
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

      {}
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
                    value={formData.salesOpportunityName}
                    onChange={(e) =>
                      updateField("salesOpportunityName", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.salesOpportunityName}
                    errorMessage={validationErrors?.salesOpportunityName}
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
                      formData.salesOpportunityStage
                        ? [formData.salesOpportunityStage]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesOpportunityStage", val);
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
                    value={formData.salesOpportunityAmount}
                    onChange={(e) =>
                      updateField("salesOpportunityAmount", e.target.value)
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
                    value={formData.salesOpportunityProbability}
                    onChange={(e) =>
                      updateField("salesOpportunityProbability", e.target.value)
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
                    value={formData.salesOpportunityExpectedCloseDate}
                    onChange={(e) =>
                      updateField(
                        "salesOpportunityExpectedCloseDate",
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
                      formData.salesOpportunitySource
                        ? [formData.salesOpportunitySource]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("salesOpportunitySource", val);
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
                    value={formData.salesOpportunityContactId}
                    onChange={(e) =>
                      updateField("salesOpportunityContactId", e.target.value)
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
                    value={formData.salesOpportunityAccountId}
                    onChange={(e) =>
                      updateField("salesOpportunityAccountId", e.target.value)
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
                    value={formData.salesOpportunityAssignedTo}
                    onChange={(e) =>
                      updateField("salesOpportunityAssignedTo", e.target.value)
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
                  value={formData.salesOpportunityNotes}
                  onChange={(e) =>
                    updateField("salesOpportunityNotes", e.target.value)
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

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบโอกาสขาย</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingOpp?.salesOpportunityName}
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

      {}
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
