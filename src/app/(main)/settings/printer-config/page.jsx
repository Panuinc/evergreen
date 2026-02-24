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
  Chip,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import { Printer, Save, TestTube, Wifi, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  getPrinterConfig,
  savePrinterConfig,
  getDefaultConfig,
} from "@/lib/printerConfig";
import {
  getTscPrinterConfig,
  saveTscPrinterConfig,
  getTscDefaultConfig,
} from "@/lib/tscPrinterConfig";
import { testConnection, printTestLabel } from "@/lib/qzPrinter";

const DPI_OPTIONS = [
  { key: "203", label: "203 DPI" },
  { key: "300", label: "300 DPI" },
];

// ─── CP30 (RFID) Tab ───────────────────────────────────────────────

function Cp30Settings() {
  const [config, setConfig] = useState(getDefaultConfig);
  const [connected, setConnected] = useState(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setConfig(getPrinterConfig());
  }, []);

  const updateField = (field, value) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    savePrinterConfig(config);
    toast.success("บันทึกการตั้งค่า CP30 เรียบร้อย");
  };

  const handleReset = () => {
    const def = getDefaultConfig();
    setConfig(def);
    savePrinterConfig(def);
    toast.success("รีเซ็ตค่า CP30 เป็นค่าเริ่มต้นแล้ว");
  };

  const handleTestConnection = async () => {
    setChecking(true);
    try {
      await testConnection();
      setConnected(true);
      toast.success("เชื่อมต่อเครื่องพิมพ์สำเร็จ");
    } catch {
      setConnected(false);
      toast.error("ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้ กรุณาตรวจสอบเครือข่าย");
    } finally {
      setChecking(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      savePrinterConfig(config);
      await printTestLabel();
      toast.success("ส่งพิมพ์ทดสอบแล้ว");
    } catch (err) {
      toast.error(`ทดสอบไม่สำเร็จ: ${err.message || err}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Printer Connection */}
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardHeader className="flex items-center gap-2 pb-0">
          <Printer size={20} />
          <p className="font-semibold text-lg">เครื่องพิมพ์</p>
        </CardHeader>
        <CardBody className="gap-3">
          <div className="flex gap-2 items-center">
            <p className="text-sm text-default-500">
              Chainway CP30 (Network — 192.168.1.110:9100)
            </p>
            {connected === true && (
              <Chip size="sm" color="success" variant="flat">
                เชื่อมต่อแล้ว
              </Chip>
            )}
            {connected === false && (
              <Chip size="sm" color="danger" variant="flat">
                ไม่พบเครื่องพิมพ์
              </Chip>
            )}
          </div>
          <Button
            variant="flat"
            size="md"
            radius="md"
            onPress={handleTestConnection}
            isLoading={checking}
            startContent={!checking && <Wifi size={16} />}
          >
            ทดสอบการเชื่อมต่อ
          </Button>
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
              label="DPI"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
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
            <Input
              type="number"
              label="ขนาดตัวอักษร (dots)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={10}
              max={100}
              value={String(config.fontSize)}
              onValueChange={(v) => updateField("fontSize", Number(v))}
            />
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="ความกว้าง Label (mm)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={10}
              max={118}
              value={String(config.labelWidth)}
              onValueChange={(v) => updateField("labelWidth", Number(v))}
            />
            <Input
              type="number"
              label="ความสูง Label (mm)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={5}
              max={300}
              value={String(config.labelHeight)}
              onValueChange={(v) => updateField("labelHeight", Number(v))}
            />
          </div>

          <Input
            type="number"
            label="เลื่อนแนวนอน (mm)"
            labelPlacement="outside"
            variant="bordered"
            size="md"
            radius="md"
            min={0}
            max={30}
            value={String(config.labelShift || 0)}
            onValueChange={(v) => updateField("labelShift", Number(v))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="ความเร็วพิมพ์ (ips)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={1}
              max={8}
              value={String(config.printSpeed)}
              onValueChange={(v) => updateField("printSpeed", Number(v))}
            />
            <Input
              type="number"
              label="ความเข้ม (0-30)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={0}
              max={30}
              value={String(config.darkness)}
              onValueChange={(v) => updateField("darkness", Number(v))}
            />
          </div>
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
          size="md"
          radius="md"
          onPress={handleSave}
          startContent={<Save size={16} />}
        >
          บันทึก
        </Button>
        <Button
          color="success"
          variant="flat"
          size="md"
          radius="md"
          onPress={handleTestPrint}
          isLoading={testing}
          startContent={!testing && <TestTube size={16} />}
        >
          พิมพ์ทดสอบ
        </Button>
        <Button variant="flat" size="md" radius="md" onPress={handleReset}>
          รีเซ็ตค่าเริ่มต้น
        </Button>
      </div>
    </div>
  );
}

// ─── TSC TE Tab ─────────────────────────────────────────────────────

function TscTeSettings() {
  const [config, setConfig] = useState(getTscDefaultConfig);
  const [connected, setConnected] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setConfig(getTscPrinterConfig());
  }, []);

  const updateField = (field, value) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    saveTscPrinterConfig(config);
    toast.success("บันทึกการตั้งค่า TSC TE เรียบร้อย");
  };

  const handleReset = () => {
    const def = getTscDefaultConfig();
    setConfig(def);
    saveTscPrinterConfig(def);
    toast.success("รีเซ็ตค่า TSC TE เป็นค่าเริ่มต้นแล้ว");
  };

  const handleTestConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/warehouse/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "testConnection",
          printer: "tsc-te",
          host: config.host,
          port: config.port,
        }),
      });
      if (!res.ok) throw new Error("Connection failed");
      setConnected(true);
      toast.success("เชื่อมต่อ TSC TE สำเร็จ");
    } catch {
      setConnected(false);
      toast.error("ไม่สามารถเชื่อมต่อ TSC TE ได้");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Printer Connection */}
      <Card shadow="none" className="bg-default-50 border-2 border-default">
        <CardHeader className="flex items-center gap-2 pb-0">
          <Printer size={20} />
          <p className="font-semibold text-lg">เครื่องพิมพ์</p>
        </CardHeader>
        <CardBody className="gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="IP Address"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              value={config.host}
              onValueChange={(v) => updateField("host", v)}
            />
            <Input
              type="number"
              label="Port"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              value={String(config.port)}
              onValueChange={(v) => updateField("port", Number(v))}
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="flat"
              size="md"
              radius="md"
              onPress={handleTestConnection}
              isLoading={checking}
              startContent={!checking && <Wifi size={16} />}
            >
              ทดสอบการเชื่อมต่อ
            </Button>
            {connected === true && (
              <Chip size="sm" color="success" variant="flat">
                เชื่อมต่อแล้ว
              </Chip>
            )}
            {connected === false && (
              <Chip size="sm" color="danger" variant="flat">
                ไม่พบเครื่องพิมพ์
              </Chip>
            )}
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
              label="DPI"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
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
            <Input
              type="number"
              label="ขนาดตัวอักษร (dots)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={10}
              max={100}
              value={String(config.fontSize)}
              onValueChange={(v) => updateField("fontSize", Number(v))}
            />
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="ความกว้าง Label (mm)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={10}
              max={200}
              value={String(config.labelWidth)}
              onValueChange={(v) => updateField("labelWidth", Number(v))}
            />
            <Input
              type="number"
              label="ความสูง Label (mm)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
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
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={1}
              max={10}
              value={String(config.printSpeed)}
              onValueChange={(v) => updateField("printSpeed", Number(v))}
            />
            <Input
              type="number"
              label="ความเข้ม (0-15)"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={0}
              max={15}
              value={String(config.darkness)}
              onValueChange={(v) => updateField("darkness", Number(v))}
            />
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          color="primary"
          size="md"
          radius="md"
          onPress={handleSave}
          startContent={<Save size={16} />}
        >
          บันทึก
        </Button>
        <Button
          variant="flat"
          size="md"
          radius="md"
          onPress={handleReset}
          startContent={<RotateCcw size={16} />}
        >
          รีเซ็ตค่าเริ่มต้น
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function PrinterConfigPage() {
  return (
    <div className="flex flex-col w-full gap-4 max-w-2xl">
      <Tabs aria-label="Printer" variant="underlined" color="primary" size="lg">
        <Tab key="cp30" title="Chainway CP30 (RFID)">
          <Cp30Settings />
        </Tab>
        <Tab key="tsc-te" title="TSC TE">
          <TscTeSettings />
        </Tab>
      </Tabs>
    </div>
  );
}
