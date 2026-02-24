"use client";

import { useState, useMemo } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  CardHeader,
  Button,
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
  Switch,
  Tooltip,
  RadioGroup,
  Radio,
  Accordion,
  AccordionItem,
  Progress,
  Divider,
} from "@heroui/react";
import {
  ClipboardList,
  BarChart3,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Save,
  Play,
  CheckCircle,
  XCircle,
  Users,
  FileText,
} from "lucide-react";
import { useFeedback360 } from "@/hooks/performance/useFeedback360";
import {
  RELATIONSHIP_TYPES,
  CYCLE_STATUSES,
  VALID_TRANSITIONS,
  TRANSITION_LABELS,
  SCORE_LABELS,
  DEFAULT_COMPETENCY_TEMPLATES,
  getStatusConfig,
  getRelationshipType,
  computeGrade,
  getGradeColor,
} from "@/lib/performance/feedback360Constants";

const QUARTER_OPTIONS = [
  { key: "1", label: "Q1" },
  { key: "2", label: "Q2" },
  { key: "3", label: "Q3" },
  { key: "4", label: "Q4" },
];

export default function Feedback360Page() {
  const hook = useFeedback360();

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
        <h1 className="text-lg font-semibold">ประเมิน 360 องศา</h1>
        <p className="text-default-500 text-sm">
          ประเมินรอบด้านจากหัวหน้า เพื่อนร่วมงาน ลูกน้อง และตนเอง
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
          key="pending"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>รอดำเนินการ</span>
              {hook.pendingReviews.length > 0 && (
                <Chip size="md" radius="md" color="danger" variant="bordered">{hook.pendingReviews.length}</Chip>
              )}
            </div>
          }
        >
          <PendingTab hook={hook} />
        </Tab>
        <Tab
          key="myResults"
          title={
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>ผลประเมินของฉัน</span>
            </div>
          }
        >
          <MyResultsTab hook={hook} />
        </Tab>
        <Tab
          key="admin"
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>จัดการ</span>
            </div>
          }
        >
          <AdminTab hook={hook} />
        </Tab>
      </Tabs>

      <CycleModal hook={hook} />
      <NominationModal hook={hook} />
      <ReviewModal hook={hook} />
    </div>
  );
}

// ===================== Pending Tab =====================

function PendingTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      {hook.loadingPending ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : hook.pendingReviews.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ไม่มีรายการรอประเมิน
          </CardBody>
        </Card>
      ) : (
        hook.pendingReviews.map((nom) => {
          const relType = getRelationshipType(nom.relationshipType);
          const revieweeName = nom.reviewee
            ? `${nom.reviewee.employeeFirstName} ${nom.reviewee.employeeLastName}`
            : nom.revieweeEmployeeId;

          return (
            <Card key={nom.id}>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{revieweeName}</h4>
                    <Chip size="md" radius="md" variant="bordered" style={{ backgroundColor: relType.color + "20", color: relType.color }}>
                      {relType.label}
                    </Chip>
                  </div>
                  <p className="text-sm text-default-400">
                    {nom.cycle?.name} | กำหนดส่ง: {nom.cycle?.responseDeadline ? new Date(nom.cycle.responseDeadline).toLocaleDateString("th-TH") : "-"}
                  </p>
                </div>
                <Button color="primary" size="md" radius="md" onPress={() => hook.handleOpenReview(nom)}>
                  ประเมิน
                </Button>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ===================== My Results Tab =====================

function MyResultsTab({ hook }) {
  const completedCycles = useMemo(
    () => hook.cycles.filter((c) => c.status === "completed"),
    [hook.cycles],
  );

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Select
        label="เลือกรอบประเมิน"
        variant="bordered"
        size="md"
        radius="md"
        labelPlacement="outside"
        selectedKeys={hook.resultCycleId ? [hook.resultCycleId] : []}
        onSelectionChange={(keys) => {
          const id = [...keys][0];
          hook.setResultCycleId(id);
          if (id) hook.loadMyResults(id);
        }}
        className="max-w-sm"
      >
        {completedCycles.map((c) => (
          <SelectItem key={c.id}>{c.name}</SelectItem>
        ))}
      </Select>

      {hook.loadingResults ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !hook.myResults ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            เลือกรอบประเมินเพื่อดูผล
          </CardBody>
        </Card>
      ) : (
        <ResultsDisplay results={hook.myResults} />
      )}
    </div>
  );
}

function ResultsDisplay({ results }) {
  const grade = computeGrade(results.overallScore);
  const gradeColor = getGradeColor(grade);
  const competencies = results.competencies || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Overall Score */}
      <Card>
        <CardBody className="flex flex-row items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-default-500">คะแนนรวม</p>
            <p className="text-4xl font-bold">{results.overallScore?.toFixed(2) || "0.00"}</p>
          </div>
          <Chip color={gradeColor} variant="bordered" size="md" radius="md">
            {grade}
          </Chip>
          <div className="text-sm text-default-400">
            จำนวนผู้ประเมิน: {results.totalResponses || 0} คน
          </div>
        </CardBody>
      </Card>

      {/* By Relationship Type */}
      <Card>
        <CardHeader><h3 className="font-semibold">คะแนนตามกลุ่มผู้ประเมิน</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RELATIONSHIP_TYPES.map((rt) => {
              const typeData = results.typeAverages?.[rt.key];
              if (!typeData) return null;
              return (
                <div key={rt.key} className="p-3 rounded-lg" style={{ backgroundColor: rt.color + "10" }}>
                  <p className="text-sm font-medium" style={{ color: rt.color }}>{rt.label}</p>
                  <p className="text-2xl font-bold">{typeData.overallScore?.toFixed(2) || "-"}</p>
                  <p className="text-xs text-default-400">{typeData.responseCount} คน</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Competency Breakdown */}
      {competencies.length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold">คะแนนรายสมรรถนะ</h3></CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">สมรรถนะ</th>
                    {RELATIONSHIP_TYPES.map((rt) => (
                      results.typeAverages?.[rt.key] ? (
                        <th key={rt.key} className="text-center py-2 px-3" style={{ color: rt.color }}>
                          {rt.labelShort}
                        </th>
                      ) : null
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competencies.map((comp) => (
                    <tr key={comp.id} className="border-b">
                      <td className="py-2 px-3">{comp.name}</td>
                      {RELATIONSHIP_TYPES.map((rt) => {
                        const typeData = results.typeAverages?.[rt.key];
                        if (!typeData) return null;
                        const score = typeData.competencyAverages?.[comp.id];
                        return (
                          <td key={rt.key} className="text-center py-2 px-3">
                            {score ? score.toFixed(2) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Qualitative Feedback */}
      {results.feedback && Object.keys(results.feedback).length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold">ความคิดเห็น</h3></CardHeader>
          <CardBody>
            {Object.entries(results.feedback).map(([type, fb]) => {
              const rt = getRelationshipType(type);
              const hasContent = fb.strengths?.length > 0 || fb.improvements?.length > 0 || fb.comments?.length > 0;
              if (!hasContent) return null;
              return (
                <div key={type} className="mb-4">
                  <h4 className="font-medium mb-2" style={{ color: rt.color }}>{rt.label}</h4>
                  {fb.strengths?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-default-500 mb-1">จุดแข็ง:</p>
                      {fb.strengths.map((s, i) => (
                        <p key={i} className="text-sm ml-2">• {s}</p>
                      ))}
                    </div>
                  )}
                  {fb.improvements?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-default-500 mb-1">จุดที่ควรพัฒนา:</p>
                      {fb.improvements.map((s, i) => (
                        <p key={i} className="text-sm ml-2">• {s}</p>
                      ))}
                    </div>
                  )}
                  <Divider className="my-2" />
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ===================== Admin Tab =====================

function AdminTab({ hook }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">รอบประเมิน 360 องศา</h3>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => hook.handleOpenCycleForm()}
        >
          สร้างรอบประเมิน
        </Button>
      </div>

      {hook.loadingCycles ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : hook.cycles.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-default-400">
            ยังไม่มีรอบประเมิน — กดปุ่ม "สร้างรอบประเมิน" เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {hook.cycles.map((cycle) => (
            <CycleCard key={cycle.id} cycle={cycle} hook={hook} />
          ))}
        </div>
      )}

      {/* Selected Cycle Details */}
      {hook.selectedCycle && <CycleDetails hook={hook} />}
    </div>
  );
}

function CycleCard({ cycle, hook }) {
  const statusConfig = getStatusConfig(cycle.status, CYCLE_STATUSES);
  const isSelected = hook.selectedCycle?.id === cycle.id;
  const transitions = VALID_TRANSITIONS[cycle.status] || [];

  return (
    <Card
      className={isSelected ? "border-2 border-primary" : "cursor-pointer hover:bg-default-50"}
      isPressable
      onPress={() => hook.setSelectedCycle(isSelected ? null : cycle)}
    >
      <CardBody className="flex flex-row items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{cycle.name}</h4>
            <Chip size="md" radius="md" color={statusConfig.color} variant="bordered">
              {statusConfig.label}
            </Chip>
          </div>
          <p className="text-xs text-default-400">
            ปี {cycle.year} {cycle.quarter ? `Q${cycle.quarter}` : ""} | กำหนดส่ง: {cycle.responseDeadline ? new Date(cycle.responseDeadline).toLocaleDateString("th-TH") : "-"}
          </p>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {transitions.filter((t) => t !== "cancelled").map((t) => (
            <Button key={t} size="md" radius="md" color="primary" variant="bordered" onPress={() => hook.handleTransition(cycle.id, t)}>
              {TRANSITION_LABELS[t]}
            </Button>
          ))}
          {cycle.status === "draft" && (
            <>
              <Tooltip content="แก้ไข">
                <Button isIconOnly size="md" radius="md" variant="bordered" onPress={() => hook.handleOpenCycleForm(cycle)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="ลบ">
                <Button isIconOnly size="md" radius="md" variant="bordered" color="danger" onPress={() => hook.handleDeleteCycle(cycle.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function CycleDetails({ hook }) {
  const [detailTab, setDetailTab] = useState("competencies");
  const cycle = hook.selectedCycle;

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">รายละเอียด: {cycle.name}</h3>
      </CardHeader>
      <CardBody>
        <Tabs selectedKey={detailTab} onSelectionChange={setDetailTab} variant="bordered" size="md" radius="md">
          <Tab key="competencies" title="สมรรถนะ">
            <CompetenciesPanel hook={hook} />
          </Tab>
          <Tab key="nominations" title="ผู้ประเมิน">
            <NominationsPanel hook={hook} />
          </Tab>
          <Tab key="progress" title="ความคืบหน้า">
            <ProgressPanel hook={hook} />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

function CompetenciesPanel({ hook }) {
  const [editMode, setEditMode] = useState(false);
  const [localComps, setLocalComps] = useState([]);
  const isDraft = hook.selectedCycle?.status === "draft";

  const handleEdit = () => {
    setLocalComps(hook.competencies.map((c) => ({ ...c })));
    setEditMode(true);
  };

  const handleSave = () => {
    hook.handleSaveCompetencies(hook.selectedCycle.id, localComps);
    setEditMode(false);
  };

  const handleLoadTemplates = () => {
    setLocalComps(DEFAULT_COMPETENCY_TEMPLATES.map((t) => ({
      name: t.name, description: t.description, questions: [...t.questions], weight: 1,
    })));
    setEditMode(true);
  };

  return (
    <div className="flex flex-col gap-3 mt-3">
      {isDraft && (
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <Button size="md" radius="md" onPress={handleEdit} startContent={<Pencil className="w-3 h-3" />}>
                แก้ไข
              </Button>
              {hook.competencies.length === 0 && (
                <Button size="md" radius="md" color="secondary" variant="bordered" onPress={handleLoadTemplates}>
                  โหลดเทมเพลตเริ่มต้น
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="md" radius="md" color="primary" onPress={handleSave} isLoading={hook.savingCompetencies} startContent={<Save className="w-3 h-3" />}>
                บันทึก
              </Button>
              <Button size="md" radius="md" variant="bordered" onPress={() => setEditMode(false)}>ยกเลิก</Button>
            </>
          )}
        </div>
      )}

      {hook.loadingCompetencies ? (
        <Spinner />
      ) : editMode ? (
        <div className="flex flex-col gap-3">
          {localComps.map((comp, i) => (
            <Card key={i} className="p-3">
              <Input
                label="ชื่อสมรรถนะ"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                value={comp.name}
                onValueChange={(v) => {
                  const updated = [...localComps];
                  updated[i] = { ...updated[i], name: v };
                  setLocalComps(updated);
                }}
                className="mb-2"
              />
              <Textarea
                label="คำถาม (แต่ละข้อขึ้นบรรทัดใหม่)"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                value={(comp.questions || []).join("\n")}
                onValueChange={(v) => {
                  const updated = [...localComps];
                  updated[i] = { ...updated[i], questions: v.split("\n").filter((q) => q.trim()) };
                  setLocalComps(updated);
                }}
                minRows={3}
              />
              <Button
                size="md"
                radius="md"
                variant="bordered"
                color="danger"
                className="self-end mt-1"
                onPress={() => setLocalComps(localComps.filter((_, j) => j !== i))}
              >
                ลบ
              </Button>
            </Card>
          ))}
          <Button
            size="md"
            radius="md"
            variant="bordered"
            startContent={<Plus className="w-3 h-3" />}
            onPress={() => setLocalComps([...localComps, { name: "", description: "", questions: [], weight: 1 }])}
          >
            เพิ่มสมรรถนะ
          </Button>
        </div>
      ) : hook.competencies.length === 0 ? (
        <p className="text-default-400 text-sm">ยังไม่มีสมรรถนะ</p>
      ) : (
        hook.competencies.map((comp) => (
          <div key={comp.id} className="p-3 rounded-lg bg-default-50">
            <h4 className="font-medium">{comp.name}</h4>
            {comp.description && <p className="text-xs text-default-400">{comp.description}</p>}
            <ul className="mt-1 ml-4 list-disc text-sm text-default-600">
              {(comp.questions || []).map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function NominationsPanel({ hook }) {
  const canAddNominations = ["nominating", "draft"].includes(hook.selectedCycle?.status);

  // Group by reviewee
  const grouped = useMemo(() => {
    const map = {};
    for (const nom of hook.nominations) {
      const eid = nom.revieweeEmployeeId;
      if (!map[eid]) {
        map[eid] = {
          reviewee: nom.reviewee,
          nominations: [],
        };
      }
      map[eid].nominations.push(nom);
    }
    return Object.values(map);
  }, [hook.nominations]);

  return (
    <div className="flex flex-col gap-3 mt-3">
      {canAddNominations && (
        <Button
          size="md"
          radius="md"
          color="primary"
          startContent={<Plus className="w-3 h-3" />}
          onPress={hook.handleOpenNominationForm}
        >
          เพิ่มผู้ประเมิน
        </Button>
      )}

      {hook.loadingNominations ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <p className="text-default-400 text-sm">ยังไม่มีการเสนอชื่อ</p>
      ) : (
        grouped.map((group) => {
          const revieweeName = group.reviewee
            ? `${group.reviewee.employeeFirstName} ${group.reviewee.employeeLastName}`
            : "Unknown";

          return (
            <div key={group.reviewee?.employeeId} className="p-3 rounded-lg bg-default-50">
              <h4 className="font-medium mb-2">{revieweeName}</h4>
              <div className="flex flex-wrap gap-2">
                {group.nominations.map((nom) => {
                  const relType = getRelationshipType(nom.relationshipType);
                  const reviewerName = nom.reviewer
                    ? `${nom.reviewer.employeeFirstName} ${nom.reviewer.employeeLastName}`
                    : nom.reviewerEmployeeId;
                  return (
                    <Chip
                      key={nom.id}
                      variant="bordered"
                      size="md"
                      radius="md"
                      style={{ backgroundColor: relType.color + "20", color: relType.color }}
                      onClose={canAddNominations ? () => hook.handleDeleteNomination(nom.id) : undefined}
                    >
                      {reviewerName} ({relType.labelShort}) — {nom.status === "completed" ? "เสร็จ" : "รอ"}
                    </Chip>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProgressPanel({ hook }) {
  const grouped = useMemo(() => {
    const map = {};
    for (const nom of hook.nominations) {
      const eid = nom.revieweeEmployeeId;
      if (!map[eid]) {
        map[eid] = { reviewee: nom.reviewee, total: 0, completed: 0 };
      }
      map[eid].total++;
      if (nom.status === "completed") map[eid].completed++;
    }
    return Object.values(map);
  }, [hook.nominations]);

  return (
    <div className="flex flex-col gap-3 mt-3">
      {grouped.length === 0 ? (
        <p className="text-default-400 text-sm">ยังไม่มีข้อมูล</p>
      ) : (
        grouped.map((item) => {
          const name = item.reviewee
            ? `${item.reviewee.employeeFirstName} ${item.reviewee.employeeLastName}`
            : "Unknown";
          const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
          return (
            <div key={item.reviewee?.employeeId} className="flex items-center gap-3">
              <span className="text-sm min-w-[150px]">{name}</span>
              <Progress value={pct} className="flex-1" color={pct === 100 ? "success" : "primary"} size="sm" />
              <span className="text-xs text-default-500 min-w-[60px] text-right">{item.completed}/{item.total}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ===================== Modals =====================

function CycleModal({ hook }) {
  const { cycleModal, editingCycle, cycleForm, setCycleForm, savingCycle, handleSaveCycle } = hook;

  return (
    <Modal isOpen={cycleModal.isOpen} onClose={cycleModal.onClose} size="xl">
      <ModalContent>
        <ModalHeader>{editingCycle ? "แก้ไขรอบประเมิน" : "สร้างรอบประเมินใหม่"}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="ชื่อรอบ"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="เช่น รอบประเมิน 360 องศา Q1/2026"
              value={cycleForm.name}
              onValueChange={(v) => setCycleForm((f) => ({ ...f, name: v }))}
              isRequired
            />
            <Textarea
              label="รายละเอียด"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              value={cycleForm.description}
              onValueChange={(v) => setCycleForm((f) => ({ ...f, description: v }))}
            />
            <div className="flex gap-4">
              <Input
                label="ปี"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                type="number"
                value={cycleForm.year}
                onValueChange={(v) => setCycleForm((f) => ({ ...f, year: v }))}
                className="flex-1"
                isRequired
              />
              <Select
                label="ไตรมาส"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                selectedKeys={cycleForm.quarter ? [cycleForm.quarter] : []}
                onSelectionChange={(keys) => setCycleForm((f) => ({ ...f, quarter: [...keys][0] || "" }))}
                className="flex-1"
              >
                {QUARTER_OPTIONS.map((q) => (
                  <SelectItem key={q.key}>{q.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="วันกำหนดส่ง"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                type="date"
                value={cycleForm.responseDeadline}
                onValueChange={(v) => setCycleForm((f) => ({ ...f, responseDeadline: v }))}
                className="flex-1"
                isRequired
              />
            </div>
            <Switch
              isSelected={cycleForm.anonymousToReviewee}
              onValueChange={(v) => setCycleForm((f) => ({ ...f, anonymousToReviewee: v }))}
            >
              ไม่เปิดเผยตัวตนผู้ประเมิน (Anonymous)
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={cycleModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={handleSaveCycle} isLoading={savingCycle} startContent={<Save className="w-4 h-4" />}>
            {editingCycle ? "บันทึก" : "สร้าง"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function NominationModal({ hook }) {
  const { nominationModal, nominationForm, setNominationForm, savingNomination, handleSaveNomination, employees } = hook;
  const activeEmployees = employees.filter((e) => e.employeeStatus === "active");

  return (
    <Modal isOpen={nominationModal.isOpen} onClose={nominationModal.onClose} size="lg">
      <ModalContent>
        <ModalHeader>เพิ่มผู้ประเมิน</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Select
              label="ผู้ถูกประเมิน"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              selectedKeys={nominationForm.revieweeEmployeeId ? [nominationForm.revieweeEmployeeId] : []}
              onSelectionChange={(keys) => setNominationForm((f) => ({ ...f, revieweeEmployeeId: [...keys][0] }))}
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.employeeId}>
                  {e.employeeFirstName} {e.employeeLastName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="ผู้ประเมิน"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              selectedKeys={nominationForm.reviewerEmployeeId ? [nominationForm.reviewerEmployeeId] : []}
              onSelectionChange={(keys) => setNominationForm((f) => ({ ...f, reviewerEmployeeId: [...keys][0] }))}
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.employeeId}>
                  {e.employeeFirstName} {e.employeeLastName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="ความสัมพันธ์"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              selectedKeys={[nominationForm.relationshipType]}
              onSelectionChange={(keys) => setNominationForm((f) => ({ ...f, relationshipType: [...keys][0] }))}
            >
              {RELATIONSHIP_TYPES.map((r) => (
                <SelectItem key={r.key}>{r.label}</SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={nominationModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={handleSaveNomination} isLoading={savingNomination}>
            เพิ่ม
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ReviewModal({ hook }) {
  const {
    reviewModal, activeReview, reviewCompetencies,
    reviewScores, setReviewScore, reviewComments, setReviewComments,
    submittingReview, handleSubmitReview,
  } = hook;

  if (!activeReview) return null;

  const revieweeName = activeReview.reviewee
    ? `${activeReview.reviewee.employeeFirstName} ${activeReview.reviewee.employeeLastName}`
    : "";

  const relType = getRelationshipType(activeReview.relationshipType);

  // Count answered
  let totalQ = 0;
  let answeredQ = 0;
  for (const comp of reviewCompetencies) {
    totalQ += (comp.questions || []).length;
    const scores = reviewScores[comp.id] || [];
    answeredQ += scores.filter((s) => s > 0).length;
  }
  const progress = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;

  return (
    <Modal isOpen={reviewModal.isOpen} onClose={reviewModal.onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <span>ประเมิน 360 องศา: {revieweeName}</span>
            <Chip size="md" radius="md" style={{ backgroundColor: relType.color + "20", color: relType.color }}>
              {relType.label}
            </Chip>
          </div>
        </ModalHeader>
        <ModalBody>
          <Progress value={progress} color="primary" size="sm" className="mb-4" />
          <p className="text-xs text-default-400 mb-4">{answeredQ}/{totalQ} ข้อ</p>

          <Accordion selectionMode="multiple" defaultExpandedKeys={reviewCompetencies.map((c) => c.id)}>
            {reviewCompetencies.map((comp) => (
              <AccordionItem key={comp.id} title={comp.name} subtitle={comp.description}>
                <div className="flex flex-col gap-4">
                  {(comp.questions || []).map((question, qIdx) => {
                    const currentScore = (reviewScores[comp.id] || [])[qIdx] || 0;
                    return (
                      <div key={qIdx} className="p-2 rounded bg-default-50">
                        <p className="text-sm mb-2">
                          {qIdx + 1}. {question}
                        </p>
                        <RadioGroup
                          orientation="horizontal"
                          value={String(currentScore)}
                          onValueChange={(v) => setReviewScore(comp.id, qIdx, parseInt(v))}
                        >
                          {[1, 2, 3, 4, 5].map((score) => (
                            <Radio key={score} value={String(score)}>
                              {score} - {SCORE_LABELS[score]?.label}
                            </Radio>
                          ))}
                        </RadioGroup>
                      </div>
                    );
                  })}
                </div>
              </AccordionItem>
            ))}
          </Accordion>

          <Divider className="my-4" />

          <div className="flex flex-col gap-3">
            <Textarea
              label="จุดแข็ง"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="สิ่งที่ผู้ถูกประเมินทำได้ดี..."
              value={reviewComments.strengthComment}
              onValueChange={(v) => setReviewComments((c) => ({ ...c, strengthComment: v }))}
            />
            <Textarea
              label="จุดที่ควรพัฒนา"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="สิ่งที่ผู้ถูกประเมินควรปรับปรุง..."
              value={reviewComments.improvementComment}
              onValueChange={(v) => setReviewComments((c) => ({ ...c, improvementComment: v }))}
            />
            <Textarea
              label="ความคิดเห็นเพิ่มเติม"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="ความคิดเห็นอื่นๆ..."
              value={reviewComments.comment}
              onValueChange={(v) => setReviewComments((c) => ({ ...c, comment: v }))}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={reviewModal.onClose}>ยกเลิก</Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={handleSubmitReview}
            isLoading={submittingReview}
            isDisabled={answeredQ < totalQ}
            startContent={<Save className="w-4 h-4" />}
          >
            ส่งผลประเมิน
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
