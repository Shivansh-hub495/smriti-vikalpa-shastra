
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedAppLayout from "@/components/ProtectedAppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoadingPage } from "@/components/LoadingStates";
import PageTransition from "@/components/PageTransition";

// Direct imports (lazy loading removed)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import StudySession from './pages/StudySession';
import StudySummary from './pages/StudySummary';
import Progress from './pages/Progress';
import Browse from './pages/Browse';
import Settings from './pages/Settings';
import CreateDeck from './pages/CreateDeck';
import CreateQuiz from './pages/CreateQuiz';
import QuizEdit from './pages/QuizEdit';
import QuestionCreate from './pages/QuestionCreate';
import QuestionEdit from './pages/QuestionEdit';
import QuizTaking from './pages/QuizTaking';
import QuizAttemptHistoryPage from './pages/QuizAttemptHistoryPage';
import FolderView from './pages/FolderView';
import DeckEdit from './pages/DeckEdit';
import CardEdit from './pages/CardEdit';
import FlashcardSetup from './pages/FlashcardSetup';
import ChatbotAssistant from './components/ChatbotAssistant';

const queryClient = new QueryClient();

// Route-specific wrapper components with appropriate loading messages
const AuthPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const DashboardPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const StudyPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const QuizPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const ProgressPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const BrowsePageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const SettingsPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const FolderPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const DeckPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const CardPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const GenericPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageTransition>
    {children}
  </PageTransition>
);

const App = () => (
<QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="smriti-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={
                <AuthPageWrapper>
                  <Auth />
                </AuthPageWrapper>
              } />

              {/* Protected Routes with persistent sidebar */}
              <Route element={<ProtectedAppLayout />}>
                <Route path="/" element={
                  <DashboardPageWrapper>
                    <Dashboard />
                  </DashboardPageWrapper>
                } />

                <Route path="/study" element={
                  <StudyPageWrapper>
                    <Study />
                  </StudyPageWrapper>
                } />

                <Route path="/progress" element={
                  <ProgressPageWrapper>
                    <Progress />
                  </ProgressPageWrapper>
                } />

                <Route path="/browse" element={
                  <BrowsePageWrapper>
                    <Browse />
                  </BrowsePageWrapper>
                } />

                <Route path="/settings" element={
                  <SettingsPageWrapper>
                    <Settings />
                  </SettingsPageWrapper>
                } />

                {/* Protected Folder Routes */}
                <Route path="/folder/:folderId" element={
                  <FolderPageWrapper>
                    <FolderView />
                  </FolderPageWrapper>
                } />

                {/* Deck routes inside persistent layout */}
                <Route path="/create" element={
                  <DeckPageWrapper>
                    <CreateDeck />
                  </DeckPageWrapper>
                } />

                <Route path="/deck/:deckId/edit" element={
                  <DeckPageWrapper>
                    <DeckEdit />
                  </DeckPageWrapper>
                } />

                <Route path="/deck/:deckId/flashcards" element={
                  <DeckPageWrapper>
                    <FlashcardSetup />
                  </DeckPageWrapper>
                } />

                {/* Quiz routes inside persistent layout */}
                <Route path="/create-quiz" element={
                  <QuizPageWrapper>
                    <CreateQuiz />
                  </QuizPageWrapper>
                } />

                <Route path="/folder/:folderId/create-quiz" element={
                  <QuizPageWrapper>
                    <CreateQuiz />
                  </QuizPageWrapper>
                } />

                <Route path="/quiz/:quizId/edit" element={
                  <QuizPageWrapper>
                    <QuizEdit />
                  </QuizPageWrapper>
                } />

                <Route path="/quiz/:quizId/question/create" element={
                  <QuizPageWrapper>
                    <QuestionCreate />
                  </QuizPageWrapper>
                } />

                <Route path="/quiz/:quizId/question/:questionId/edit" element={
                  <QuizPageWrapper>
                    <QuestionEdit />
                  </QuizPageWrapper>
                } />

                <Route path="/quiz/:quizId/history" element={
                  <QuizPageWrapper>
                    <QuizAttemptHistoryPage />
                  </QuizPageWrapper>
                } />

                <Route path="/quiz/:quizId/results/:attemptId" element={
                  <QuizPageWrapper>
                    <QuizAttemptHistoryPage />
                  </QuizPageWrapper>
                } />
              </Route>

              {/* Fullscreen study flows (outside persistent layout) */}
              <Route path="/study/:deckId" element={
                <ProtectedRoute>
                  <StudyPageWrapper>
                    <StudySession />
                  </StudyPageWrapper>
                </ProtectedRoute>
              } />

              <Route path="/study/summary" element={
                <ProtectedRoute>
                  <StudyPageWrapper>
                    <StudySummary />
                  </StudyPageWrapper>
                </ProtectedRoute>
              } />

              {/* Take quiz is a full-screen flow without the sidebar */}
              <Route path="/quiz/:quizId/take" element={
                <ProtectedRoute>
                  <QuizPageWrapper>
                    <QuizTaking />
                  </QuizPageWrapper>
                </ProtectedRoute>
              } />

                {/* Protected Deck Routes */}


                <Route path="/study/:deckId/card/:cardId/edit" element={
                  <ProtectedRoute>
                    <CardPageWrapper>
                      <CardEdit />
                    </CardPageWrapper>
                  </ProtectedRoute>
                } />

                {/* Protected Quiz Routes */}


                {/* Catch-all route for 404 */}
                <Route path="*" element={
                  <GenericPageWrapper>
                    <NotFound />
                  </GenericPageWrapper>
                } />
              </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
