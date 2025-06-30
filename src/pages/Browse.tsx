import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Folder, BookOpen, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Deck {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  folder_id: string;
  user_id: string;
  created_at: string;
  folder?: {
    name: string;
  };
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
}

const Browse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortDecks();
  }, [decks, searchQuery, selectedFolder, selectedTag, sortBy]);

  const fetchData = async () => {
    try {
      const [decksResponse, foldersResponse] = await Promise.all([
        supabase
          .from('decks')
          .select(`
            *,
            folder:folders(name)
          `)
          .eq('user_id', user?.id),
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user?.id)
      ]);

      if (decksResponse.error) throw decksResponse.error;
      if (foldersResponse.error) throw foldersResponse.error;

      setDecks(decksResponse.data || []);
      setFolders(foldersResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDecks = () => {
    let filtered = [...decks];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(deck =>
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by folder
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(deck => deck.folder_id === selectedFolder);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(deck => deck.tags.includes(selectedTag));
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredDecks(filtered);
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    decks.forEach(deck => {
      deck.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-gray-600 hover:text-gray-900 transition-colors" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Browse</h1>
            <p className="text-gray-600">Explore and manage all your study materials</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search decks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                />
              </div>

              {/* Folder Filter */}
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300">
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {getAllTags().map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {filteredDecks.length} {filteredDecks.length === 1 ? 'Deck' : 'Decks'}
            </h2>
            <Button
              onClick={() => navigate('/create')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              Create New Deck
            </Button>
          </div>

          {filteredDecks.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No decks found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedFolder !== 'all' || selectedTag !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Create your first deck to get started'
                  }
                </p>
                <Button
                  onClick={() => navigate('/create')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Create Deck
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDecks.map((deck) => (
                <Card
                  key={deck.id}
                  className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/deck/${deck.id}/edit`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      {deck.folder && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Folder className="h-3 w-3 mr-1" />
                          {deck.folder.name}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors break-words leading-tight">
                      {deck.name}
                    </h3>
                    
                    {deck.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deck.description}</p>
                    )}
                    
                    {deck.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {deck.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {deck.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{deck.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(deck.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
