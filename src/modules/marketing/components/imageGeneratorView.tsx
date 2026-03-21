"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardBody, Button, Textarea, Select, SelectItem, Spinner, Progress, Chip } from "@heroui/react";
import { Sparkles, Upload, Trash2, Clock, Download, X, Images } from "lucide-react";
import Loading from "@/components/ui/loading";
import type { ImageGeneratorViewProps } from "@/modules/marketing/types";

function downloadImage(url: string, filename = "generated.png") {
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob as Blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}

function downloadAll(results) {
  results
    .filter((r) => r.status === "success")
    .forEach((r, i) => {
      setTimeout(() => downloadImage(r.generatedImageUrl, `generated-${i + 1}.png`), i * 300);
    });
}

const sizes = [
  { key: "1024x1024", label: "1:1 (1024×1024)" },
  { key: "1536x1024", label: "3:2 แนวนอน (1536×1024)" },
  { key: "1024x1536", label: "2:3 แนวตั้ง (1024×1536)" },
  { key: "2016x864", label: "21:9 แนวนอน (2016×864)" },
];

export default function ImageGeneratorView({
  generate,
  generateBatch,
  generating,
  result,
  batchResults,
  batchProgress,
  reset,
  history,
  loadHistory,
  loadingHistory,
}: ImageGeneratorViewProps) {
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef(null);

  const isBatch = imageFiles.length > 1;

  useEffect(() => {
    if (showHistory && history.length === 0) loadHistory();
  }, [showHistory, history.length, loadHistory]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f as Blob)));
    reset();
  };

  const handleRemoveFile = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setPreviews(newPreviews);
    if (newFiles.length === 0 && fileRef.current) fileRef.current.value = "";
    reset();
  };

  const handleClearAll = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImageFiles([]);
    setPreviews([]);
    if (fileRef.current) fileRef.current.value = "";
    reset();
  };

  const handleGenerate = async () => {
    if (isBatch) {
      await generateBatch(imageFiles, prompt, size);
    } else {
      await generate(imageFiles[0], prompt, size);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-light">AI สร้างรูปภาพ</p>
          <p className="text-xs text-muted-foreground">สร้างและแก้ไขรูปภาพด้วย AI — รองรับหลายรูปพร้อมกัน</p>
        </div>
        <div className="flex items-center gap-2">
          {showHistory && (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Sparkles />}
              onPress={() => setShowHistory(false)}
            >
              สร้างใหม่
            </Button>
          )}
          <Button
            variant={showHistory ? "solid" : "bordered"}
            size="md"
            radius="md"
            startContent={<Clock />}
            onPress={() => setShowHistory(!showHistory)}
          >
            ประวัติ
          </Button>
        </div>
      </div>

      {showHistory ? (
        <HistoryPanel history={history} loading={loadingHistory} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Input */}
            <div className="flex flex-col gap-4">
              {/* Image upload */}
              <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
                <CardBody className="gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      รูปภาพต้นฉบับ
                    </p>
                    {imageFiles.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat">{imageFiles.length} รูป</Chip>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          startContent={<Trash2 />}
                          onPress={handleClearAll}
                        >
                          ล้างทั้งหมด
                        </Button>
                      </div>
                    )}
                  </div>

                  {previews.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                      {previews.map((src, i) => (
                        <div key={i} className="relative group">
                          <Image
                            src={src}
                            alt={imageFiles[i]?.name}
                            width={0}
                            height={80}
                            unoptimized
                            className="w-full h-20 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add more button */}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center justify-center w-full h-20 border-2 border-dashed border-default-300 rounded-lg hover:border-primary transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-default-400" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-default-300 rounded-xl p-10 hover:border-primary transition-colors cursor-pointer"
                    >
                      <Images className="text-default-400" />
                      <span className="text-xs text-muted-foreground">
                        คลิกเพื่อเลือกรูปภาพ (เลือกได้หลายรูป)
                      </span>
                      <span className="text-xs text-default-400">
                        PNG, JPG, WEBP (สูงสุด 20MB ต่อรูป)
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </CardBody>
              </Card>

              {/* Prompt + options */}
              <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
                <CardBody className="gap-4">
                  <Textarea
                    variant="bordered"
                    radius="md"
                    label="Prompt"
                    placeholder="อธิบายสิ่งที่ต้องการ เช่น เปลี่ยนพื้นหลังเป็นห้องนอนสไตล์มินิมอล..."
                    value={prompt}
                    onValueChange={setPrompt}
                    minRows={3}
                    maxRows={6}
                  />
                  <Select
                    variant="bordered"
                    radius="md"
                    size="md"
                    label="ขนาดภาพ"
                    selectedKeys={[size]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      if (val) setSize(String(val));
                    }}
                  >
                    {sizes.map((s) => (
                      <SelectItem key={s.key}>{s.label}</SelectItem>
                    ))}
                  </Select>
                  <Button
                    color="primary"
                    size="md"
                    radius="md"
                    startContent={generating ? null : <Sparkles />}
                    isLoading={generating}
                    isDisabled={imageFiles.length === 0 || !prompt.trim()}
                    onPress={handleGenerate}
                    fullWidth
                  >
                    {generating
                      ? batchProgress.total > 0
                        ? `กำลังสร้าง ${batchProgress.current}/${batchProgress.total}...`
                        : "กำลังสร้าง..."
                      : isBatch
                        ? `สร้างรูปภาพ ${imageFiles.length} รูป`
                        : "สร้างรูปภาพ"}
                  </Button>
                </CardBody>
              </Card>
            </div>

            {/* Right: Result */}
            <div className="flex flex-col gap-4">
              <Card shadow="none" className="border border-border min-h-[400px]">
                <CardBody className="items-center justify-center gap-4">
                  {generating && batchProgress.total > 0 ? (
                    <div className="flex flex-col items-center gap-3 w-full px-4">
                      <Spinner color="primary" variant="wave" />
                      <p className="text-xs text-muted-foreground">
                        กำลังสร้างรูปที่ {batchProgress.current} จาก {batchProgress.total}
                      </p>
                      <Progress
                        value={(batchProgress.current / batchProgress.total) * 100}
                        color="primary"
                        size="md"
                        className="w-full"
                      />
                    </div>
                  ) : generating ? (
                    <div className="flex flex-col items-center gap-3">
                      <Spinner color="primary" variant="wave" />
                      <p className="text-xs text-muted-foreground">
                        AI กำลังสร้างรูปภาพ อาจใช้เวลาสักครู่...
                      </p>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">ผลลัพธ์</p>
                      <Image
                        src={result.generatedImageUrl}
                        alt="Generated"
                        width={0}
                        height={0}
                        unoptimized
                        className="w-full max-h-[500px] object-contain rounded-lg"
                        style={{ height: "auto" }}
                      />
                      <Button
                        variant="bordered"
                        size="md"
                        radius="md"
                        startContent={<Download />}
                        onPress={() => downloadImage(result.generatedImageUrl)}
                      >
                        ดาวน์โหลด
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-default-400">
                      <Sparkles />
                      <p className="text-xs">ผลลัพธ์จะแสดงที่นี่</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Batch results grid */}
          {batchResults.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  ผลลัพธ์ทั้งหมด ({batchResults.filter((r) => r.status === "success").length}/{batchResults.length})
                </p>
                <Button
                  variant="bordered"
                  size="sm"
                  radius="md"
                  startContent={<Download />}
                  onPress={() => downloadAll(batchResults)}
                >
                  ดาวน์โหลดทั้งหมด
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {batchResults.map((item, i) => (
                  <Card
                    key={i}
                    shadow="none"
                    className={`border transition-colors duration-200 ${
                      item.status === "error" ? "border-danger" : "border-border hover:border-primary"
                    }`}
                  >
                    <CardBody className="gap-2 p-3">
                      {item.status === "success" ? (
                        <>
                          <Image
                            src={item.generatedImageUrl}
                            alt={`Result ${i + 1}`}
                            width={0}
                            height={160}
                            unoptimized
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-default-400 truncate">{item.file}</p>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => downloadImage(item.generatedImageUrl, `${item.file}-gen.png`)}
                            >
                              <Download />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                          <p className="text-xs text-danger">ล้มเหลว</p>
                          <p className="text-xs text-default-400 truncate w-full text-center">{item.file}</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ history, loading }: { history: ImageGeneratorViewProps["history"]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card shadow="none" className="border border-border">
        <CardBody className="items-center py-10 text-default-400">
          <Clock className="mb-2" />
          <p className="text-xs">ยังไม่มีประวัติการสร้างรูปภาพ</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {history.map((item) => (
        <Card
          key={item.mktGeneratedImageId}
          shadow="none"
          className="border border-border hover:border-primary transition-colors duration-200"
        >
          <CardBody className="gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Image
                src={item.mktGeneratedImageOriginalUrl}
                alt="Original"
                width={0}
                height={128}
                unoptimized
                className="w-full h-32 object-cover rounded-lg"
              />
              <Image
                src={item.mktGeneratedImageResultUrl}
                alt="Result"
                width={0}
                height={128}
                unoptimized
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.mktGeneratedImagePrompt}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-default-400">
                {new Date(item.mktGeneratedImageCreatedAt).toLocaleString("th-TH")}
              </p>
              <Button
                variant="bordered"
                size="sm"
                radius="md"
                startContent={<Download />}
                onPress={() => downloadImage(item.mktGeneratedImageResultUrl)}
              >
                ดาวน์โหลด
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
