import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, CheckCircle, Info } from 'lucide-react';
import type { FillBlankData } from '@/types/quiz';

interface FillBlankEditorProps {
  data: FillBlankData;
  onChange: (data: FillBlankData) => void;
}

const FillBlankEditorComponent: React.FC<FillBlankEditorProps> = ({ data, onChange }) => {
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...data.correctAnswers];
    newAnswers[index] = value;
    onChange({ ...data, correctAnswers: newAnswers });
  };

  const addAnswer = () => {
    if (data.correctAnswers.length < 10) { // Limit to 10 possible answers
      onChange({ 
        ...data, 
        correctAnswers: [...data.correctAnswers, ''] 
      });
    }
  };

  const removeAnswer = (index: number) => {
    if (data.correctAnswers.length > 1) { // Minimum 1 answer
      const newAnswers = data.correctAnswers.filter((_, i) => i !== index);
      onChange({ ...data, correctAnswers: newAnswers });
    }
  };

  const handleCaseSensitiveChange = (caseSensitive: boolean) => {
    onChange({ ...data, caseSensitive });
  };

  const handlePartialMatchChange = (acceptPartialMatch: boolean) => {
    onChange({ ...data, acceptPartialMatch });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Correct Answers</Label>
        <div className="text-sm text-gray-600">
          Multiple acceptable answers allowed
        </div>
      </div>

      <div className="space-y-3">
        {data.correctAnswers.map((answer, index) => (
          <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Label className="text-sm text-green-700 font-medium">
                  Answer {index + 1}
                </Label>
              </div>
              {data.correctAnswers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAnswer(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Textarea rows={2}
                placeholder="Enter correct answer"
                value={answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="min-h-[44px] sm:min-h-[48px] resize-y whitespace-pre-wrap border-green-300 bg-white"
              />
            </div>

          </div>
        ))}
      </div>

      {data.correctAnswers.length < 10 && (
        <Button
          variant="outline"
          onClick={addAnswer}
          className="w-full border-green-300 text-green-700 hover:bg-green-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Alternative Answer ({data.correctAnswers.length}/10)
        </Button>
      )}

      {/* Answer Matching Options */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-medium">Answer Matching Options</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="case-sensitive" className="text-sm font-medium">
                Case Sensitive
              </Label>
              <p className="text-xs text-gray-600">
                Require exact case matching (e.g., "Paris" ≠ "paris")
              </p>
            </div>
            <Switch
              id="case-sensitive"
              checked={data.caseSensitive || false}
              onCheckedChange={handleCaseSensitiveChange}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="partial-match" className="text-sm font-medium">
                Accept Partial Matches
              </Label>
              <p className="text-xs text-gray-600">
                Accept answers that contain the correct answer as a substring
              </p>
            </div>
            <Switch
              id="partial-match"
              checked={data.acceptPartialMatch || false}
              onCheckedChange={handlePartialMatchChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Tips for Fill-in-the-Blank Questions:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Provide multiple acceptable answers when possible</li>
              <li>• Consider common abbreviations and variations</li>
              <li>• Use case-insensitive matching for most questions</li>
              <li>• Be specific about what format you expect</li>
              <li>• Test your answers to ensure they work correctly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gray-50 border rounded-md p-3">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview: How students will see this question
        </Label>
        <div className="bg-white border rounded p-3">
          <p className="text-sm text-gray-600 mb-2">
            Students will see a text input field where they can type their answer.
          </p>
          <Input 
            placeholder="Student types answer here..." 
            disabled 
            className="bg-gray-50"
          />
          <div className="mt-2 text-xs text-gray-500">
            Accepted answers: {data.correctAnswers.filter(a => a.trim()).join(', ') || 'None set'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(FillBlankEditorComponent);