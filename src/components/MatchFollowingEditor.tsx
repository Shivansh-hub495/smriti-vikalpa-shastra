import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, Info, Shuffle } from 'lucide-react';
import type { MatchFollowingData } from '@/types/quiz';

interface MatchFollowingEditorProps {
  data: MatchFollowingData;
  onChange: (data: MatchFollowingData) => void;
}

const MatchFollowingEditorComponent: React.FC<MatchFollowingEditorProps> = ({ data, onChange }) => {
  const handleLeftItemChange = (index: number, value: string) => {
    const newLeftItems = [...data.leftItems];
    newLeftItems[index] = value;
    onChange({ ...data, leftItems: newLeftItems });
  };

  const handleRightItemChange = (index: number, value: string) => {
    const newRightItems = [...data.rightItems];
    newRightItems[index] = value;
    onChange({ ...data, rightItems: newRightItems });
  };

  const handlePairChange = (pairIndex: number, side: 'left' | 'right', itemIndex: number) => {
    const newPairs = [...data.correctPairs];
    newPairs[pairIndex] = { ...newPairs[pairIndex], [side]: itemIndex };
    onChange({ ...data, correctPairs: newPairs });
  };

  const addPair = () => {
    if (data.leftItems.length < 10 && data.rightItems.length < 10) { // Limit to 10 items each
      const newLeftItems = [...data.leftItems, ''];
      const newRightItems = [...data.rightItems, ''];
      const newPairs = [...data.correctPairs, { left: newLeftItems.length - 1, right: newRightItems.length - 1 }];
      
      onChange({ 
        ...data, 
        leftItems: newLeftItems,
        rightItems: newRightItems,
        correctPairs: newPairs
      });
    }
  };

  const removePair = (index: number) => {
    if (data.leftItems.length > 1) { // Minimum 1 pair
      const newLeftItems = data.leftItems.filter((_, i) => i !== index);
      const newRightItems = data.rightItems.filter((_, i) => i !== index);
      
      // Update pair indices and remove the pair at the specified index
      const newPairs = data.correctPairs
        .filter((_, i) => i !== index)
        .map(pair => ({
          left: pair.left > index ? pair.left - 1 : pair.left,
          right: pair.right > index ? pair.right - 1 : pair.right
        }));
      
      onChange({ 
        ...data, 
        leftItems: newLeftItems,
        rightItems: newRightItems,
        correctPairs: newPairs
      });
    }
  };

  const handleShuffleChange = (shuffleItems: boolean) => {
    onChange({ ...data, shuffleItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Matching Pairs</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="shuffle-items" className="text-sm">Shuffle Items</Label>
          <Switch
            id="shuffle-items"
            checked={data.shuffleItems || false}
            onCheckedChange={handleShuffleChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        {data.correctPairs.map((pair, pairIndex) => (
          <div key={pairIndex} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">
                Pair {pairIndex + 1}
              </Label>
              {data.correctPairs.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePair(pairIndex)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Left Item */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Left Column</Label>
                <Textarea rows={2}
                  placeholder="Enter left item"
                  value={data.leftItems[pairIndex] || ''}
                  onChange={(e) => handleLeftItemChange(pairIndex, e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] resize-y whitespace-pre-wrap bg-white"
                />
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>

              {/* Right Item */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Right Column</Label>
                <Textarea rows={2}
                  placeholder="Enter right item"
                  value={data.rightItems[pairIndex] || ''}
                  onChange={(e) => handleRightItemChange(pairIndex, e.target.value)}
                  className="min-h-[44px] sm:min-h-[48px] resize-y whitespace-pre-wrap bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.correctPairs.length < 10 && (
        <Button
          variant="outline"
          onClick={addPair}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pair ({data.correctPairs.length}/10)
        </Button>
      )}

      {/* Advanced Pairing Options */}
      {data.leftItems.length !== data.rightItems.length && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Advanced Matching</p>
              <p className="mt-1">
                You can create unequal numbers of left and right items for more challenging questions.
                Some items may not have matches, making students think more carefully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      <div className="bg-gray-50 border rounded-md p-3">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview: How students will see this question
        </Label>
        <div className="bg-white border rounded p-3">
          <p className="text-sm text-gray-600 mb-3">
            Students will see two columns and need to match items by dragging or selecting:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Left Column</div>
              <div className="space-y-2">
                {data.leftItems.filter(item => item.trim()).map((item, index) => (
                  <div key={index} className="p-2 border rounded bg-blue-50 text-sm">
                    {item || `Item ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Right Column</div>
              <div className="space-y-2">
                {data.rightItems.filter(item => item.trim()).map((item, index) => (
                  <div key={index} className="p-2 border rounded bg-green-50 text-sm">
                    {item || `Match ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Tips for Match the Following Questions:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• Keep items concise and clear</li>
              <li>• Ensure each match is unambiguous</li>
              <li>• Consider adding extra items to increase difficulty</li>
              <li>• Use consistent formatting for similar types of items</li>
              <li>• Test the matching logic to ensure it works correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MatchFollowingEditorComponent);