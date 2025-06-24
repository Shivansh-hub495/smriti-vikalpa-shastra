import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, Search, BookOpen, MoreVertical, Edit, Trash2, Play, Settings, Tag, Folder } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateFolderModal from '@/components/CreateFolderModal';
import FolderCard from '@/components/FolderCard';
import StudyOptionsModal, { StudyOptions } from '@/components/StudyOptionsModal';

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

const FolderView = () => {
  const navigate = useNavigate();
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [deckCardCount, setDeckCardCount] = useState(0);

  useEffect(() => {
    if (user && folderId) {
      fetchFolderData();
    }
  }, [user, folderId]);

  useEffect(() => {
    filterDecks();
  }, [decks, searchQuery]);

  const fetchFolderData = async () => {
    try {
      // Fetch folder details
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('user_id', user?.id)
        .single();

      if (folderError) throw folderError;
      setFolder(folderData);

      // Fetch subfolders
      const { data: subfoldersData, error: subfoldersError } = await supabase
        .from('folders')
        .select(`
          *,
          decks:decks(count),
          subfolders:folders!parent_id(count)
        `)
        .eq('parent_id', folderId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (subfoldersError) throw subfoldersError;

      // Process subfolder data to include counts
      const processedSubfolders = subfoldersData?.map(folder => ({
        ...folder,
        deck_count: folder.decks?.[0]?.count || 0,
        subfolder_count: folder.subfolders?.[0]?.count || 0
      })) || [];

      setSubfolders(processedSubfolders);

      // Fetch decks in this folder
      const { data: decksData, error: decksError } = await supabase
        .from('decks')
        .select(`
          *,
          flashcards(count)
        `)
        .eq('folder_id', folderId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (decksError) throw decksError;

      // Process deck data to include flashcard count
      const processedDecks = decksData?.map(deck => ({
        ...deck,
        flashcard_count: deck.flashcards?.[0]?.count || 0
      })) || [];

      setDecks(processedDecks);
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
  };

  const handleCreateSubfolder = (parentId: string) => {
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateDeck = (folderId: string) => {
    // Navigate to create deck page with folder context
    navigate(`/create-deck?folderId=${folderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Folder not found</h1>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-4">
          {/* Navigation and Title Section */}
          <div className="flex items-start gap-2 sm:gap-4">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 mt-1" />
            <Button
              variant="ghost"
              onClick={() => {
                if (folder?.parent_id) {
                  navigate(`/folder/${folder.parent_id}`);
                } else {
                  navigate('/');
                }
              }}
              className="p-2 flex-shrink-0 mt-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 break-words leading-tight">
                {folder.name}
              </h1>
              {folder.description && (
                <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed">
                  {folder.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => setIsCreateFolderModalOpen(true)}
              variant="outline"
              className="bg-white/80 backdrop-blur-lg border-white/20 text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto flex-shrink-0"
            >
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button
              onClick={() => navigate(`/create?folderId=${folderId}`)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>
        </div>

        {/* Subfolders Section */}
        {subfolders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Subfolders</h2>
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
                />
              ))}
            </div>
          </div>
        )}

        {/* Decks Grid */}
        {filteredDecks.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? 'No decks found' : 'No decks in this folder'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create your first deck to get started'
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredDecks.map((deck) => (
              <Card
                key={deck.id}
                className="w-full max-w-full min-w-0 bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 group overflow-hidden"
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
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-1 break-words overflow-hidden">
                      {deck.name}
                    </h3>
                  </div>

                  {deck.description && (
                    <div className="min-w-0 mb-4">
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 break-words overflow-hidden">{deck.description}</p>
                    </div>
                  )}

                  {deck.tags.length > 0 && (
                    <div className="min-w-0 mb-4">
                      <div className="flex flex-wrap gap-1 overflow-hidden">
                        {deck.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs max-w-[80px] truncate">
                            <Tag className="h-2 w-2 mr-1 flex-shrink-0" />
                            <span className="truncate">{tag}</span>
                          </Badge>
                        ))}
                        {deck.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            +{deck.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="min-w-0 mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
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
        )}
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
    </div>
  );
};

export default FolderView;
