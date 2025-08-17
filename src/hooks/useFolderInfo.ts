/**
 * @fileoverview useFolderInfo hook for fetching folder information
 * @description Hook for retrieving folder details for breadcrumb context
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface FolderInfo {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface UseFolderInfoResult {
  /** Folder information */
  folder: FolderInfo | null;
  /** Whether the folder is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Hook for fetching folder information by ID
 */
export const useFolderInfo = (folderId?: string): UseFolderInfoResult => {
  const { user } = useAuth();
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!folderId || !user) {
        setFolder(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('id, name, created_at, updated_at')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .single();

        if (folderError) {
          throw new Error(`Failed to fetch folder: ${folderError.message}`);
        }

        setFolder(folderData);
      } catch (err) {
        console.error('Error fetching folder:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch folder');
        setFolder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFolder();
  }, [folderId, user?.id]);

  return {
    folder,
    isLoading,
    error
  };
};

export default useFolderInfo;