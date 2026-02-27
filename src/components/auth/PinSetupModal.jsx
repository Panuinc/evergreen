"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import PinInput from "./PinInput";

export default function PinSetupModal({ isOpen, onClose, onSetup }) {
  const [step, setStep] = useState("enter"); // "enter" | "confirm"
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = (completedPin) => {
    const p = typeof completedPin === "string" ? completedPin : pin;
    if (p.length !== 6) {
      toast.error("กรุณาใส่ตัวเลข 6 หลัก");
      return;
    }
    setPin(p);
    setStep("confirm");
    setConfirmPin("");
    setError(false);
  };

  const handleConfirm = async (completedPin) => {
    const cp = typeof completedPin === "string" ? completedPin : confirmPin;
    if (cp !== pin) {
      setError(true);
      toast.error("PIN ไม่ตรงกัน");
      setConfirmPin("");
      return;
    }

    setLoading(true);
    try {
      await onSetup(pin);
      toast.success("ตั้ง PIN สำเร็จ");
      handleClose();
    } catch (err) {
      toast.error(err.message || "ตั้ง PIN ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("enter");
    setPin("");
    setConfirmPin("");
    setError(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          {step === "enter" ? "ตั้ง PIN ปลดล็อกด่วน" : "ยืนยัน PIN ของคุณ"}
        </ModalHeader>
        <ModalBody>
          <p className="text-default-500 text-center mb-4">
            {step === "enter"
              ? "ตั้ง PIN 6 หลักสำหรับลงชื่อเข้าใช้ด่วน"
              : "ใส่ PIN เดิมอีกครั้งเพื่อยืนยัน"}
          </p>
          <PinInput
            value={step === "enter" ? pin : confirmPin}
            onChange={step === "enter" ? setPin : setConfirmPin}
            onComplete={step === "enter" ? handleNext : handleConfirm}
            error={error}
          />
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button variant="light" size="md" radius="md" onPress={handleClose}>
            ข้าม
          </Button>
          {step === "enter" ? (
            <Button
              color="primary"
              size="md"
              radius="md"
              onPress={handleNext}
              isDisabled={pin.length !== 6}
            >
              ถัดไป
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                onPress={() => {
                  setStep("enter");
                  setConfirmPin("");
                  setError(false);
                }}
              >
                ย้อนกลับ
              </Button>
              <Button
                color="primary"
                size="md"
                radius="md"
                onPress={handleConfirm}
                isDisabled={confirmPin.length !== 6}
                isLoading={loading}
              >
                ยืนยัน
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
