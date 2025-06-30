
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, BookOpen, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Deck } from "@/lib/supabase";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deckData: {
    name: string;
    description: string;
    folder_id: string;
    color: string;
    tags: string[];
  }) => void;
  folderId?: string;
  editingDeck?: Deck | null;
}

const CreateDeckModal = ({
  isOpen,
  onClose,
  onSubmit,
  folderId,
  editingDeck
}: CreateDeckModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-500");
  const { toast } = useToast();

  const predefinedTags = ["CA", "NEET", "UPSC", "GATE", "Board", "JEE", "Biology", "Physics", "Chemistry", "Math", "History", "Geography"];

  const colorOptions = [
    { value: "bg-blue-500", label: "Blue", class: "bg-blue-500" },
    { value: "bg-purple-500", label: "Purple", class: "bg-purple-500" },
    { value: "bg-green-500", label: "Green", class: "bg-green-500" },
    { value: "bg-orange-500", label: "Orange", class: "bg-orange-500" },
    { value: "bg-red-500", label: "Red", class: "bg-red-500" },
    { value: "bg-pink-500", label: "Pink", class: "bg-pink-500" },
    { value: "bg-indigo-500", label: "Indigo", class: "bg-indigo-500" },
    { value: "bg-teal-500", label: "Teal", class: "bg-teal-500" },
  ];

  // Reset form when modal opens/closes or editing deck changes
  useEffect(() => {
    if (isOpen) {
      if (editingDeck) {
        setName(editingDeck.name);
        setDescription(editingDeck.description || "");
        setTags(editingDeck.tags || []);
        setSelectedColor(editingDeck.color);
      } else {
        setName("");
        setDescription("");
        setTags([]);
        setSelectedColor("bg-purple-500");
      }
    }
  }, [isOpen, editingDeck]);

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(currentTag);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive"
      });
      return;
    }

    if (!folderId && !editingDeck) {
      toast({
        title: "Error",
        description: "Please select a folder for this deck",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      folder_id: folderId || editingDeck?.folder_id || '',
      color: selectedColor,
      tags
    });

    // Reset form
    setName("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setSelectedColor("bg-purple-500");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setTags([]);
    setCurrentTag("");
    setSelectedColor("bg-purple-500");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-lg border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            {editingDeck ? "Edit Deck" : "Create New Deck"} ✨
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-semibold">Deck Name *</Label>
            <Input
              id="name"
              placeholder="e.g., CA Foundation - Accounting Basics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 font-semibold">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this deck covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Deck Color
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative p-4 rounded-xl ${color.class} transition-all duration-300 hover:scale-110 ${
                    selectedColor === color.value
                      ? 'ring-4 ring-white ring-opacity-50 shadow-xl'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 rounded-xl border-2 border-white"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTag(currentTag)}
                disabled={!currentTag.trim()}
                className="bg-white/80 backdrop-blur-lg border-white/20 text-purple-600 hover:bg-purple-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Quick add:</span>
              {predefinedTags.filter(tag => !tags.includes(tag)).slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-6 py-2 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {editingDeck ? "Update Deck" : "Create Deck"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDeckModal;
