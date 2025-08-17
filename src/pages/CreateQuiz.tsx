import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QuizCreationModal from '@/components/QuizCreationModal';
import QuizBreadcrumb from '@/components/QuizBreadcrumb';
import { useFolderRouteGuard } from '@/hooks/useQuizRouteGuard';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { folderId: paramFolderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Get folder ID from URL params or search params
  const folderId = paramFolderId || searchParams.get('folderId');
  
  // Use folder route guard to validate folder access
  const { isLoading: folderLoading, hasAccess: folderAccess, folderTitle } = useFolderRouteGuard();

  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Redirect if no folder ID is provided
    if (!folderId) {
      toast({
        title: "Error",
        description: "No folder specified for quiz creation",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Redirect if user is not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [folderId, user, navigate, toast]);

  const handleQuizCreate = async (data: any) => {
    setLoading(true);
    
    try {
      // Use MCP tools to create the quiz
      const quizData = {
        title: data.title,
        description: data.description || null,
        folder_id: folderId,
        user_id: user?.id,
        settings: data.settings
      };

      // Create the quiz using Supabase MCP tools
      // Note: In a real implementation, you would import and use the MCP functions
      // For now, we'll use the supabase client directly
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: createdQuiz, error } = await supabase
        .from('quizzes')
        .insert(quizData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('Quiz created successfully:', createdQuiz);
      
      // Navigate back to the folder after successful creation
      navigate(`/folder/${folderId}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Navigate back to folder when modal is closed
    navigate(`/folder/${folderId}`);
  };

  if (!folderId || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <QuizBreadcrumb
          folderTitle={folderTitle}
          folderId={folderId}
          currentPage="create"
          className="mb-4"
        />

        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6">
          <SidebarTrigger className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0" />
          <Button
            variant="ghost"
            onClick={() => navigate(`/folder/${folderId}`)}
            className="p-2 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Create New Quiz
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Set up your quiz with questions and settings
            </p>
          </div>
        </div>

        {/* Quiz Creation Modal */}
        <QuizCreationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleQuizCreate}
          folderId={folderId}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CreateQuiz;