"use client";

import { useState, useCallback } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Button,
  Progress,
  Chip,  Modal,
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
import {
  OKR_STATUSES,
  KR_STATUSES,
  METRIC_TYPES,
  VISIBILITY_OPTIONS,
  QUARTER_OPTIONS,
  getStatusConfig,
  computeKrProgress,
} from "@/lib/performance/okrConstants";
import Loading from "@/components/ui/Loading";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

function PeriodFilter({ filterYear, onFilterYearChange, filterQuarter, onFilterQuarterChange }) {
  return (
    <div className="flex gap-2 items-center">
      <Select
        label="ปี"
        selectedKeys={[filterYear]}
        onSelectionChange={(keys) => onFilterYearChange([...keys][0])}
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
        selectedKeys={[filterQuarter]}
        onSelectionChange={(keys) => onFilterQuarterChange([...keys][0])}
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

function MyOkrTab({
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  objectives,
  loadingObjectives,
  onOpenObjectiveForm,
  onDeleteObjective,
  onUpdateObjectiveStatus,
  onOpenKrForm,
  onDeleteKr,
  onOpenCheckin,
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <PeriodFilter
          filterYear={filterYear}
          onFilterYearChange={onFilterYearChange}
          filterQuarter={filterQuarter}
          onFilterQuarterChange={onFilterQuarterChange}
        />
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => onOpenObjectiveForm()}
        >
          สร้าง Objective
        </Button>
      </div>

      {loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : objectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มี OKR ในช่วงเวลานี้ — กดปุ่ม &quot;สร้าง Objective&quot; เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        objectives.map((obj) => (
          <ObjectiveCard
            key={obj.perfOkrObjectiveId}
            objective={obj}
            editable
            onOpenObjectiveForm={onOpenObjectiveForm}
            onDeleteObjective={onDeleteObjective}
            onUpdateObjectiveStatus={onUpdateObjectiveStatus}
            onOpenKrForm={onOpenKrForm}
            onDeleteKr={onDeleteKr}
            onOpenCheckin={onOpenCheckin}
          />
        ))
      )}
    </div>
  );
}

function TeamOkrTab({
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  teamObjectives,
  loadingObjectives,
  onOpenObjectiveForm,
  onDeleteObjective,
  onUpdateObjectiveStatus,
  onOpenKrForm,
  onDeleteKr,
  onOpenCheckin,
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <PeriodFilter
        filterYear={filterYear}
        onFilterYearChange={onFilterYearChange}
        filterQuarter={filterQuarter}
        onFilterQuarterChange={onFilterQuarterChange}
      />

      {loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : teamObjectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มี OKR ระดับทีมในช่วงเวลานี้
          </CardBody>
        </Card>
      ) : (
        teamObjectives.map((obj) => (
          <ObjectiveCard
            key={obj.perfOkrObjectiveId}
            objective={obj}
            showOwner
            onOpenObjectiveForm={onOpenObjectiveForm}
            onDeleteObjective={onDeleteObjective}
            onUpdateObjectiveStatus={onUpdateObjectiveStatus}
            onOpenKrForm={onOpenKrForm}
            onDeleteKr={onDeleteKr}
            onOpenCheckin={onOpenCheckin}
          />
        ))
      )}
    </div>
  );
}

function CompanyOkrTab({
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  companyObjectives,
  loadingObjectives,
  onOpenObjectiveForm,
  onDeleteObjective,
  onUpdateObjectiveStatus,
  onOpenKrForm,
  onDeleteKr,
  onOpenCheckin,
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <PeriodFilter
        filterYear={filterYear}
        onFilterYearChange={onFilterYearChange}
        filterQuarter={filterQuarter}
        onFilterQuarterChange={onFilterQuarterChange}
      />

      {loadingObjectives ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : companyObjectives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มี OKR ระดับบริษัทในช่วงเวลานี้
          </CardBody>
        </Card>
      ) : (
        companyObjectives.map((obj) => (
          <ObjectiveCard
            key={obj.perfOkrObjectiveId}
            objective={obj}
            showOwner
            onOpenObjectiveForm={onOpenObjectiveForm}
            onDeleteObjective={onDeleteObjective}
            onUpdateObjectiveStatus={onUpdateObjectiveStatus}
            onOpenKrForm={onOpenKrForm}
            onDeleteKr={onDeleteKr}
            onOpenCheckin={onOpenCheckin}
          />
        ))
      )}
    </div>
  );
}

function ObjectiveCard({
  objective,
  editable = false,
  showOwner = false,
  onOpenObjectiveForm,
  onDeleteObjective,
  onUpdateObjectiveStatus,
  onOpenKrForm,
  onDeleteKr,
  onOpenCheckin,
}) {
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
              <p className="text-xs font-light">{objective.perfOkrObjectiveTitle}</p>
              <Chip size="md" radius="md" color={statusConfig.color} variant="flat">
                {statusConfig.label}
              </Chip>
              <Chip size="md" radius="md" variant="flat">
                {objective.perfOkrObjectivePeriod}
              </Chip>
            </div>
            {showOwner && ownerName && (
              <p className="text-xs text-muted-foreground">{ownerName} — {objective.employee?.hrEmployeeDepartment}</p>
            )}
            {objective.perfOkrObjectiveDescription && (
              <p className="text-xs text-muted-foreground">{objective.perfOkrObjectiveDescription}</p>
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
                    variant="flat"
                    onPress={() => onOpenObjectiveForm(objective)}
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
                      onPress={() => onUpdateObjectiveStatus(objective.perfOkrObjectiveId, "active")}
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
                      onPress={() => onUpdateObjectiveStatus(objective.perfOkrObjectiveId, "completed")}
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
                    onPress={() => onDeleteObjective(objective.perfOkrObjectiveId)}
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
          <span className="text-xs font-light min-w-[50px] text-right">
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
              <KeyResultRow
                key={kr.perfOkrKeyResultId}
                kr={kr}
                editable={editable}
                onOpenCheckin={onOpenCheckin}
                onOpenKrForm={onOpenKrForm}
                onDeleteKr={onDeleteKr}
              />
            ))}
            {editable && (
              <Button
                size="md"
                radius="md"
                variant="bordered"
                color="primary"
                startContent={<Plus className="w-3 h-3" />}
                className="self-start"
                onPress={() => onOpenKrForm(objective.perfOkrObjectiveId)}
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

function KeyResultRow({ kr, editable, onOpenCheckin, onOpenKrForm, onDeleteKr }) {
  const progress = computeKrProgress(kr);
  const statusConfig = getStatusConfig(kr.perfOkrKeyResultStatus, KR_STATUSES);
  const displayValue = kr.perfOkrKeyResultMetricType === "boolean"
    ? (kr.perfOkrKeyResultCurrentValue >= 1 ? "สำเร็จ" : "ยังไม่สำเร็จ")
    : `${kr.perfOkrKeyResultCurrentValue}${kr.perfOkrKeyResultUnit ? ` ${kr.perfOkrKeyResultUnit}` : ""} / ${kr.perfOkrKeyResultTargetValue}${kr.perfOkrKeyResultUnit ? ` ${kr.perfOkrKeyResultUnit}` : ""}`;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-default-50 hover:bg-default-100">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-light">{kr.perfOkrKeyResultTitle}</span>
          <Chip size="md" radius="md" color={statusConfig.color} variant="flat">
            {statusConfig.label}
          </Chip>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress
            value={progress}
            className="flex-1 max-w-xs"
            size="md"
            color={progress >= 70 ? "success" : progress >= 40 ? "warning" : "danger"}
          />
          <span className="text-xs text-muted-foreground">{displayValue}</span>
        </div>
      </div>
      {editable && (
        <div className="flex items-center gap-1">
          <Tooltip content="Check-in">
            <Button
              isIconOnly
              size="md"
              radius="md"
              variant="flat"
              color="primary"
              onPress={() => onOpenCheckin(kr)}
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
              onPress={() => onOpenKrForm(kr.perfOkrKeyResultObjectiveId, kr)}
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
              onPress={() => onDeleteKr(kr.perfOkrKeyResultId)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

function ObjectiveModal({
  objectiveModal,
  editingObjective,
  objectiveForm,
  onObjectiveFormChange,
  savingObjective,
  onSaveObjective,
}) {
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
              onValueChange={(v) => onObjectiveFormChange((f) => ({ ...f, perfOkrObjectiveTitle: v }))}
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
              onValueChange={(v) => onObjectiveFormChange((f) => ({ ...f, perfOkrObjectiveDescription: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <div className="flex gap-4">
              <Select
                label="ปี"
                selectedKeys={[objectiveForm.perfOkrObjectiveYear]}
                onSelectionChange={(keys) => onObjectiveFormChange((f) => ({ ...f, perfOkrObjectiveYear: [...keys][0] }))}
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
                onSelectionChange={(keys) => onObjectiveFormChange((f) => ({ ...f, perfOkrObjectiveQuarter: [...keys][0] }))}
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
                onSelectionChange={(keys) => onObjectiveFormChange((f) => ({ ...f, perfOkrObjectiveVisibility: [...keys][0] }))}
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
            onPress={onSaveObjective}
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

function KrModal({
  krModal,
  editingKr,
  krForm,
  onKrFormChange,
  savingKr,
  onSaveKr,
}) {
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
              onValueChange={(v) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultTitle: v }))}
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
                onSelectionChange={(keys) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultMetricType: [...keys][0] }))}
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
                onValueChange={(v) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultUnit: v }))}
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
                onValueChange={(v) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultStartValue: v }))}
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
                onValueChange={(v) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultTargetValue: v }))}
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
                onValueChange={(v) => onKrFormChange((f) => ({ ...f, perfOkrKeyResultWeight: v }))}
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
            onPress={onSaveKr}
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

function CheckinModal({
  checkinModal,
  checkinKr,
  checkinValue,
  onCheckinValueChange,
  checkinNote,
  onCheckinNoteChange,
  savingCheckin,
  onSaveCheckin,
}) {
  if (!checkinKr) return null;

  const displayTarget = `${checkinKr.perfOkrKeyResultTargetValue}${checkinKr.perfOkrKeyResultUnit ? ` ${checkinKr.perfOkrKeyResultUnit}` : ""}`;

  return (
    <Modal isOpen={checkinModal.isOpen} onClose={checkinModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>Check-in: {checkinKr.perfOkrKeyResultTitle}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted-foreground">
              เป้าหมาย: <span className="font-light">{displayTarget}</span>
              {" | "}ค่าปัจจุบัน: <span className="font-light">{checkinKr.perfOkrKeyResultCurrentValue}{checkinKr.perfOkrKeyResultUnit ? ` ${checkinKr.perfOkrKeyResultUnit}` : ""}</span>
            </div>
            <Input
              label="ค่าใหม่"
              type="number"
              value={checkinValue}
              onValueChange={onCheckinValueChange}
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
              onValueChange={onCheckinNoteChange}
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
            onPress={onSaveCheckin}
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

export default function OkrView({
  activeTab,
  onTabChange,
  filterYear,
  onFilterYearChange,
  filterQuarter,
  onFilterQuarterChange,
  objectives,
  teamObjectives,
  companyObjectives,
  loadingObjectives,
  objectiveModal,
  editingObjective,
  objectiveForm,
  onObjectiveFormChange,
  savingObjective,
  onSaveObjective,
  onOpenObjectiveForm,
  onDeleteObjective,
  onUpdateObjectiveStatus,
  krModal,
  editingKr,
  krForm,
  onKrFormChange,
  savingKr,
  onSaveKr,
  onOpenKrForm,
  onDeleteKr,
  checkinModal,
  checkinKr,
  checkinValue,
  onCheckinValueChange,
  checkinNote,
  onCheckinNoteChange,
  savingCheckin,
  onSaveCheckin,
  onOpenCheckin,
}) {

  const periodFilterProps = {
    filterYear,
    onFilterYearChange,
    filterQuarter,
    onFilterQuarterChange,
  };


  const objectiveActionProps = {
    onOpenObjectiveForm,
    onDeleteObjective,
    onUpdateObjectiveStatus,
    onOpenKrForm,
    onDeleteKr,
    onOpenCheckin,
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div>
        <p className="text-xs font-light">OKR (Objectives & Key Results)</p>
        <p className="text-muted-foreground text-xs">
          ตั้งเป้าหมายและติดตามความคืบหน้าด้วย Key Results
        </p>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={onTabChange}
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
          <MyOkrTab
            {...periodFilterProps}
            {...objectiveActionProps}
            objectives={objectives}
            loadingObjectives={loadingObjectives}
          />
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
          <TeamOkrTab
            {...periodFilterProps}
            {...objectiveActionProps}
            teamObjectives={teamObjectives}
            loadingObjectives={loadingObjectives}
          />
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
          <CompanyOkrTab
            {...periodFilterProps}
            {...objectiveActionProps}
            companyObjectives={companyObjectives}
            loadingObjectives={loadingObjectives}
          />
        </Tab>
      </Tabs>

      {}
      <ObjectiveModal
        objectiveModal={objectiveModal}
        editingObjective={editingObjective}
        objectiveForm={objectiveForm}
        onObjectiveFormChange={onObjectiveFormChange}
        savingObjective={savingObjective}
        onSaveObjective={onSaveObjective}
      />
      {}
      <KrModal
        krModal={krModal}
        editingKr={editingKr}
        krForm={krForm}
        onKrFormChange={onKrFormChange}
        savingKr={savingKr}
        onSaveKr={onSaveKr}
      />
      {}
      <CheckinModal
        checkinModal={checkinModal}
        checkinKr={checkinKr}
        checkinValue={checkinValue}
        onCheckinValueChange={onCheckinValueChange}
        checkinNote={checkinNote}
        onCheckinNoteChange={onCheckinNoteChange}
        savingCheckin={savingCheckin}
        onSaveCheckin={onSaveCheckin}
      />
    </div>
  );
}
