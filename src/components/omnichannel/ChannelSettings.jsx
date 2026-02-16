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
  Chip,
} from "@heroui/react";
import { Facebook } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ChannelSettings({ isOpen, onClose }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [lineToken, setLineToken] = useState("");

  useEffect(() => {
    if (isOpen) loadChannels();
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

      toast.success("Channel settings saved");
      onClose();
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
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
