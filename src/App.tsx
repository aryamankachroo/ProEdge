import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileProvider'
import { DiagnosticTestPage } from './pages/DiagnosticTestPage'
import { DiagnosticsPage } from './pages/DiagnosticsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { StudyPlanPage } from './pages/StudyPlanPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/study-plan" element={<StudyPlanPage />} />
      <Route path="/diagnostics/test" element={<DiagnosticTestPage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </BrowserRouter>
  )
}
