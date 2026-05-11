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
import RoutinesPage from './pages/RoutinesPage.jsx'
import CoursesPage from './pages/CoursesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import AuthLayout from './components/AuthLayout.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/" element={<App />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
            <Route path="/courses/:courseId/subjects/:subjectId" element={<SubjectsDetailsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
