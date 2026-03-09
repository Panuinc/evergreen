"use client";

import { useState, useMemo } from "react";
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
  Switch,
  Divider,
} from "@heroui/react";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Save,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import LineChart from "@/modules/performance/components/LineChart";
import {
  KPI_CATEGORIES,
  KPI_FREQUENCIES,
  KPI_UNITS,
  computeKpiStatus,
  getKpiStatusLabel,
  getKpiStatusColor,
  computeKpiProgress,
  getCategoryLabel,
  getFrequencyLabel,
} from "@/lib/performance/kpiConstants";
import Loading from "@/components/ui/Loading";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

export default function KpiView({
  loading,
  activeTab,
  onTabChange,
  myAssignments,
  loadingAssignments,
  filterYear,
  onFilterYearChange,
  dashboardData,
  loadingDashboard,
  definitions,
  loadingDefinitions,
  employees,
  records,
  loadingRecords,
  onLoadRecords,
  definitionModal,
  editingDefinition,
  definitionForm,
  onDefinitionFormChange,
  savingDefinition,
  onSaveDefinition,
  onOpenDefinitionForm,
  onDeleteDefinition,
  assignmentModal,
  assignForm,
  onAssignFormChange,
  savingAssignment,
  onSaveAssignment,
  onOpenAssignForm,
  recordModal,
  recordingAssignment,
  recordForm,
  onRecordFormChange,
  savingRecord,
  onSaveRecord,
  onOpenRecordForm,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div>
        <p className="text-sm font-light">KPI (Key Performance Indicators)</p>
        <p className="text-muted-foreground text-sm">
          วัดผลงานด้วยตัวชี้วัด ติดตามแนวโน้ม และจัดการ KPI ทั้งองค์กร
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
          key="myKpi"
          title={
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>KPI ของฉัน</span>
            </div>
          }
        >
          <MyKpiTab
            myAssignments={myAssignments}
            loadingAssignments={loadingAssignments}
            filterYear={filterYear}
            onFilterYearChange={onFilterYearChange}
            loadingRecords={loadingRecords}
            onLoadRecords={onLoadRecords}
            onOpenRecordForm={onOpenRecordForm}
          />
        </Tab>
        <Tab
          key="dashboard"
          title={
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </div>
          }
        >
          <DashboardTab
            dashboardData={dashboardData}
            loadingDashboard={loadingDashboard}
            filterYear={filterYear}
            onFilterYearChange={onFilterYearChange}
          />
        </Tab>
        <Tab
          key="manage"
          title={
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>จัดการ KPI</span>
            </div>
          }
        >
          <ManageTab
            definitions={definitions}
            loadingDefinitions={loadingDefinitions}
            onOpenDefinitionForm={onOpenDefinitionForm}
            onOpenAssignForm={onOpenAssignForm}
            onDeleteDefinition={onDeleteDefinition}
          />
        </Tab>
      </Tabs>

      <DefinitionModal
        definitionModal={definitionModal}
        editingDefinition={editingDefinition}
        definitionForm={definitionForm}
        onDefinitionFormChange={onDefinitionFormChange}
        savingDefinition={savingDefinition}
        onSaveDefinition={onSaveDefinition}
      />
      <AssignmentModal
        assignmentModal={assignmentModal}
        assignForm={assignForm}
        onAssignFormChange={onAssignFormChange}
        savingAssignment={savingAssignment}
        onSaveAssignment={onSaveAssignment}
        definitions={definitions}
        employees={employees}
      />
      <RecordModal
        recordModal={recordModal}
        recordingAssignment={recordingAssignment}
        recordForm={recordForm}
        onRecordFormChange={onRecordFormChange}
        savingRecord={savingRecord}
        onSaveRecord={onSaveRecord}
      />
    </div>
  );
}

// ===================== My KPI Tab =====================

function MyKpiTab({
  myAssignments,
  loadingAssignments,
  filterYear,
  onFilterYearChange,
  loadingRecords,
  onLoadRecords,
  onOpenRecordForm,
}) {
  const [selectedTrend, setSelectedTrend] = useState(null);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
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
      </div>

      {loadingAssignments ? (
        <div className="flex justify-center py-8"><Loading /></div>
      ) : myAssignments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มี KPI ที่ถูก assign ให้คุณในปีนี้
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="ตามเป้า"
              count={myAssignments.filter((a) => a.status === "success").length}
              total={myAssignments.length}
              color="success"
            />
            <SummaryCard
              label="ใกล้เป้า"
              count={myAssignments.filter((a) => a.status === "warning").length}
              total={myAssignments.length}
              color="warning"
            />
            <SummaryCard
              label="ต่ำกว่าเป้า"
              count={myAssignments.filter((a) => a.status === "danger").length}
              total={myAssignments.length}
              color="danger"
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssignments.map((a) => (
              <KpiCard
                key={a.assignmentId}
                assignment={a}
                onRecord={() => onOpenRecordForm(a)}
                onTrend={() => {
                  setSelectedTrend(a);
                  onLoadRecords(a.assignmentId);
                }}
              />
            ))}
          </div>

          {/* Trend chart */}
          {selectedTrend && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <p className="text-sm font-light">
                    แนวโน้ม: {selectedTrend.definition?.perfKpiDefinitionName}
                  </p>
                  <Button size="md" radius="md" variant="bordered" onPress={() => setSelectedTrend(null)}>
                    ปิด
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {loadingRecords ? (
                  <div className="flex justify-center py-8"><Loading /></div>
                ) : (
                  <LineChart
                    data={(selectedTrend.records || []).map((r) => ({
                      period: r.perfKpiRecordPeriodLabel,
                      actual: r.perfKpiRecordActualValue,
                      target: selectedTrend.targetValue,
                    }))}
                    lines={[
                      { dataKey: "actual", name: "ค่าจริง", color: "#3b82f6" },
                      { dataKey: "target", name: "เป้าหมาย", color: "#ef4444" },
                    ]}
                    height={250}
                  />
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, count, total, color }) {
  return (
    <Card>
      <CardBody className="flex flex-row items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-sm font-light">{count}</p>
        </div>
        <Chip color={color} variant="flat" size="md" radius="md">
          {total > 0 ? Math.round((count / total) * 100) : 0}%
        </Chip>
      </CardBody>
    </Card>
  );
}

function KpiCard({ assignment, onRecord, onTrend }) {
  const def = assignment.definition || {};
  const status = assignment.status;
  const statusLabel = getKpiStatusLabel(status);
  const statusColor = getKpiStatusColor(status);
  const progress = assignment.latestValue != null
    ? computeKpiProgress(assignment.latestValue, assignment.targetValue, def.perfKpiDefinitionHigherIsBetter !== false)
    : 0;

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-light">{def.perfKpiDefinitionName}</p>
            <p className="text-sm text-muted-foreground">
              {getCategoryLabel(def.perfKpiDefinitionCategory)} | {getFrequencyLabel(def.perfKpiDefinitionFrequency)}
            </p>
          </div>
          <Chip size="md" radius="md" color={statusColor} variant="flat">
            {statusLabel}
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-light">
            {assignment.latestValue != null ? assignment.latestValue : "-"}
          </span>
          <span className="text-sm text-muted-foreground">
            / {assignment.targetValue} {def.perfKpiDefinitionUnit}
          </span>
        </div>

        <Progress
          value={progress}
          color={statusColor}
          size="md"
          className="w-full"
        />

        <div className="flex gap-2">
          <Button size="md" radius="md" color="primary" variant="flat" onPress={onRecord} startContent={<Plus className="w-3 h-3" />}>
            บันทึกค่า
          </Button>
          <Button size="md" radius="md" variant="bordered" onPress={onTrend} startContent={<TrendingUp className="w-3 h-3" />}>
            แนวโน้ม
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ===================== Dashboard Tab =====================

function DashboardTab({
  dashboardData,
  loadingDashboard,
  filterYear,
  onFilterYearChange,
}) {
  const [selectedKpi, setSelectedKpi] = useState(null);

  // Group dashboard data by definition
  const grouped = useMemo(() => {
    const map = {};
    for (const item of dashboardData) {
      const defId = item.definitionId;
      if (!map[defId]) {
        map[defId] = { definition: item.definition, employees: [] };
      }
      map[defId].employees.push(item);
    }
    return Object.values(map);
  }, [dashboardData]);

  return (
    <div className="flex flex-col gap-4 mt-4">
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

      {loadingDashboard ? (
        <div className="flex justify-center py-8"><Loading /></div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มีข้อมูล KPI ในปีนี้
          </CardBody>
        </Card>
      ) : (
        grouped.map((group) => {
          const def = group.definition || {};
          const successCount = group.employees.filter((e) => e.status === "success").length;
          const total = group.employees.length;

          return (
            <Card key={def.perfKpiDefinitionId}>
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="font-light">{def.perfKpiDefinitionName}</p>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryLabel(def.perfKpiDefinitionCategory)} | {def.perfKpiDefinitionUnit} | {getFrequencyLabel(def.perfKpiDefinitionFrequency)}
                    </p>
                  </div>
                  <Chip size="md" radius="md" color={successCount === total ? "success" : "warning"} variant="flat">
                    {successCount}/{total} ตามเป้า
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-2">
                  {group.employees.map((emp) => {
                    const empName = emp.employee
                      ? `${emp.employee.hrEmployeeFirstName} ${emp.employee.hrEmployeeLastName}`
                      : emp.hrEmployeeId;
                    return (
                      <div key={emp.assignmentId} className="flex items-center gap-3 p-2 rounded-lg bg-default-50">
                        <span className="text-sm min-w-[150px]">{empName}</span>
                        <Progress
                          value={emp.latestValue != null ? computeKpiProgress(emp.latestValue, emp.targetValue, def.perfKpiDefinitionHigherIsBetter !== false) : 0}
                          color={getKpiStatusColor(emp.status)}
                          size="sm"
                          className="flex-1"
                        />
                        <span className="text-sm min-w-[80px] text-right">
                          {emp.latestValue != null ? `${emp.latestValue} / ${emp.targetValue}` : "-"}
                        </span>
                        <Chip size="md" radius="md" color={getKpiStatusColor(emp.status)} variant="flat">
                          {getKpiStatusLabel(emp.status)}
                        </Chip>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ===================== Manage Tab =====================

function ManageTab({
  definitions,
  loadingDefinitions,
  onOpenDefinitionForm,
  onOpenAssignForm,
  onDeleteDefinition,
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-light">KPI Definitions</p>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => onOpenDefinitionForm()}
        >
          สร้าง KPI
        </Button>
      </div>

      {loadingDefinitions ? (
        <div className="flex justify-center py-8"><Loading /></div>
      ) : definitions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มี KPI — กดปุ่ม "สร้าง KPI" เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {definitions.map((def) => (
            <Card key={def.perfKpiDefinitionId}>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-light">{def.perfKpiDefinitionName}</p>
                    <Chip size="md" radius="md" variant="flat">{getCategoryLabel(def.perfKpiDefinitionCategory)}</Chip>
                    <Chip size="md" radius="md" variant="flat">{def.perfKpiDefinitionUnit}</Chip>
                    <Chip size="md" radius="md" variant="flat">{getFrequencyLabel(def.perfKpiDefinitionFrequency)}</Chip>
                    {!def.perfKpiDefinitionIsActive && <Chip size="md" radius="md" color="danger" variant="flat">ปิดใช้งาน</Chip>}
                  </div>
                  {def.perfKpiDefinitionDescription && <p className="text-sm text-muted-foreground mt-1">{def.perfKpiDefinitionDescription}</p>}
                  <p className="text-sm text-muted-foreground mt-1">
                    เป้าหมาย: {def.perfKpiDefinitionTargetValue ?? "-"} | เตือน: {def.perfKpiDefinitionWarningThreshold ?? "-"} | {def.perfKpiDefinitionHigherIsBetter ? "ยิ่งสูงยิ่งดี" : "ยิ่งต่ำยิ่งดี"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Tooltip content="Assign ให้พนักงาน">
                    <Button isIconOnly size="md" radius="md" variant="flat" color="primary" onPress={() => onOpenAssignForm(def.perfKpiDefinitionId)}>
                      <Users className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="แก้ไข">
                    <Button isIconOnly size="md" radius="md" variant="bordered" onPress={() => onOpenDefinitionForm(def)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="ลบ">
                    <Button isIconOnly size="md" radius="md" variant="bordered" color="danger" onPress={() => onDeleteDefinition(def.perfKpiDefinitionId)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== Modals =====================

function DefinitionModal({
  definitionModal,
  editingDefinition,
  definitionForm,
  onDefinitionFormChange,
  savingDefinition,
  onSaveDefinition,
}) {
  return (
    <Modal isOpen={definitionModal.isOpen} onClose={definitionModal.onClose} size="2xl">
      <ModalContent>
        <ModalHeader>{editingDefinition ? "แก้ไข KPI" : "สร้าง KPI ใหม่"}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อ KPI"
              placeholder="เช่น อัตราความพึงพอใจลูกค้า"
              value={definitionForm.perfKpiDefinitionName}
              onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionName: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Textarea
              label="รายละเอียด"
              placeholder="อธิบาย KPI..."
              value={definitionForm.perfKpiDefinitionDescription}
              onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionDescription: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <div className="flex gap-4">
              <Select
                label="หมวดหมู่"
                selectedKeys={[definitionForm.perfKpiDefinitionCategory]}
                onSelectionChange={(keys) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionCategory: [...keys][0] }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {KPI_CATEGORIES.map((c) => (
                  <SelectItem key={c.key}>{c.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="หน่วย"
                placeholder="%, บาท, ชิ้น"
                value={definitionForm.perfKpiDefinitionUnit}
                onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionUnit: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                isRequired
              />
              <Select
                label="ความถี่"
                selectedKeys={[definitionForm.perfKpiDefinitionFrequency]}
                onSelectionChange={(keys) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionFrequency: [...keys][0] }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              >
                {KPI_FREQUENCIES.map((f) => (
                  <SelectItem key={f.key}>{f.label}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="flex gap-4">
              <Input
                label="เป้าหมาย"
                type="number"
                value={definitionForm.perfKpiDefinitionTargetValue}
                onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionTargetValue: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
              <Input
                label="เกณฑ์เตือน"
                type="number"
                value={definitionForm.perfKpiDefinitionWarningThreshold}
                onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionWarningThreshold: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
            </div>
            <Switch
              isSelected={definitionForm.perfKpiDefinitionHigherIsBetter}
              onValueChange={(v) => onDefinitionFormChange((f) => ({ ...f, perfKpiDefinitionHigherIsBetter: v }))}
            >
              {definitionForm.perfKpiDefinitionHigherIsBetter ? "ยิ่งสูงยิ่งดี" : "ยิ่งต่ำยิ่งดี"}
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={definitionModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={onSaveDefinition} isLoading={savingDefinition} startContent={<Save className="w-4 h-4" />}>
            {editingDefinition ? "บันทึก" : "สร้าง"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AssignmentModal({
  assignmentModal,
  assignForm,
  onAssignFormChange,
  savingAssignment,
  onSaveAssignment,
  definitions,
  employees,
}) {
  const activeEmployees = employees.filter((e) => e.isActive);

  return (
    <Modal isOpen={assignmentModal.isOpen} onClose={assignmentModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>Assign KPI ให้พนักงาน</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Select
              label="KPI"
              selectedKeys={assignForm.perfKpiAssignmentDefinitionId ? [assignForm.perfKpiAssignmentDefinitionId] : []}
              onSelectionChange={(keys) => {
                const id = [...keys][0];
                onAssignFormChange((f) => ({ ...f, perfKpiAssignmentDefinitionId: id }));
                const def = definitions.find((d) => d.perfKpiDefinitionId === id);
                if (def?.perfKpiDefinitionTargetValue) onAssignFormChange((f) => ({ ...f, perfKpiAssignmentTargetValue: String(def.perfKpiDefinitionTargetValue) }));
              }}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            >
              {definitions.map((d) => (
                <SelectItem key={d.perfKpiDefinitionId}>{d.perfKpiDefinitionName} ({d.perfKpiDefinitionUnit})</SelectItem>
              ))}
            </Select>
            <Select
              label="พนักงาน"
              selectedKeys={assignForm.perfKpiAssignmentEmployeeId ? [assignForm.perfKpiAssignmentEmployeeId] : []}
              onSelectionChange={(keys) => onAssignFormChange((f) => ({ ...f, perfKpiAssignmentEmployeeId: [...keys][0] }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.hrEmployeeId}>
                  {e.hrEmployeeFirstName} {e.hrEmployeeLastName} — {e.hrEmployeeDepartment}
                </SelectItem>
              ))}
            </Select>
            <div className="flex gap-4">
              <Input
                label="เป้าหมาย"
                type="number"
                value={assignForm.perfKpiAssignmentTargetValue}
                onValueChange={(v) => onAssignFormChange((f) => ({ ...f, perfKpiAssignmentTargetValue: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                isRequired
              />
              <Input
                label="น้ำหนัก"
                type="number"
                value={assignForm.perfKpiAssignmentWeight}
                onValueChange={(v) => onAssignFormChange((f) => ({ ...f, perfKpiAssignmentWeight: v }))}
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
          <Button variant="bordered" size="md" radius="md" onPress={assignmentModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={onSaveAssignment} isLoading={savingAssignment}>
            Assign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RecordModal({
  recordModal,
  recordingAssignment,
  recordForm,
  onRecordFormChange,
  savingRecord,
  onSaveRecord,
}) {
  if (!recordingAssignment) return null;

  const def = recordingAssignment.definition || {};

  return (
    <Modal isOpen={recordModal.isOpen} onClose={recordModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>บันทึกค่า: {def.perfKpiDefinitionName}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              เป้าหมาย: <span className="font-light">{recordingAssignment.targetValue} {def.perfKpiDefinitionUnit}</span>
              {recordingAssignment.latestValue != null && (
                <> | ค่าล่าสุด: <span className="font-light">{recordingAssignment.latestValue} {def.perfKpiDefinitionUnit}</span></>
              )}
            </div>
            <Input
              label="ช่วงเวลา"
              placeholder="เช่น 2026-01"
              value={recordForm.perfKpiRecordPeriodLabel}
              onValueChange={(v) => onRecordFormChange((f) => ({ ...f, perfKpiRecordPeriodLabel: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Input
              label={`ค่าจริง (${def.perfKpiDefinitionUnit})`}
              type="number"
              value={recordForm.perfKpiRecordActualValue}
              onValueChange={(v) => onRecordFormChange((f) => ({ ...f, perfKpiRecordActualValue: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Textarea
              label="หมายเหตุ"
              placeholder="หมายเหตุเพิ่มเติม..."
              value={recordForm.perfKpiRecordNote}
              onValueChange={(v) => onRecordFormChange((f) => ({ ...f, perfKpiRecordNote: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={recordModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={onSaveRecord} isLoading={savingRecord} startContent={<Save className="w-4 h-4" />}>
            บันทึก
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
