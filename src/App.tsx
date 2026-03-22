import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileProvider'
import { DashboardPage } from './pages/DashboardPage'
import { DiagnosticExamPage } from './pages/DiagnosticExamPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { DiagnosticTestPage } from './pages/DiagnosticTestPage'
import { DiagnosticsPage } from './pages/DiagnosticsPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PostQuestionnairePage } from './pages/PostQuestionnairePage'
import { StudyPlanPage } from './pages/StudyPlanPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/post-questionnaire" element={<PostQuestionnairePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/study-plan" element={<StudyPlanPage />} />
      <Route path="/diagnostics/test" element={<DiagnosticTestPage />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/diagnostic/exam" element={<DiagnosticExamPage />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
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
