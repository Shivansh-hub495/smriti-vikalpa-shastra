import { ChevronRight, Home, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FolderPath {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  currentPath: FolderPath[];
  onNavigate: (folderId?: string) => void;
}

const FolderBreadcrumb = ({ currentPath, onNavigate }: FolderBreadcrumbProps) => {
  return (
    <div className="flex items-center space-x-2 mb-6 p-4 bg-white/60 backdrop-blur-lg rounded-xl shadow-lg border border-white/20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-300"
      >
        <Home className="h-4 w-4" />
        <span className="font-medium">Home</span>
      </Button>

      {currentPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className={`flex items-center space-x-2 rounded-lg transition-all duration-300 ${
              index === currentPath.length - 1
                ? 'text-purple-600 font-semibold bg-purple-50 hover:bg-purple-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="font-medium">{folder.name}</span>
          </Button>
        </div>
      ))}
    </div>
  );
};

export default FolderBreadcrumb;
