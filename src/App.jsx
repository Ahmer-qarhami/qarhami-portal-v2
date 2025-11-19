/**
 * Main App component that handles routing and authentication
 * This component serves as the entry point for the application,
 * manages authentication state, and defines all application routes.
 */
import React, { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
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

// Layout component that conditionally renders the Sidebar
const Layout = ({
  isAuthenticated,
  setIsAuthenticated,
  sidebarCollapsed,
  setSidebarCollapsed,
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
    </>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
