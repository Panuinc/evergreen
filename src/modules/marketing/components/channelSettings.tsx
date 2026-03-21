"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
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
import { get, put } from "@/lib/apiClient";
import { toast } from "sonner";

export default function ChannelSettings({ isOpen, onClose }) {
  const [channels, setChannels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fbToken, setFbToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [lineToken, setLineToken] = useState("");

  const [aiSystemPrompt, setAiSystemPrompt] = useState("");
  const [aiMaxHistory, setAiMaxHistory] = useState("20");
  const [aiBankAccountInfo, setAiBankAccountInfo] = useState("");
  const [aiShippingInfo, setAiShippingInfo] = useState("");
  const [aiAfterSalesInfo, setAiAfterSalesInfo] = useState("");
  const [aiBrandStory, setAiBrandStory] = useState("");

  const { data: settingsData, isLoading: loading } = useSWR(
    isOpen ? "channel-settings" : null,
    async () => {
      const [{ data: channelsData }, aiData] = await Promise.all([
        supabase.from("mktChannel").select("*"),
        get("/api/marketing/omnichannel/ai/settings").catch(() => null),
      ]);
      return { channels: channelsData || [], aiSettings: aiData };
    },
  );

  useEffect(() => {
    if (!settingsData) return;
    const { channels: ch, aiSettings } = settingsData;
    setChannels(ch);
    const fb = ch.find((c) => c.mktChannelType === "facebook");
    const line = ch.find((c) => c.mktChannelType === "line");
    if (fb) { setFbToken(fb.mktChannelAccessToken || ""); setFbPageId(fb.mktChannelPageRef || ""); }
    if (line) { setLineToken(line.mktChannelAccessToken || ""); }
    if (aiSettings) {
      setAiSystemPrompt(aiSettings.mktAiSettingSystemPrompt || "");
      setAiMaxHistory(String(aiSettings.mktAiSettingMaxHistoryMessages || 20));
      setAiBankAccountInfo(aiSettings.mktAiSettingBankAccountInfo || "");
      setAiShippingInfo(aiSettings.mktAiSettingShippingInfo || "");
      setAiAfterSalesInfo(aiSettings.mktAiSettingAfterSalesInfo || "");
      setAiBrandStory(aiSettings.mktAiSettingBrandStory || "");
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      setSaving(true);


      await supabase.from("mktChannel").upsert(
        {
          mktChannelType: "facebook",
          mktChannelName: "Facebook Page",
          mktChannelAccessToken: fbToken,
          mktChannelPageRef: fbPageId,
          mktChannelStatus: fbToken ? "active" : "inactive",
        },
        { onConflict: "mktChannelType" }
      );


      await supabase.from("mktChannel").upsert(
        {
          mktChannelType: "line",
          mktChannelName: "LINE Official Account",
          mktChannelAccessToken: lineToken,
          mktChannelStatus: lineToken ? "active" : "inactive",
        },
        { onConflict: "mktChannelType" }
      );


      try {
        await put("/api/marketing/omnichannel/ai/settings", {
          mktAiSettingSystemPrompt: aiSystemPrompt,
          mktAiSettingMaxHistoryMessages: parseInt(aiMaxHistory) || 20,
          mktAiSettingBankAccountInfo: aiBankAccountInfo,
          mktAiSettingShippingInfo: aiShippingInfo,
          mktAiSettingAfterSalesInfo: aiAfterSalesInfo,
          mktAiSettingBrandStory: aiBrandStory,
        });
      } catch {

      }

      toast.success("บันทึกการตั้งค่าเรียบร้อย");
      onClose();
    } catch (error) {
      toast.error("บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>ตั้งค่าช่องทาง</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-6">
            {}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Facebook className="text-blue-500" />
                <span className="font-light">Facebook Messenger</span>
                <Chip size="md" variant="flat" color={fbToken ? "success" : "default"}>
                  {fbToken ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Chip>
              </div>
              <Input
                label="โทเค็นการเข้าถึงเพจ"
                labelPlacement="outside"
                placeholder="ใส่ Facebook Page Access Token"
                variant="flat"
                size="md"
                radius="md"
                value={fbToken}
                onValueChange={setFbToken}
                type="password"
              />
              <Input
                label="Page ID"
                labelPlacement="outside"
                placeholder="ใส่ Facebook Page ID"
                variant="bordered"
                size="md"
                radius="md"
                value={fbPageId}
                onValueChange={setFbPageId}
              />
            </div>

            {}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-light text-xs">LINE</span>
                <span className="font-light">LINE Official Account</span>
                <Chip size="md" variant="flat" color={lineToken ? "success" : "default"}>
                  {lineToken ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Chip>
              </div>
              <Input
                label="Channel Access Token"
                labelPlacement="outside"
                placeholder="ใส่ LINE Channel Access Token"
                variant="flat"
                size="md"
                radius="md"
                value={lineToken}
                onValueChange={setLineToken}
                type="password"
              />
            </div>

            {}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-secondary" />
                <span className="font-light">ตั้งค่า AI Agent</span>
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
                label="จำนวนข้อความย้อนหลังสูงสุด"
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
              <Textarea
                label="ข้อมูลบัญชีธนาคาร"
                labelPlacement="outside"
                placeholder={"ธนาคารกสิกรไทย\nชื่อบัญชี: บริษัท xxx จำกัด\nเลขบัญชี: 123-4-56789-0"}
                description="ส่งให้ลูกค้าหลังอนุมัติใบเสนอราคา"
                variant="bordered"
                size="md"
                radius="md"
                minRows={3}
                value={aiBankAccountInfo}
                onValueChange={setAiBankAccountInfo}
              />
              <Textarea
                label="เรื่องราวแบรนด์ / จุดเด่น (USP)"
                labelPlacement="outside"
                placeholder={"เช่น บริษัทมีประสบการณ์กว่า 10 ปี ใช้วัสดุคุณภาพ มีรีวิวจากลูกค้ากว่า 1,000 รีวิว..."}
                description="AI จะอ้างอิงข้อมูลนี้เพื่อสร้างความมั่นใจให้ลูกค้า"
                variant="bordered"
                size="md"
                radius="md"
                minRows={3}
                value={aiBrandStory}
                onValueChange={setAiBrandStory}
              />
              <Textarea
                label="ข้อมูลการจัดส่ง"
                labelPlacement="outside"
                placeholder={"เช่น จัดส่งฟรีทั่วประเทศ 3-5 วันทำการ\nค่าส่งกรุงเทพ 50 บาท ต่างจังหวัด 100 บาท..."}
                description="AI จะใช้ตอบคำถามเรื่องค่าส่งและระยะเวลาจัดส่ง"
                variant="bordered"
                size="md"
                radius="md"
                minRows={3}
                value={aiShippingInfo}
                onValueChange={setAiShippingInfo}
              />
              <Textarea
                label="นโยบายหลังการขาย / การรับประกัน"
                labelPlacement="outside"
                placeholder={"เช่น รับประกันสินค้า 1 ปี\nคืนสินค้าภายใน 7 วัน หากสินค้ามีปัญหา..."}
                description="AI จะใช้ตอบคำถามเรื่องการรับประกันและคืนสินค้า"
                variant="bordered"
                size="md"
                radius="md"
                minRows={3}
                value={aiAfterSalesInfo}
                onValueChange={setAiAfterSalesInfo}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" size="md" radius="md" onPress={onClose}>
            ยกเลิก
          </Button>
          <Button color="primary" size="md" radius="md" onPress={handleSave} isLoading={saving}>
            บันทึกการตั้งค่า
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
