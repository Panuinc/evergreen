"use client";

import { useState, useMemo, useCallback } from "react";
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

export default function Feedback360View({
  activeTab,
  onTabChange,
  pendingReviews,
  loadingPending,
  cycles,
  loadingCycles,
  selectedCycle,
  onSelectCycle,
  competencies,
  loadingCompetencies,
  savingCompetencies,
  onSaveCompetencies,
  nominations,
  loadingNominations,
  onDeleteNomination,
  onOpenNominationForm,
  resultCycleId,
  onResultCycleIdChange,
  myResults,
  loadingResults,
  onLoadMyResults,
  employees,
  cycleModal,
  editingCycle,
  cycleForm,
  onCycleFormChange,
  savingCycle,
  onSaveCycle,
  onOpenCycleForm,
  onDeleteCycle,
  onTransition,
  nominationModal,
  nominationForm,
  onNominationFormChange,
  savingNomination,
  onSaveNomination,
  reviewModal,
  activeReview,
  reviewCompetencies,
  reviewScores,
  onSetReviewScore,
  reviewComments,
  onReviewCommentsChange,
  submittingReview,
  onSubmitReview,
  onOpenReview,
}) {
  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div>
        <h1 className="text-lg font-semibold">ประเมิน 360 องศา</h1>
        <p className="text-muted-foreground text-sm">
          ประเมินรอบด้านจากหัวหน้า เพื่อนร่วมงาน ลูกน้อง และตนเอง
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
          key="pending"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>รอดำเนินการ</span>
              {pendingReviews.length > 0 && (
                <Chip size="md" radius="md" color="danger" variant="bordered">{pendingReviews.length}</Chip>
              )}
            </div>
          }
        >
          <PendingTab
            pendingReviews={pendingReviews}
            loadingPending={loadingPending}
            onOpenReview={onOpenReview}
          />
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
          <MyResultsTab
            cycles={cycles}
            resultCycleId={resultCycleId}
            onResultCycleIdChange={onResultCycleIdChange}
            myResults={myResults}
            loadingResults={loadingResults}
            onLoadMyResults={onLoadMyResults}
          />
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
          <AdminTab
            cycles={cycles}
            loadingCycles={loadingCycles}
            selectedCycle={selectedCycle}
            onSelectCycle={onSelectCycle}
            competencies={competencies}
            loadingCompetencies={loadingCompetencies}
            savingCompetencies={savingCompetencies}
            onSaveCompetencies={onSaveCompetencies}
            nominations={nominations}
            loadingNominations={loadingNominations}
            onDeleteNomination={onDeleteNomination}
            onOpenNominationForm={onOpenNominationForm}
            onOpenCycleForm={onOpenCycleForm}
            onDeleteCycle={onDeleteCycle}
            onTransition={onTransition}
          />
        </Tab>
      </Tabs>

      <CycleModal
        cycleModal={cycleModal}
        editingCycle={editingCycle}
        cycleForm={cycleForm}
        onCycleFormChange={onCycleFormChange}
        savingCycle={savingCycle}
        onSaveCycle={onSaveCycle}
      />
      <NominationModal
        nominationModal={nominationModal}
        nominationForm={nominationForm}
        onNominationFormChange={onNominationFormChange}
        savingNomination={savingNomination}
        onSaveNomination={onSaveNomination}
        employees={employees}
      />
      <ReviewModal
        reviewModal={reviewModal}
        activeReview={activeReview}
        reviewCompetencies={reviewCompetencies}
        reviewScores={reviewScores}
        onSetReviewScore={onSetReviewScore}
        reviewComments={reviewComments}
        onReviewCommentsChange={onReviewCommentsChange}
        submittingReview={submittingReview}
        onSubmitReview={onSubmitReview}
      />
    </div>
  );
}

// ===================== Pending Tab =====================

function PendingTab({ pendingReviews, loadingPending, onOpenReview }) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      {loadingPending ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : pendingReviews.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ไม่มีรายการรอประเมิน
          </CardBody>
        </Card>
      ) : (
        pendingReviews.map((nom) => {
          const relType = getRelationshipType(nom.perf360NominationRelationshipType);
          const revieweeName = nom.reviewee
            ? `${nom.reviewee.hrEmployeeFirstName} ${nom.reviewee.hrEmployeeLastName}`
            : nom.perf360NominationRevieweeEmployeeId;

          return (
            <Card key={nom.perf360NominationId}>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{revieweeName}</h4>
                    <Chip size="md" radius="md" variant="bordered" style={{ backgroundColor: relType.color + "20", color: relType.color }}>
                      {relType.label}
                    </Chip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {nom.cycle?.perf360CycleName} | กำหนดส่ง: {nom.cycle?.perf360CycleResponseDeadline ? new Date(nom.cycle.perf360CycleResponseDeadline).toLocaleDateString("th-TH") : "-"}
                  </p>
                </div>
                <Button color="primary" size="md" radius="md" onPress={() => onOpenReview(nom)}>
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

function MyResultsTab({ cycles, resultCycleId, onResultCycleIdChange, myResults, loadingResults, onLoadMyResults }) {
  const completedCycles = useMemo(
    () => cycles.filter((c) => c.perf360CycleStatus === "completed"),
    [cycles],
  );

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Select
        label="เลือกรอบประเมิน"
        variant="bordered"
        size="md"
        radius="md"
        labelPlacement="outside"
        selectedKeys={resultCycleId ? [resultCycleId] : []}
        onSelectionChange={(keys) => {
          const id = [...keys][0];
          onResultCycleIdChange(id);
          if (id) onLoadMyResults(id);
        }}
        className="max-w-sm"
      >
        {completedCycles.map((c) => (
          <SelectItem key={c.perf360CycleId}>{c.perf360CycleName}</SelectItem>
        ))}
      </Select>

      {loadingResults ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !myResults ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            เลือกรอบประเมินเพื่อดูผล
          </CardBody>
        </Card>
      ) : (
        <ResultsDisplay results={myResults} />
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
            <p className="text-sm text-muted-foreground">คะแนนรวม</p>
            <p className="text-4xl font-semibold">{results.overallScore?.toFixed(2) || "0.00"}</p>
          </div>
          <Chip color={gradeColor} variant="bordered" size="md" radius="md">
            {grade}
          </Chip>
          <div className="text-sm text-muted-foreground">
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
                  <p className="text-2xl font-semibold">{typeData.overallScore?.toFixed(2) || "-"}</p>
                  <p className="text-sm text-muted-foreground">{typeData.responseCount} คน</p>
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
                    <tr key={comp.perf360CompetencyId} className="border-b">
                      <td className="py-2 px-3">{comp.perf360CompetencyName}</td>
                      {RELATIONSHIP_TYPES.map((rt) => {
                        const typeData = results.typeAverages?.[rt.key];
                        if (!typeData) return null;
                        const score = typeData.competencyAverages?.[comp.perf360CompetencyId];
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
                      <p className="text-sm text-muted-foreground mb-1">จุดแข็ง:</p>
                      {fb.strengths.map((s, i) => (
                        <p key={i} className="text-sm ml-2">• {s}</p>
                      ))}
                    </div>
                  )}
                  {fb.improvements?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-1">จุดที่ควรพัฒนา:</p>
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

function AdminTab({
  cycles,
  loadingCycles,
  selectedCycle,
  onSelectCycle,
  competencies,
  loadingCompetencies,
  savingCompetencies,
  onSaveCompetencies,
  nominations,
  loadingNominations,
  onDeleteNomination,
  onOpenNominationForm,
  onOpenCycleForm,
  onDeleteCycle,
  onTransition,
}) {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">รอบประเมิน 360 องศา</h3>
        <Button
          color="primary"
          size="md"
          radius="md"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => onOpenCycleForm()}
        >
          สร้างรอบประเมิน
        </Button>
      </div>

      {loadingCycles ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : cycles.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-muted-foreground">
            ยังไม่มีรอบประเมิน — กดปุ่ม "สร้างรอบประเมิน" เพื่อเริ่มต้น
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {cycles.map((cycle) => (
            <CycleCard
              key={cycle.perf360CycleId}
              cycle={cycle}
              selectedCycle={selectedCycle}
              onSelectCycle={onSelectCycle}
              onOpenCycleForm={onOpenCycleForm}
              onDeleteCycle={onDeleteCycle}
              onTransition={onTransition}
            />
          ))}
        </div>
      )}

      {/* Selected Cycle Details */}
      {selectedCycle && (
        <CycleDetails
          selectedCycle={selectedCycle}
          competencies={competencies}
          loadingCompetencies={loadingCompetencies}
          savingCompetencies={savingCompetencies}
          onSaveCompetencies={onSaveCompetencies}
          nominations={nominations}
          loadingNominations={loadingNominations}
          onDeleteNomination={onDeleteNomination}
          onOpenNominationForm={onOpenNominationForm}
        />
      )}
    </div>
  );
}

function CycleCard({ cycle, selectedCycle, onSelectCycle, onOpenCycleForm, onDeleteCycle, onTransition }) {
  const statusConfig = getStatusConfig(cycle.perf360CycleStatus, CYCLE_STATUSES);
  const isSelected = selectedCycle?.perf360CycleId === cycle.perf360CycleId;
  const transitions = VALID_TRANSITIONS[cycle.perf360CycleStatus] || [];

  return (
    <Card
      className={isSelected ? "border-2 border-primary" : "cursor-pointer hover:bg-default-50"}
      isPressable
      onPress={() => onSelectCycle(isSelected ? null : cycle)}
    >
      <CardBody className="flex flex-row items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{cycle.perf360CycleName}</h4>
            <Chip size="md" radius="md" color={statusConfig.color} variant="bordered">
              {statusConfig.label}
            </Chip>
          </div>
          <p className="text-sm text-muted-foreground">
            ปี {cycle.perf360CycleYear} {cycle.perf360CycleQuarter ? `Q${cycle.perf360CycleQuarter}` : ""} | กำหนดส่ง: {cycle.perf360CycleResponseDeadline ? new Date(cycle.perf360CycleResponseDeadline).toLocaleDateString("th-TH") : "-"}
          </p>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {transitions.filter((t) => t !== "cancelled").map((t) => (
            <Button key={t} size="md" radius="md" color="primary" variant="bordered" onPress={() => onTransition(cycle.perf360CycleId, t)}>
              {TRANSITION_LABELS[t]}
            </Button>
          ))}
          {cycle.perf360CycleStatus === "draft" && (
            <>
              <Tooltip content="แก้ไข">
                <Button isIconOnly size="md" radius="md" variant="bordered" onPress={() => onOpenCycleForm(cycle)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="ลบ">
                <Button isIconOnly size="md" radius="md" variant="bordered" color="danger" onPress={() => onDeleteCycle(cycle.perf360CycleId)}>
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

function CycleDetails({
  selectedCycle,
  competencies,
  loadingCompetencies,
  savingCompetencies,
  onSaveCompetencies,
  nominations,
  loadingNominations,
  onDeleteNomination,
  onOpenNominationForm,
}) {
  const [detailTab, setDetailTab] = useState("competencies");

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">รายละเอียด: {selectedCycle.perf360CycleName}</h3>
      </CardHeader>
      <CardBody>
        <Tabs selectedKey={detailTab} onSelectionChange={setDetailTab} variant="bordered" size="md" radius="md">
          <Tab key="competencies" title="สมรรถนะ">
            <CompetenciesPanel
              selectedCycle={selectedCycle}
              competencies={competencies}
              loadingCompetencies={loadingCompetencies}
              savingCompetencies={savingCompetencies}
              onSaveCompetencies={onSaveCompetencies}
            />
          </Tab>
          <Tab key="nominations" title="ผู้ประเมิน">
            <NominationsPanel
              selectedCycle={selectedCycle}
              nominations={nominations}
              loadingNominations={loadingNominations}
              onDeleteNomination={onDeleteNomination}
              onOpenNominationForm={onOpenNominationForm}
            />
          </Tab>
          <Tab key="progress" title="ความคืบหน้า">
            <ProgressPanel nominations={nominations} />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

function CompetenciesPanel({ selectedCycle, competencies, loadingCompetencies, savingCompetencies, onSaveCompetencies }) {
  const [editMode, setEditMode] = useState(false);
  const [localComps, setLocalComps] = useState([]);
  const isDraft = selectedCycle?.perf360CycleStatus === "draft";

  const handleEdit = useCallback(() => {
    setLocalComps(competencies.map((c) => ({
      name: c.perf360CompetencyName || c.name || "",
      description: c.perf360CompetencyDescription || c.description || "",
      questions: c.perf360CompetencyQuestions || c.questions || [],
      weight: c.perf360CompetencyWeight || c.weight || 1,
    })));
    setEditMode(true);
  }, [competencies]);

  const handleSave = useCallback(() => {
    onSaveCompetencies(selectedCycle.perf360CycleId, localComps);
    setEditMode(false);
  }, [onSaveCompetencies, selectedCycle, localComps]);

  const handleLoadTemplates = useCallback(() => {
    setLocalComps(DEFAULT_COMPETENCY_TEMPLATES.map((t) => ({
      name: t.name, description: t.description, questions: [...t.questions], weight: 1,
    })));
    setEditMode(true);
  }, []);

  return (
    <div className="flex flex-col gap-3 mt-3">
      {isDraft && (
        <div className="flex gap-2">
          {!editMode ? (
            <>
              <Button size="md" radius="md" onPress={handleEdit} startContent={<Pencil className="w-3 h-3" />}>
                แก้ไข
              </Button>
              {competencies.length === 0 && (
                <Button size="md" radius="md" color="secondary" variant="bordered" onPress={handleLoadTemplates}>
                  โหลดเทมเพลตเริ่มต้น
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="md" radius="md" color="primary" onPress={handleSave} isLoading={savingCompetencies} startContent={<Save className="w-3 h-3" />}>
                บันทึก
              </Button>
              <Button size="md" radius="md" variant="bordered" onPress={() => setEditMode(false)}>ยกเลิก</Button>
            </>
          )}
        </div>
      )}

      {loadingCompetencies ? (
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
                value={comp.name || comp.perf360CompetencyName || ""}
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
                value={(comp.questions || comp.perf360CompetencyQuestions || []).join("\n")}
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
      ) : competencies.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีสมรรถนะ</p>
      ) : (
        competencies.map((comp) => (
          <div key={comp.perf360CompetencyId} className="p-3 rounded-lg bg-default-50">
            <h4 className="font-medium">{comp.perf360CompetencyName}</h4>
            {comp.perf360CompetencyDescription && <p className="text-sm text-muted-foreground">{comp.perf360CompetencyDescription}</p>}
            <ul className="mt-1 ml-4 list-disc text-sm text-foreground">
              {(comp.perf360CompetencyQuestions || []).map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function NominationsPanel({ selectedCycle, nominations, loadingNominations, onDeleteNomination, onOpenNominationForm }) {
  const canAddNominations = ["nominating", "draft"].includes(selectedCycle?.perf360CycleStatus);

  // Group by reviewee
  const grouped = useMemo(() => {
    const map = {};
    for (const nom of nominations) {
      const eid = nom.perf360NominationRevieweeEmployeeId;
      if (!map[eid]) {
        map[eid] = {
          reviewee: nom.reviewee,
          nominations: [],
        };
      }
      map[eid].nominations.push(nom);
    }
    return Object.values(map);
  }, [nominations]);

  return (
    <div className="flex flex-col gap-3 mt-3">
      {canAddNominations && (
        <Button
          size="md"
          radius="md"
          color="primary"
          startContent={<Plus className="w-3 h-3" />}
          onPress={onOpenNominationForm}
        >
          เพิ่มผู้ประเมิน
        </Button>
      )}

      {loadingNominations ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีการเสนอชื่อ</p>
      ) : (
        grouped.map((group) => {
          const revieweeName = group.reviewee
            ? `${group.reviewee.hrEmployeeFirstName} ${group.reviewee.hrEmployeeLastName}`
            : "Unknown";

          return (
            <div key={group.reviewee?.hrEmployeeId} className="p-3 rounded-lg bg-default-50">
              <h4 className="font-medium mb-2">{revieweeName}</h4>
              <div className="flex flex-wrap gap-2">
                {group.nominations.map((nom) => {
                  const relType = getRelationshipType(nom.perf360NominationRelationshipType);
                  const reviewerName = nom.reviewer
                    ? `${nom.reviewer.hrEmployeeFirstName} ${nom.reviewer.hrEmployeeLastName}`
                    : nom.perf360NominationReviewerEmployeeId;
                  return (
                    <Chip
                      key={nom.perf360NominationId}
                      variant="bordered"
                      size="md"
                      radius="md"
                      style={{ backgroundColor: relType.color + "20", color: relType.color }}
                      onClose={canAddNominations ? () => onDeleteNomination(nom.perf360NominationId) : undefined}
                    >
                      {reviewerName} ({relType.labelShort}) — {nom.perf360NominationStatus === "completed" ? "เสร็จ" : "รอ"}
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

function ProgressPanel({ nominations }) {
  const grouped = useMemo(() => {
    const map = {};
    for (const nom of nominations) {
      const eid = nom.perf360NominationRevieweeEmployeeId;
      if (!map[eid]) {
        map[eid] = { reviewee: nom.reviewee, total: 0, completed: 0 };
      }
      map[eid].total++;
      if (nom.perf360NominationStatus === "completed") map[eid].completed++;
    }
    return Object.values(map);
  }, [nominations]);

  return (
    <div className="flex flex-col gap-3 mt-3">
      {grouped.length === 0 ? (
        <p className="text-muted-foreground text-sm">ยังไม่มีข้อมูล</p>
      ) : (
        grouped.map((item) => {
          const name = item.reviewee
            ? `${item.reviewee.hrEmployeeFirstName} ${item.reviewee.hrEmployeeLastName}`
            : "Unknown";
          const pct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
          return (
            <div key={item.reviewee?.hrEmployeeId} className="flex items-center gap-3">
              <span className="text-sm min-w-[150px]">{name}</span>
              <Progress value={pct} className="flex-1" color={pct === 100 ? "success" : "primary"} size="sm" />
              <span className="text-sm text-muted-foreground min-w-[60px] text-right">{item.completed}/{item.total}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ===================== Modals =====================

function CycleModal({ cycleModal, editingCycle, cycleForm, onCycleFormChange, savingCycle, onSaveCycle }) {
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
              value={cycleForm.perf360CycleName}
              onValueChange={(v) => onCycleFormChange((f) => ({ ...f, perf360CycleName: v }))}
              isRequired
            />
            <Textarea
              label="รายละเอียด"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              value={cycleForm.perf360CycleDescription}
              onValueChange={(v) => onCycleFormChange((f) => ({ ...f, perf360CycleDescription: v }))}
            />
            <div className="flex gap-4">
              <Input
                label="ปี"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                type="number"
                value={cycleForm.perf360CycleYear}
                onValueChange={(v) => onCycleFormChange((f) => ({ ...f, perf360CycleYear: v }))}
                className="flex-1"
                isRequired
              />
              <Select
                label="ไตรมาส"
                variant="bordered"
                size="md"
                radius="md"
                labelPlacement="outside"
                selectedKeys={cycleForm.perf360CycleQuarter ? [cycleForm.perf360CycleQuarter] : []}
                onSelectionChange={(keys) => onCycleFormChange((f) => ({ ...f, perf360CycleQuarter: [...keys][0] || "" }))}
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
                value={cycleForm.perf360CycleResponseDeadline}
                onValueChange={(v) => onCycleFormChange((f) => ({ ...f, perf360CycleResponseDeadline: v }))}
                className="flex-1"
                isRequired
              />
            </div>
            <Switch
              isSelected={cycleForm.perf360CycleAnonymousToReviewee}
              onValueChange={(v) => onCycleFormChange((f) => ({ ...f, perf360CycleAnonymousToReviewee: v }))}
            >
              ไม่เปิดเผยตัวตนผู้ประเมิน (Anonymous)
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={cycleModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={onSaveCycle} isLoading={savingCycle} startContent={<Save className="w-4 h-4" />}>
            {editingCycle ? "บันทึก" : "สร้าง"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function NominationModal({ nominationModal, nominationForm, onNominationFormChange, savingNomination, onSaveNomination, employees }) {
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.hrEmployeeStatus === "active"),
    [employees],
  );

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
              selectedKeys={nominationForm.perf360NominationRevieweeEmployeeId ? [nominationForm.perf360NominationRevieweeEmployeeId] : []}
              onSelectionChange={(keys) => onNominationFormChange((f) => ({ ...f, perf360NominationRevieweeEmployeeId: [...keys][0] }))}
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.hrEmployeeId}>
                  {e.hrEmployeeFirstName} {e.hrEmployeeLastName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="ผู้ประเมิน"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              selectedKeys={nominationForm.perf360NominationReviewerEmployeeId ? [nominationForm.perf360NominationReviewerEmployeeId] : []}
              onSelectionChange={(keys) => onNominationFormChange((f) => ({ ...f, perf360NominationReviewerEmployeeId: [...keys][0] }))}
              isRequired
            >
              {activeEmployees.map((e) => (
                <SelectItem key={e.hrEmployeeId}>
                  {e.hrEmployeeFirstName} {e.hrEmployeeLastName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="ความสัมพันธ์"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              selectedKeys={[nominationForm.perf360NominationRelationshipType]}
              onSelectionChange={(keys) => onNominationFormChange((f) => ({ ...f, perf360NominationRelationshipType: [...keys][0] }))}
            >
              {RELATIONSHIP_TYPES.map((r) => (
                <SelectItem key={r.key}>{r.label}</SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={nominationModal.onClose}>ยกเลิก</Button>
          <Button color="primary" size="md" radius="md" onPress={onSaveNomination} isLoading={savingNomination}>
            เพิ่ม
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ReviewModal({
  reviewModal,
  activeReview,
  reviewCompetencies,
  reviewScores,
  onSetReviewScore,
  reviewComments,
  onReviewCommentsChange,
  submittingReview,
  onSubmitReview,
}) {
  if (!activeReview) return null;

  const revieweeName = activeReview.reviewee
    ? `${activeReview.reviewee.hrEmployeeFirstName} ${activeReview.reviewee.hrEmployeeLastName}`
    : "";

  const relType = getRelationshipType(activeReview.perf360NominationRelationshipType);

  // Count answered
  let totalQ = 0;
  let answeredQ = 0;
  for (const comp of reviewCompetencies) {
    totalQ += (comp.perf360CompetencyQuestions || []).length;
    const scores = reviewScores[comp.perf360CompetencyId] || [];
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
          <p className="text-sm text-muted-foreground mb-4">{answeredQ}/{totalQ} ข้อ</p>

          <Accordion selectionMode="multiple" defaultExpandedKeys={reviewCompetencies.map((c) => c.perf360CompetencyId)}>
            {reviewCompetencies.map((comp) => (
              <AccordionItem key={comp.perf360CompetencyId} title={comp.perf360CompetencyName} subtitle={comp.perf360CompetencyDescription}>
                <div className="flex flex-col gap-4">
                  {(comp.perf360CompetencyQuestions || []).map((question, qIdx) => {
                    const currentScore = (reviewScores[comp.perf360CompetencyId] || [])[qIdx] || 0;
                    return (
                      <div key={qIdx} className="p-2 rounded bg-default-50">
                        <p className="text-sm mb-2">
                          {qIdx + 1}. {question}
                        </p>
                        <RadioGroup
                          orientation="horizontal"
                          value={String(currentScore)}
                          onValueChange={(v) => onSetReviewScore(comp.perf360CompetencyId, qIdx, parseInt(v))}
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
              value={reviewComments.perf360ResponseStrengthComment}
              onValueChange={(v) => onReviewCommentsChange((c) => ({ ...c, perf360ResponseStrengthComment: v }))}
            />
            <Textarea
              label="จุดที่ควรพัฒนา"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="สิ่งที่ผู้ถูกประเมินควรปรับปรุง..."
              value={reviewComments.perf360ResponseImprovementComment}
              onValueChange={(v) => onReviewCommentsChange((c) => ({ ...c, perf360ResponseImprovementComment: v }))}
            />
            <Textarea
              label="ความคิดเห็นเพิ่มเติม"
              variant="bordered"
              size="md"
              radius="md"
              labelPlacement="outside"
              placeholder="ความคิดเห็นอื่นๆ..."
              value={reviewComments.perf360ResponseComment}
              onValueChange={(v) => onReviewCommentsChange((c) => ({ ...c, perf360ResponseComment: v }))}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={reviewModal.onClose}>ยกเลิก</Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={onSubmitReview}
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
