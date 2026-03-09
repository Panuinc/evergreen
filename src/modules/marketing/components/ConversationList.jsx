"use client";

import { Input, Chip, Avatar} from "@heroui/react";
import { Search } from "lucide-react";
import ChannelBadge from "./ChannelBadge";
import Loading from "@/components/ui/Loading";

const STATUS_FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "open", label: "เปิด" },
  { key: "waiting", label: "รอ" },
  { key: "closed", label: "ปิด" },
];

const CHANNEL_FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "facebook", label: "Facebook" },
  { key: "line", label: "LINE" },
];

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
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
      {/* Search */}
      <div className="p-3 border-b border-border">
        <Input
          isClearable
          placeholder="ค้นหาการสนทนา..."
          variant="bordered"
          size="md"
          radius="md"
          startContent={<Search size={16} />}
          value={searchQuery}
          onValueChange={onSearchChange}
          onClear={() => onSearchChange("")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 p-3 border-b border-border">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => onStatusFilterChange(f.key)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {CHANNEL_FILTERS.map((f) => (
            <Chip
              key={f.key}
              size="sm"
              variant={channelFilter === f.key ? "solid" : "bordered"}
              className="cursor-pointer"
              onClick={() => onChannelFilterChange(f.key)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* List */}
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
            const contact = conv.omContact;
            const isSelected = selectedConversation?.omConversationId === conv.omConversationId;
            return (
              <div
                key={conv.omConversationId}
                onClick={() => onSelect(conv)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors border-b border-border ${
                  isSelected ? "bg-default" : "hover:bg-default/50"
                }`}
              >
                <Avatar
                  src={contact?.omContactAvatarUrl}
                  name={contact?.omContactDisplayName?.charAt(0) || "?"}
                  size="sm"
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-light truncate">
                      {contact?.omContactDisplayName || "ไม่ทราบ"}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatTime(conv.omConversationLastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-muted-foreground truncate text-[11px]">
                      {conv.omConversationLastMessagePreview || "..."}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <ChannelBadge channelType={conv.omConversationChannelType} />
                      {conv.omConversationUnreadCount > 0 && (
                        <Chip size="sm" color="danger" variant="solid" className="min-w-5 h-5 text-[10px]">
                          {conv.omConversationUnreadCount}
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
