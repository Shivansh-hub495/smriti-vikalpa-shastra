import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, ArrowLeft, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/RichTextEditor';
import { ImageUpload } from '@/components/ImageUpload';

interface Deck {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  folder_id: string;
  user_id: string;
  created_at: string;
}

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  front_content_html?: string;
  back_content_html?: string;
  front_image_url?: string;
  back_image_url?: string;
  deck_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const FlashcardSetup = () => {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New flashcard form
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [frontContentHtml, setFrontContentHtml] = useState('');
  const [backContentHtml, setBackContentHtml] = useState('');
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [showAnswers, setShowAnswers] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user && deckId) {
      fetchDeckAndFlashcards();
    }
  }, [user, deckId]);

  const fetchDeckAndFlashcards = async () => {
    try {
      // Fetch deck details
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .eq('user_id', user?.id)
        .single();

      if (deckError) throw deckError;
      setDeck(deckData);

      // Fetch flashcards
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (flashcardsError) throw flashcardsError;
      setFlashcards(flashcardsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load deck data",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const saveFlashcard = async () => {
    // Check if both sides have either content or image
    const frontHasContent = frontContent.trim() || frontImageUrl;
    const backHasContent = backContent.trim() || backImageUrl;

    if (!frontHasContent || !backHasContent) {
      toast({
        title: "Error",
        description: "Please add content (text or image) to both front and back of the card",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCard) {
        // Update existing flashcard
        const { data, error } = await supabase
          .from('flashcards')
          .update({
            front_content: frontContent.trim(),
            back_content: backContent.trim(),
            front_content_html: frontContentHtml,
            back_content_html: backContentHtml,
            front_image_url: frontImageUrl || null,
            back_image_url: backImageUrl || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCard.id)
          .eq('user_id', user?.id)
          .select()
          .single();

        if (error) throw error;

        setFlashcards(flashcards.map(card => 
          card.id === editingCard.id ? data : card
        ));
        
        toast({
          title: "Flashcard updated",
          description: "Your flashcard has been updated successfully",
        });
      } else {
        // Create new flashcard
        const { data, error } = await supabase
          .from('flashcards')
          .insert([
            {
              front_content: frontContent.trim(),
              back_content: backContent.trim(),
              front_content_html: frontContentHtml,
              back_content_html: backContentHtml,
              front_image_url: frontImageUrl || null,
              back_image_url: backImageUrl || null,
              deck_id: deckId,
              user_id: user?.id
            }
          ])
          .select()
          .single();

        if (error) throw error;

        setFlashcards([data, ...flashcards]);
        
        toast({
          title: "Flashcard created",
          description: "Your flashcard has been created successfully",
        });
      }

      // Reset form
      setFrontContent('');
      setBackContent('');
      setFrontContentHtml('');
      setBackContentHtml('');
      setFrontImageUrl('');
      setBackImageUrl('');
      setEditingCard(null);
    } catch (error) {
      console.error('Error saving flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to save flashcard",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const editFlashcard = (card: Flashcard) => {
    setEditingCard(card);
    setFrontContent(card.front_content);
    setBackContent(card.back_content);
    setFrontContentHtml(card.front_content_html || '');
    setBackContentHtml(card.back_content_html || '');
    setFrontImageUrl(card.front_image_url || '');
    setBackImageUrl(card.back_image_url || '');
  };

  const deleteFlashcard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFlashcards(flashcards.filter(card => card.id !== cardId));
      
      toast({
        title: "Flashcard deleted",
        description: "The flashcard has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setFrontContent('');
    setBackContent('');
    setFrontContentHtml('');
    setBackContentHtml('');
    setFrontImageUrl('');
    setBackImageUrl('');
  };

  const toggleAnswer = (cardId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Deck not found</h1>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors touch-manipulation" />
          <Button
            variant="ghost"
            onClick={() => navigate(`/deck/${deckId}/edit`)}
            className="p-1.5 sm:p-2 touch-manipulation"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">Manage Flashcards</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words leading-tight">
              {deck.name} • {flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="create" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="create" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden sm:inline">{editingCard ? 'Edit Flashcard' : 'Create Flashcard'}</span>
              <span className="sm:hidden">{editingCard ? 'Edit' : 'Create'}</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="text-xs sm:text-sm py-2 sm:py-2.5">
              <span className="hidden sm:inline">Manage Cards ({flashcards.length})</span>
              <span className="sm:hidden">Cards ({flashcards.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Create/Edit Flashcard Tab */}
          <TabsContent value="create" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Front Side */}
                  <div className="space-y-3 sm:space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Front (Question)
                    </label>
                    <RichTextEditor
                      content={frontContentHtml || frontContent}
                      onChange={(text, html) => {
                        setFrontContent(text);
                        setFrontContentHtml(html);
                      }}
                      placeholder="Enter the question or prompt..."
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 rounded-xl shadow-lg"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Front Image (Optional)
                      </label>
                      <ImageUpload
                        imageUrl={frontImageUrl}
                        onImageUpload={setFrontImageUrl}
                        onImageRemove={() => setFrontImageUrl('')}
                        placeholder="Add an image to the front of the card"
                      />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="space-y-3 sm:space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Back (Answer)
                    </label>
                    <RichTextEditor
                      content={backContentHtml || backContent}
                      onChange={(text, html) => {
                        setBackContent(text);
                        setBackContentHtml(html);
                      }}
                      placeholder="Enter the answer or explanation..."
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 rounded-xl shadow-lg"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Back Image (Optional)
                      </label>
                      <ImageUpload
                        imageUrl={backImageUrl}
                        onImageUpload={setBackImageUrl}
                        onImageRemove={() => setBackImageUrl('')}
                        placeholder="Add an image to the back of the card"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={saveFlashcard}
                    disabled={saving || !frontContent.trim() || !backContent.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white touch-manipulation w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : editingCard ? 'Update Card' : 'Create Card'}
                  </Button>

                  {editingCard && (
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      className="touch-manipulation w-full sm:w-auto"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Cards Tab */}
          <TabsContent value="manage" className="space-y-4 sm:space-y-6">
            {flashcards.length === 0 ? (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No flashcards yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">Create your first flashcard to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {flashcards.map((card) => (
                  <Card
                    key={card.id}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {/* Front */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs sm:text-sm">
                              Front
                            </Badge>
                          </div>
                          <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                            {card.front_image_url && (
                              <img
                                src={card.front_image_url}
                                alt="Front image"
                                className="max-w-full h-auto rounded-lg max-h-24 sm:max-h-32 object-cover"
                              />
                            )}
                            <div
                              className="flashcard-prose flashcard-prose-sm max-w-none text-sm sm:text-base"
                              dangerouslySetInnerHTML={{
                                __html: card.front_content_html || card.front_content
                              }}
                            />
                          </div>
                        </div>

                        {/* Back */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs sm:text-sm">
                              Back
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAnswer(card.id)}
                              className="h-6 w-6 p-0 touch-manipulation"
                            >
                              {showAnswers[card.id] ? (
                                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                            {showAnswers[card.id] ? (
                              <>
                                {card.back_image_url && (
                                  <img
                                    src={card.back_image_url}
                                    alt="Back image"
                                    className="max-w-full h-auto rounded-lg max-h-24 sm:max-h-32 object-cover"
                                  />
                                )}
                                <div
                                  className="flashcard-prose flashcard-prose-sm max-w-none text-sm sm:text-base"
                                  dangerouslySetInnerHTML={{
                                    __html: card.back_content_html || card.back_content
                                  }}
                                />
                              </>
                            ) : (
                              <p className="text-gray-400 italic text-xs sm:text-sm">Click the eye icon to reveal answer</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            onClick={() => editFlashcard(card)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 touch-manipulation"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            onClick={() => deleteFlashcard(card.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 touch-manipulation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FlashcardSetup;
