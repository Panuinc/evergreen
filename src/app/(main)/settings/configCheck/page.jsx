"use client";

import { Card, CardBody, Chip, Button, Spinner } from "@heroui/react";
import { RefreshCw, Database, Building2, Bot, MessageCircle, Facebook } from "lucide-react";
import { useConfigCheck } from "@/hooks/shared/useConfigCheck";

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

export default function ConfigCheckPage() {
  const { status, loading, refetch } = useConfigCheck();

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">ตรวจสอบการตั้งค่า</h1>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          startContent={<RefreshCw size={16} />}
          onPress={refetch}
          isLoading={loading}
        >
          ตรวจสอบอีกครั้ง
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center w-full h-full">
          <Spinner />
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
                className="border border-default-200"
              >
                <CardBody className="gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={24} />
                      <div>
                        <p className="font-semibold text-lg">{service.name}</p>
                        <p className="text-default-400 text-sm">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <Chip
                      variant="bordered"
                      size="md"
                      radius="md"
                      color={isConnected ? "success" : "danger"}
                    >
                      {data?.status === "connected" ? "เชื่อมต่อแล้ว" : data?.status === "disconnected" ? "ไม่ได้เชื่อมต่อ" : data?.status || "กำลังตรวจสอบ..."}
                    </Chip>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-400">เวลาตอบสนอง</span>
                      <span>
                        {data?.latency != null ? `${data.latency} ms` : "-"}
                      </span>
                    </div>
                    {data?.detail && (
                      <div className="flex justify-between">
                        <span className="text-default-400">บัญชี</span>
                        <span className="font-medium">{data.detail}</span>
                      </div>
                    )}
                    {data?.error && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-default-400">ข้อผิดพลาด</span>
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
