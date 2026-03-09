import { useState, useMemo } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Select,
  SelectItem,
  Button,
  Progress,
  Accordion,
  AccordionItem,
  RadioGroup,
  Radio,
  Chip,  Textarea,
} from "@heroui/react";
import { ClipboardList, BarChart3, Shield, Trash2, Save, Sparkles } from "lucide-react";
import SpiderChart from "@/modules/performance/components/SpiderChart";
import AiFeedbackPanel from "@/modules/performance/components/AiFeedbackPanel";
import {
  EVALUATION_CATEGORIES,
  SCORE_LABELS,
  QUARTER_OPTIONS,
  getGradeColor,
} from "@/lib/performance/evaluationCriteria";
import Loading from "@/components/ui/Loading";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

export default function EvaluationView({
  activeTab,
  onTabChange,
  employees,
  selectedEmployee,
  onSelectEmployee,
  quarter,
  onQuarterChange,
  year,
  onYearChange,
  currentEmployee,
  perfEvaluationPeriod,
  scores,
  onSetScore,
  categoryAverages,
  overallScore,
  grade,
  answeredCount,
  totalQuestions,
  progress,
  comment,
  onCommentChange,
  onSubmit,
  saving,
  onClearScores,
  myResults,
  companyAverage,
  loadingResults,
  onLoadCompanyAverage,
  resultYear,
  onResultYearChange,
  aiFeedback,
  loadingFeedback,
  feedbackStale,
  onLoadAiFeedback,
  onClearAiFeedback,
  adminSummary,
  loadingAdmin,
  onLoadAdminSummary,
}) {
  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div>
        <p className="text-sm font-light">ประเมินค่านิยม CHH²</p>
        <p className="text-muted-foreground text-sm">
          ประเมินพนักงาน 6 ด้าน พร้อม Spider Chart & ประวัติเปรียบเทียบรายรอบ
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
          key="evaluate"
          title={
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span>ประเมิน</span>
            </div>
          }
        >
          <EvaluateTab
            employees={employees}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={onSelectEmployee}
            quarter={quarter}
            onQuarterChange={onQuarterChange}
            year={year}
            onYearChange={onYearChange}
            currentEmployee={currentEmployee}
            perfEvaluationPeriod={perfEvaluationPeriod}
            scores={scores}
            onSetScore={onSetScore}
            categoryAverages={categoryAverages}
            overallScore={overallScore}
            grade={grade}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
            progress={progress}
            comment={comment}
            onCommentChange={onCommentChange}
            onSubmit={onSubmit}
            saving={saving}
            onClearScores={onClearScores}
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
            myResults={myResults}
            companyAverage={companyAverage}
            loadingResults={loadingResults}
            onLoadCompanyAverage={onLoadCompanyAverage}
            resultYear={resultYear}
            onResultYearChange={onResultYearChange}
            aiFeedback={aiFeedback}
            loadingFeedback={loadingFeedback}
            feedbackStale={feedbackStale}
            onLoadAiFeedback={onLoadAiFeedback}
            onClearAiFeedback={onClearAiFeedback}
            currentEmployee={currentEmployee}
          />
        </Tab>
        <Tab
          key="admin"
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>สรุปภาพรวม</span>
            </div>
          }
        >
          <AdminTab
            adminSummary={adminSummary}
            loadingAdmin={loadingAdmin}
            onLoadAdminSummary={onLoadAdminSummary}
            aiFeedback={aiFeedback}
            loadingFeedback={loadingFeedback}
            feedbackStale={feedbackStale}
            onLoadAiFeedback={onLoadAiFeedback}
            onClearAiFeedback={onClearAiFeedback}
          />
        </Tab>
      </Tabs>
    </div>
  );
}

// ==================== Tab 1: Evaluate ====================

function EvaluateTab({
  employees,
  selectedEmployee,
  onSelectEmployee,
  quarter,
  onQuarterChange,
  year,
  onYearChange,
  currentEmployee,
  perfEvaluationPeriod,
  scores,
  onSetScore,
  categoryAverages,
  overallScore,
  grade,
  answeredCount,
  totalQuestions,
  progress,
  comment,
  onCommentChange,
  onSubmit,
  saving,
  onClearScores,
}) {
  const spiderDatasets = useMemo(() => {
    const hasAnyScore = Object.values(categoryAverages).some((v) => v > 0);
    if (!hasAnyScore) return [];
    return [
      {
        label: "คะแนนปัจจุบัน",
        data: categoryAverages,
        color: "#3b82f6",
        fillOpacity: 0.2,
      },
    ];
  }, [categoryAverages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      {/* Left: Form */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Info Card */}
        <Card>
          <CardBody className="gap-4">
            <p className="font-light">ข้อมูลการประเมิน</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="พนักงานที่ต้องการประเมิน"
                labelPlacement="outside"
                placeholder="เลือกพนักงาน"
                variant="bordered"
                size="md"
                radius="md"
                selectedKeys={selectedEmployee ? [selectedEmployee] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  onSelectEmployee(val || "");
                }}
              >
                {employees.map((emp) => (
                  <SelectItem key={emp.hrEmployeeId}>
                    {`${emp.hrEmployeeFirstName} ${emp.hrEmployeeLastName}`}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="รอบประเมิน"
                labelPlacement="outside"
                variant="bordered"
                size="md"
                radius="md"
                selectedKeys={[quarter]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) onQuarterChange(val);
                }}
              >
                {QUARTER_OPTIONS.map((q) => (
                  <SelectItem key={q.key}>{q.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="ปี"
                labelPlacement="outside"
                variant="bordered"
                size="md"
                radius="md"
                selectedKeys={[year]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) onYearChange(val);
                }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y.key}>{y.label}</SelectItem>
                ))}
              </Select>
            </div>

            {currentEmployee && (
              <p className="text-sm text-muted-foreground">
                ผู้ประเมิน: {currentEmployee.hrEmployeeFirstName}{" "}
                {currentEmployee.hrEmployeeLastName} | รอบ: {perfEvaluationPeriod}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Score Legend */}
        <Card>
          <CardBody>
            <p className="font-light mb-2">เกณฑ์คะแนน (1-5)</p>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <Chip
                  key={s}
                  size="md"
                  radius="md"
                  variant="flat"
                  color={SCORE_LABELS[s].color}
                >
                  {s} — {SCORE_LABELS[s].label} ({SCORE_LABELS[s].description})
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Progress */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-light">
                ตอบแล้ว {answeredCount}/{totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
            <Progress
              value={progress}
              color={progress === 100 ? "success" : "primary"}
              size="sm"
            />
            {overallScore > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-muted-foreground">คะแนนเฉลี่ย:</span>
                <span className="text-sm font-light">
                  {overallScore.toFixed(2)}
                </span>
                <Chip size="md" radius="md" color={getGradeColor(grade)}>
                  {grade}
                </Chip>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Evaluation Sections */}
        <Accordion variant="flat" selectionMode="multiple" defaultExpandedKeys={["0"]}>
          {EVALUATION_CATEGORIES.map((cat, catIdx) => {
            const catScores = scores[cat.key] || [];
            const answered = catScores.filter((s) => s > 0).length;
            const avg = categoryAverages[cat.key];

            return (
              <AccordionItem
                key={String(catIdx)}
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="font-light">
                      {catIdx + 1}. {cat.name}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({cat.nameTh})
                    </span>
                    <Chip size="md" radius="md" variant="flat" color={answered === 5 ? "success" : "default"}>
                      {answered}/5
                    </Chip>
                    {avg > 0 && (
                      <Chip size="md" radius="md" variant="flat" color="primary">
                        {avg.toFixed(1)}
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="flex flex-col gap-6 py-2">
                  {cat.questions.map((question, qIdx) => (
                    <div key={qIdx}>
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground mr-2">
                          {qIdx + 1}
                        </span>
                        {question}
                      </p>
                      <RadioGroup
                        orientation="horizontal"
                        value={String(catScores[qIdx] || "")}
                        onValueChange={(val) =>
                          onSetScore(cat.key, qIdx, parseInt(val))
                        }
                        size="sm"
                      >
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Radio key={v} value={String(v)}>
                            {v}
                          </Radio>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Comment */}
        <Card>
          <CardBody>
            <Textarea
              label="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
              labelPlacement="outside"
              placeholder="พิมพ์ความคิดเห็นเพิ่มเติม..."
              variant="flat"
              size="md"
              radius="md"
              value={comment}
              onValueChange={onCommentChange}
              minRows={2}
            />
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            color="primary"
            size="md"
            radius="md"
            startContent={<Save className="w-4 h-4" />}
            onPress={onSubmit}
            isLoading={saving}
            isDisabled={answeredCount < totalQuestions}
          >
            บันทึกผลประเมิน
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={onClearScores}
          >
            ล้างคะแนน
          </Button>
        </div>
      </div>

      {/* Right: Spider Chart Preview */}
      <div className="flex flex-col gap-4">
        <Card className="sticky top-4">
          <CardBody>
            <p className="font-light text-center mb-2">
              แผนภูมิใยแมงมุม (เรียลไทม์)
            </p>
            <SpiderChart
              datasets={spiderDatasets}
              height={320}
              showLegend={false}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ==================== Tab 2: My Results ====================

function MyResultsTab({
  myResults,
  companyAverage,
  loadingResults,
  onLoadCompanyAverage,
  resultYear,
  onResultYearChange,
  aiFeedback,
  loadingFeedback,
  feedbackStale,
  onLoadAiFeedback,
  onClearAiFeedback,
  currentEmployee,
}) {
  const [feedbackPeriod, setFeedbackPeriod] = useState(null);

  const selectedPeriod = useMemo(() => {
    if (myResults.length > 0) return myResults[0]?.period;
    return `Q1-${resultYear}`;
  }, [myResults, resultYear]);

  const quarterDatasets = useMemo(() => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
    return myResults
      .filter((r) => String(r.year) === resultYear)
      .map((r, i) => ({
        label: `Q${r.quarter}/${r.year}`,
        data: r.categoryAverages,
        color: colors[i % colors.length],
        fillOpacity: 0.1,
      }));
  }, [myResults, resultYear]);

  const comparisonDatasets = useMemo(() => {
    const ds = [];
    const myLatest = myResults.find(
      (r) => String(r.year) === resultYear,
    );
    if (myLatest) {
      ds.push({
        label: "คะแนนของฉัน",
        data: myLatest.categoryAverages,
        color: "#3b82f6",
        fillOpacity: 0.15,
      });
    }
    if (companyAverage?.categoryAverages) {
      ds.push({
        label: "ค่าเฉลี่ยบริษัท",
        data: companyAverage.categoryAverages,
        color: "#a1a1aa",
        fillOpacity: 0.1,
      });
    }
    return ds;
  }, [myResults, companyAverage, resultYear]);

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center gap-4">
        <Select
          label="ปี"
          labelPlacement="outside"
          variant="bordered"
          size="md"
          radius="md"
          className="max-w-[150px]"
          selectedKeys={[resultYear]}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) {
              onResultYearChange(val);
              onLoadCompanyAverage(`Q1-${val}`);
            }
          }}
        >
          {YEAR_OPTIONS.map((y) => (
            <SelectItem key={y.key}>{y.label}</SelectItem>
          ))}
        </Select>

        <Button
          variant="bordered"
          size="md"
          radius="md"
          onPress={() => onLoadCompanyAverage(selectedPeriod)}
        >
          โหลดค่าเฉลี่ยบริษัท
        </Button>
      </div>

      {loadingResults ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : myResults.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีผลประเมิน
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <p className="font-light text-center mb-2">
                  เปรียบเทียบรายรอบ {resultYear}
                </p>
                <SpiderChart datasets={quarterDatasets} height={350} />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="font-light text-center mb-2">
                  เทียบกับค่าเฉลี่ยบริษัท
                </p>
                <SpiderChart datasets={comparisonDatasets} height={350} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <p className="font-light mb-4">สรุปคะแนนรายรอบ</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3">รอบ</th>
                      {EVALUATION_CATEGORIES.map((cat) => (
                        <th key={cat.key} className="text-center py-2 px-2">
                          {cat.emoji}
                        </th>
                      ))}
                      <th className="text-center py-2 px-3">เฉลี่ย</th>
                      <th className="text-center py-2 px-3">เกรด</th>
                      <th className="text-center py-2 px-3">ผู้ประเมิน</th>
                      <th className="text-center py-2 px-3">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myResults
                      .filter((r) => String(r.year) === resultYear)
                      .map((r) => (
                        <tr
                          key={r.period}
                          className="border-b border-border"
                        >
                          <td className="py-2 px-3 font-light">
                            Q{r.quarter}/{r.year}
                          </td>
                          {EVALUATION_CATEGORIES.map((cat) => (
                            <td
                              key={cat.key}
                              className="text-center py-2 px-2"
                            >
                              {(r.categoryAverages?.[cat.key] || 0).toFixed(1)}
                            </td>
                          ))}
                          <td className="text-center py-2 px-3 font-light">
                            {r.overallScore?.toFixed(2)}
                          </td>
                          <td className="text-center py-2 px-3">
                            <Chip size="md" radius="md" color={getGradeColor(r.grade)}>
                              {r.grade}
                            </Chip>
                          </td>
                          <td className="text-center py-2 px-3 text-muted-foreground">
                            {r.evaluatorCount} คน
                          </td>
                          <td className="text-center py-2 px-3">
                            <Button
                              size="md"
                              radius="md"
                              variant={feedbackPeriod === r.period ? "solid" : "flat"}
                              color="secondary"
                              startContent={<Sparkles className="w-3 h-3" />}
                              onPress={() => {
                                if (feedbackPeriod === r.period) {
                                  setFeedbackPeriod(null);
                                  onClearAiFeedback();
                                } else {
                                  setFeedbackPeriod(r.period);
                                  onClearAiFeedback();
                                }
                              }}
                            >
                              AI
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {feedbackPeriod && currentEmployee && (
            <AiFeedbackPanel
              employeeId={currentEmployee.hrEmployeeId}
              period={feedbackPeriod}
              feedback={aiFeedback}
              isLoading={loadingFeedback}
              isStale={feedbackStale}
              onGenerate={(force) =>
                onLoadAiFeedback(currentEmployee.hrEmployeeId, feedbackPeriod, force)
              }
            />
          )}
        </>
      )}
    </div>
  );
}

// ==================== Tab 3: Admin Summary ====================

function AdminTab({
  adminSummary,
  loadingAdmin,
  onLoadAdminSummary,
  aiFeedback,
  loadingFeedback,
  feedbackStale,
  onLoadAiFeedback,
  onClearAiFeedback,
}) {
  const [adminPeriod, setAdminPeriod] = useState(() => {
    const q = Math.ceil((new Date().getMonth() + 1) / 3);
    return `Q${q}-${new Date().getFullYear()}`;
  });
  const [selectedAdminEmployee, setSelectedAdminEmployee] = useState(null);

  const handleLoadSummary = () => {
    onLoadAdminSummary(adminPeriod);
    setSelectedAdminEmployee(null);
    onClearAiFeedback();
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 flex-wrap">
            <Select
              label="รอบประเมิน"
              labelPlacement="outside"
              variant="flat"
              size="md"
              radius="md"
              className="max-w-[200px]"
              selectedKeys={[adminPeriod.split("-")[0].replace("Q", "")]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) {
                  const y = adminPeriod.split("-")[1];
                  setAdminPeriod(`Q${val}-${y}`);
                }
              }}
            >
              {QUARTER_OPTIONS.map((q) => (
                <SelectItem key={q.key}>{q.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="ปี"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              className="max-w-[120px]"
              selectedKeys={[adminPeriod.split("-")[1]]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) {
                  const q = adminPeriod.split("-")[0];
                  setAdminPeriod(`${q}-${val}`);
                }
              }}
            >
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y.key}>{y.label}</SelectItem>
              ))}
            </Select>

            <Button color="primary" size="md" radius="md" onPress={handleLoadSummary}>
              โหลดสรุป
            </Button>
          </div>
        </CardBody>
      </Card>

      {loadingAdmin ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : adminSummary.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-muted-foreground py-8">
              กดปุ่ม "โหลดสรุป" เพื่อดูผลประเมิน หรือยังไม่มีข้อมูลในรอบนี้
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
        <Card>
          <CardBody>
            <p className="font-light mb-4">
              สรุปผลประเมิน {adminPeriod} ({adminSummary.length} คน)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">ชื่อพนักงาน</th>
                    <th className="text-left py-2 px-3">แผนก</th>
                    {EVALUATION_CATEGORIES.map((cat) => (
                      <th key={cat.key} className="text-center py-2 px-2">
                        {cat.emoji}
                      </th>
                    ))}
                    <th className="text-center py-2 px-3">เฉลี่ย</th>
                    <th className="text-center py-2 px-3">เกรด</th>
                    <th className="text-center py-2 px-3">ผู้ประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSummary.map((row, idx) => (
                    <tr
                      key={row.employee?.hrEmployeeId || idx}
                      className={`border-b border-border hover:bg-default-50 cursor-pointer ${selectedAdminEmployee === row.employee?.hrEmployeeId ? "bg-primary-50" : ""}`}
                      onClick={() => {
                        if (selectedAdminEmployee === row.employee?.hrEmployeeId) {
                          setSelectedAdminEmployee(null);
                          onClearAiFeedback();
                        } else {
                          setSelectedAdminEmployee(row.employee?.hrEmployeeId);
                          onClearAiFeedback();
                        }
                      }}
                    >
                      <td className="py-2 px-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-light">
                        {row.employee?.hrEmployeeFirstName}{" "}
                        {row.employee?.hrEmployeeLastName}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {row.employee?.hrEmployeeDepartment || "-"}
                      </td>
                      {EVALUATION_CATEGORIES.map((cat) => (
                        <td key={cat.key} className="text-center py-2 px-2">
                          {(row.categoryAverages?.[cat.key] || 0).toFixed(1)}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 font-light">
                        {row.overallScore?.toFixed(2)}
                      </td>
                      <td className="text-center py-2 px-3">
                        <Chip size="md" radius="md" color={getGradeColor(row.grade)}>
                          {row.grade}
                        </Chip>
                      </td>
                      <td className="text-center py-2 px-3 text-muted-foreground">
                        {row.evaluatorCount} คน
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedAdminEmployee && (
              <p className="text-sm text-muted-foreground mt-2">
                คลิกอีกครั้งเพื่อยกเลิกการเลือก
              </p>
            )}
          </CardBody>
        </Card>

        {selectedAdminEmployee && (
          <AiFeedbackPanel
            employeeId={selectedAdminEmployee}
            period={adminPeriod}
            feedback={aiFeedback}
            isLoading={loadingFeedback}
            isStale={feedbackStale}
            onGenerate={(force) =>
              onLoadAiFeedback(selectedAdminEmployee, adminPeriod, force)
            }
          />
        )}
        </>
      )}
    </div>
  );
}
