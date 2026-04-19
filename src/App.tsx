import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ProfileProvider } from './context/ProfileProvider'
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
import {
  AboutPage,
  ContactPage,
  ReviewsPage,
  WhyUsPage,
} from './pages/marketingPages'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PostQuestionnairePage } from './pages/PostQuestionnairePage'
import { SettingsPage } from './pages/SettingsPage'
import { StudyPlanPage } from './pages/StudyPlanPage'
import { ChatAssistantWidget } from './components/ChatAssistantWidget'
import { ThemeToggle } from './components/ThemeToggle'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/why-us" element={<WhyUsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/post-questionnaire" element={<PostQuestionnairePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/practice/cars" element={<CarsPracticePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/analytics" element={<AiAnalyticsPage />} />
      <Route path="/journal" element={<AiJournalPage />} />
      <Route path="/study-plan" element={<StudyPlanPage />} />
      <Route path="/diagnostics/test" element={<DiagnosticTestPage />} />
      <Route path="/diagnostics/results" element={<DiagnosticResultsPage />} />
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
      <AuthProvider>
        <ProfileProvider>
          <AppRoutes />
          <ThemeToggle />
          <ChatAssistantWidget />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
