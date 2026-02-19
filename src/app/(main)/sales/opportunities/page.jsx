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
import { useCrmOpportunities } from "@/hooks/useCrmOpportunities";
import DataTable from "@/components/ui/DataTable";

const KANBAN_STAGES = [
  { key: "prospecting", name: "Prospecting", color: "#6366f1" },
  { key: "qualification", name: "Qualification", color: "#3b82f6" },
  { key: "proposal", name: "Proposal", color: "#f59e0b" },
  { key: "negotiation", name: "Negotiation", color: "#f97316" },
];

const columns = [
  { name: "Opp No.", uid: "opportunityNo", sortable: true },
  { name: "Name", uid: "opportunityName", sortable: true },
  { name: "Contact", uid: "contact" },
  { name: "Account", uid: "account" },
  { name: "Stage", uid: "opportunityStage" },
  { name: "Amount", uid: "opportunityAmount" },
  { name: "Probability", uid: "opportunityProbability" },
  { name: "Weighted Value", uid: "weightedValue" },
  { name: "Expected Close", uid: "opportunityExpectedCloseDate" },
  { name: "Actions", uid: "actions" },
];

const statusOptions = [
  { name: "Prospecting", uid: "prospecting" },
  { name: "Qualification", uid: "qualification" },
  { name: "Proposal", uid: "proposal" },
  { name: "Negotiation", uid: "negotiation" },
  { name: "Closed Won", uid: "closed_won" },
  { name: "Closed Lost", uid: "closed_lost" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "opportunityNo",
  "opportunityName",
  "contact",
  "opportunityStage",
  "opportunityAmount",
  "opportunityProbability",
  "actions",
];

export default function OpportunitiesPage() {
  const {
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
  } = useCrmOpportunities();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "opportunityNo":
          return (
            <span className="text-default-500">
              {item.opportunityNo || "-"}
            </span>
          );
        case "opportunityName":
          return (
            <span className="font-medium">{item.opportunityName}</span>
          );
        case "contact":
          return item.crmContacts
            ? `${item.crmContacts.contactFirstName} ${item.crmContacts.contactLastName}`
            : "-";
        case "account":
          return item.crmAccounts?.accountName || "-";
        case "opportunityStage": {
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
              color={colorMap[item.opportunityStage] || "default"}
            >
              {item.opportunityStage}
            </Chip>
          );
        }
        case "opportunityAmount":
          return item.opportunityAmount
            ? `฿${Number(item.opportunityAmount).toLocaleString()}`
            : "-";
        case "opportunityProbability":
          return item.opportunityProbability != null
            ? `${item.opportunityProbability}%`
            : "-";
        case "weightedValue": {
          const amount = Number(item.opportunityAmount) || 0;
          const probability = Number(item.opportunityProbability) || 0;
          const weighted = (amount * probability) / 100;
          return `฿${weighted.toLocaleString()}`;
        }
        case "opportunityExpectedCloseDate":
          return item.opportunityExpectedCloseDate || "-";
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
          rowKey="opportunityId"
          isLoading={loading}
          initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
          searchPlaceholder="Search opportunities..."
          searchKeys={["opportunityName", "opportunityAssignedTo"]}
          statusField="opportunityStage"
          statusOptions={statusOptions}
          emptyContent="No opportunities found"
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
                Add Opportunity
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
                (opp) => opp.opportunityStage === stage.key,
              );
              const totalValue = stageOpps.reduce(
                (sum, opp) => sum + (Number(opp.opportunityAmount) || 0),
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
                        {stageOpps.length} deals &middot; ฿
                        {totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-240px)]">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.opportunityId}
                        className="flex flex-col gap-1 p-3 bg-background rounded-md border border-default-200 cursor-pointer hover:border-default-400 transition-colors"
                        onClick={() => handleOpen(opp)}
                      >
                        <span className="font-medium text-sm">
                          {opp.opportunityName}
                        </span>
                        <span className="text-xs text-default-500">
                          {opp.crmContacts
                            ? `${opp.crmContacts.contactFirstName} ${opp.crmContacts.contactLastName}`
                            : "-"}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium">
                            ฿
                            {Number(
                              opp.opportunityAmount || 0,
                            ).toLocaleString()}
                          </span>
                          <span className="text-xs text-default-500">
                            {opp.opportunityProbability != null
                              ? `${opp.opportunityProbability}%`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stageOpps.length === 0 && (
                      <div className="text-center text-xs text-default-400 py-4">
                        No opportunities
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
            {editingOpp ? "Edit Opportunity" : "Add Opportunity"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Opportunity Name"
                    labelPlacement="outside"
                    placeholder="Enter opportunity name"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityName}
                    onChange={(e) =>
                      updateField("opportunityName", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.opportunityName}
                    errorMessage={validationErrors?.opportunityName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Stage"
                    labelPlacement="outside"
                    placeholder="Select stage"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.opportunityStage
                        ? [formData.opportunityStage]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("opportunityStage", val);
                    }}
                  >
                    <SelectItem key="prospecting">Prospecting</SelectItem>
                    <SelectItem key="qualification">Qualification</SelectItem>
                    <SelectItem key="proposal">Proposal</SelectItem>
                    <SelectItem key="negotiation">Negotiation</SelectItem>
                    <SelectItem key="closed_won">Closed Won</SelectItem>
                    <SelectItem key="closed_lost">Closed Lost</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Amount"
                    labelPlacement="outside"
                    placeholder="Enter amount"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityAmount}
                    onChange={(e) =>
                      updateField("opportunityAmount", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="Probability %"
                    labelPlacement="outside"
                    placeholder="Enter probability"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityProbability}
                    onChange={(e) =>
                      updateField("opportunityProbability", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="Expected Close Date"
                    labelPlacement="outside"
                    placeholder="Select date"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityExpectedCloseDate}
                    onChange={(e) =>
                      updateField(
                        "opportunityExpectedCloseDate",
                        e.target.value,
                      )
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="Source"
                    labelPlacement="outside"
                    placeholder="Select source"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.opportunitySource
                        ? [formData.opportunitySource]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("opportunitySource", val);
                    }}
                  >
                    <SelectItem key="website">Website</SelectItem>
                    <SelectItem key="referral">Referral</SelectItem>
                    <SelectItem key="social">Social</SelectItem>
                    <SelectItem key="event">Event</SelectItem>
                    <SelectItem key="cold_call">Cold Call</SelectItem>
                    <SelectItem key="partner">Partner</SelectItem>
                    <SelectItem key="existing_customer">
                      Existing Customer
                    </SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Contact"
                    labelPlacement="outside"
                    placeholder="Enter contact ID"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityContactId}
                    onChange={(e) =>
                      updateField("opportunityContactId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Account"
                    labelPlacement="outside"
                    placeholder="Enter account ID"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityAccountId}
                    onChange={(e) =>
                      updateField("opportunityAccountId", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="Assigned To"
                    labelPlacement="outside"
                    placeholder="Enter assigned to"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.opportunityAssignedTo}
                    onChange={(e) =>
                      updateField("opportunityAssignedTo", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Notes"
                  labelPlacement="outside"
                  placeholder="Enter notes"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.opportunityNotes}
                  onChange={(e) =>
                    updateField("opportunityNotes", e.target.value)
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              {editingOpp ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>Delete Opportunity</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deletingOpp?.opportunityName}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal isOpen={lostReasonModal.isOpen} onClose={lostReasonModal.onClose}>
        <ModalContent>
          <ModalHeader>Close as Lost</ModalHeader>
          <ModalBody>
            <Input
              label="Lost Reason"
              labelPlacement="outside"
              placeholder="Why was this opportunity lost?"
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
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleCloseLost}
            >
              Confirm Lost
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
