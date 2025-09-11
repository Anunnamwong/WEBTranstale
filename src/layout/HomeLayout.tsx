import dynamic from "next/dynamic";
import React, { useState } from "react";
import Topbar from "../components/common/Topbar";

const HomeSidebar = dynamic(() => import("../components/sidebar/HomeSidebar"), {
  ssr: false,
});

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900">
      <Topbar onToggleSidebar={() => setOpen(!open)} title="Project NextBase" />
      <div className={`sm:block ${open ? "block" : "hidden"}`}>
        <HomeSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 mt-16 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default HomeLayout;
