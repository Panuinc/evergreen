"use client";

import { useImageGenerator } from "@/modules/marketing/hooks/useImageGenerator";
import ImageGeneratorView from "@/modules/marketing/components/ImageGeneratorView";

export default function ImageGenClient() {
  const hook = useImageGenerator();
  return <ImageGeneratorView {...hook} />;
}
