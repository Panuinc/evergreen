"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Chip,
} from "@heroui/react";
import { Facebook, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getAiSettings, updateAiSettings } from "@/actions/marketing";
import { toast } from "sonner";

export default function ChannelSettings({ isOpen, onClose }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [lineToken, setLineToken] = useState("");

  // AI Settings
  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [aiMaxHistory, setAiMaxHistory] = useState("20");

  useEffect(() => {
    if (isOpen) {
      loadChannels();
      loadAiSettings();
    }
  }, [isOpen]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("omChannels").select("*");
      setChannels(data || []);
      const fb = data?.find((c) => c.channelType === "facebook");
      const line = data?.find((c) => c.channelType === "line");
      if (fb) {
        setFbToken(fb.channelAccessToken || "");
        setFbPageId(fb.channelPageId || "");
      }
      if (line) {
        setLineToken(line.channelAccessToken || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAiSettings = async () => {
    try {
      const data = await getAiSettings();
      if (data) {
        setAiSystemPrompt(data.aiSystemPrompt || "");
        setAiMaxHistory(String(data.aiMaxHistoryMessages || 20));
      }
    } catch {
      // AI settings table may not exist yet
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upsert Facebook channel
      await supabase.from("omChannels").upsert(
        {
          channelType: "facebook",
          channelName: "Facebook Page",
          channelAccessToken: fbToken,
          channelPageId: fbPageId,
          channelStatus: fbToken ? "active" : "inactive",
        },
        { onConflict: "channelType" }
      );

      // Upsert LINE channel
      await supabase.from("omChannels").upsert(
        {
          channelType: "line",
          channelName: "LINE Official Account",
          channelAccessToken: lineToken,
          channelStatus: lineToken ? "active" : "inactive",
        },
        { onConflict: "channelType" }
      );

      // Save AI settings
      try {
        await updateAiSettings({
          aiSystemPrompt,
          aiMaxHistoryMessages: parseInt(aiMaxHistory) || 20,
        });
      } catch {
        // AI settings table may not exist yet
      }

      toast.success("Settings saved");
      onClose();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Channel Settings</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-6">
            {/* Facebook */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Facebook size={18} className="text-blue-500" />
                <span className="font-semibold">Facebook Messenger</span>
                <Chip size="sm" variant="flat" color={fbToken ? "success" : "default"}>
                  {fbToken ? "Active" : "Inactive"}
                </Chip>
              </div>
              <Input
                label="Page Access Token"
                labelPlacement="outside"
                placeholder="Enter Facebook Page Access Token"
                variant="bordered"
                size="md"
                radius="md"
                value={fbToken}
                onValueChange={setFbToken}
                type="password"
              />
              <Input
                label="Page ID"
                labelPlacement="outside"
                placeholder="Enter Facebook Page ID"
                variant="bordered"
                size="md"
                radius="md"
                value={fbPageId}
                onValueChange={setFbPageId}
              />
            </div>

            {/* LINE */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold text-sm">LINE</span>
                <span className="font-semibold">LINE Official Account</span>
                <Chip size="sm" variant="flat" color={lineToken ? "success" : "default"}>
                  {lineToken ? "Active" : "Inactive"}
                </Chip>
              </div>
              <Input
                label="Channel Access Token"
                labelPlacement="outside"
                placeholder="Enter LINE Channel Access Token"
                variant="bordered"
                size="md"
                radius="md"
                value={lineToken}
                onValueChange={setLineToken}
                type="password"
              />
            </div>

            {/* AI Agent Settings */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-secondary" />
                <span className="font-semibold">AI Agent Settings</span>
              </div>
              <Textarea
                label="System Prompt"
                labelPlacement="outside"
                placeholder="กำหนด system prompt สำหรับ AI agent..."
                variant="bordered"
                size="md"
                radius="md"
                minRows={4}
                value={aiSystemPrompt}
                onValueChange={setAiSystemPrompt}
              />
              <Input
                label="Max History Messages"
                labelPlacement="outside"
                placeholder="20"
                description="จำนวนข้อความย้อนหลังที่ AI จะอ่านเพื่อตอบ"
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                value={aiMaxHistory}
                onValueChange={setAiMaxHistory}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" radius="md" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" radius="md" onPress={handleSave} isLoading={saving}>
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
