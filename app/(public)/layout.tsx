import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import NavigationLoader from "@/components/NavigationLoader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
            <Navbar />
            <BackButton />
      <NavigationLoader />
      {children}
    </>
  );
}