import { supabase } from '@/integrations/supabase/client';

export interface FolderHierarchy {
  id: string;
  name: string;
  parent_id: string | null;
  children: FolderHierarchy[];
  level: number;
}

/**
 * Fetches all folders for the current user and builds a hierarchical structure
 */
export const fetchFolderHierarchy = async (): Promise<FolderHierarchy[]> => {
  try {
    const { data: folders, error } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .order('name');

    if (error) throw error;

    if (!folders) return [];

    // Build hierarchy
    const folderMap = new Map<string, FolderHierarchy>();
    const rootFolders: FolderHierarchy[] = [];

    // First pass: create all folder objects
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id,
        children: [],
        level: 0
      });
    });

    // Second pass: build hierarchy
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id)!;
      
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderNode);
          folderNode.level = parent.level + 1;
        } else {
          // Parent not found, treat as root
          rootFolders.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

    // Sort children recursively
    const sortChildren = (folders: FolderHierarchy[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => sortChildren(folder.children));
    };

    sortChildren(rootFolders);
    return rootFolders;
  } catch (error) {
    console.error('Error fetching folder hierarchy:', error);
    return [];
  }
};

/**
 * Flattens the folder hierarchy into a list with indentation levels
 */
export const flattenFolderHierarchy = (folders: FolderHierarchy[]): FolderHierarchy[] => {
  const result: FolderHierarchy[] = [];
  
  const flatten = (folders: FolderHierarchy[], level: number = 0) => {
    folders.forEach(folder => {
      result.push({ ...folder, level });
      if (folder.children.length > 0) {
        flatten(folder.children, level + 1);
      }
    });
  };
  
  flatten(folders);
  return result;
};

/**
 * Checks if moving a folder would create a circular reference
 */
export const wouldCreateCircularReference = (
  folderId: string,
  targetParentId: string | null,
  folderHierarchy: FolderHierarchy[]
): boolean => {
  if (!targetParentId) return false; // Moving to root is always safe
  if (folderId === targetParentId) return true; // Can't move to itself

  // Find the folder being moved
  const findFolder = (folders: FolderHierarchy[], id: string): FolderHierarchy | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const found = findFolder(folder.children, id);
      if (found) return found;
    }
    return null;
  };

  const folderBeingMoved = findFolder(folderHierarchy, folderId);
  if (!folderBeingMoved) return false;

  // Check if target parent is a descendant of the folder being moved
  const isDescendant = (folder: FolderHierarchy, targetId: string): boolean => {
    if (folder.id === targetId) return true;
    return folder.children.some(child => isDescendant(child, targetId));
  };

  return isDescendant(folderBeingMoved, targetParentId);
};

/**
 * Gets the path to a folder (breadcrumb trail)
 */
export const getFolderPath = async (folderId?: string): Promise<{ id: string; name: string }[]> => {
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

/**
 * Moves a folder to a new parent
 */
export const moveFolder = async (folderId: string, newParentId: string | null): Promise<void> => {
  const { error } = await supabase
    .from('folders')
    .update({ parent_id: newParentId })
    .eq('id', folderId);

  if (error) throw error;
};

/**
 * Moves a deck to a new folder
 */
export const moveDeck = async (deckId: string, newFolderId: string): Promise<void> => {
  const { error } = await supabase
    .from('decks')
    .update({ folder_id: newFolderId })
    .eq('id', deckId);

  if (error) throw error;
};
