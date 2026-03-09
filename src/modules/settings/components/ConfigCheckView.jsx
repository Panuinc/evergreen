"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  RefreshCw,
  Database,
  Building2,
  Bot,
  MessageCircle,
  Facebook,
  Printer,
  Save,
  TestTube,
  Wifi,
  RotateCcw,
  Activity,
} from "lucide-react";
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
import Loading from "@/components/ui/Loading";



const services = [
  {
    key: "supabase",
    name: "Supabase",
    description: "ฐานข้อมูลและการยืนยันตัวตน",
    icon: Database,
  },
  {
    key: "bc",
    name: "365 Business Central",
    description: "เชื่อมต่อ ERP (OAuth2)",
    icon: Building2,
  },
  {
    key: "openrouter",
    name: "OpenRouter AI",
    description: "AI Chatbot (Gemini 2.5 Flash Lite)",
    icon: Bot,
  },
  {
    key: "line",
    name: "LINE Messaging API",
    description: "ช่องทางรวม — LINE Official Account",
    icon: MessageCircle,
  },
  {
    key: "facebook",
    name: "Facebook Graph API",
    description: "ช่องทางรวม — Facebook Page",
    icon: Facebook,
  },
];



function SystemStatusTab({ status, loading, refetch }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="bordered"
          size="md"
          radius="md"
          startContent={<RefreshCw />}
          onPress={refetch}
          isLoading={loading}
        >
          ตรวจสอบอีกครั้ง
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => {
            const data = status?.[service.key];
            const isConnected = data?.status === "connected";
            const Icon = service.icon;

            return (
              <Card
                key={service.key}
                shadow="none"
                className="border border-border hover:border-primary transition-colors duration-200"
              >
                <CardBody className="gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon />
                      <div>
                        <p className="font-light text-xs">{service.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <Chip
                      variant="flat"
                      size="md"
                      radius="md"
                      color={isConnected ? "success" : "danger"}
                    >
                      {data?.status === "connected"
                        ? "เชื่อมต่อแล้ว"
                        : data?.status === "disconnected"
                          ? "ไม่ได้เชื่อมต่อ"
                          : data?.status || "กำลังตรวจสอบ..."}
                    </Chip>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เวลาตอบสนอง</span>
                      <span>
                        {data?.latency != null ? `${data.latency} ms` : "-"}
                      </span>
                    </div>
                    {data?.detail && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">บัญชี</span>
                        <span className="font-light">{data.detail}</span>
                      </div>
                    )}
                    {data?.error && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-muted-foreground">ข้อผิดพลาด</span>
                        <span className="text-danger text-xs break-all">
                          {data.error}
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}



const DPI_OPTIONS = [
  { key: "203", label: "203 DPI" },
  { key: "300", label: "300 DPI" },
];

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
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="flex items-center gap-2 pb-0">
          <Printer />
          <p className="font-light text-xs">Chainway CP30 (RFID)</p>
        </CardHeader>
        <CardBody className="gap-3">
          <div className="flex gap-2 items-center">
            <p className="text-xs text-muted-foreground">
              Network — 192.168.1.110:9100
            </p>
            {connected === true && (
              <Chip variant="flat" size="md" radius="md" color="success">
                เชื่อมต่อแล้ว
              </Chip>
            )}
            {connected === false && (
              <Chip variant="flat" size="md" radius="md" color="danger">
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
            startContent={!checking && <Wifi />}
          >
            ทดสอบการเชื่อมต่อ
          </Button>
        </CardBody>
      </Card>

      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <p className="font-light text-xs">ตั้งค่าการพิมพ์</p>
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

      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <p className="font-light text-xs">เนื้อหา Label</p>
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

      <div className="flex gap-2">
        <Button
          variant="bordered"
          size="md"
          radius="md"
          onPress={handleSave}
          startContent={<Save />}
        >
          บันทึก
        </Button>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          onPress={handleTestPrint}
          isLoading={testing}
          startContent={!testing && <TestTube />}
        >
          พิมพ์ทดสอบ
        </Button>
        <Button variant="bordered" size="md" radius="md" onPress={handleReset}>
          รีเซ็ตค่าเริ่มต้น
        </Button>
      </div>
    </div>
  );
}



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
      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="flex items-center gap-2 pb-0">
          <Printer />
          <p className="font-light text-xs">TSC TE</p>
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
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleTestConnection}
              isLoading={checking}
              startContent={!checking && <Wifi />}
            >
              ทดสอบการเชื่อมต่อ
            </Button>
            {connected === true && (
              <Chip variant="flat" size="md" radius="md" color="success">
                เชื่อมต่อแล้ว
              </Chip>
            )}
            {connected === false && (
              <Chip variant="flat" size="md" radius="md" color="danger">
                ไม่พบเครื่องพิมพ์
              </Chip>
            )}
          </div>
        </CardBody>
      </Card>

      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <p className="font-light text-xs">ตั้งค่าการพิมพ์</p>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="DPI"
              labelPlacement="outside"
              variant="flat"
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

      <div className="flex gap-2">
        <Button
          variant="bordered"
          size="md"
          radius="md"
          onPress={handleSave}
          startContent={<Save />}
        >
          บันทึก
        </Button>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          onPress={handleReset}
          startContent={<RotateCcw />}
        >
          รีเซ็ตค่าเริ่มต้น
        </Button>
      </div>
    </div>
  );
}



function PrinterTab() {
  return (
    <Tabs aria-label="Printer" variant="bordered" size="md" radius="md">
      <Tab key="cp30" title="Chainway CP30 (RFID)">
        <Cp30Settings />
      </Tab>
      <Tab key="tsc-te" title="TSC TE">
        <TscTeSettings />
      </Tab>
    </Tabs>
  );
}



export default function ConfigCheckView({ status, loading, refetch }) {
  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">ตั้งค่าระบบ</p>

      <Tabs aria-label="Settings" variant="bordered" size="md" radius="md">
        <Tab
          key="status"
          title={
            <div className="flex items-center gap-2">
              <Activity />
              <span>สถานะระบบ</span>
            </div>
          }
        >
          <SystemStatusTab status={status} loading={loading} refetch={refetch} />
        </Tab>
        <Tab
          key="printer"
          title={
            <div className="flex items-center gap-2">
              <Printer />
              <span>เครื่องพิมพ์</span>
            </div>
          }
        >
          <PrinterTab />
        </Tab>
      </Tabs>
    </div>
  );
}
