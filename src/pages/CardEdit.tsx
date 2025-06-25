import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  front_content_html?: string;
  back_content_html?: string;
  front_image_url?: string;
  back_image_url?: string;
  deck_id: string;
}

const CardEdit: React.FC = () => {
  const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [frontContent, setFrontContent] = useState("");
  const [backContent, setBackContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cardId && user) {
      fetchCardData();
    }
  }, [cardId, user]);

  const fetchCardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', cardId)
        .eq('deck_id', deckId)
        .single();

      if (error) throw error;

      if (data) {
        setFrontContent(data.front_content);
        setBackContent(data.back_content);
      }
    } catch (err) {
      console.error('Error fetching card:', err);
      toast({
        title: "Error",
        description: "Failed to load card data",
        variant: "destructive"
      });
      navigate(`/study/${deckId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!frontContent.trim() || !backContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both front and back content",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('flashcards')
        .update({
          front_content: frontContent.trim(),
          back_content: backContent.trim()
        })
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Success! ✨",
        description: "Card updated successfully",
      });

      navigate(`/study/${deckId}`);
    } catch (err) {
      console.error('Error updating card:', err);
      toast({
        title: "Error",
        description: "Failed to update card",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/study/${deckId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="p-2 touch-manipulation"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800">Edit Card</h1>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="touch-manipulation"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="touch-manipulation"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="bg-white/80 backdrop-blur-lg border-white/20 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">
              Edit Flashcard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Front (Question)
                </label>
                <textarea
                  value={frontContent}
                  onChange={(e) => setFrontContent(e.target.value)}
                  placeholder="Enter the question or prompt..."
                  className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Back (Answer)
                </label>
                <textarea
                  value={backContent}
                  onChange={(e) => setBackContent(e.target.value)}
                  placeholder="Enter the answer or explanation..."
                  className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardEdit;
