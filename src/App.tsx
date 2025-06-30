
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="light">
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/study" element={<Layout><Study /></Layout>} />
              <Route path="/study/:deckId" element={<StudySession />} />
              <Route path="/study/summary" element={<StudySummary />} />
              <Route path="/progress" element={<Layout><Progress /></Layout>} />
              <Route path="/browse" element={<Layout><Browse /></Layout>} />
              <Route path="/create" element={<Layout><CreateDeck /></Layout>} />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/folder/:folderId" element={<Layout><FolderView /></Layout>} />
              <Route path="/deck/:deckId/edit" element={<Layout><DeckEdit /></Layout>} />
              <Route path="/deck/:deckId/flashcards" element={<Layout><FlashcardSetup /></Layout>} />
              <Route path="/study/:deckId/card/:cardId/edit" element={<CardEdit />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
