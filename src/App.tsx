import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileProvider'
<<<<<<< Updated upstream
import { DiagnosticsPage } from './pages/DiagnosticsPage'
=======
import { DiagnosticExamPage } from './pages/DiagnosticExamPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
>>>>>>> Stashed changes
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PostQuestionnairePage } from './pages/PostQuestionnairePage'
import { StudyPlanPage } from './pages/StudyPlanPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
<<<<<<< Updated upstream
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
=======
      <Route path="/post-questionnaire" element={<PostQuestionnairePage />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
      <Route path="/diagnostic/exam" element={<DiagnosticExamPage />} />
      <Route path="/study-plan" element={<StudyPlanPage />} />
>>>>>>> Stashed changes
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
