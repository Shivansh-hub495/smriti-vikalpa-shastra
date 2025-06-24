import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  imageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  className?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  imageUrl,
  onImageUpload,
  onImageRemove,
  className = "",
  placeholder = "Click to upload or drag and drop an image"
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading file:', { fileName: filePath, fileSize: file.size, fileType: file.type });

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('flashcard-images')
        .upload(filePath, file);

      console.log('Upload result:', { uploadError, uploadData });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('flashcard-images')
        .getPublicUrl(filePath);

      onImageUpload(data.publicUrl);
      
      toast({
        title: "Success! 📸",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [onImageUpload]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      await uploadImage(file);
    }
  }, [uploadImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleRemoveImage = () => {
    onImageRemove();
    toast({
      title: "Image removed",
      description: "Image has been removed from the flashcard",
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {imageUrl ? (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Flashcard image"
            className="w-full max-w-sm h-auto rounded-lg border shadow-sm"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive ? 'Drop the image here' : placeholder}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
