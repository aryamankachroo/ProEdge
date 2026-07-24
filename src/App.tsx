import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ProfileProvider } from './context/ProfileProvider'
import { useAuth } from './context/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AiAnalyticsPage } from './pages/AiAnalyticsPage'
import { AiJournalPage } from './pages/AiJournalPage'
import { CalendarPage } from './pages/CalendarPage'
import { CarsPracticePage } from './pages/CarsPracticePage'
import { DashboardPage } from './pages/DashboardPage'
import { DiagnosticExamPage } from './pages/DiagnosticExamPage'
import { DiagnosticPage } from './pages/DiagnosticPage'
import { DiagnosticResultsPage } from './pages/DiagnosticResultsPage'
import { DiagnosticTestPage } from './pages/DiagnosticTestPage'
import { DiagnosticsPage } from './pages/DiagnosticsPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PostQuestionnairePage } from './pages/PostQuestionnairePage'
import { StudyPlanPage } from './pages/StudyPlanPage'
import { ChatAssistantWidget } from './components/ChatAssistantWidget'
import { ThemeToggle } from './components/ThemeToggle'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-questionnaire"
        element={
          <ProtectedRoute>
            <PostQuestionnairePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/cars"
        element={
          <ProtectedRoute>
            <CarsPracticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AiAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <AiJournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/study-plan"
        element={
          <ProtectedRoute>
            <StudyPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostics/test"
        element={
          <ProtectedRoute>
            <DiagnosticTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostics/results"
        element={
          <ProtectedRoute>
            <DiagnosticResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostics"
        element={
          <ProtectedRoute>
            <DiagnosticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostic/exam"
        element={
          <ProtectedRoute>
            <DiagnosticExamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostic"
        element={
          <ProtectedRoute>
            <DiagnosticPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AuthenticatedChat() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null
  return <ChatAssistantWidget />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <AppRoutes />
          <ThemeToggle />
          <AuthenticatedChat />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
