import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/loginPage/login.jsx'
import SignupPage from './pages/signupPage/SignupPage.jsx'
import CourseDetailsPage from './pages/coursesPage/CourseDetailsPage.jsx'
import SubjectsDetailsPage from './pages/subejctsPage/SubjectsDetailsPage.jsx'
import SchedulePage from './pages/schedulePage/SchedulePage.jsx'
import RoutinesPage from './pages/routinesPage/RoutinesPage.jsx'
import CoursesPage from './pages/coursesPage/CoursesPage.jsx'
import ProfilePage from './pages/profilePage/ProfilePage.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import AuthLayout from './components/AuthLayout.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<App />} />
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
