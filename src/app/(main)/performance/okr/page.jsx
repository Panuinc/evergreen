"use client";

import { useState } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Tooltip,
  Divider,
} from "@heroui/react";
import {
  Target,
  Users,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useOkr } from "@/hooks/performance/useOkr";
import {
  OKR_STATUSES,
  KR_STATUSES,
  METRIC_TYPES,
  VISIBILITY_OPTIONS,
  QUARTER_OPTIONS,
  getStatusConfig,
  computeKrProgress,
} from "@/lib/performance/okrConstants";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

export default function OkrPage() {
  const hook = useOkr();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div>
        <h1 className="text-lg font-semibold">OKR (Objectives & Key Results)</h1>
        <p className="text-default-500 text-sm">
          ตั้งเป้าหมายและติดตามความคืบหน้าด้วย Key Results
        </p>
      </div>

      <Tabs
        selectedKey={hook.activeTab}
        onSelectionChange={hook.setActiveTab}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab
          key="myOkr"
          title={
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>OKR ของฉัน</span>
            </div>
          }
        >
          <MyOkrTab hook={hook} />
        </Tab>
        <Tab
          key="teamOkr"
          title={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>OKR ทีม</span>
            </div>
          }
        >
          <TeamOkrTab hook={hook} />
        </Tab>
        <Tab
          key="companyOkr"
          title={
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>OKR บริษัท</span>
            </div>
          }
        >
          <CompanyOkrTab hook={hook} />
        </Tab>
      </Tabs>

      {/* Objective Modal */}
      <ObjectiveModal hook={hook} />
      {/* Key Result Modal */}
      <KrModal hook={hook} />
      {/* Check-in Modal */}
      <CheckinModal hook={hook} />
    </div>
  );
}

// ===================== Filters =====================

function PeriodFilter({ hook }) {
  return (
    <div className="flex gap-2 items-center">
      <Select
        label="ปี"
        selectedKeys={[hook.filterYear]}
        onSelectionChange={(keys) => hook.setFilterYear([...keys][0])}
        className="w-28"
        variant="bordered"
        size="md"
        radius="md"
        labelPlacement="outside"
      >
        {YEAR_OPTIONS.map((y) => (
          <SelectItem key={y.key}>{y.label}</SelectItem>
        ))}
      </Select>
      <Select
        label="ไตรมาส"
        selectedKeys={[hook.filterQuarter]}
        onSelectionChange={(keys) => hook.setFilterQuarter([...keys][0])}
        className="w-40"
        variant="bordered"
        size="md"
        radius="md"
        labelPlacement="outside"
      >
        {QUARTER_OPTIONS.map((q) => (
          <SelectItem key={q.key}>{q.label}</SelectItem>
        ))}
      </Select>
    </div>
  );
}

// ===================== My OKR Tab =====================

function MyOkrTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <PeriodFilter hook={hook} />
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => hook.handleOpenObjectiveForm()}
        >
          สร้าง Objective
        </Button>
      </div>

      {hook.loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : hook.objectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มี OKR ในช่วงเวลานี้ — กดปุ่ม "สร้าง Objective" เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        hook.objectives.map((obj) => (
          <ObjectiveCard key={obj.perfOkrObjectiveId} objective={obj} hook={hook} editable />
        ))
      )}
    </div>
  );
}

// ===================== Team OKR Tab =====================

function TeamOkrTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <PeriodFilter hook={hook} />

      {hook.loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : hook.teamObjectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มี OKR ระดับทีมในช่วงเวลานี้
          </CardBody>
        </Card>
      ) : (
        hook.teamObjectives.map((obj) => (
          <ObjectiveCard key={obj.perfOkrObjectiveId} objective={obj} hook={hook} showOwner />
        ))
      )}
    </div>
  );
}

// ===================== Company OKR Tab =====================

function CompanyOkrTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <PeriodFilter hook={hook} />

      {hook.loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : hook.companyObjectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มี OKR ระดับบริษัทในช่วงเวลานี้
          </CardBody>
        </Card>
      ) : (
        hook.companyObjectives.map((obj) => (
          <ObjectiveCard key={obj.perfOkrObjectiveId} objective={obj} hook={hook} showOwner />
        ))
      )}
    </div>
  );
}

// ===================== Objective Card =====================

function ObjectiveCard({ objective, hook, editable = false, showOwner = false }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = getStatusConfig(objective.perfOkrObjectiveStatus, OKR_STATUSES);
  const krs = objective.keyResults || [];

  const ownerName = objective.employee
    ? `${objective.employee.hrEmployeeFirstName} ${objective.employee.hrEmployeeLastName}`
    : "";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 pb-0">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{objective.perfOkrObjectiveTitle}</h3>
              <Chip size="md" radius="md" color={statusConfig.color} variant="bordered">
                {statusConfig.label}
              </Chip>
              <Chip size="md" radius="md" variant="bordered">
                {objective.perfOkrObjectivePeriod}
              </Chip>
            </div>
            {showOwner && ownerName && (
              <p className="text-sm text-default-500">{ownerName} — {objective.employee?.hrEmployeeDepartment}</p>
            )}
            {objective.perfOkrObjectiveDescription && (
              <p className="text-sm text-default-400">{objective.perfOkrObjectiveDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editable && (
              <>
                <Tooltip content="แก้ไข Objective">
                  <Button
                    isIconOnly
                    size="md"
                    radius="md"
                    variant="bordered"
                    onPress={() => hook.handleOpenObjectiveForm(objective)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Tooltip>
                {objective.perfOkrObjectiveStatus === "draft" && (
                  <Tooltip content="เปิดใช้งาน">
                    <Button
                      isIconOnly
                      size="md"
                      radius="md"
                      variant="bordered"
                      color="primary"
                      onPress={() => hook.handleUpdateObjectiveStatus(objective.perfOkrObjectiveId, "active")}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
                {objective.perfOkrObjectiveStatus === "active" && (
                  <Tooltip content="ทำเครื่องหมายว่าสำเร็จ">
                    <Button
                      isIconOnly
                      size="md"
                      radius="md"
                      variant="bordered"
                      color="success"
                      onPress={() => hook.handleUpdateObjectiveStatus(objective.perfOkrObjectiveId, "completed")}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="ลบ Objective">
                  <Button
                    isIconOnly
                    size="md"
                    radius="md"
                    variant="bordered"
                    color="danger"
                    onPress={() => hook.handleDeleteObjective(objective.perfOkrObjectiveId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        <div className="w-full flex items-center gap-3">
          <Progress
            value={objective.perfOkrObjectiveProgress || 0}
            className="flex-1"
            color={objective.perfOkrObjectiveProgress >= 70 ? "success" : objective.perfOkrObjectiveProgress >= 40 ? "warning" : "danger"}
            size="md"
          />
          <span className="text-sm font-semibold min-w-[50px] text-right">
            {Math.round(objective.perfOkrObjectiveProgress || 0)}%
          </span>
        </div>
      </CardHeader>

      <CardBody className="pt-2">
        <Button
          variant="bordered"
          size="md"
          radius="md"
          className="mb-2"
          startContent={expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          onPress={() => setExpanded(!expanded)}
        >
          Key Results ({krs.length})
        </Button>

        {expanded && (
          <div className="flex flex-col gap-2">
            {krs.map((kr) => (
              <KeyResultRow key={kr.perfOkrKeyResultId} kr={kr} hook={hook} editable={editable} />
            ))}
            {editable && (
              <Button
                size="md"
                radius="md"
                variant="bordered"
                color="primary"
                startContent={<Plus className="w-3 h-3" />}
                className="self-start"
                onPress={() => hook.handleOpenKrForm(objective.perfOkrObjectiveId)}
              >
                เพิ่ม Key Result
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ===================== Key Result Row =====================

function KeyResultRow({ kr, hook, editable }) {
  const progress = computeKrProgress(kr);
  const statusConfig = getStatusConfig(kr.perfOkrKeyResultStatus, KR_STATUSES);
  const displayValue = kr.perfOkrKeyResultMetricType === "boolean"
    ? (kr.perfOkrKeyResultCurrentValue >= 1 ? "สำเร็จ" : "ยังไม่สำเร็จ")
    : `${kr.perfOkrKeyResultCurrentValue}${kr.perfOkrKeyResultUnit ? ` ${kr.perfOkrKeyResultUnit}` : ""} / ${kr.perfOkrKeyResultTargetValue}${kr.perfOkrKeyResultUnit ? ` ${kr.perfOkrKeyResultUnit}` : ""}`;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-default-50 hover:bg-default-100">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{kr.perfOkrKeyResultTitle}</span>
          <Chip size="md" radius="md" color={statusConfig.color} variant="bordered">
            {statusConfig.label}
          </Chip>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress
            value={progress}
            className="flex-1 max-w-xs"
            size="sm"
            color={progress >= 70 ? "success" : progress >= 40 ? "warning" : "danger"}
          />
          <span className="text-xs text-default-500">{displayValue}</span>
        </div>
      </div>
      {editable && (
        <div className="flex items-center gap-1">
          <Tooltip content="Check-in">
            <Button
              isIconOnly
              size="md"
              radius="md"
              variant="bordered"
              color="primary"
              onPress={() => hook.handleOpenCheckin(kr)}
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="แก้ไข">
            <Button
              isIconOnly
              size="md"
              radius="md"
              variant="bordered"
              onPress={() => hook.handleOpenKrForm(kr.perfOkrKeyResultObjectiveId, kr)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          </Tooltip>
          <Tooltip content="ลบ">
            <Button
              isIconOnly
              size="md"
              radius="md"
              variant="bordered"
              color="danger"
              onPress={() => hook.handleDeleteKr(kr.perfOkrKeyResultId)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// ===================== Objective Modal =====================

function ObjectiveModal({ hook }) {
  const { objectiveModal, editingObjective, objectiveForm, setObjectiveForm, savingObjective, handleSaveObjective } = hook;

  return (
    <Modal isOpen={objectiveModal.isOpen} onClose={objectiveModal.onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          {editingObjective ? "แก้ไข Objective" : "สร้าง Objective ใหม่"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อ Objective"
              placeholder="เช่น เพิ่มยอดขายไตรมาส 1"
              value={objectiveForm.perfOkrObjectiveTitle}
              onValueChange={(v) => setObjectiveForm((f) => ({ ...f, perfOkrObjectiveTitle: v }))}
              isRequired
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <Textarea
              label="รายละเอียด"
              placeholder="อธิบายเป้าหมาย..."
              value={objectiveForm.perfOkrObjectiveDescription}
              onValueChange={(v) => setObjectiveForm((f) => ({ ...f, perfOkrObjectiveDescription: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <div className="flex gap-4">
              <Select
                label="ปี"
                selectedKeys={[objectiveForm.perfOkrObjectiveYear]}
                onSelectionChange={(keys) => setObjectiveForm((f) => ({ ...f, perfOkrObjectiveYear: [...keys][0] }))}
                className="flex-1"
                isDisabled={!!editingObjective}
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y.key}>{y.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="ไตรมาส"
                selectedKeys={[objectiveForm.perfOkrObjectiveQuarter]}
                onSelectionChange={(keys) => setObjectiveForm((f) => ({ ...f, perfOkrObjectiveQuarter: [...keys][0] }))}
                className="flex-1"
                isDisabled={!!editingObjective}
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {QUARTER_OPTIONS.map((q) => (
                  <SelectItem key={q.key}>{q.label}</SelectItem>
                ))}
              </Select>
              <Select
                label="การมองเห็น"
                selectedKeys={[objectiveForm.perfOkrObjectiveVisibility]}
                onSelectionChange={(keys) => setObjectiveForm((f) => ({ ...f, perfOkrObjectiveVisibility: [...keys][0] }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {VISIBILITY_OPTIONS.map((v) => (
                  <SelectItem key={v.key}>{v.label}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={objectiveModal.onClose}>
            ยกเลิก
          </Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={handleSaveObjective}
            isLoading={savingObjective}
            startContent={<Save className="w-4 h-4" />}
          >
            {editingObjective ? "บันทึก" : "สร้าง"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ===================== Key Result Modal =====================

function KrModal({ hook }) {
  const { krModal, editingKr, krForm, setKrForm, savingKr, handleSaveKr } = hook;

  return (
    <Modal isOpen={krModal.isOpen} onClose={krModal.onClose} size="xl">
      <ModalContent>
        <ModalHeader>
          {editingKr ? "แก้ไข Key Result" : "เพิ่ม Key Result"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อ Key Result"
              placeholder="เช่น ปิดการขายใหม่ 10 ราย"
              value={krForm.perfOkrKeyResultTitle}
              onValueChange={(v) => setKrForm((f) => ({ ...f, perfOkrKeyResultTitle: v }))}
              isRequired
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <div className="flex gap-4">
              <Select
                label="ประเภทตัวชี้วัด"
                selectedKeys={[krForm.perfOkrKeyResultMetricType]}
                onSelectionChange={(keys) => setKrForm((f) => ({ ...f, perfOkrKeyResultMetricType: [...keys][0] }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {METRIC_TYPES.map((m) => (
                  <SelectItem key={m.key}>{m.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="หน่วย"
                placeholder="เช่น ราย, บาท"
                value={krForm.perfOkrKeyResultUnit}
                onValueChange={(v) => setKrForm((f) => ({ ...f, perfOkrKeyResultUnit: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
            </div>
            <div className="flex gap-4">
              <Input
                label="ค่าเริ่มต้น"
                type="number"
                value={krForm.perfOkrKeyResultStartValue}
                onValueChange={(v) => setKrForm((f) => ({ ...f, perfOkrKeyResultStartValue: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
              <Input
                label="เป้าหมาย"
                type="number"
                value={krForm.perfOkrKeyResultTargetValue}
                onValueChange={(v) => setKrForm((f) => ({ ...f, perfOkrKeyResultTargetValue: v }))}
                className="flex-1"
                isRequired
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
              <Input
                label="น้ำหนัก"
                type="number"
                value={krForm.perfOkrKeyResultWeight}
                onValueChange={(v) => setKrForm((f) => ({ ...f, perfOkrKeyResultWeight: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={krModal.onClose}>
            ยกเลิก
          </Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={handleSaveKr}
            isLoading={savingKr}
            startContent={<Save className="w-4 h-4" />}
          >
            {editingKr ? "บันทึก" : "เพิ่ม"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ===================== Check-in Modal =====================

function CheckinModal({ hook }) {
  const { checkinModal, checkinKr, checkinValue, setCheckinValue, checkinNote, setCheckinNote, savingCheckin, handleSaveCheckin } = hook;

  if (!checkinKr) return null;

  const displayTarget = `${checkinKr.perfOkrKeyResultTargetValue}${checkinKr.perfOkrKeyResultUnit ? ` ${checkinKr.perfOkrKeyResultUnit}` : ""}`;

  return (
    <Modal isOpen={checkinModal.isOpen} onClose={checkinModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>Check-in: {checkinKr.perfOkrKeyResultTitle}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-default-500">
              เป้าหมาย: <span className="font-semibold">{displayTarget}</span>
              {" | "}ค่าปัจจุบัน: <span className="font-semibold">{checkinKr.perfOkrKeyResultCurrentValue}{checkinKr.perfOkrKeyResultUnit ? ` ${checkinKr.perfOkrKeyResultUnit}` : ""}</span>
            </div>
            <Input
              label="ค่าใหม่"
              type="number"
              value={checkinValue}
              onValueChange={setCheckinValue}
              isRequired
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <Textarea
              label="หมายเหตุ"
              placeholder="อธิบายความคืบหน้า..."
              value={checkinNote}
              onValueChange={setCheckinNote}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={checkinModal.onClose}>
            ยกเลิก
          </Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={handleSaveCheckin}
            isLoading={savingCheckin}
            startContent={<TrendingUp className="w-4 h-4" />}
          >
            บันทึก Check-in
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
