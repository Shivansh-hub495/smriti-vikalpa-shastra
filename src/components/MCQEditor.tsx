import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Circle } from 'lucide-react';
import type { MCQData } from '@/types/quiz';

interface MCQEditorProps {
  data: MCQData;
  onChange: (data: MCQData) => void;
}

const MCQEditorComponent: React.FC<MCQEditorProps> = ({ data, onChange }) => {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...data.options];
    newOptions[index] = value;
    onChange({ ...data, options: newOptions });
  };

  const handleCorrectAnswerChange = (index: number) => {
    onChange({ ...data, correctAnswer: index });
  };

  const addOption = () => {
    if (data.options.length < 6) { // Limit to 6 options
      onChange({ 
        ...data, 
        options: [...data.options, ''] 
      });
    }
  };

  const removeOption = (index: number) => {
    if (data.options.length > 2) { // Minimum 2 options
      const newOptions = data.options.filter((_, i) => i !== index);
      const newCorrectAnswer = data.correctAnswer >= index 
        ? Math.max(0, data.correctAnswer - 1)
        : data.correctAnswer;
      
      onChange({ 
        ...data, 
        options: newOptions,
        correctAnswer: newCorrectAnswer >= newOptions.length ? 0 : newCorrectAnswer
      });
    }
  };

  const handleShuffleChange = (shuffleOptions: boolean) => {
    onChange({ ...data, shuffleOptions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Answer Options</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="shuffle-options" className="text-sm">Shuffle Options</Label>
          <Switch
            id="shuffle-options"
            checked={data.shuffleOptions || false}
            onCheckedChange={handleShuffleChange}
          />
        </div>
      </div>

      <div className="space-y-3">
        {data.options.map((option, index) => (
          <div key={index} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroup
                  value={data.correctAnswer.toString()}
                  onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      className="text-green-600"
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      {data.correctAnswer === index ? 'Correct' : 'Option'}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {data.options.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Textarea rows={2}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className={`min-h-[44px] sm:min-h-[48px] resize-y whitespace-pre-wrap ${data.correctAnswer === index ? 'border-green-500 bg-green-50' : ''}`}
              />
            </div>

          </div>
        ))}
      </div>

      {data.options.length < 6 && (
        <Button
          variant="outline"
          onClick={addOption}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option ({data.options.length}/6)
        </Button>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <Circle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Tips for Multiple Choice Questions:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Make sure all options are plausible</li>
              <li>• Avoid "all of the above" or "none of the above" options</li>
              <li>• Keep options roughly the same length</li>
              <li>• Only one option should be clearly correct</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MCQEditorComponent);