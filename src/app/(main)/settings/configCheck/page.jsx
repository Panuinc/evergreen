"use client";

import { Card, CardBody, Chip, Button, Spinner } from "@heroui/react";
import { RefreshCw, Database, Building2, Bot } from "lucide-react";
import { useConfigCheck } from "@/hooks/useConfigCheck";

const services = [
  {
    key: "supabase",
    name: "Supabase",
    description: "Database & Authentication",
    icon: Database,
  },
  {
    key: "bc",
    name: "365 Business Central",
    description: "ERP Integration (OAuth2)",
    icon: Building2,
  },
  {
    key: "openrouter",
    name: "OpenRouter AI",
    description: "AI Chatbot (Kimi K2.5)",
    icon: Bot,
  },
];

export default function ConfigCheckPage() {
  const { status, loading, refetch } = useConfigCheck();

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Config Check</h1>
        <Button
          variant="bordered"
          size="md"
          radius="md"
          startContent={<RefreshCw size={16} />}
          onPress={refetch}
          isLoading={loading}
        >
          Recheck
        </Button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center py-12">
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
                variant="bordered"
                radius="md"
                shadow="none"
                className="border-2 border-default"
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
                      {data?.status || "checking..."}
                    </Chip>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-400">Latency</span>
                      <span>
                        {data?.latency != null ? `${data.latency} ms` : "-"}
                      </span>
                    </div>
                    {data?.error && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-default-400">Error</span>
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
