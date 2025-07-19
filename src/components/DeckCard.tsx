
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Clock, Play, MoreVertical, Edit, Trash2, Move } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Deck {
  id: string;
  name: string;
  description?: string;
  folder_id: string;
  color: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed fields from database function
  total_cards?: number;
  cards_due?: number;
  accuracy_percentage?: number;
  last_studied?: string;
}

interface DeckCardProps {
  deck: Deck;
  onStudy: (deckId: string) => void;
  onEdit: (deck: Deck) => void;
  onDelete: (deckId: string) => void;
  onMove?: (deck: Deck) => void;
}

const DeckCard = ({ deck, onStudy, onEdit, onDelete, onMove }: DeckCardProps) => {
  const { toast } = useToast();

  const handleStudy = () => {
    onStudy(deck.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(deck);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(deck.id);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(deck);
  };

  return (
    <Card className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-105 rounded-2xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${deck.color.replace('bg-', 'from-')}-100 dark:from-gray-700 ${deck.color.replace('bg-', 'to-')}-200 dark:to-gray-600 opacity-50 group-hover:opacity-70 transition-opacity duration-500`}></div>

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${deck.color} rounded-xl blur opacity-75`}></div>
            <div className={`relative p-3 rounded-xl bg-gradient-to-r ${deck.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors break-words leading-tight">
              {deck.name}
            </CardTitle>
            {deck.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words leading-relaxed">{deck.description}</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Deck
            </DropdownMenuItem>
            {onMove && (
              <DropdownMenuItem onClick={handleMove}>
                <Move className="h-4 w-4 mr-2" />
                Move to
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Deck
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Tags */}
        {deck.tags && deck.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {deck.tags.slice(0, 3).map((tag, index) => {
              const colors = [
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "bg-gradient-to-r from-blue-500 to-cyan-500",
                "bg-gradient-to-r from-green-500 to-emerald-500"
              ];
              return (
                <Badge
                  key={index}
                  className={`text-xs text-white font-semibold px-3 py-1 rounded-full shadow-lg ${colors[index % colors.length]} hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  {tag}
                </Badge>
              );
            })}
            {deck.tags.length > 3 && (
              <Badge className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold px-3 py-1 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                +{deck.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {deck.total_cards || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold">Cards</div>
          </div>

          <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {deck.accuracy_percentage || 0}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold">Accuracy</div>
          </div>

          <div className="text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {deck.cards_due || 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-semibold">Due</div>
          </div>
        </div>

        {/* Last Studied */}
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
          Last studied: {deck.last_studied ? new Date(deck.last_studied).toLocaleDateString() : 'Never'}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleStudy}
          className="group w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Play className="h-4 w-4 mr-2 relative z-10" />
          <span className="relative z-10">Study Now</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeckCard;
