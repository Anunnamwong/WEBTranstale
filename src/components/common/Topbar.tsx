import React from "react";

type TopbarProps = {
  onToggleSidebar?: () => void;
  title?: string;
};

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, title }) => {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-4 bg-white border-b border-neutral-200">
      <button
        className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-indigo-600" />
        <span className="font-semibold tracking-tight text-neutral-900">
          {title || "App"}
        </span>
      </div>
      <div className="text-xs text-neutral-500">Modern</div>
    </header>
  );
};

export default Topbar;
