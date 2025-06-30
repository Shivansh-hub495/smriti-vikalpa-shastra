import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: {
    name: string;
    description: string;
    parent_id?: string;
    color: string;
  }) => void;
  parentId?: string;
  editingFolder?: Folder | null;
  availableFolders?: Folder[];
}

const CreateFolderModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  parentId, 
  editingFolder,
  availableFolders = []
}: CreateFolderModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentId);
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const { toast } = useToast();

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

  // Reset form when modal opens/closes or editing folder changes
  useEffect(() => {
    if (isOpen) {
      if (editingFolder) {
        setName(editingFolder.name);
        setDescription(editingFolder.description || "");
        setSelectedParentId(editingFolder.parent_id);
        setSelectedColor(editingFolder.color);
      } else {
        setName("");
        setDescription("");
        setSelectedParentId(parentId);
        setSelectedColor("bg-blue-500");
      }
    }
  }, [isOpen, editingFolder, parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      parent_id: selectedParentId,
      color: selectedColor
    });

    // Don't reset form here - let the parent component handle closing
    // The form will be reset when the modal closes via useEffect
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedParentId(undefined);
    setSelectedColor("bg-blue-500");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-lg border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <Folder className="h-6 w-6 text-purple-600" />
            {editingFolder ? "Edit Folder" : "Create New Folder"} ✨
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-semibold">Folder Name *</Label>
            <Input
              id="name"
              placeholder="e.g., CA Foundation, NEET Biology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 font-semibold">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this folder's contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 placeholder:text-gray-400 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 resize-none"
            />
          </div>

          {availableFolders.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Parent Folder</Label>
              <Select value={selectedParentId || "root"} onValueChange={(value) => setSelectedParentId(value === "root" ? undefined : value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-lg border-white/20 text-gray-700 rounded-xl shadow-lg focus:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No parent)</SelectItem>
                  {availableFolders
                    .filter(folder => folder.id !== editingFolder?.id) // Don't allow selecting self as parent
                    .map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Folder Color
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
              {editingFolder ? "Update Folder" : "Create Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderModal;
