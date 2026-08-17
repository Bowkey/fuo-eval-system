import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import FeedbackForm from "./pages/FeedbackForm";
import LecturerDashboard from "./pages/LecturerDashboard";
import HODDashboard from "./pages/HODDashboard";
import NotFound from "./pages/NotFound";

function RoleHome() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === "student") return <StudentDashboard />;
  if (profile.role === "lecturer") return <LecturerDashboard />;
  if (profile.role === "hod") return <HODDashboard />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluate/:courseId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <FeedbackForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
