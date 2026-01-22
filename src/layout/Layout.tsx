import React from "react";
import Topbar from "../components/common/Topbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Topbar title="Project NextBase" />
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default Layout;
