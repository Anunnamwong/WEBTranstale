import {
  ArrowLeftStartOnRectangleIcon,
  Bars3Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
  ScaleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";

import { logout } from "@/services/logoutServices";

interface NavItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
}

const navigation: NavItem[] = [
  { name: "หน้าหลัก", icon: HomeIcon, path: "/user" },
  { name: "รายการขาย", icon: ScaleIcon, path: "/user/usersalepage" },
  { name: "ลูกค้า", icon: UserGroupIcon, path: "/user/customer" },
  {
    name: "สถานะการสั่งซื้อ",
    icon: ClipboardDocumentListIcon,
    path: "/user/usersalestatuspage",
  },
  {
    name: "รายการเบิกเงิน",
    icon: CurrencyDollarIcon,
    path: "/user/withdrawalspage",
  },
  { name: "สินค้า", icon: ShoppingBagIcon, path: "/user/sww_productspage" },
];

const UserSidebar = () => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Add useRef for the dropdown container
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    const response = await logout();
    if (response.success) {
      localStorage.removeItem("token");
      router.push("/login");
    }
    setShowLogoutModal(false);
  };

  // ปิด sidebar เมื่อหน้าจอใหญ่ขึ้น
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // สร้างฟังก์ชันสำหรับดึงตัวอักษรแรกของชือ
  const getInitials = () => {
    try {
      const profileData = sessionStorage.getItem("userData");
      if (profileData) {
        const profile = JSON.parse(profileData);
        return profile.name ? profile.name.charAt(0).toUpperCase() : "?";
      }
      return "?";
    } catch {
      return "?";
    }
  };

  // แก้ไขฟังก์ชัน getName ให้ดึงจาก 'userData'
  const getName = () => {
    try {
      const profileData = sessionStorage.getItem("userData");
      if (profileData) {
        const profile = JSON.parse(profileData);
        return profile.name || "Loading...";
      }
      return "Loading...";
    } catch {
      return "Loading...";
    }
  };

  // Update click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Navigation Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-16 
        bg-gradient-to-r from-emerald-500 to-green-500
        shadow-lg z-40 flex items-center px-4"
      >
        {/* Mobile Toggle */}
        <button
          className="sm:hidden p-2 rounded-lg 
            text-gray-300 hover:text-emerald-300
            hover:bg-[#1a1a1a] transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>

        {/* Sidebar Toggle Button */}
        <button
          className="hidden sm:flex p-2 rounded-lg 
            text-gray-300 hover:text-emerald-300
            hover:bg-[#1a1a1a] transition-all duration-300"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Logo Container */}
        <div
          className="relative h-10 ml-4 sm:ml-2 
          bg-white/95 backdrop-blur-sm
          rounded-xl overflow-hidden
          shadow-[0_0_20px_rgba(255,255,255,0.3)]
          group
          hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
          transition-all duration-500 ease-in-out
          transform hover:scale-105
          px-3"
        >
          {/* <img
            src="/image/11881.jpg"
            alt="Logo"
            className="h-10 w-auto relative z-10
              transition-all duration-300
              group-hover:brightness-110"
          /> */}
        </div>

        {/* Profile Button */}
        <div className="ml-auto flex items-center gap-4 absolute right-5">
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 p-2 rounded-lg 
              relative overflow-hidden group
              text-gray-200 transition-all duration-300"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-emerald-500/10 via-green-600/20 to-emerald-500/10
                transition-opacity duration-300 ease-in-out"
              />
              <div
                className="w-8 h-8 rounded-full 
                bg-gradient-to-br from-slate-400 to-slate-600 
                flex items-center justify-center text-sm font-bold text-white"
              >
                {getInitials()}
              </div>
              <span className="hidden sm:inline text-sm font-medium group-hover:text-emerald-300">
                {getName()}
              </span>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div
                className="absolute right-0 mt-3 w-48 
                bg-gradient-to-b from-emerald-800 to-green-900
                rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.3)]
                border border-emerald-700/50"
              >
                <div className="py-1">
                  <button
                    className="w-full flex items-center px-4 py-2 
                    text-sm text-gray-200 
                    relative overflow-hidden group
                    transition-all duration-300"
                    onClick={() => {
                      router.push("/user/settings");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100
                      bg-gradient-to-r from-emerald-500/10 via-emerald-600/20 to-emerald-500/10
                      transition-opacity duration-300 ease-in-out"
                    />
                    <Cog6ToothIcon className="w-5 h-5 mr-2 text-emerald-400 group-hover:text-emerald-300" />
                    <span className="relative z-10 group-hover:text-emerald-300">
                      Settings
                    </span>
                  </button>
                  <button
                    className="w-full flex items-center px-4 py-2 
                    text-sm text-gray-200
                    relative overflow-hidden group
                    transition-all duration-300"
                    onClick={() => {
                      handleLogout();
                      setShowProfileDropdown(false);
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100
                      bg-gradient-to-r from-red-500/10 via-red-500/20 to-red-500/10
                      transition-opacity duration-300 ease-in-out"
                    />
                    <ArrowLeftStartOnRectangleIcon className="w-5 h-5 mr-2 text-red-400 group-hover:text-red-500" />
                    <span className="relative z-10 text-red-400 group-hover:text-red-500">
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Sidebar */}
      <div
        className={`
          fixed sm:static inset-y-0 left-0 z-50
          transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          sm:translate-x-0 transition-all duration-300 ease-in-out
          bg-gradient-to-b from-emerald-900 to-green-900
          text-gray-100
          ${isCollapsed ? "w-20" : "w-64"} flex flex-col
          mt-16 bottom-0
          shadow-xl
        `}
      >
        {/* Navigation Items */}
        <nav className="h-[calc(100vh-4rem)] flex-1 py-4 px-2">
          <div className="h-full overflow-hidden">
            {navigation.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(item.path);
                }}
                className={`
                  flex items-center px-4 py-3 text-sm group
                  relative overflow-hidden rounded-xl
                  mb-1
                  ${
                    router.pathname === item.path
                      ? "bg-gradient-to-r from-emerald-500/80 to-green-500/80 text-white"
                      : "text-gray-300 hover:text-white"
                  }
                  cursor-pointer transition-all duration-300
                  hover:bg-white/10 backdrop-blur-sm
                `}
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-gradient-to-r from-white/5 to-transparent
                  transition-opacity duration-300 ease-in-out
                `}
                />
                <item.icon
                  className={`
                    w-5 h-5 mr-3
                    group-hover:text-emerald-300
                    ${router.pathname === item.path ? "text-white" : "text-emerald-400"}
                  `}
                  aria-hidden="true"
                />
                <span className="relative z-10">
                  {!isCollapsed && item.name}
                </span>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowLogoutModal(false)}
          />
          <div
            className="relative bg-gradient-to-b from-emerald-900 to-green-900 
            w-full max-w-md rounded-2xl
            shadow-[0_0_40px_rgba(16,185,129,0.3)]
            border border-emerald-600/30"
          >
            <div className="p-8">
              <div
                className="mx-auto w-16 h-16 rounded-full 
                bg-gradient-to-br from-emerald-400 to-green-500 
                flex items-center justify-center
                shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              >
                <ArrowLeftStartOnRectangleIcon className="h-8 w-8 text-white" />
              </div>

              <div className="text-center mt-6 mb-8">
                <h3 className="text-2xl font-bold text-emerald-300 mb-2">
                  Confirm Logout
                </h3>
                <p className="text-gray-300">
                  Are you sure you want to logout?
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 px-4 py-3 text-sm 
                  relative overflow-hidden group
                  rounded-xl text-white
                  bg-gradient-to-r from-emerald-500 to-green-500
                  shadow-[0_0_20px_rgba(16,185,129,0.3)]
                  hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
                  transition-all duration-300
                  transform hover:scale-105"
                  onClick={() => setShowLogoutModal(false)}
                >
                  <span className="relative">Cancel</span>
                </button>

                <button
                  className="flex-1 px-4 py-3 text-sm 
                  relative overflow-hidden group
                  rounded-xl text-white
                  bg-gradient-to-r from-emerald-500 to-green-500
                  shadow-[0_0_20px_rgba(16,185,129,0.3)]
                  hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
                  transition-all duration-300
                  transform hover:scale-105"
                  onClick={confirmLogout}
                >
                  <span className="relative">Confirm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserSidebar;
