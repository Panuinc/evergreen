"use client";

import { Input, Chip, Avatar} from "@heroui/react";
import { Search } from "lucide-react";
import ChannelBadge from "./channelBadge";
import Loading from "@/components/ui/loading";

const statusFilters = [
  { key: "all", label: "ทั้งหมด" },
  { key: "open", label: "เปิด" },
  { key: "waiting", label: "รอ" },
  { key: "closed", label: "ปิด" },
];

const channelFilters = [
  { key: "all", label: "ทั้งหมด" },
  { key: "facebook", label: "Facebook" },
  { key: "line", label: "LINE" },
];

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "เมื่อวาน";
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export default function ConversationList({
  conversations,
  selectedConversation,
  loading,
  statusFilter,
  channelFilter,
  searchQuery,
  onStatusFilterChange,
  onChannelFilterChange,
  onSearchChange,
  onSelect,
}) {
  return (
    <div className="flex flex-col h-full">
      {}
      <div className="p-3 border-b border-border">
        <Input
          isClearable
          placeholder="ค้นหาการสนทนา..."
          variant="bordered"
          size="md"
          radius="md"
          startContent={<Search />}
          value={searchQuery}
          onValueChange={onSearchChange}
          onClear={() => onSearchChange("")}
        />
      </div>

      {}
      <div className="flex flex-col gap-2 p-3 border-b border-border">
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((f) => (
            <Chip
              key={f.key}
              size="md"
              variant={statusFilter === f.key ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => onStatusFilterChange(f.key)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {channelFilters.map((f) => (
            <Chip
              key={f.key}
              size="md"
              variant={channelFilter === f.key ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => onChannelFilterChange(f.key)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            ไม่พบการสนทนา
          </div>
        ) : (
          conversations.map((conv) => {
            const contact = conv.mktContact;
            const isSelected = selectedConversation?.mktConversationId === conv.mktConversationId;
            return (
              <div
                key={conv.mktConversationId}
                onClick={() => onSelect(conv)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-border ${
                  isSelected ? "bg-default" : "hover:bg-default/50"
                }`}
              >
                <Avatar
                  src={contact?.mktContactAvatarUrl}
                  name={contact?.mktContactDisplayName?.charAt(0) || "?"}
                  size="md"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-light truncate">
                      {contact?.mktContactDisplayName || "ไม่ทราบ"}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(conv.mktConversationLastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-muted-foreground truncate text-xs">
                      {conv.mktConversationLastMessagePreview || "..."}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ChannelBadge channelType={conv.mktConversationChannelType} />
                      {conv.mktConversationUnreadCount > 0 && (
                        <Chip size="md" color="danger" variant="solid" className="min-w-5 h-5 text-xs">
                          {conv.mktConversationUnreadCount}
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
