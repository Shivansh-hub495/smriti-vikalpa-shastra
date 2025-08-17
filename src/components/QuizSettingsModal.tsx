import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Clock, 
  Shuffle, 
  Eye, 
  RotateCcw, 
  Target,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { QuizSettings } from '@/types/quiz';

interface QuizSettingsModalProps {
  settings: QuizSettings;
  onChange: (settings: QuizSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  settings,
  onChange,
  isOpen,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<QuizSettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalSettings(settings);
    setErrors({});
  }, [settings, isOpen]);

  const validateSettings = () => {
    const newErrors: Record<string, string> = {};

    if (localSettings.timeLimit !== undefined) {
      if (localSettings.timeLimit <= 0) {
        newErrors.timeLimit = 'Time limit must be greater than 0';
      } else if (localSettings.timeLimit > 480) {
        newErrors.timeLimit = 'Time limit cannot exceed 8 hours (480 minutes)';
      }
    }

    if (localSettings.maxRetakes !== undefined) {
      if (localSettings.maxRetakes < 0) {
        newErrors.maxRetakes = 'Max retakes cannot be negative';
      } else if (localSettings.maxRetakes > 100) {
        newErrors.maxRetakes = 'Max retakes cannot exceed 100';
      }
    }

    if (localSettings.passingScore !== undefined) {
      if (localSettings.passingScore < 0 || localSettings.passingScore > 100) {
        newErrors.passingScore = 'Passing score must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateSettings()) {
      onChange(localSettings);
      onClose();
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setErrors({});
    onClose();
  };

  const updateSetting = <K extends keyof QuizSettings>(
    key: K,
    value: QuizSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const toggleSetting = (key: keyof QuizSettings) => {
    const currentValue = localSettings[key] as boolean;
    updateSetting(key, !currentValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quiz Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Timing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                  <Switch
                    checked={localSettings.timeLimit !== undefined}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateSetting('timeLimit', 30);
                      } else {
                        const { timeLimit, ...rest } = localSettings;
                        setLocalSettings(rest);
                      }
                    }}
                  />
                </div>
                {localSettings.timeLimit !== undefined && (
                  <div className="space-y-1">
                    <Input
                      id="time-limit"
                      type="number"
                      min="1"
                      max="480"
                      value={localSettings.timeLimit || ''}
                      onChange={(e) => updateSetting('timeLimit', parseInt(e.target.value) || undefined)}
                      placeholder="Enter time limit in minutes"
                      className={errors.timeLimit ? 'border-red-500' : ''}
                    />
                    {errors.timeLimit && (
                      <p className="text-sm text-red-600">{errors.timeLimit}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Students will have this much time to complete the entire quiz
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Question Behavior */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Shuffle className="h-4 w-4" />
                <span>Question Behavior</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Shuffle Questions</Label>
                  <p className="text-xs text-gray-600">
                    Present questions in random order for each attempt
                  </p>
                </div>
                <Switch
                  checked={localSettings.shuffleQuestions || false}
                  onCheckedChange={() => toggleSetting('shuffleQuestions')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results & Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Results & Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Show Results Immediately</Label>
                  <p className="text-xs text-gray-600">
                    Display score and results right after quiz completion
                  </p>
                </div>
                <Switch
                  checked={localSettings.showResults || false}
                  onCheckedChange={() => toggleSetting('showResults')}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Show Correct Answers</Label>
                  <p className="text-xs text-gray-600">
                    Show correct answers in the results
                  </p>
                </div>
                <Switch
                  checked={localSettings.showCorrectAnswers || false}
                  onCheckedChange={() => toggleSetting('showCorrectAnswers')}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Show Explanations</Label>
                  <p className="text-xs text-gray-600">
                    Display question explanations in results
                  </p>
                </div>
                <Switch
                  checked={localSettings.showExplanations || false}
                  onCheckedChange={() => toggleSetting('showExplanations')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Retakes & Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Retakes & Scoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Allow Retakes</Label>
                  <p className="text-xs text-gray-600">
                    Let students retake the quiz multiple times
                  </p>
                </div>
                <Switch
                  checked={localSettings.allowRetakes || false}
                  onCheckedChange={() => toggleSetting('allowRetakes')}
                />
              </div>

              {localSettings.allowRetakes && (
                <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                  <Label htmlFor="max-retakes">Maximum Retakes</Label>
                  <Input
                    id="max-retakes"
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.maxRetakes || ''}
                    onChange={(e) => updateSetting('maxRetakes', parseInt(e.target.value) || undefined)}
                    placeholder="Unlimited (leave empty)"
                    className={errors.maxRetakes ? 'border-red-500' : ''}
                  />
                  {errors.maxRetakes && (
                    <p className="text-sm text-red-600">{errors.maxRetakes}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave empty for unlimited retakes
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                  <Switch
                    checked={localSettings.passingScore !== undefined}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateSetting('passingScore', 70);
                      } else {
                        const { passingScore, ...rest } = localSettings;
                        setLocalSettings(rest);
                      }
                    }}
                  />
                </div>
                {localSettings.passingScore !== undefined && (
                  <div className="space-y-1">
                    <Input
                      id="passing-score"
                      type="number"
                      min="0"
                      max="100"
                      value={localSettings.passingScore || ''}
                      onChange={(e) => updateSetting('passingScore', parseInt(e.target.value) || undefined)}
                      placeholder="Enter passing score percentage"
                      className={errors.passingScore ? 'border-red-500' : ''}
                    />
                    {errors.passingScore && (
                      <p className="text-sm text-red-600">{errors.passingScore}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Students need this score or higher to pass
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings Preview */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>Settings Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  {localSettings.timeLimit ? (
                    <>
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{localSettings.timeLimit} minute time limit</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>No time limit</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {localSettings.shuffleQuestions ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Questions shuffled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>Questions in order</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {localSettings.allowRetakes ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        {localSettings.maxRetakes 
                          ? `${localSettings.maxRetakes} retakes allowed`
                          : 'Unlimited retakes'
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>No retakes allowed</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {localSettings.passingScore ? (
                    <>
                      <Target className="h-4 w-4 text-purple-600" />
                      <span>{localSettings.passingScore}% passing score</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>No passing score set</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {localSettings.showResults ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Show results immediately</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>Results hidden</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {localSettings.showCorrectAnswers ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Show correct answers</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span>Hide correct answers</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuizSettingsModal;