
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
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
import FolderView from './pages/FolderView';
import DeckEdit from './pages/DeckEdit';
import CardEdit from './pages/CardEdit';
import FlashcardSetup from './pages/FlashcardSetup';
import ChatbotAssistant from './components/ChatbotAssistant';

const queryClient = new QueryClient();

const App = () => (
<QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="smriti-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<><Layout><Dashboard /></Layout><ChatbotAssistant /></>} />
              <Route path="/study" element={<><Layout><Study /></Layout><ChatbotAssistant /></>} />
              <Route path="/study/:deckId" element={<StudySession />} />
              <Route path="/study/summary" element={<StudySummary />} />
              <Route path="/progress" element={<><Layout><Progress /></Layout><ChatbotAssistant /></>} />
              <Route path="/browse" element={<><Layout><Browse /></Layout><ChatbotAssistant /></>} />
              <Route path="/create" element={<><Layout><CreateDeck /></Layout><ChatbotAssistant /></>} />
              <Route path="/settings" element={<><Layout><Settings /></Layout><ChatbotAssistant /></>} />
              <Route path="/folder/:folderId" element={<><Layout><FolderView /></Layout><ChatbotAssistant /></>} />
              <Route path="/deck/:deckId/edit" element={<><Layout><DeckEdit /></Layout><ChatbotAssistant /></>} />
              <Route path="/deck/:deckId/flashcards" element={<><Layout><FlashcardSetup /></Layout><ChatbotAssistant /></>} />
              <Route path="/study/:deckId/card/:cardId/edit" element={<CardEdit />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
