"use client";

import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

    if (pathname === "/") return null;

  return (
    <div className="fixed left-2 top-24 z-40 sm:left-4">
      <Button
        variant="secondary"
        onClick={() => router.back()}
        className="!w-auto !px-4 !py-2 text-xl"
      >
        ←
      </Button>
    </div>
  );
}