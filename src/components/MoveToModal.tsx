import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderOpen, Home, Move, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchFolderHierarchy, 
  flattenFolderHierarchy, 
  wouldCreateCircularReference,
  moveFolder,
  moveDeck,
  type FolderHierarchy 
} from "@/utils/folderUtils";

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemType: 'folder' | 'deck';
  itemId: string;
  itemName: string;
  currentFolderId?: string | null;
}

const MoveToModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  itemType,
  itemId,
  itemName,
  currentFolderId
}: MoveToModalProps) => {
  const [folderHierarchy, setFolderHierarchy] = useState<FolderHierarchy[]>([]);
  const [flatFolders, setFlatFolders] = useState<FolderHierarchy[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const hierarchy = await fetchFolderHierarchy();
      setFolderHierarchy(hierarchy);
      setFlatFolders(flattenFolderHierarchy(hierarchy));
    } catch (error) {
      console.error('Error loading folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    if (moving) return;

    // Validate the move
    if (itemType === 'folder' && selectedFolderId) {
      if (wouldCreateCircularReference(itemId, selectedFolderId, folderHierarchy)) {
        toast({
          title: "Invalid Move",
          description: "Cannot move a folder into one of its subfolders",
          variant: "destructive"
        });
        return;
      }
    }

    if (itemType === 'deck' && !selectedFolderId) {
      toast({
        title: "Invalid Move",
        description: "Please select a destination folder for the deck",
        variant: "destructive"
      });
      return;
    }

    setMoving(true);
    try {
      if (itemType === 'folder') {
        await moveFolder(itemId, selectedFolderId);
        toast({
          title: "Success! ✨",
          description: `Folder "${itemName}" moved successfully`,
        });
      } else {
        await moveDeck(itemId, selectedFolderId!);
        toast({
          title: "Success! ✨",
          description: `Deck "${itemName}" moved successfully`,
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Error",
        description: `Failed to move ${itemType}`,
        variant: "destructive"
      });
    } finally {
      setMoving(false);
    }
  };

  const getFolderDisplayName = (folder: FolderHierarchy) => {
    const indent = "  ".repeat(folder.level);
    return `${indent}${folder.name}`;
  };

  const isOptionDisabled = (folder: FolderHierarchy) => {
    if (itemType === 'folder') {
      // Can't move folder to itself
      if (folder.id === itemId) return true;
      // Can't move folder to its current parent
      if (folder.id === currentFolderId) return true;
      // Can't move folder to its descendants
      return wouldCreateCircularReference(itemId, folder.id, folderHierarchy);
    }
    return false;
  };

  const getSelectedFolderName = () => {
    if (!selectedFolderId) return "Root";
    const folder = flatFolders.find(f => f.id === selectedFolderId);
    return folder ? folder.name : "Unknown";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto my-4 max-h-[90vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Move className="h-5 w-5 text-purple-600" />
            Move {itemType === 'folder' ? 'Folder' : 'Deck'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-hidden">
          {/* Item info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-100 block sm:inline">"{itemName}"</span>
              <span className="mx-2 hidden sm:inline">→</span>
              <span className="block sm:inline text-purple-600 dark:text-purple-400 font-medium">{getSelectedFolderName()}</span>
            </p>
          </div>

          {/* Folder selection */}
          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Destination Folder
            </label>

            {loading ? (
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading folders...</p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <ScrollArea className="h-[250px]">
                  <div className="p-2 space-y-1">
                    {/* Root option */}
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      disabled={itemType === 'folder' && currentFolderId === null}
                      className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 text-sm ${
                        selectedFolderId === null
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                          : 'hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      } ${
                        itemType === 'folder' && currentFolderId === null
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <Home className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">Root</span>
                    </button>

                    {/* Folder options */}
                    {flatFolders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        disabled={isOptionDisabled(folder)}
                        className={`w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 text-sm ${
                          selectedFolderId === folder.id
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                            : 'hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        } ${
                          isOptionDisabled(folder)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-1 flex-shrink-0" style={{ marginLeft: `${folder.level * 12}px` }}>
                          {folder.level > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                          <Folder className="h-4 w-4" />
                        </div>
                        <span className="truncate min-w-0">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - fixed at bottom */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={moving}
              className="flex-1 text-sm h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={loading || moving || (itemType === 'deck' && !selectedFolderId)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm h-10"
            >
              {moving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Moving...
                </>
              ) : (
                "Move"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveToModal;
