
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, BookOpen, Folder, ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import DeckCard from "@/components/DeckCard";
import FolderCard from "@/components/FolderCard";
import CreateDeckModal from "@/components/CreateDeckModal";
import CreateFolderModal from "@/components/CreateFolderModal";
import FolderBreadcrumb from "@/components/FolderBreadcrumb";
import StatsOverview from "@/components/StatsOverview";
import { useFolders } from "@/hooks/useFolders";
import { useDecks } from "@/hooks/useDecks";
import type { Folder, Deck } from "@/lib/supabase";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDeckModalOpen, setIsCreateDeckModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const { toast } = useToast();

  // Hooks for data fetching
  const {
    folders,
    loading: foldersLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderPath
  } = useFolders(currentFolderId);

  const {
    decks,
    loading: decksLoading,
    createDeck,
    updateDeck,
    deleteDeck
  } = useDecks(currentFolderId);

  // Update breadcrumb path when folder changes
  useEffect(() => {
    const updatePath = async () => {
      if (currentFolderId) {
        const path = await getFolderPath(currentFolderId);
        setCurrentPath(path);
      } else {
        setCurrentPath([]);
      }
    };
    updatePath();
  }, [currentFolderId, getFolderPath]);

  // Filter items based on search
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (folder.description && folder.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deck.description && deck.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    deck.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Event handlers
  const handleFolderOpen = (folderId: string) => {
    setCurrentFolderId(folderId);
  };

  const handleNavigate = (folderId?: string) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (folderData: {
    name: string;
    description: string;
    parent_id?: string;
    color: string;
  }) => {
    await createFolder({
      ...folderData,
      parent_id: folderData.parent_id || currentFolderId
    });
    setIsCreateFolderModalOpen(false);
    setEditingFolder(null);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setIsCreateFolderModalOpen(true);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? All contents will be deleted.')) {
      await deleteFolder(folderId);
    }
  };

  const handleCreateDeck = async (deckData: {
    name: string;
    description: string;
    folder_id: string;
    color: string;
    tags: string[];
  }) => {
    await createDeck({
      ...deckData,
      folder_id: deckData.folder_id || currentFolderId || ''
    });
    setIsCreateDeckModalOpen(false);
    setEditingDeck(null);
  };

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setIsCreateDeckModalOpen(true);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck? All flashcards will be deleted.')) {
      await deleteDeck(deckId);
    }
  };

  const handleStudyDeck = (deckId: string) => {
    toast({
      title: "Starting Study Session",
      description: "Opening deck for review",
    });
    // TODO: Navigate to study page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-white/20 dark:border-gray-700/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Dashboard</h2>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsCreateFolderModalOpen(true)}
                variant="outline"
                className="bg-white/80 backdrop-blur-lg border-white/20 text-purple-600 hover:bg-purple-50 font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button
                onClick={() => setIsCreateDeckModalOpen(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="h-4 w-4 mr-2 relative z-10" />
                <span className="relative z-10">Create Deck</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Breadcrumb Navigation */}
        <FolderBreadcrumb
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search folders, decks, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>
        </div>

        {/* Loading State */}
        {(foldersLoading || decksLoading) && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        )}

        {/* Content Grid */}
        {!foldersLoading && !decksLoading && (
          <>
            {/* Folders and Decks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={handleFolderOpen}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                  onCreateSubfolder={(parentId) => {
                    setCurrentFolderId(parentId);
                    setIsCreateFolderModalOpen(true);
                  }}
                  onCreateDeck={(folderId) => {
                    setCurrentFolderId(folderId);
                    setIsCreateDeckModalOpen(true);
                  }}
                />
              ))}

              {/* Decks */}
              {filteredDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onStudy={handleStudyDeck}
                  onEdit={handleEditDeck}
                  onDelete={handleDeleteDeck}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredFolders.length === 0 && filteredDecks.length === 0 && (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
                    {searchTerm ? <Search className="h-12 w-12 text-white" /> : <Folder className="h-12 w-12 text-white" />}
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                  {searchTerm ? "No items found" : "This folder is empty"}
                </h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first folder or deck"
                  }
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleCreateFolder}
        parentId={currentFolderId}
        editingFolder={editingFolder}
        availableFolders={folders}
      />

      <CreateDeckModal
        isOpen={isCreateDeckModalOpen}
        onClose={() => {
          setIsCreateDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSubmit={handleCreateDeck}
        folderId={currentFolderId}
        editingDeck={editingDeck}
      />
    </div>
  );
};

export default Index;
