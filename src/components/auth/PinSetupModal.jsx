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

  const handleNext = () => {
    if (pin.length !== 6) {
      toast.error("Please enter 6 digits");
      return;
    }
    setStep("confirm");
    setConfirmPin("");
    setError(false);
  };

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setError(true);
      toast.error("PIN does not match");
      setConfirmPin("");
      return;
    }

    setLoading(true);
    try {
      await onSetup(pin);
      toast.success("PIN set successfully");
      handleClose();
    } catch (err) {
      toast.error(err.message || "Failed to set PIN");
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
          {step === "enter" ? "Set Quick Unlock PIN" : "Confirm Your PIN"}
        </ModalHeader>
        <ModalBody>
          <p className="text-default-500 text-center mb-4">
            {step === "enter"
              ? "Set a 6-digit PIN for quick sign in"
              : "Enter the same PIN again to confirm"}
          </p>
          <PinInput
            value={step === "enter" ? pin : confirmPin}
            onChange={step === "enter" ? setPin : setConfirmPin}
            error={error}
          />
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button variant="light" onPress={handleClose}>
            Skip
          </Button>
          {step === "enter" ? (
            <Button
              color="primary"
              onPress={handleNext}
              isDisabled={pin.length !== 6}
            >
              Next
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="bordered"
                onPress={() => {
                  setStep("enter");
                  setConfirmPin("");
                  setError(false);
                }}
              >
                Back
              </Button>
              <Button
                color="primary"
                onPress={handleConfirm}
                isDisabled={confirmPin.length !== 6}
                isLoading={loading}
              >
                Confirm
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
