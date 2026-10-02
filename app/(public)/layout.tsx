import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
            <Navbar />
      <BackButton />
      {children}
    </>
  );
}