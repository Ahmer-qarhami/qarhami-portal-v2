/**
 * Main App component that handles routing and authentication
 * This component serves as the entry point for the application,
 * manages authentication state, and defines all application routes.
 */
import React, { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import { Modal, Button } from "antd";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ProtectedRoute from "./ProtectedRoute";

// Lazy load page components for better performance
const Home = lazy(() => import("./pages/Home.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Management = lazy(() => import("./pages/Management.jsx"));
const DeviceStatusReport = lazy(() => import("./pages/DeviceStatusReport.jsx"));
const VersionManagement = lazy(() => import("./pages/VersionManagement.jsx"));
const MessageBroadcasting = lazy(() =>
  import("./pages/MessageBroadcasting.jsx")
);
const Announcement = lazy(() => import("./pages/Announcement.jsx"));

const compareVersions = (a, b) => {
  if (!a || !b) return 0;
  const partsA = String(a).split(".").map(Number);
  const partsB = String(b).split(".").map(Number);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const numA = Number.isFinite(partsA[i]) ? partsA[i] : 0;
    const numB = Number.isFinite(partsB[i]) ? partsB[i] : 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
};

const isDynamicImportFetchError = (message = "") =>
  String(message).includes("Failed to fetch dynamically imported module");

// Layout component that conditionally renders the Sidebar
const Layout = ({
  isAuthenticated,
  setIsAuthenticated,
  sidebarCollapsed,
  setSidebarCollapsed,
  versionUpdateModalOpen,
  appVersion,
  availableVersion,
  onUpdateVersion,
  children,
}) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {isAuthenticated && !isLoginPage && (
        <Sidebar
          setIsAuthenticated={setIsAuthenticated}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      )}
      <div
        className={`transition-all duration-300 ${
          isAuthenticated && !isLoginPage
            ? sidebarCollapsed
              ? "ml-16"
              : "ml-64"
            : ""
        }`}
      >
        {children}
      </div>
      {isAuthenticated && !isLoginPage && (
        <Modal
          title="New Version Released"
          open={versionUpdateModalOpen}
          closable={false}
          maskClosable={false}
          keyboard={false}
          footer={[
            <Button
              key="update-version"
              type="primary"
              onClick={onUpdateVersion}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Update Version
            </Button>,
          ]}
        >
          <p>A new portal version is available.</p>
          <p>
            Current portal version: <strong>{appVersion}</strong>
          </p>
          {availableVersion ? (
            <p>
              Available version: <strong>{availableVersion}</strong>
            </p>
          ) : null}
          <p>Please click "Update Version" to refresh the portal.</p>
        </Modal>
      )}
    </>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [versionUpdateModalOpen, setVersionUpdateModalOpen] = useState(false);
  const [availableVersion, setAvailableVersion] = useState("");
  const appVersion = import.meta.env.VITE_VERSION || "1.0.0";

  useEffect(() => {
    // Ensure stale service workers/caches do not serve old portal bundles.
    const clearLegacyPwaCache = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }
      } catch (error) {
        // Ignore cleanup failures; app should continue normally.
      }
    };

    clearLegacyPwaCache();

    // Register service worker for PWA functionality
    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker
    //     .register("/sw.js")
    //     .then((registration) => {
    //       registration.onupdatefound = () => {
    //         const installingWorker = registration.installing;
    //         installingWorker.onstatechange = () => {
    //           if (installingWorker.state === "installed") {
    //             if (navigator.serviceWorker.controller) {
    //               alert("A new version is available. Please refresh.");
    //             }
    //           }
    //         };
    //       };
    //     })
    //     .catch((error) => {
    //       console.error("Service worker registration failed:", error);
    //     });
    // }

    // Check authentication status on mount
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Here you would typically verify the token with your backend
        // For example:
        // verifyToken(token)
        //   .then(isValid => {
        //     setIsAuthenticated(isValid);
        //     setLoading(false);
        //   })
        //   .catch(() => {
        //     localStorage.removeItem("token");
        //     setIsAuthenticated(false);
        //     setLoading(false);
        //   });

        // For now, we'll just check if it exists
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    const RELOAD_GUARD_KEY = "portal_chunk_reload_attempt_at";
    const RELOAD_GUARD_MS = 30000; // prevent reload loops for 30s window

    const tryRecoverFromChunkError = () => {
      const lastAttempt = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
      const now = Date.now();
      if (now - lastAttempt < RELOAD_GUARD_MS) return;

      sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
      window.location.reload();
    };

    const onWindowError = (event) => {
      const errorMessage = event?.message || "";
      if (isDynamicImportFetchError(errorMessage)) {
        tryRecoverFromChunkError();
      }
    };

    const onUnhandledRejection = (event) => {
      const errorMessage = event?.reason?.message || "";
      if (isDynamicImportFetchError(errorMessage)) {
        tryRecoverFromChunkError();
      }
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkForNewVersion = async () => {
      try {
        const response = await fetch(
          `${window.location.origin}/version.json?t=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
        if (!response.ok) return;

        const versionData = await response.json();
        const publishedVersion = String(versionData?.version || "").trim();
        if (!publishedVersion) return;

        if (compareVersions(publishedVersion, appVersion) > 0) {
          setAvailableVersion(publishedVersion);
          setVersionUpdateModalOpen(true);
        } else {
          setVersionUpdateModalOpen(false);
        }
      } catch (error) {
        // Silent fail: version check should not break app usage.
      }
    };

    checkForNewVersion();
    const intervalId = setInterval(checkForNewVersion, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForNewVersion();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, appVersion]);

  const handleHotReload = () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const cacheBuster = `?_v=${encodeURIComponent(
      availableVersion || appVersion
    )}&_t=${Date.now()}`;
    window.location.assign(`${baseUrl}${cacheBuster}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <Layout
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        versionUpdateModalOpen={versionUpdateModalOpen}
        appVersion={appVersion}
        availableVersion={availableVersion}
        onUpdateVersion={handleHotReload}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route
              path="/login"
              element={<Login setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<Home />}
                />
              }
            />
            <Route
              path="/management"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<Management />}
                />
              }
            />
            <Route
              path="/device-status-report"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<DeviceStatusReport />}
                />
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<About />}
                />
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<Services />}
                />
              }
            />
            <Route
              path="/contact"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<Contact />}
                />
              }
            />
            <Route
              path="/version-management"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<VersionManagement />}
                />
              }
            />
            <Route
              path="/message-broadcasting"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<MessageBroadcasting />}
                />
              }
            />
            <Route
              path="/announcement"
              element={
                <ProtectedRoute
                  isAuthenticated={isAuthenticated}
                  authenticationPath="/login"
                  outlet={<Announcement />}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
