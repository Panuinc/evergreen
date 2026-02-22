"use client";

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
  Chip,
  Spinner,
  Textarea,
} from "@heroui/react";
import { ClipboardList, BarChart3, Shield, Trash2, Save } from "lucide-react";
import { useEvaluation } from "@/hooks/useEvaluation";
import SpiderChart from "@/components/charts/SpiderChart";
import {
  EVALUATION_CATEGORIES,
  SCORE_LABELS,
  QUARTER_OPTIONS,
  getGradeColor,
} from "@/lib/evaluationCriteria";

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { key: String(y), label: String(y) };
});

export default function EvaluationPage() {
  const hook = useEvaluation();

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
        <h1 className="text-2xl font-bold">CHH² Core Values Evaluation</h1>
        <p className="text-default-500 text-sm">
          ประเมินพนักงาน 6 ด้าน พร้อม Spider Chart & ประวัติเปรียบเทียบรายรอบ
        </p>
      </div>

      <Tabs
        selectedKey={hook.activeTab}
        onSelectionChange={hook.setActiveTab}
        variant="solid"
        color="primary"
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
          <EvaluateTab hook={hook} />
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
              <span>สรุปภาพรวม</span>
            </div>
          }
        >
          <AdminTab hook={hook} />
        </Tab>
      </Tabs>
    </div>
  );
}

// ==================== Tab 1: Evaluate ====================

function EvaluateTab({ hook }) {
  const spiderDatasets = useMemo(() => {
    const hasAnyScore = Object.values(hook.categoryAverages).some((v) => v > 0);
    if (!hasAnyScore) return [];
    return [
      {
        label: "คะแนนปัจจุบัน",
        data: hook.categoryAverages,
        color: "#3b82f6",
        fillOpacity: 0.2,
      },
    ];
  }, [hook.categoryAverages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
      {/* Left: Form */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Info Card */}
        <Card>
          <CardBody className="gap-4">
            <p className="font-semibold">ข้อมูลการประเมิน</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="พนักงานที่ต้องการประเมิน"
                placeholder="เลือกพนักงาน"
                selectedKeys={hook.selectedEmployee ? [hook.selectedEmployee] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  hook.setSelectedEmployee(val || "");
                }}
              >
                {hook.employees.map((emp) => (
                  <SelectItem key={emp.employeeId}>
                    {`${emp.employeeFirstName} ${emp.employeeLastName}`}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="รอบประเมิน"
                selectedKeys={[hook.quarter]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) hook.setQuarter(val);
                }}
              >
                {QUARTER_OPTIONS.map((q) => (
                  <SelectItem key={q.key}>{q.label}</SelectItem>
                ))}
              </Select>

              <Select
                label="ปี"
                selectedKeys={[hook.year]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) hook.setYear(val);
                }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y.key}>{y.label}</SelectItem>
                ))}
              </Select>
            </div>

            {hook.currentEmployee && (
              <p className="text-sm text-default-400">
                ผู้ประเมิน: {hook.currentEmployee.employeeFirstName}{" "}
                {hook.currentEmployee.employeeLastName} | รอบ: {hook.period}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Score Legend */}
        <Card>
          <CardBody>
            <p className="font-semibold mb-2">เกณฑ์คะแนน (1-5)</p>
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <Chip
                  key={s}
                  size="sm"
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
              <p className="text-sm font-medium">
                ตอบแล้ว {hook.answeredCount}/{hook.totalQuestions}
              </p>
              <p className="text-sm text-default-400">{hook.progress}%</p>
            </div>
            <Progress
              value={hook.progress}
              color={hook.progress === 100 ? "success" : "primary"}
              size="sm"
            />
            {hook.overallScore > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-default-500">คะแนนเฉลี่ย:</span>
                <span className="text-lg font-bold">
                  {hook.overallScore.toFixed(2)}
                </span>
                <Chip size="sm" color={getGradeColor(hook.grade)}>
                  {hook.grade}
                </Chip>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Evaluation Sections */}
        <Accordion variant="bordered" selectionMode="multiple" defaultExpandedKeys={["0"]}>
          {EVALUATION_CATEGORIES.map((cat, catIdx) => {
            const catScores = hook.scores[cat.key] || [];
            const answered = catScores.filter((s) => s > 0).length;
            const avg = hook.categoryAverages[cat.key];

            return (
              <AccordionItem
                key={String(catIdx)}
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="font-semibold">
                      {catIdx + 1}. {cat.name}
                    </span>
                    <span className="text-default-400 text-sm">
                      ({cat.nameTh})
                    </span>
                    <Chip size="sm" variant="flat" color={answered === 5 ? "success" : "default"}>
                      {answered}/5
                    </Chip>
                    {avg > 0 && (
                      <Chip size="sm" variant="flat" color="primary">
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
                        <span className="text-default-400 mr-2">
                          {qIdx + 1}
                        </span>
                        {question}
                      </p>
                      <RadioGroup
                        orientation="horizontal"
                        value={String(catScores[qIdx] || "")}
                        onValueChange={(val) =>
                          hook.setScore(cat.key, qIdx, parseInt(val))
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
              placeholder="พิมพ์ความคิดเห็นเพิ่มเติม..."
              value={hook.comment}
              onValueChange={hook.setComment}
              minRows={2}
            />
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            color="primary"
            size="lg"
            startContent={<Save className="w-4 h-4" />}
            onPress={hook.handleSubmit}
            isLoading={hook.saving}
            isDisabled={hook.answeredCount < hook.totalQuestions}
          >
            บันทึกผลประเมิน
          </Button>
          <Button
            variant="flat"
            size="lg"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={hook.clearScores}
          >
            ล้างคะแนน
          </Button>
        </div>
      </div>

      {/* Right: Spider Chart Preview */}
      <div className="flex flex-col gap-4">
        <Card className="sticky top-4">
          <CardBody>
            <p className="font-semibold text-center mb-2">
              Spider Chart (Real-time)
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

function MyResultsTab({ hook }) {
  const {
    myResults,
    companyAverage,
    loadingResults,
    loadCompanyAverage,
    resultYear,
    setResultYear,
  } = hook;

  // Load company average when year changes
  const selectedPeriod = useMemo(() => {
    if (myResults.length > 0) return myResults[0]?.period;
    return `Q1-${resultYear}`;
  }, [myResults, resultYear]);

  // Spider chart datasets: one line per quarter
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

  // Spider chart with company average comparison
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
          className="max-w-[150px]"
          selectedKeys={[resultYear]}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0];
            if (val) {
              setResultYear(val);
              loadCompanyAverage(`Q1-${val}`);
            }
          }}
        >
          {YEAR_OPTIONS.map((y) => (
            <SelectItem key={y.key}>{y.label}</SelectItem>
          ))}
        </Select>

        <Button
          variant="flat"
          size="sm"
          onPress={() => loadCompanyAverage(selectedPeriod)}
        >
          โหลดค่าเฉลี่ยบริษัท
        </Button>
      </div>

      {loadingResults ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : myResults.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-default-400 py-8">
              ยังไม่มีผลประเมิน
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quarter comparison */}
            <Card>
              <CardBody>
                <p className="font-semibold text-center mb-2">
                  เปรียบเทียบรายรอบ {resultYear}
                </p>
                <SpiderChart datasets={quarterDatasets} height={350} />
              </CardBody>
            </Card>

            {/* Company average comparison */}
            <Card>
              <CardBody>
                <p className="font-semibold text-center mb-2">
                  เทียบกับค่าเฉลี่ยบริษัท
                </p>
                <SpiderChart datasets={comparisonDatasets} height={350} />
              </CardBody>
            </Card>
          </div>

          {/* Score Breakdown Table */}
          <Card>
            <CardBody>
              <p className="font-semibold mb-4">สรุปคะแนนรายรอบ</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-default-200">
                      <th className="text-left py-2 px-3">รอบ</th>
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
                    {myResults
                      .filter((r) => String(r.year) === resultYear)
                      .map((r) => (
                        <tr
                          key={r.period}
                          className="border-b border-default-100"
                        >
                          <td className="py-2 px-3 font-medium">
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
                          <td className="text-center py-2 px-3 font-bold">
                            {r.overallScore?.toFixed(2)}
                          </td>
                          <td className="text-center py-2 px-3">
                            <Chip size="sm" color={getGradeColor(r.grade)}>
                              {r.grade}
                            </Chip>
                          </td>
                          <td className="text-center py-2 px-3 text-default-400">
                            {r.evaluatorCount} คน
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

// ==================== Tab 3: Admin Summary ====================

function AdminTab({ hook }) {
  const { adminSummary, loadingAdmin, loadAdminSummary } = hook;
  const [adminPeriod, setAdminPeriod] = useState(() => {
    const q = Math.ceil((new Date().getMonth() + 1) / 3);
    return `Q${q}-${new Date().getFullYear()}`;
  });

  const handleLoadSummary = () => {
    loadAdminSummary(adminPeriod);
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <Card>
        <CardBody>
          <div className="flex items-center gap-4 flex-wrap">
            <Select
              label="รอบประเมิน"
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

            <Button color="primary" onPress={handleLoadSummary}>
              โหลดสรุป
            </Button>
          </div>
        </CardBody>
      </Card>

      {loadingAdmin ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : adminSummary.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-default-400 py-8">
              กดปุ่ม "โหลดสรุป" เพื่อดูผลประเมิน หรือยังไม่มีข้อมูลในรอบนี้
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="font-semibold mb-4">
              สรุปผลประเมิน {adminPeriod} ({adminSummary.length} คน)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200">
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
                      key={row.employee?.employeeId || idx}
                      className="border-b border-default-100 hover:bg-default-50"
                    >
                      <td className="py-2 px-3 text-default-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {row.employee?.employeeFirstName}{" "}
                        {row.employee?.employeeLastName}
                      </td>
                      <td className="py-2 px-3 text-default-500">
                        {row.employee?.employeeDepartment || "-"}
                      </td>
                      {EVALUATION_CATEGORIES.map((cat) => (
                        <td key={cat.key} className="text-center py-2 px-2">
                          {(row.categoryAverages?.[cat.key] || 0).toFixed(1)}
                        </td>
                      ))}
                      <td className="text-center py-2 px-3 font-bold">
                        {row.overallScore?.toFixed(2)}
                      </td>
                      <td className="text-center py-2 px-3">
                        <Chip size="sm" color={getGradeColor(row.grade)}>
                          {row.grade}
                        </Chip>
                      </td>
                      <td className="text-center py-2 px-3 text-default-400">
                        {row.evaluatorCount} คน
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

