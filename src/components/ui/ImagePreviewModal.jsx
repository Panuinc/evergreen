"use client";

import { useState } from "react";
import { Modal, ModalContent, ModalBody, Button } from "@heroui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImagePreviewModal({ isOpen, onClose, images = [], initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images.length) return null;

  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" hideCloseButton>
      <ModalContent>
        <ModalBody className="p-0 relative">
          <Button
            isIconOnly
            variant="light"
            size="md"
            radius="md"
            onPress={onClose}
            className="absolute top-2 right-2 z-10"
          >
            <X size={20} />
          </Button>

          <div className="flex items-center justify-center min-h-[400px] bg-default-100">
            <img
              src={images[currentIndex]}
              alt={`preview-${currentIndex}`}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>

          {images.length > 1 && (
            <>
              <Button
                isIconOnly
                variant="flat"
                size="md"
                radius="md"
                onPress={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                size="md"
                radius="md"
                onPress={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <ChevronRight size={20} />
              </Button>
              <p className="text-center text-sm text-muted-foreground py-2">
                {currentIndex + 1} / {images.length}
              </p>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
