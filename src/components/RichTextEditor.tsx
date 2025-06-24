import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Highlighter, 
  List, 
  Image as ImageIcon,
  Type
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Enter text...",
  className = ""
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(text, html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[80px] sm:min-h-[100px] p-3 sm:p-4 text-sm sm:text-base',
      },
    },
  });

  const uploadImage = useCallback(async (file: File) => {
    try {
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

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && editor) {
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, uploadImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg ${className}`} {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Toolbar */}
      <div className="border-b p-1.5 sm:p-2 flex flex-wrap gap-1 sm:gap-1.5">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <Bold className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <Italic className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <UnderlineIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <Strikethrough className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <Highlighter className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <List className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 touch-manipulation"
        >
          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Color picker */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded border cursor-pointer touch-manipulation"
            title="Text Color"
          />
        </div>
      </div>
      
      {/* Editor Content */}
      <div className={`relative ${isDragActive ? 'bg-blue-50 border-blue-300' : ''}`}>
        {isDragActive && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-10 rounded-b-lg">
            <div className="text-blue-600 font-medium">Drop image here...</div>
          </div>
        )}
        
        <EditorContent
          editor={editor}
          className="min-h-[80px] sm:min-h-[100px]"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
