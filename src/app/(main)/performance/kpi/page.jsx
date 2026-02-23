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
import { useKpi } from "@/hooks/useKpi";
import LineChart from "@/components/charts/LineChart";
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
} from "@/lib/kpiConstants";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

export default function KpiPage() {
  const hook = useKpi();

  if (hook.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4 p-2">
      <div>
        <h1 className="text-2xl font-bold">KPI (Key Performance Indicators)</h1>
        <p className="text-default-500 text-sm">
          วัดผลงานด้วยตัวชี้วัด ติดตามแนวโน้ม และจัดการ KPI ทั้งองค์กร
        </p>
      </div>

      <Tabs
        selectedKey={hook.activeTab}
        onSelectionChange={hook.setActiveTab}
        variant="solid"
        color="primary"
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
          <MyKpiTab hook={hook} />
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
          <DashboardTab hook={hook} />
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
          <ManageTab hook={hook} />
        </Tab>
      </Tabs>

      <DefinitionModal hook={hook} />
      <AssignmentModal hook={hook} />
      <RecordModal hook={hook} />
    </div>
  );
}

// ===================== My KPI Tab =====================

function MyKpiTab({ hook }) {
  const [selectedTrend, setSelectedTrend] = useState(null);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
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
      </div>

      {hook.loadingAssignments ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : hook.myAssignments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มี KPI ที่ถูก assign ให้คุณในปีนี้
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="ตามเป้า"
              count={hook.myAssignments.filter((a) => a.status === "success").length}
              total={hook.myAssignments.length}
              color="success"
            />
            <SummaryCard
              label="ใกล้เป้า"
              count={hook.myAssignments.filter((a) => a.status === "warning").length}
              total={hook.myAssignments.length}
              color="warning"
            />
            <SummaryCard
              label="ต่ำกว่าเป้า"
              count={hook.myAssignments.filter((a) => a.status === "danger").length}
              total={hook.myAssignments.length}
              color="danger"
            />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hook.myAssignments.map((a) => (
              <KpiCard
                key={a.assignmentId}
                assignment={a}
                onRecord={() => hook.handleOpenRecordForm(a)}
                onTrend={() => {
                  setSelectedTrend(a);
                  hook.loadRecords(a.assignmentId);
                }}
              />
            ))}
          </div>

          {/* Trend chart */}
          {selectedTrend && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-lg font-semibold">
                    แนวโน้ม: {selectedTrend.definition?.name}
                  </h3>
                  <Button size="md" radius="md" variant="light" onPress={() => setSelectedTrend(null)}>
                    ปิด
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {hook.loadingRecords ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : (
                  <LineChart
                    data={(selectedTrend.records || []).map((r) => ({
                      period: r.periodLabel,
                      actual: r.actualValue,
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
          <p className="text-sm text-default-500">{label}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        <Chip color={color} variant="flat" size="lg">
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
    ? computeKpiProgress(assignment.latestValue, assignment.targetValue, def.higherIsBetter !== false)
    : 0;

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{def.name}</h4>
            <p className="text-xs text-default-400">
              {getCategoryLabel(def.category)} | {getFrequencyLabel(def.frequency)}
            </p>
          </div>
          <Chip size="sm" color={statusColor} variant="flat">
            {statusLabel}
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {assignment.latestValue != null ? assignment.latestValue : "-"}
          </span>
          <span className="text-sm text-default-400">
            / {assignment.targetValue} {def.unit}
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
          <Button size="md" radius="md" variant="light" onPress={onTrend} startContent={<TrendingUp className="w-3 h-3" />}>
            แนวโน้ม
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ===================== Dashboard Tab =====================

function DashboardTab({ hook }) {
  const [selectedKpi, setSelectedKpi] = useState(null);

  // Group dashboard data by definition
  const grouped = useMemo(() => {
    const map = {};
    for (const item of hook.dashboardData) {
      const defId = item.definitionId;
      if (!map[defId]) {
        map[defId] = { definition: item.definition, employees: [] };
      }
      map[defId].employees.push(item);
    }
    return Object.values(map);
  }, [hook.dashboardData]);

  return (
    <div className="flex flex-col gap-4 mt-4">
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

      {hook.loadingDashboard ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มีข้อมูล KPI ในปีนี้
          </CardBody>
        </Card>
      ) : (
        grouped.map((group) => {
          const def = group.definition || {};
          const successCount = group.employees.filter((e) => e.status === "success").length;
          const total = group.employees.length;

          return (
            <Card key={def.id}>
              <CardHeader className="pb-1">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="font-semibold">{def.name}</h3>
                    <p className="text-xs text-default-400">
                      {getCategoryLabel(def.category)} | {def.unit} | {getFrequencyLabel(def.frequency)}
                    </p>
                  </div>
                  <Chip color={successCount === total ? "success" : "warning"} variant="flat">
                    {successCount}/{total} ตามเป้า
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-2">
                  {group.employees.map((emp) => {
                    const empName = emp.employee
                      ? `${emp.employee.employeeFirstName} ${emp.employee.employeeLastName}`
                      : emp.employeeId;
                    return (
                      <div key={emp.assignmentId} className="flex items-center gap-3 p-2 rounded-lg bg-default-50">
                        <span className="text-sm min-w-[150px]">{empName}</span>
                        <Progress
                          value={emp.latestValue != null ? computeKpiProgress(emp.latestValue, emp.targetValue, def.higherIsBetter !== false) : 0}
                          color={getKpiStatusColor(emp.status)}
                          size="sm"
                          className="flex-1"
                        />
                        <span className="text-sm min-w-[80px] text-right">
                          {emp.latestValue != null ? `${emp.latestValue} / ${emp.targetValue}` : "-"}
                        </span>
                        <Chip size="sm" color={getKpiStatusColor(emp.status)} variant="flat">
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

function ManageTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">KPI Definitions</h3>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => hook.handleOpenDefinitionForm()}
        >
          สร้าง KPI
        </Button>
      </div>

      {hook.loadingDefinitions ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : hook.definitions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มี KPI — กดปุ่ม "สร้าง KPI" เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {hook.definitions.map((def) => (
            <Card key={def.id}>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{def.name}</h4>
                    <Chip size="sm" variant="flat">{getCategoryLabel(def.category)}</Chip>
                    <Chip size="sm" variant="bordered">{def.unit}</Chip>
                    <Chip size="sm" variant="bordered">{getFrequencyLabel(def.frequency)}</Chip>
                    {!def.isActive && <Chip size="sm" color="danger" variant="flat">ปิดใช้งาน</Chip>}
                  </div>
                  {def.description && <p className="text-xs text-default-400 mt-1">{def.description}</p>}
                  <p className="text-xs text-default-500 mt-1">
                    เป้าหมาย: {def.targetValue ?? "-"} | เตือน: {def.warningThreshold ?? "-"} | {def.higherIsBetter ? "ยิ่งสูงยิ่งดี" : "ยิ่งต่ำยิ่งดี"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Tooltip content="Assign ให้พนักงาน">
                    <Button isIconOnly size="md" radius="md" variant="light" color="primary" onPress={() => hook.handleOpenAssignForm(def.id)}>
                      <Users className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="แก้ไข">
                    <Button isIconOnly size="md" radius="md" variant="light" onPress={() => hook.handleOpenDefinitionForm(def)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="ลบ">
                    <Button isIconOnly size="md" radius="md" variant="light" color="danger" onPress={() => hook.handleDeleteDefinition(def.id)}>
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

function DefinitionModal({ hook }) {
  const { definitionModal, editingDefinition, definitionForm, setDefinitionForm, savingDefinition, handleSaveDefinition } = hook;

  return (
    <Modal isOpen={definitionModal.isOpen} onClose={definitionModal.onClose} size="2xl">
      <ModalContent>
        <ModalHeader>{editingDefinition ? "แก้ไข KPI" : "สร้าง KPI ใหม่"}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อ KPI"
              placeholder="เช่น อัตราความพึงพอใจลูกค้า"
              value={definitionForm.name}
              onValueChange={(v) => setDefinitionForm((f) => ({ ...f, name: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Textarea
              label="รายละเอียด"
              placeholder="อธิบาย KPI..."
              value={definitionForm.description}
              onValueChange={(v) => setDefinitionForm((f) => ({ ...f, description: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
            <div className="flex gap-4">
              <Select
                label="หมวดหมู่"
                selectedKeys={[definitionForm.category]}
                onSelectionChange={(keys) => setDefinitionForm((f) => ({ ...f, category: [...keys][0] }))}
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
                value={definitionForm.unit}
                onValueChange={(v) => setDefinitionForm((f) => ({ ...f, unit: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                isRequired
              />
              <Select
                label="ความถี่"
                selectedKeys={[definitionForm.frequency]}
                onSelectionChange={(keys) => setDefinitionForm((f) => ({ ...f, frequency: [...keys][0] }))}
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
                value={definitionForm.targetValue}
                onValueChange={(v) => setDefinitionForm((f) => ({ ...f, targetValue: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
              <Input
                label="เกณฑ์เตือน"
                type="number"
                value={definitionForm.warningThreshold}
                onValueChange={(v) => setDefinitionForm((f) => ({ ...f, warningThreshold: v }))}
                className="flex-1"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
              />
            </div>
            <Switch
              isSelected={definitionForm.higherIsBetter}
              onValueChange={(v) => setDefinitionForm((f) => ({ ...f, higherIsBetter: v }))}
            >
              {definitionForm.higherIsBetter ? "ยิ่งสูงยิ่งดี" : "ยิ่งต่ำยิ่งดี"}
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" size="md" radius="md" onPress={definitionModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={handleSaveDefinition} isLoading={savingDefinition} startContent={<Save className="w-4 h-4" />}>
            {editingDefinition ? "บันทึก" : "สร้าง"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AssignmentModal({ hook }) {
  const { assignmentModal, assignForm, setAssignForm, savingAssignment, handleSaveAssignment, definitions, employees } = hook;
  const activeEmployees = employees.filter((e) => e.employeeStatus === "active");

  return (
    <Modal isOpen={assignmentModal.isOpen} onClose={assignmentModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>Assign KPI ให้พนักงาน</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Select
              label="KPI"
              selectedKeys={assignForm.definitionId ? [assignForm.definitionId] : []}
              onSelectionChange={(keys) => {
                const id = [...keys][0];
                setAssignForm((f) => ({ ...f, definitionId: id }));
                const def = definitions.find((d) => d.id === id);
                if (def?.targetValue) setAssignForm((f) => ({ ...f, targetValue: String(def.targetValue) }));
              }}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            >
              {definitions.map((d) => (
                <SelectItem key={d.id}>{d.name} ({d.unit})</SelectItem>
              ))}
            </Select>
            <Select
              label="พนักงาน"
              selectedKeys={assignForm.employeeId ? [assignForm.employeeId] : []}
              onSelectionChange={(keys) => setAssignForm((f) => ({ ...f, employeeId: [...keys][0] }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.employeeId}>
                  {e.employeeFirstName} {e.employeeLastName} — {e.employeeDepartment}
                </SelectItem>
              ))}
            </Select>
            <div className="flex gap-4">
              <Input
                label="เป้าหมาย"
                type="number"
                value={assignForm.targetValue}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, targetValue: v }))}
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
                value={assignForm.weight}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, weight: v }))}
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
          <Button variant="light" size="md" radius="md" onPress={assignmentModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={handleSaveAssignment} isLoading={savingAssignment}>
            Assign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function RecordModal({ hook }) {
  const { recordModal, recordingAssignment, recordForm, setRecordForm, savingRecord, handleSaveRecord } = hook;
  if (!recordingAssignment) return null;

  const def = recordingAssignment.definition || {};

  return (
    <Modal isOpen={recordModal.isOpen} onClose={recordModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>บันทึกค่า: {def.name}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-default-500">
              เป้าหมาย: <span className="font-semibold">{recordingAssignment.targetValue} {def.unit}</span>
              {recordingAssignment.latestValue != null && (
                <> | ค่าล่าสุด: <span className="font-semibold">{recordingAssignment.latestValue} {def.unit}</span></>
              )}
            </div>
            <Input
              label="ช่วงเวลา"
              placeholder="เช่น 2026-01"
              value={recordForm.periodLabel}
              onValueChange={(v) => setRecordForm((f) => ({ ...f, periodLabel: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Input
              label={`ค่าจริง (${def.unit})`}
              type="number"
              value={recordForm.actualValue}
              onValueChange={(v) => setRecordForm((f) => ({ ...f, actualValue: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              isRequired
            />
            <Textarea
              label="หมายเหตุ"
              placeholder="หมายเหตุเพิ่มเติม..."
              value={recordForm.note}
              onValueChange={(v) => setRecordForm((f) => ({ ...f, note: v }))}
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" size="md" radius="md" onPress={recordModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={handleSaveRecord} isLoading={savingRecord} startContent={<Save className="w-4 h-4" />}>
            บันทึก
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
