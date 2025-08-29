import { useState, useEffect } from "react";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
  BookOpen,
  Settings,
  GripVertical,
  Loader2
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Deck, type Flashcard } from "@/lib/supabase";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageUpload } from "@/components/ImageUpload";

const DeckEdit = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isCreatingCardLoading, setIsCreatingCardLoading] = useState(false);
  const [isUpdatingCardLoading, setIsUpdatingCardLoading] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  // Form state for new/editing flashcard
  const [frontContent, setFrontContent] = useState("");
  const [backContent, setBackContent] = useState("");
  const [frontContentHtml, setFrontContentHtml] = useState("");
  const [backContentHtml, setBackContentHtml] = useState("");
  const [frontImageUrl, setFrontImageUrl] = useState("");
  const [backImageUrl, setBackImageUrl] = useState("");

  // Deck settings state
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckTags, setDeckTags] = useState<string[]>([]);

  useEffect(() => {
    if (deckId) {
      fetchDeckData();
      fetchFlashcards();
    }
  }, [deckId]);

  const fetchDeckData = async () => {
    try {
      const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('id', deckId)
        .single();

      if (error) throw error;

      setDeck(data);
      setDeckName(data.name);
      setDeckDescription(data.description || "");
      setDeckTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching deck:', err);
      toast({
        title: "Error",
        description: "Failed to load deck data",
        variant: "destructive"
      });
    }
  };

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at');

      if (error) throw error;

      setFlashcards(data || []);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    // Check if both sides have either content or image
    const frontHasContent = frontContent.trim() || frontImageUrl;
    const backHasContent = backContent.trim() || backImageUrl;

    if (!frontHasContent || !backHasContent) {
      toast({
        title: "Error",
        description: "Please add content (text or image) to both front and back of the card",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreatingCardLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('flashcards')
        .insert([{
          deck_id: deckId!,
          user_id: user.id,
          front_content: frontContent.trim(),
          back_content: backContent.trim(),
          front_content_html: frontContentHtml,
          back_content_html: backContentHtml,
          front_image_url: frontImageUrl || null,
          back_image_url: backImageUrl || null,
          difficulty: 0,
          next_review_date: new Date().toISOString(),
          review_count: 0,
          correct_count: 0
        }]);

      if (error) throw error;

      toast({
        title: "Success! ✨",
        description: "Flashcard created successfully",
      });

      setFrontContent("");
      setBackContent("");
      setFrontContentHtml("");
      setBackContentHtml("");
      setFrontImageUrl("");
      setBackImageUrl("");
      setIsCreatingCard(false);
      await fetchFlashcards();
    } catch (err) {
      console.error('Error creating flashcard:', err);
      toast({
        title: "Error",
        description: "Failed to create flashcard",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCardLoading(false);
    }
  };

  const handleUpdateCard = async () => {
    // Check if both sides have either content or image
    const frontHasContent = frontContent.trim() || frontImageUrl;
    const backHasContent = backContent.trim() || backImageUrl;

    if (!editingCard || !frontHasContent || !backHasContent) {
      toast({
        title: "Error",
        description: "Please add content (text or image) to both front and back of the card",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdatingCardLoading(true);
      const { error } = await supabase
        .from('flashcards')
        .update({
          front_content: frontContent.trim(),
          back_content: backContent.trim(),
          front_content_html: frontContentHtml,
          back_content_html: backContentHtml,
          front_image_url: frontImageUrl || null,
          back_image_url: backImageUrl || null
        })
        .eq('id', editingCard.id);

      if (error) throw error;

      toast({
        title: "Success! ✨",
        description: "Flashcard updated successfully",
      });

      setFrontContent("");
      setBackContent("");
      setFrontContentHtml("");
      setBackContentHtml("");
      setFrontImageUrl("");
      setBackImageUrl("");
      setEditingCard(null);
      await fetchFlashcards();
    } catch (err) {
      console.error('Error updating flashcard:', err);
      toast({
        title: "Error",
        description: "Failed to update flashcard",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingCardLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;



      await fetchFlashcards();
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive"
      });
    }
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    try {
      // Create new array with reordered cards
      const newFlashcards = Array.from(flashcards);
      const [reorderedCard] = newFlashcards.splice(sourceIndex, 1);
      newFlashcards.splice(destinationIndex, 0, reorderedCard);

      // Update local state immediately for smooth UX
      setFlashcards(newFlashcards);

      // Update created_at timestamps to reflect new order
      const updates = newFlashcards.map((card, index) => {
        const baseTime = new Date('2020-01-01').getTime();
        const newTimestamp = new Date(baseTime + (index * 1000)).toISOString();
        return {
          id: card.id,
          created_at: newTimestamp
        };
      });

      // Update all cards in database
      for (const update of updates) {
        const { error } = await supabase
          .from('flashcards')
          .update({ created_at: update.created_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Success! ✨",
        description: "Card order updated successfully",
      });

    } catch (err) {
      console.error('Error reordering cards:', err);
      // Revert local state on error
      await fetchFlashcards();
      toast({
        title: "Error",
        description: "Failed to reorder cards",
        variant: "destructive"
      });
    }
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setFrontContent(card.front_content);
    setBackContent(card.back_content);
    setFrontContentHtml(card.front_content_html || "");
    setBackContentHtml(card.back_content_html || "");
    setFrontImageUrl(card.front_image_url || "");
    setBackImageUrl(card.back_image_url || "");
    setIsCreatingCard(false);

    // Scroll to top for better mobile experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setIsCreatingCard(false);
    setFrontContent("");
    setBackContent("");
    setFrontContentHtml("");
    setBackContentHtml("");
    setFrontImageUrl("");
    setBackImageUrl("");
  };

  const handleUpdateDeck = async () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('decks')
        .update({
          name: deckName.trim(),
          description: deckDescription.trim(),
          tags: deckTags
        })
        .eq('id', deckId);

      if (error) throw error;

      toast({
        title: "Success! ✨",
        description: "Deck settings updated successfully",
      });

      await fetchDeckData();
    } catch (err) {
      console.error('Error updating deck:', err);
      toast({
        title: "Error",
        description: "Failed to update deck settings",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Deck not found</h1>
          <Button onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-white/20 dark:border-gray-700/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3 sm:py-4 min-h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1 w-full sm:w-auto">
              <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors touch-manipulation flex-shrink-0" />
              <Button
                onClick={() => {
                  if (deck?.folder_id) {
                    navigate(`/folder/${deck.folder_id}`);
                  } else {
                    navigate('/');
                  }
                }}
                variant="ghost"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 p-1.5 sm:p-2 touch-manipulation flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words leading-tight">
                  {deck.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{flashcards.length} flashcards</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowAnswers(!showAnswers)}
                variant="outline"
                className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 touch-manipulation text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none"
              >
                {showAnswers ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                <span className="hidden sm:inline">{showAnswers ? 'Hide' : 'Show'} Answers</span>
                <span className="sm:hidden">{showAnswers ? 'Hide' : 'Show'}</span>
              </Button>
              <Button
                onClick={() => {
                  setIsCreatingCard(true);
                  // Scroll to top for better mobile experience
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white touch-manipulation text-xs sm:text-sm px-2 sm:px-3 flex-1 sm:flex-none"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Card</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Tabs defaultValue="cards" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-lg rounded-xl h-auto">
            <TabsTrigger value="cards" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-sm sm:text-base">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Flashcards</span>
              <span className="sm:hidden">Cards</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-sm sm:text-base">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Deck Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6">
            {/* Create/Edit Card Form */}
            {(isCreatingCard || editingCard) && (
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                    {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Front Side */}
                    <div className="space-y-4">
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
                          onImageRemove={() => setFrontImageUrl("")}
                          placeholder="Add an image to the front of the card"
                        />
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="space-y-4">
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
                          onImageRemove={() => setBackImageUrl("")}
                          placeholder="Add an image to the back of the card"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 touch-manipulation w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingCard ? handleUpdateCard : handleCreateCard}
                      disabled={isCreatingCardLoading || isUpdatingCardLoading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white touch-manipulation w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {(editingCard && isUpdatingCardLoading) || (!editingCard && isCreatingCardLoading) ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editingCard 
                        ? (isUpdatingCardLoading ? 'Updating...' : 'Update Card')
                        : (isCreatingCardLoading ? 'Creating...' : 'Create Card')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flashcards List */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="flashcards">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {flashcards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl transition-all duration-300 rounded-2xl w-full ${
                              snapshot.isDragging
                                ? 'rotate-1 scale-105 shadow-2xl z-50 bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600'
                                : 'hover:shadow-2xl hover:-translate-y-1'
                            }`}
                          >
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Card #{index + 1}
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCard(card)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 touch-manipulation"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCard(card.id)}
                          className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 touch-manipulation"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 min-w-0">
                    <div className={`${showAnswers ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Front:</div>
                        <div className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg min-h-[50px] sm:min-h-[60px] space-y-2 break-words">
                          {card.front_image_url && (
                            <img
                              src={card.front_image_url}
                              alt="Front image"
                              className="max-w-full h-auto rounded-lg max-h-24 sm:max-h-32 object-cover"
                            />
                          )}
                          <div
                            className="flashcard-prose flashcard-prose-sm max-w-none text-xs sm:text-sm break-words overflow-hidden"
                            dangerouslySetInnerHTML={{
                              __html: card.front_content_html || card.front_content
                            }}
                          />
                        </div>
                      </div>
                      {showAnswers && (
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Back:</div>
                          <div className="text-gray-800 dark:text-gray-200 bg-green-50 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg min-h-[50px] sm:min-h-[60px] space-y-2 break-words">
                            {card.back_image_url && (
                              <img
                                src={card.back_image_url}
                                alt="Back image"
                                className="max-w-full h-auto rounded-lg max-h-24 sm:max-h-32 object-cover"
                              />
                            )}
                            <div
                              className="flashcard-prose flashcard-prose-sm max-w-none text-xs sm:text-sm break-words overflow-hidden"
                              dangerouslySetInnerHTML={{
                                __html: card.back_content_html || card.back_content
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 min-w-0">
                      <span className="truncate">Reviews: {card.review_count}</span>
                      <span className="truncate">Accuracy: {card.review_count > 0 ? Math.round((card.correct_count / card.review_count) * 100) : 0}%</span>
                    </div>
                  </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {flashcards.length === 0 && (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-700">No flashcards yet</h3>
                <p className="mt-2 text-gray-500 mb-4">
                  Get started by creating your first flashcard
                </p>
                <Button
                  onClick={() => {
                    setIsCreatingCard(true);
                    // Scroll to top for better mobile experience
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Card
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Deck Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Deck Name
                  </label>
                  <Input
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Enter deck name..."
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                    placeholder="Enter deck description..."
                    rows={3}
                    className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {deckTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800 px-3 py-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setDeckTags(deckTags.filter((_, i) => i !== index))}
                          className="ml-2 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          const newTag = target.value.trim();
                          if (newTag && !deckTags.includes(newTag)) {
                            setDeckTags([...deckTags, newTag]);
                            target.value = '';
                          }
                        }
                      }}
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-lg border-white/20 dark:border-gray-600/20 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateDeck}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white touch-manipulation w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DeckEdit;
