"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Spinner,
  Divider,
} from "@heroui/react";
import { Printer, Save, TestTube } from "lucide-react";
import { toast } from "sonner";
import {
  getPrinterConfig,
  savePrinterConfig,
  getDefaultConfig,
} from "@/lib/printerConfig";
import { listPrinters, printTestLabel } from "@/lib/qzPrinter";

const PRINT_MODES = [
  { key: "DT", label: "Direct Thermal (DT)" },
  { key: "TT", label: "Thermal Transfer (TT)" },
];

const MEDIA_TYPES = [
  { key: "W", label: "Web Sensing (Gap)" },
  { key: "M", label: "Mark Sensing (Black Mark)" },
  { key: "N", label: "Continuous" },
];

const DPI_OPTIONS = [
  { key: "203", label: "203 DPI" },
  { key: "300", label: "300 DPI" },
];

const LANGUAGE_OPTIONS = [
  { key: "TSPL", label: "TSPL (แนะนำ)" },
  { key: "ZPL", label: "ZPL-II" },
];

export default function PrinterConfigPage() {
  const [config, setConfig] = useState(getDefaultConfig);
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setConfig(getPrinterConfig());
  }, []);

  const updateField = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    savePrinterConfig(config);
    toast.success("บันทึกการตั้งค่าเรียบร้อย");
  };

  const handleReset = () => {
    const def = getDefaultConfig();
    setConfig(def);
    savePrinterConfig(def);
    toast.success("รีเซ็ตเป็นค่าเริ่มต้นแล้ว");
  };

  const handleLoadPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const list = await listPrinters();
      const arr = Array.isArray(list) ? list : [list];
      setPrinters(arr);
      if (arr.length > 0 && !config.printerName) {
        const cp30 = arr.find((p) => p.toLowerCase().includes("cp30"));
        if (cp30) updateField("printerName", cp30);
      }
      toast.success(`พบเครื่องพิมพ์ ${arr.length} เครื่อง`);
    } catch {
      toast.error(
        "ไม่สามารถเชื่อมต่อ QZ Tray ได้ กรุณาตรวจสอบว่าเปิดโปรแกรมแล้ว",
      );
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleTestPrint = async () => {
    if (!config.printerName) {
      toast.error("กรุณาเลือกเครื่องพิมพ์ก่อน");
      return;
    }
    setTesting(true);
    try {
      savePrinterConfig(config);
      await printTestLabel(config.printerName);
      toast.success("ส่งพิมพ์ทดสอบแล้ว");
    } catch (err) {
      toast.error(`ทดสอบไม่สำเร็จ: ${err.message || err}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 max-w-2xl">
      {/* Printer Connection */}
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardHeader className="flex items-center gap-2 pb-0">
          <Printer size={20} />
          <p className="font-semibold text-lg">เครื่องพิมพ์</p>
        </CardHeader>
        <CardBody className="gap-3">
          <div className="flex gap-2 items-end">
            {loadingPrinters ? (
              <Spinner size="sm" label="กำลังค้นหา..." />
            ) : (
              <Select
                label="เลือกเครื่องพิมพ์"
                className="flex-1"
                selectedKeys={config.printerName ? [config.printerName] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0];
                  if (val) updateField("printerName", val);
                }}
              >
                {printers.map((p) => (
                  <SelectItem key={p}>{p}</SelectItem>
                ))}
              </Select>
            )}
            <Button variant="flat" onPress={handleLoadPrinters}>
              ค้นหา
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Print Settings */}
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardHeader className="pb-0">
          <p className="font-semibold text-lg">ตั้งค่าการพิมพ์</p>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="ภาษาเครื่องพิมพ์"
              selectedKeys={[config.printerLanguage]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) updateField("printerLanguage", val);
              }}
            >
              {LANGUAGE_OPTIONS.map((m) => (
                <SelectItem key={m.key}>{m.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="โหมดพิมพ์"
              selectedKeys={[config.printMode]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) updateField("printMode", val);
              }}
            >
              {PRINT_MODES.map((m) => (
                <SelectItem key={m.key}>{m.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="ประเภทกระดาษ"
              selectedKeys={[config.mediaType]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) updateField("mediaType", val);
              }}
            >
              {MEDIA_TYPES.map((m) => (
                <SelectItem key={m.key}>{m.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="DPI"
              selectedKeys={[String(config.dpi)]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0];
                if (val) updateField("dpi", Number(val));
              }}
            >
              {DPI_OPTIONS.map((m) => (
                <SelectItem key={m.key}>{m.label}</SelectItem>
              ))}
            </Select>
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="ความกว้าง Label (mm)"
              min={10}
              max={118}
              value={String(config.labelWidth)}
              onValueChange={(v) => updateField("labelWidth", Number(v))}
            />
            <Input
              type="number"
              label="ความสูง Label (mm)"
              min={5}
              max={300}
              value={String(config.labelHeight)}
              onValueChange={(v) => updateField("labelHeight", Number(v))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="ความเร็วพิมพ์ (ips)"
              min={1}
              max={8}
              value={String(config.printSpeed)}
              onValueChange={(v) => updateField("printSpeed", Number(v))}
            />
            <Input
              type="number"
              label="ความเข้ม (0-30)"
              min={0}
              max={30}
              value={String(config.darkness)}
              onValueChange={(v) => updateField("darkness", Number(v))}
            />
          </div>

          <Input
            type="number"
            label="ขนาดตัวอักษร (dots)"
            min={10}
            max={100}
            value={String(config.fontSize)}
            onValueChange={(v) => updateField("fontSize", Number(v))}
          />
        </CardBody>
      </Card>

      {/* Label Content */}
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardHeader className="pb-0">
          <p className="font-semibold text-lg">เนื้อหา Label</p>
        </CardHeader>
        <CardBody className="gap-3">
          <Switch
            isSelected={config.showPieceNumber}
            onValueChange={(v) => updateField("showPieceNumber", v)}
          >
            แสดงลำดับชิ้น (เช่น 1/10)
          </Switch>
          <Switch
            isSelected={config.showBarcode}
            onValueChange={(v) => updateField("showBarcode", v)}
          >
            แสดง Barcode
          </Switch>
          <Switch
            isSelected={config.encodeRfid}
            onValueChange={(v) => updateField("encodeRfid", v)}
          >
            เขียนข้อมูล RFID
          </Switch>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          color="primary"
          onPress={handleSave}
          startContent={<Save size={16} />}
        >
          บันทึก
        </Button>
        <Button
          color="success"
          variant="flat"
          onPress={handleTestPrint}
          isLoading={testing}
          startContent={!testing && <TestTube size={16} />}
        >
          พิมพ์ทดสอบ
        </Button>
        <Button variant="flat" onPress={handleReset}>
          รีเซ็ตค่าเริ่มต้น
        </Button>
      </div>
    </div>
  );
}
