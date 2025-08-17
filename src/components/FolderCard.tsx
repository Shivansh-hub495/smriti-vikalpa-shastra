import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Folder, FolderOpen, MoreVertical, Edit, Trash2, Plus, Move } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  deck_count?: number;
  quiz_count?: number;
  subfolder_count?: number;
}

interface FolderCardProps {
  folder: Folder;
  onOpen: (folderId: string) => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onCreateDeck: (folderId: string) => void;
  onMove?: (folder: Folder) => void;
}

const FolderCard = ({
  folder,
  onOpen,
  onEdit,
  onDelete,
  onCreateSubfolder,
  onCreateDeck,
  onMove
}: FolderCardProps) => {
  const { toast } = useToast();

  const handleOpen = () => {
    onOpen(folder.id);
    // Ensure top after navigation for better UX
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(folder);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(folder.id);
  };

  const handleCreateSubfolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateSubfolder(folder.id);
  };

  const handleCreateDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateDeck(folder.id);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(folder);
  };

  return (
    <Card
      className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105 rounded-2xl cursor-pointer"
      onClick={handleOpen}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
      
      <CardHeader className="relative z-10 space-y-0 pb-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-75"></div>
              <div className="relative p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Folder className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors break-words leading-tight">
                {folder.name}
              </CardTitle>
              {folder.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words leading-relaxed">{folder.description}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-70 hover:opacity-100 transition-opacity duration-300 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCreateDeck}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateSubfolder}>
              <Folder className="h-4 w-4 mr-2" />
              Create Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Folder
            </DropdownMenuItem>
            {onMove && (
              <DropdownMenuItem onClick={handleMove}>
                <Move className="h-4 w-4 mr-2" />
                Move to
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            {folder.deck_count !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{folder.deck_count}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Decks</div>
              </div>
            )}
            {folder.quiz_count !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{folder.quiz_count}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Quizzes</div>
              </div>
            )}
            {folder.subfolder_count !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{folder.subfolder_count}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Folders</div>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(folder.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FolderCard;
