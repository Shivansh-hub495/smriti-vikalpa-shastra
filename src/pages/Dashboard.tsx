import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Folder, Search, TrendingUp, Target, Clock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useAuth } from '@/contexts/AuthContext';
import FolderCard from '@/components/FolderCard';
import CreateFolderModal from '@/components/CreateFolderModal';
import { useToast } from '@/hooks/use-toast';

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

interface DashboardStats {
  studyStreak: number;
  overallAccuracy: number;
  cardsReviewed: number;
  studyTime: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    studyStreak: 0,
    overallAccuracy: 0,
    cardsReviewed: 0,
    studyTime: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchStats();
    }
  }, [user]);

  // auto refresh on focus/visibility/back
  useAutoRefresh(() => {
    if (user) {
      fetchFolders();
      fetchStats();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          decks:decks(count),
          subfolders:folders!parent_id(count)
        `)
        .eq('user_id', user?.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to include counts
      const processedFolders = data?.map(folder => ({
        ...folder,
        deck_count: folder.decks?.[0]?.count || 0,
        subfolder_count: folder.subfolders?.[0]?.count || 0
      })) || [];

      setFolders(processedFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Use count queries for better performance and accuracy
      const [totalSessionsResponse, correctSessionsResponse, recentSessionsResponse] = await Promise.all([
        // Total sessions count
        supabase
          .from('study_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id),
        // Correct sessions count
        supabase
          .from('study_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('was_correct', true),
        // Recent sessions for streak calculation (last 30 days)
        supabase
          .from('study_sessions')
          .select('created_at')
          .eq('user_id', user?.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      if (totalSessionsResponse.error) throw totalSessionsResponse.error;
      if (correctSessionsResponse.error) throw correctSessionsResponse.error;
      if (recentSessionsResponse.error) throw recentSessionsResponse.error;

      // Calculate stats from count queries (more accurate and efficient)
      const totalReviews = totalSessionsResponse.count || 0;
      const totalCorrect = correctSessionsResponse.count || 0;

      // Calculate study streak based on recent sessions (more accurate)
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const hasActivity = recentSessionsResponse.data?.some(session =>
          session.created_at?.startsWith(dateStr)
        );

        if (hasActivity) {
          if (i === 0 || streak === i) streak = i + 1;
        } else if (i === 0) {
          break;
        }
      }

      // Estimate study time based on reviews (assuming 30 seconds per review)
      const estimatedStudyTimeMinutes = totalReviews * 0.5;
      const studyTimeHours = estimatedStudyTimeMinutes / 60;

      setStats({
        studyStreak: streak,
        overallAccuracy: totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0,
        cardsReviewed: totalReviews,
        studyTime: Math.round(studyTimeHours * 10) / 10
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([
          {
            name: newFolderName.trim(),
            user_id: user?.id,
            color: 'bg-purple-500'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFolders([data, ...folders]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

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
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;



      await fetchFolders();
      setIsCreateFolderModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
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

      await fetchFolders();
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



      await fetchFolders();
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
    // For dashboard, we don't create subfolders directly
    // Navigate to the parent folder where subfolder creation is handled
    navigate(`/folder/${parentId}`);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCreateDeck = (folderId: string) => {
    // Navigate to create deck page with folder context
    navigate(`/create-deck?folderId=${folderId}`);
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Track your learning progress and manage your study materials</p>
            </div>
          </div>
          <Button
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Study Streak</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{stats.studyStreak}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">days</p>
                </div>
                <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Accuracy</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.overallAccuracy}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">%</p>
                </div>
                <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cards Reviewed</p>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.cardsReviewed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">total</p>
                </div>
                <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Study Time</p>
                  <p className="text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.studyTime}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">hrs total</p>
                </div>
                <div className="p-2 lg:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Folders */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search folders, decks, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
              />
            </div>
          </div>

          {/* Create Folder Form */}
          {isCreatingFolder && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Input
                    placeholder="Folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                    autoFocus
                  />
                  <Button onClick={createFolder} className="bg-green-500 hover:bg-green-600 text-white">
                    Create
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Folders Grid */}
          {filteredFolders.length === 0 ? (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No folders yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Get started by creating your first folder</p>
                <Button
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={handleFolderOpen}
                  onEdit={handleEditFolder}
                  onDelete={handleDeleteFolder}
                  onCreateSubfolder={handleCreateSubfolder}
                  onCreateDeck={handleCreateDeck}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => {
          setIsCreateFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
        editingFolder={editingFolder}
        availableFolders={folders}
      />
    </div>
  );
};

export default Dashboard;
