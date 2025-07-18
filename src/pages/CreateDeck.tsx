import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, ArrowLeft, Folder, Tag } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Folder {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
}

const CreateDeck = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  // Set selected folder from URL parameter
  useEffect(() => {
    const folderId = searchParams.get('folderId');
    if (folderId) {
      setSelectedFolder(folderId);
    }
  }, [searchParams]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setFoldersLoading(false);
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
            user_id: user?.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFolders([data, ...folders]);
      setSelectedFolder(data.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
      

    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const createDeck = async () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFolder) {
      toast({
        title: "Error",
        description: "Please select a folder for your deck",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('decks')
        .insert([
          {
            name: deckName.trim(),
            description: deckDescription.trim() || null,
            folder_id: selectedFolder,
            tags: tags,
            user_id: user?.id
          }
        ])
        .select()
        .single();

      if (error) throw error;



      // Navigate to the deck edit page to add flashcards
      navigate(`/deck/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating deck:', error);
      toast({
        title: "Error",
        description: "Failed to create deck",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors" />
          <Button
            variant="ghost"
            onClick={() => {
              if (selectedFolder) {
                navigate(`/folder/${selectedFolder}`);
              } else {
                navigate('/');
              }
            }}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Create New Deck</h1>
            <p className="text-gray-600 dark:text-gray-300">Set up your new flashcard deck</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">Deck Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="deckName" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Deck Name *
                  </Label>
                  <Input
                    id="deckName"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Enter deck name..."
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                  />
                </div>

                <div>
                  <Label htmlFor="deckDescription" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="deckDescription"
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder="Enter deck description..."
                    rows={3}
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Folder *
                  </Label>
                  {foldersLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300">
                          <SelectValue placeholder="Select a folder" />
                        </SelectTrigger>
                        <SelectContent>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4" />
                                {folder.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {!isCreatingFolder ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreatingFolder(true)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Folder
                        </Button>
                      ) : (
                        <div className="flex gap-2">
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
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Tags
                  </Label>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-600 dark:hover:text-red-400"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="mb-3">After creating your deck, you'll be able to:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Add flashcards
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Import from files
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Start studying
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={createDeck}
              disabled={loading || !deckName.trim() || !selectedFolder}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Deck'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDeck;
