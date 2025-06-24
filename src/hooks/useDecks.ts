import { useState, useEffect } from 'react';
import { supabase, type Deck } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useDecks = (folderId?: string) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDecks = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('decks').select('*');
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      // Fetch stats for each deck
      const decksWithStats = await Promise.all(
        (data || []).map(async (deck) => {
          const { data: stats } = await supabase
            .rpc('get_deck_stats', { deck_uuid: deck.id });
          
          return {
            ...deck,
            total_cards: stats?.[0]?.total_cards || 0,
            cards_due: stats?.[0]?.cards_due || 0,
            accuracy_percentage: stats?.[0]?.accuracy_percentage || 0,
            last_studied: stats?.[0]?.last_studied || null
          };
        })
      );

      setDecks(decksWithStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch decks';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (deckData: {
    name: string;
    description?: string;
    folder_id: string;
    color: string;
    tags: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('decks')
        .insert([{
          ...deckData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;



      await fetchDecks();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deck';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateDeck = async (id: string, updates: Partial<Deck>) => {
    try {
      const { error } = await supabase
        .from('decks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;



      await fetchDecks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deck';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteDeck = async (id: string) => {
    try {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', id);

      if (error) throw error;



      await fetchDecks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deck';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [folderId]);

  return {
    decks,
    loading,
    error,
    createDeck,
    updateDeck,
    deleteDeck,
    refetch: fetchDecks
  };
};
