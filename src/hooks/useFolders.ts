import { useState, useEffect } from 'react';
import { supabase, type Folder } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useFolders = (parentId?: string) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('folders')
        .select(`
          *,
          decks:decks(count),
          subfolders:folders!parent_id(count)
        `);

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      // Process the data to include counts
      const processedFolders = data?.map(folder => ({
        ...folder,
        deck_count: folder.decks?.[0]?.count || 0,
        subfolder_count: folder.subfolders?.[0]?.count || 0
      })) || [];

      setFolders(processedFolders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch folders';
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

  const createFolder = async (folderData: {
    name: string;
    description?: string;
    parent_id?: string;
    color: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('folders')
        .insert([{
          ...folderData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;



      await fetchFolders();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success! ✨",
        description: "Folder updated successfully",
      });

      await fetchFolders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update folder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success! 🗑️",
        description: "Folder deleted successfully",
      });

      await fetchFolders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete folder';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const getFolderPath = async (folderId?: string): Promise<{ id: string; name: string }[]> => {
    if (!folderId) return [];

    try {
      const path: { id: string; name: string }[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const { data, error } = await supabase
          .from('folders')
          .select('id, name, parent_id')
          .eq('id', currentId)
          .single();

        if (error) throw error;

        path.unshift({ id: data.id, name: data.name });
        currentId = data.parent_id;
      }

      return path;
    } catch (err) {
      console.error('Failed to get folder path:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [parentId]);

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    getFolderPath,
    refetch: fetchFolders
  };
};
