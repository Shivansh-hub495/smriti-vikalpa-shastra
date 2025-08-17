import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import type { TrueFalseData } from '@/types/quiz';

interface TrueFalseEditorProps {
  data: TrueFalseData;
  onChange: (data: TrueFalseData) => void;
}

const TrueFalseEditorComponent: React.FC<TrueFalseEditorProps> = ({ data, onChange }) => {
  const handleCorrectAnswerChange = (value: string) => {
    onChange({ ...data, correctAnswer: value === 'true' });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Correct Answer</Label>
      
      <RadioGroup
        value={data.correctAnswer.toString()}
        onValueChange={handleCorrectAnswerChange}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-green-50 transition-colors">
          <RadioGroupItem 
            value="true" 
            id="true-option"
            className="text-green-600"
          />
          <Label 
            htmlFor="true-option" 
            className="flex items-center space-x-2 cursor-pointer flex-1"
          >
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-lg font-medium">True</span>
          </Label>
          {data.correctAnswer === true && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Correct Answer
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-red-50 transition-colors">
          <RadioGroupItem 
            value="false" 
            id="false-option"
            className="text-red-600"
          />
          <Label 
            htmlFor="false-option" 
            className="flex items-center space-x-2 cursor-pointer flex-1"
          >
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-lg font-medium">False</span>
          </Label>
          {data.correctAnswer === false && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Correct Answer
            </div>
          )}
        </div>
      </RadioGroup>

      {/* Preview Section */}
      <div className="bg-gray-50 border rounded-md p-3">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview: How students will see this question
        </Label>
        <div className="bg-white border rounded p-3">
          <p className="text-sm text-gray-600 mb-3">
            Students will see two buttons to choose from:
          </p>
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>True</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg bg-red-50 border-red-200 text-red-700">
              <XCircle className="h-4 w-4" />
              <span>False</span>
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Correct answer: <span className="font-medium">{data.correctAnswer ? 'True' : 'False'}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Tips for True/False Questions:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Make statements clearly true or false, avoid ambiguity</li>
              <li>• Avoid absolute words like "always" or "never" unless accurate</li>
              <li>• Focus on important concepts, not trivial details</li>
              <li>• Consider providing an explanation for the correct answer</li>
              <li>• Ensure the statement is not obviously true or false</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrueFalseEditorComponent);