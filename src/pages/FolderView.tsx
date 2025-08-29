import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, Search, BookOpen, MoreVertical, Edit, Trash2, Play, Settings, Tag, Folder, Move, Brain } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateFolderModal from '@/components/CreateFolderModal';
import FolderCard from '@/components/FolderCard';
import QuizCard from '@/components/QuizCard';
import StudyOptionsModal, { StudyOptions } from '@/components/StudyOptionsModal';
import MoveToModal from '@/components/MoveToModal';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Temporarily comment out the optimized hooks to fix the white screen
// import { useQuizzesInFolder, useDeleteQuiz } from '@/hooks/useQuizQuery';
// import { VirtualizedQuizList } from '@/components/quiz/VirtualizedQuizList';
// import { QuizListSkeleton } from '@/components/quiz/LazyQuizComponents';

interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Computed fields
  deck_count?: number;
  quiz_count?: number;
  subfolder_count?: number;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  folder_id: string;
  user_id: string;
  created_at: string;
  flashcard_count?: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  folder_id: string;
  user_id: string;
  settings: any;
  created_at: string;
  updated_at: string;
  question_count?: number;
  last_attempt?: {
    score: number;
    completed_at: string;
  };
  attempt_count?: number;
}

const FolderView = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCardCount, setDeckCardCount] = useState(0);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveItem, setMoveItem] = useState<{ type: 'folder' | 'deck'; item: Folder | Deck } | null>(null);
  useEffect(() => {
    if (user && folderId) {
      // Always fetch fresh data when folder changes or page mounts
      fetchFolderData();
    }
  }, [user, folderId]);

  // Auto refresh on focus/visibility/back
  useAutoRefresh(() => {
    if (user && folderId) fetchFolderData();
  }, [user, folderId]);

  useEffect(() => {
    filterDecks();
    filterQuizzes();
  }, [decks, quizzes, searchQuery]);

  const fetchFolderData = async () => {
    if (!user?.id || !folderId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all basic data in parallel for much faster loading
      const [folderResult, subfoldersResult, decksResult, quizzesResult] = await Promise.all([
        // Fetch folder details
        supabase
          .from('folders')
          .select('*')
          .eq('id', folderId)
          .eq('user_id', user?.id)
          .single(),
        
        // Fetch subfolders
        supabase
          .from('folders')
          .select('*')
          .eq('parent_id', folderId)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        
        // Fetch decks
        supabase
          .from('decks')
          .select('*')
          .eq('folder_id', folderId)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        
        // Fetch quizzes
        supabase
          .from('quizzes')
          .select('*')
          .eq('folder_id', folderId)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
      ]);

      // Handle folder data
      if (folderResult.error) throw folderResult.error;
      setFolder(folderResult.data);

      // Handle subfolders - set basic data first, load counts later
      if (!subfoldersResult.error && subfoldersResult.data) {
        const basicSubfolders = subfoldersResult.data.map(folder => ({
          ...folder,
          deck_count: 0,
          quiz_count: 0,
          subfolder_count: 0
        }));
        setSubfolders(basicSubfolders);
      }

      // Handle decks - set basic data first, load flashcard counts later
      if (!decksResult.error && decksResult.data) {
        const basicDecks = decksResult.data.map(deck => ({
          ...deck,
          flashcard_count: 0
        }));
        setDecks(basicDecks);
      }

      // Handle quizzes - set basic data first
      if (!quizzesResult.error && quizzesResult.data) {
        const basicQuizzes = quizzesResult.data.map(quiz => ({
          ...quiz,
          question_count: 0,
          attempt_count: 0,
          last_attempt: undefined
        }));
        setQuizzes(basicQuizzes);
      }

      // Load additional metadata in background (non-blocking)
      setTimeout(async () => {
        try {
          // Load subfolder counts if we have subfolders
          if (subfoldersResult.data && subfoldersResult.data.length > 0) {
            const subfolderIds = subfoldersResult.data.map(f => f.id);
            
            const [deckCounts, quizCounts, subfolderCounts] = await Promise.all([
              supabase.from('decks').select('folder_id').in('folder_id', subfolderIds).eq('user_id', user?.id),
              supabase.from('quizzes').select('folder_id').in('folder_id', subfolderIds).eq('user_id', user?.id),
              supabase.from('folders').select('parent_id').in('parent_id', subfolderIds).eq('user_id', user?.id)
            ]);

            // Process counts
            const deckCountMap = new Map();
            const quizCountMap = new Map();
            const subfolderCountMap = new Map();

            deckCounts.data?.forEach(item => {
              deckCountMap.set(item.folder_id, (deckCountMap.get(item.folder_id) || 0) + 1);
            });

            quizCounts.data?.forEach(item => {
              quizCountMap.set(item.folder_id, (quizCountMap.get(item.folder_id) || 0) + 1);
            });

            subfolderCounts.data?.forEach(item => {
              subfolderCountMap.set(item.parent_id, (subfolderCountMap.get(item.parent_id) || 0) + 1);
            });

            // Update subfolders with counts
            const enrichedSubfolders = subfoldersResult.data.map(folder => ({
              ...folder,
              deck_count: deckCountMap.get(folder.id) || 0,
              quiz_count: quizCountMap.get(folder.id) || 0,
              subfolder_count: subfolderCountMap.get(folder.id) || 0
            }));

            setSubfolders(enrichedSubfolders);
          }

          // Load deck flashcard counts if we have decks
          if (decksResult.data && decksResult.data.length > 0) {
            const deckIds = decksResult.data.map(d => d.id);
            const { data: flashcards } = await supabase
              .from('flashcards')
              .select('deck_id')
              .in('deck_id', deckIds);

            const flashcardCountMap = new Map();
            flashcards?.forEach(item => {
              flashcardCountMap.set(item.deck_id, (flashcardCountMap.get(item.deck_id) || 0) + 1);
            });

            const enrichedDecks = decksResult.data.map(deck => ({
              ...deck,
              flashcard_count: flashcardCountMap.get(deck.id) || 0
            }));

            setDecks(enrichedDecks);
          }

          // Load quiz metadata if we have quizzes
          if (quizzesResult.data && quizzesResult.data.length > 0) {
            const quizIds = quizzesResult.data.map(q => q.id);
            
            const [questions, attempts] = await Promise.all([
              supabase.from('questions').select('quiz_id').in('quiz_id', quizIds),
              supabase.from('quiz_attempts')
                .select('quiz_id, score, completed_at')
                .in('quiz_id', quizIds)
                .eq('user_id', user?.id)
                .not('completed_at', 'is', null)
            ]);

            // Process counts
            const questionCounts = new Map();
            questions.data?.forEach(q => {
              questionCounts.set(q.quiz_id, (questionCounts.get(q.quiz_id) || 0) + 1);
            });

            const attemptStats = new Map();
            attempts.data?.forEach(attempt => {
              const existing = attemptStats.get(attempt.quiz_id) || { count: 0, lastAttempt: null };
              existing.count++;
              if (!existing.lastAttempt || new Date(attempt.completed_at) > new Date(existing.lastAttempt.completed_at)) {
                existing.lastAttempt = { score: attempt.score, completed_at: attempt.completed_at };
              }
              attemptStats.set(attempt.quiz_id, existing);
            });

            // Update quizzes with metadata
            const enrichedQuizzes = quizzesResult.data.map(quiz => ({
              ...quiz,
              question_count: questionCounts.get(quiz.id) || 0,
              attempt_count: attemptStats.get(quiz.id)?.count || 0,
              last_attempt: attemptStats.get(quiz.id)?.lastAttempt
            }));

            setQuizzes(enrichedQuizzes);
          }
        } catch (error) {
          console.warn('Error loading metadata:', error);
          // Metadata loading failure doesn't break the UI
        }
      }, 50); // Very small delay to ensure UI renders immediately

    } catch (error) {
      console.error('Error fetching folder data:', error);
      toast({
        title: "Error",
        description: "Failed to load folder data",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const filterDecks = () => {
    if (!searchQuery) {
      setFilteredDecks(decks);
      return;
    }

    const filtered = decks.filter(deck =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredDecks(filtered);
  };

  const filterQuizzes = () => {
    if (!searchQuery) {
      setFilteredQuizzes(quizzes);
      return;
    }

    const filtered = quizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredQuizzes(filtered);
  };

  const deleteDeck = async (deckId: string, deckName: string) => {
    if (!confirm(`Are you sure you want to delete "${deckName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDecks(decks.filter(deck => deck.id !== deckId));

    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({
        title: "Error",
        description: "Failed to delete deck",
        variant: "destructive",
      });
    }
  };

  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      toast({
        title: "Success",
        description: `Quiz "${quizTitle}" deleted successfully`,
      });

    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const startStudySession = async (deckId: string) => {
    // Find the deck and get card count
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;

    try {
      // Get card count for this deck
      const { count, error } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('deck_id', deckId);

      if (error) throw error;

      setSelectedDeck(deck);
      setDeckCardCount(count || 0);
      setShowStudyModal(true);
    } catch (error) {
      console.error('Error getting deck card count:', error);
      // Fallback to direct navigation if error
      navigate(`/study/${deckId}`);
    }
  };

  const handleStudyStart = (options: StudyOptions) => {
    if (!selectedDeck) return;

    let url = `/study/${selectedDeck.id}`;

    // Add query parameters based on options
    const params = new URLSearchParams();

    if (options.mode === 'shuffle') {
      params.set('shuffle', 'true');
    } else if (options.mode === 'startFrom' && options.startFromCard) {
      params.set('startFrom', options.startFromCard.toString());
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    setShowStudyModal(false);
    setSelectedDeck(null);
    navigate(url);
  };

  const handleModalClose = () => {
    setShowStudyModal(false);
    setSelectedDeck(null);
  };

  // Folder management handlers
  const handleCreateFolder = async (folderData: {
    name: string;
    description: string;
    parent_id?: string;
    color: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          ...folderData,
          parent_id: folderId, // Set current folder as parent
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;



      await fetchFolderData();
      setIsCreateFolderModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subfolder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setIsCreateFolderModalOpen(true);
  };

  const handleUpdateFolder = async (folderData: {
    name: string;
    description: string;
    parent_id?: string;
    color: string;
  }) => {
    if (!editingFolder) return;

    try {
      const { error } = await supabase
        .from('folders')
        .update(folderData)
        .eq('id', editingFolder.id);

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: `Folder "${folderData.name}" updated successfully`,
      });

      await fetchFolderData();
      setIsCreateFolderModalOpen(false);
      setEditingFolder(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? This will also delete all decks and cards inside it.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;



      await fetchFolderData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleFolderOpen = (folderId: string) => {
    navigate(`/folder/${folderId}`);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCreateSubfolder = (parentId: string) => {
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateDeck = (folderId: string) => {
    // Navigate to create deck page with folder context
    navigate(`/create-deck?folderId=${folderId}`);
  };

  const handleMoveFolder = (folder: Folder) => {
    setMoveItem({ type: 'folder', item: folder });
    setShowMoveModal(true);
  };

  const handleMoveDeck = (deck: Deck) => {
    setMoveItem({ type: 'deck', item: deck });
    setShowMoveModal(true);
  };

  const handleMoveSuccess = () => {
    fetchFolderData();
    setShowMoveModal(false);
    setMoveItem(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !folder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              {!user ? 'Please log in to continue' : 'Folder not found'}
            </h1>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Navigation and Title Section */}
          <div className="flex items-start gap-2 sm:gap-4">
            <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0 mt-1" />
            <Button
              variant="ghost"
              onClick={() => {
                if (folder?.parent_id) {
                  navigate(`/folder/${folder.parent_id}`);
                } else {
                  navigate('/');
                }
                // Scroll to top after navigation
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }}
              className="p-2 flex-shrink-0 mt-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 break-words leading-tight">
                {folder.name}
              </h1>
              {folder.description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words leading-relaxed">
                  {folder.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* New Folder Button */}
            <Button
              onClick={() => setIsCreateFolderModalOpen(true)}
              variant="outline"
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto flex-shrink-0"
            >
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            
            {/* Create Deck and Create Quiz - Side by side on mobile, inline on desktop */}
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => navigate(`/create?folderId=${folderId}`)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-initial sm:w-auto flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Deck
              </Button>
              <Button
                onClick={() => navigate(`/create-quiz?folderId=${folderId}`)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex-1 sm:flex-initial sm:w-auto flex-shrink-0"
                data-tour="create-quiz-button"
              >
                <Brain className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search decks and quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>
        </div>

        {/* Subfolders Section */}
        {subfolders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Subfolders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {subfolders.map((subfolder) => (
                <FolderCard
                  key={subfolder.id}
                  folder={subfolder}
                  onOpen={handleFolderOpen}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                  onCreateSubfolder={handleCreateSubfolder}
                  onCreateDeck={handleCreateDeck}
                  onMove={handleMoveFolder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quizzes Section */}
        {filteredQuizzes.length > 0 && (
          <div className="space-y-4" data-tour="quiz-results">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Quizzes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onDelete={deleteQuiz}
                />
              ))}
            </div>
          </div>
        )}

        {/* Decks Section */}
        {filteredDecks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Decks</h2>
          </div>
        )}

        {/* Decks Grid */}
        {filteredDecks.length === 0 && filteredQuizzes.length === 0 ? (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {searchQuery ? 'No content found' : 'No content in this folder'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first deck or quiz to get started'
                }
              </p>
              <Button
                onClick={() => navigate(`/create?folderId=${folderId}`)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Deck
              </Button>
            </CardContent>
          </Card>
        ) : filteredDecks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredDecks.map((deck) => (
              <Card
                key={deck.id}
                className="w-full max-w-full min-w-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                style={{ maxWidth: '100%', minWidth: '0' }}
              >
                <CardContent className="p-4 md:p-6 min-w-0">
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="p-2 md:p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors flex-shrink-0">
                      <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startStudySession(deck.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Study Now
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/deck/${deck.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Deck
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/deck/${deck.id}/flashcards`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Cards
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveDeck(deck)}>
                          <Move className="h-4 w-4 mr-2" />
                          Move to
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteDeck(deck.id, deck.name)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="min-w-0 mb-2">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors break-words leading-tight">
                      {deck.name}
                    </h3>
                  </div>

                  {deck.description && (
                    <div className="min-w-0 mb-4">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-words overflow-hidden">{deck.description}</p>
                    </div>
                  )}

                  {deck.tags.length > 0 && (
                    <div className="min-w-0 mb-4">
                      <div className="flex flex-wrap gap-1 overflow-hidden">
                        {deck.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs max-w-[80px] truncate border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            <Tag className="h-2 w-2 mr-1 flex-shrink-0" />
                            <span className="truncate">{tag}</span>
                          </Badge>
                        ))}
                        {deck.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs flex-shrink-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            +{deck.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="min-w-0 mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
                      <span className="truncate flex-shrink-0">{deck.flashcard_count || 0} cards</span>
                      <span className="text-xs truncate">{new Date(deck.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <Button
                      onClick={() => startStudySession(deck.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm min-w-0"
                    >
                      <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Study Now</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Create/Edit Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
        parentId={folderId}
        editingFolder={editingFolder}
        availableFolders={subfolders}
      />

      {/* Study Options Modal */}
      {selectedDeck && (
        <StudyOptionsModal
          isOpen={showStudyModal}
          onClose={handleModalClose}
          onStartStudy={handleStudyStart}
          deckName={selectedDeck.name}
          totalCards={deckCardCount}
        />
      )}

      {/* Move To Modal */}
      {moveItem && (
        <MoveToModal
          isOpen={showMoveModal}
          onClose={() => {
            setShowMoveModal(false);
            setMoveItem(null);
          }}
          onSuccess={handleMoveSuccess}
          itemType={moveItem.type}
          itemId={moveItem.item.id}
          itemName={moveItem.item.name}
          currentFolderId={moveItem.type === 'folder' ? (moveItem.item as Folder).parent_id : (moveItem.item as Deck).folder_id}
        />
      )}

    </div>
  );
};

export default FolderView;
