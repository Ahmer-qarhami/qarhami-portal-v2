import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  FileText,
  Code,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Megaphone,
} from "lucide-react";

const VERSION = import.meta.env.VITE_VERSION || "1.0.0";

const Sidebar = ({ setIsAuthenticated, collapsed, setCollapsed }) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navigationItems = [
    { to: "/home", label: "Devices", icon: Home },
    { to: "/management", label: "Free Trial Management", icon: Settings },
    {
      to: "/device-status-report",
      label: "Device Status Report",
      icon: FileText,
    },
    { to: "/version-management", label: "Version Management", icon: Code },
    {
      to: "/message-broadcasting",
      label: "Message Broadcasting",
      icon: MessageSquare,
    },
    { to: "/announcement", label: "Announcement", icon: Megaphone },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-indigo-600 text-white transition-all duration-300 ease-in-out z-50 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-indigo-500">
        {!collapsed && (
          <div className="flex items-center">
            <img src="./img/logoIcon.png" alt="Logo" className="w-8 h-8 mr-2" />
            <span className="text-lg font-bold">Qarhami</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-indigo-700 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Version */}
      {!collapsed && (
        <div className="px-4 py-2 text-xs text-indigo-200 border-b border-indigo-500">
          PORTAL Ver.{VERSION}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md transition-colors hover:bg-indigo-700 ${
                      isActive ? "bg-indigo-800" : ""
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <Icon size={20} className={collapsed ? "" : "mr-3"} />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-indigo-500">
        <button
          onClick={handleSignOut}
          className={`flex items-center w-full px-3 py-2 rounded-md transition-colors hover:bg-red-600 text-left ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={20} className={collapsed ? "" : "mr-3"} />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
