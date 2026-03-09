"use client";

import {
  Card,
  CardBody,
  Button,
  Chip,
  Accordion,
  AccordionItem,  Divider,
} from "@heroui/react";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, BookOpen, Target } from "lucide-react";
import Loading from "@/components/ui/Loading";

const COURSE_TYPE_MAP = {
  workshop: { label: "Workshop", color: "primary" },
  online: { label: "Online", color: "success" },
  book: { label: "Book", color: "warning" },
  activity: { label: "Activity", color: "secondary" },
};

export default function AiFeedbackPanel({
  employeeId,
  period,
  feedback,
  isLoading,
  isStale,
  onGenerate,
}) {
  if (!employeeId || !period) return null;

  return (
    <Card>
      <CardBody className="gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="font-light">AI Feedback & Recommendations</p>
          </div>

          <div className="flex items-center gap-2">
            {isStale && (
              <Chip size="md" color="warning" variant="flat">
                คะแนนมีการเปลี่ยนแปลง
              </Chip>
            )}
            <Button
              size="md"
              radius="md"
              color={feedback ? "default" : "primary"}
              variant={feedback ? "flat" : "solid"}
              startContent={
                feedback ? (
                  <RefreshCw className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )
              }
              onPress={() => onGenerate(!feedback)}
              isLoading={isLoading}
            >
              {feedback ? "สร้างใหม่" : "สร้าง AI Feedback"}
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loading />
            <p className="text-sm text-muted-foreground">กำลังวิเคราะห์ผลประเมิน...</p>
          </div>
        )}

        {!isLoading && !feedback && (
          <p className="text-sm text-muted-foreground text-center py-4">
            กดปุ่ม "สร้าง AI Feedback" เพื่อรับคำแนะนำจาก AI
          </p>
        )}

        {!isLoading && feedback && (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="bg-default-50 rounded-lg p-4">
              <p className="text-sm">{feedback.summary}</p>
            </div>

            <Divider />

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <p className="font-light text-sm text-success">จุดแข็ง</p>
                </div>
                {feedback.strengths?.map((s, i) => (
                  <div key={i} className="bg-success-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Chip size="md" color="success" variant="flat">
                        {s.categoryName}
                      </Chip>
                      <span className="text-sm text-muted-foreground">
                        {s.score?.toFixed(1)}/5.0
                      </span>
                    </div>
                    <p className="text-sm">{s.analysis}</p>
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-warning" />
                  <p className="font-light text-sm text-warning">จุดที่ควรพัฒนา</p>
                </div>
                {feedback.weaknesses?.map((w, i) => (
                  <div key={i} className="bg-warning-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Chip size="md" color="warning" variant="flat">
                        {w.categoryName}
                      </Chip>
                      <span className="text-sm text-muted-foreground">
                        {w.score?.toFixed(1)}/5.0
                      </span>
                    </div>
                    <p className="text-sm">{w.analysis}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-primary" />
                <p className="font-light text-sm">คำแนะนำเชิงปฏิบัติ</p>
              </div>
              <Accordion variant="flat" isCompact>
                {(feedback.recommendations || []).map((rec, i) => (
                  <AccordionItem
                    key={i}
                    title={
                      <div className="flex items-center gap-2 text-sm">
                        <Chip size="md" variant="flat" color="primary">
                          #{rec.priority}
                        </Chip>
                        <span>{rec.title}</span>
                        {rec.timeframe && (
                          <span className="text-sm text-muted-foreground">
                            ({rec.timeframe})
                          </span>
                        )}
                      </div>
                    }
                  >
                    <p className="text-sm pb-2">{rec.description}</p>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <Divider />

            {/* Courses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-secondary" />
                <p className="font-light text-sm">คอร์สและกิจกรรมแนะนำ</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(feedback.courses || []).map((course, i) => {
                  const typeInfo = COURSE_TYPE_MAP[course.type] || COURSE_TYPE_MAP.activity;
                  return (
                    <div
                      key={i}
                      className="border border-border rounded-lg p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-light flex-1">{course.title}</p>
                        <Chip size="md" variant="flat" color={typeInfo.color}>
                          {typeInfo.label}
                        </Chip>
                      </div>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {course.provider && <span>{course.provider}</span>}
                        {course.estimatedDuration && <span>{course.estimatedDuration}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
