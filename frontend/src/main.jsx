import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import CourseDetailsPage from './pages/CourseDetailsPage.jsx'
import SubjectsDetailsPage from './pages/SubjectsDetailsPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SidebarProvider } from './contexts/SidebarContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <App />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <CourseDetailsPage />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/subjects/:subjectId"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <SubjectsDetailsPage />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <SchedulePage />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <CoursesPage />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
