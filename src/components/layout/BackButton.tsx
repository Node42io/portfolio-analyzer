"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

interface BackButtonProps {
  className?: string;
}

// Back navigation button with arrow icon
export function BackButton({ className = "" }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="icon"
      size="icon"
      onClick={() => router.back()}
      className={`backdrop-blur-[15px] shrink-0 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={1.5} />
    </Button>
  );
}
