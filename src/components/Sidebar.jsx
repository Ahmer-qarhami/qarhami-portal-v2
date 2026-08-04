import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  FileText,
  Code,
  Scale,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Megaphone,
  Server,
} from "lucide-react";

const VERSION = import.meta.env.VITE_VERSION || "1.0.0";

const Sidebar = ({
  setIsAuthenticated,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  isDesktop,
}) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.clear();
    setMobileOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const navigationItems = [
    { to: "/home", label: "Devices", icon: Home },
    { to: "/management", label: "Free Trial Management", icon: Settings },
    {
      to: "/device-status-report",
      label: "Device Status Report",
      icon: FileText,
    },
    {
      to: "/reconciliation",
      label: "Stripe Reconciliation",
      icon: Scale,
    },
    { to: "/version-management", label: "Version Management", icon: Code },
    {
      to: "/message-broadcasting",
      label: "Message Broadcasting",
      icon: MessageSquare,
    },
    { to: "/announcement", label: "Announcement", icon: Megaphone },
    { to: "/app-info", label: "App Info", icon: Server },
  ];

  const showLabels = isDesktop ? !collapsed : true;
  const sidebarWidth = isDesktop ? (collapsed ? "w-16" : "w-64") : "w-72 max-w-[85vw]";

  return (
    <>
      {!isDesktop && mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-indigo-600 text-white transition-all duration-300 ease-in-out z-50 flex flex-col ${sidebarWidth} ${
          isDesktop
            ? ""
            : mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-indigo-500 shrink-0">
          {showLabels && (
            <div className="flex items-center min-w-0">
              <img
                src="./img/logoIcon.png"
                alt="Logo"
                className="w-8 h-8 mr-2 shrink-0"
              />
              <span className="text-base sm:text-lg font-bold truncate">
                Qarhami
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (isDesktop) {
                setCollapsed(!collapsed);
              } else {
                setMobileOpen(false);
              }
            }}
            className="p-1.5 rounded-md hover:bg-indigo-700 transition-colors shrink-0"
            aria-label={isDesktop ? "Toggle sidebar" : "Close menu"}
          >
            {isDesktop && collapsed ? (
              <Menu size={20} />
            ) : (
              <X size={20} />
            )}
          </button>
        </div>

        {showLabels && (
          <div className="px-4 py-2 text-xs text-indigo-200 border-b border-indigo-500 shrink-0">
            PORTAL Ver.{VERSION}
          </div>
        )}

        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 rounded-md transition-colors hover:bg-indigo-700 ${
                        isActive ? "bg-indigo-800" : ""
                      } ${showLabels ? "" : "justify-center"}`
                    }
                  >
                    <Icon size={20} className={showLabels ? "mr-3 shrink-0" : ""} />
                    {showLabels && (
                      <span className="text-sm font-medium leading-tight">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-indigo-500 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className={`flex items-center w-full px-3 py-2.5 rounded-md transition-colors hover:bg-red-600 text-left ${
              showLabels ? "" : "justify-center"
            }`}
          >
            <LogOut size={20} className={showLabels ? "mr-3 shrink-0" : ""} />
            {showLabels && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
