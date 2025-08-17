import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, Edit, HelpCircle, Link } from 'lucide-react';
import type { QuestionType } from '@/types/quiz';

interface QuestionTypeSelectorProps {
  selectedType: QuestionType;
  onTypeSelect: (type: QuestionType) => void;
  disabled?: boolean;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  disabled = false
}) => {
  const questionTypes = [
    {
      type: 'mcq' as QuestionType,
      name: 'Multiple Choice',
      description: 'Students select one correct answer from multiple options',
      icon: CheckCircle,
      color: 'blue',
      example: 'What is the capital of France? A) London B) Paris C) Berlin D) Madrid'
    },
    {
      type: 'fill_blank' as QuestionType,
      name: 'Fill in the Blank',
      description: 'Students type the correct answer in a text field',
      icon: Edit,
      color: 'green',
      example: 'The capital of France is _______.'
    },
    {
      type: 'true_false' as QuestionType,
      name: 'True/False',
      description: 'Students choose between True or False',
      icon: HelpCircle,
      color: 'purple',
      example: 'Paris is the capital of France. (True/False)'
    },
    {
      type: 'match_following' as QuestionType,
      name: 'Match the Following',
      description: 'Students match items from two columns',
      icon: Link,
      color: 'orange',
      example: 'Match countries with their capitals: France → Paris, Germany → Berlin'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = 'transition-all duration-200';
    
    if (isSelected) {
      switch (color) {
        case 'blue':
          return `${baseClasses} border-blue-500 bg-blue-50 text-blue-900`;
        case 'green':
          return `${baseClasses} border-green-500 bg-green-50 text-green-900`;
        case 'purple':
          return `${baseClasses} border-purple-500 bg-purple-50 text-purple-900`;
        case 'orange':
          return `${baseClasses} border-orange-500 bg-orange-50 text-orange-900`;
        default:
          return `${baseClasses} border-gray-500 bg-gray-50 text-gray-900`;
      }
    } else {
      return `${baseClasses} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
    }
  };

  const getIconColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
      switch (color) {
        case 'blue':
          return 'text-blue-600';
        case 'green':
          return 'text-green-600';
        case 'purple':
          return 'text-purple-600';
        case 'orange':
          return 'text-orange-600';
        default:
          return 'text-gray-600';
      }
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Select Question Type</Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {questionTypes.map((questionType) => {
          const Icon = questionType.icon;
          const isSelected = selectedType === questionType.type;
          
          return (
            <Card
              key={questionType.type}
              className={`cursor-pointer border-2 ${getColorClasses(questionType.color, isSelected)} ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => !disabled && onTypeSelect(questionType.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? `bg-${questionType.color}-100` 
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${getIconColorClasses(questionType.color, isSelected)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-sm">
                        {questionType.name}
                      </h3>
                      {isSelected && (
                        <div className={`px-2 py-1 rounded text-xs font-medium bg-${questionType.color}-100 text-${questionType.color}-800`}>
                          Selected
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                      {questionType.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 italic">
                      Example: {questionType.example}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {questionTypes.find(qt => qt.type === selectedType)?.name} selected
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            You can change the question type at any time, but existing data will be reset.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionTypeSelector;