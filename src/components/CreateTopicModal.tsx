import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { validateTopicInput, getHistoricalPeriods } from '@/lib/topicValidation';
import { estimateEventCount, getEstimationBreakdown } from '@/lib/eventEstimator';
import { apiClient } from '@/api';
import { toast } from '@/hooks/use-toast';

interface CreateTopicModalProps {
  onTopicCreated: (topicId: string) => void;
  children?: React.ReactNode;
}

interface ValidationState {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  normalized?: {
    period: { label: string; start_year: number; end_year: number };
    location: string;
    theme?: string;
  };
}

const COMMON_THEMES = [
  'Politics', 'Military', 'Culture', 'Science', 'Religion', 
  'Economics', 'Social', 'Exploration', 'Art', 'Technology'
];

const MAJOR_LOCATIONS = [
  'England', 'France', 'Germany', 'Italy', 'Spain', 'Russia',
  'United States', 'China', 'Japan', 'India', 'Egypt',
  'Ottoman Empire', 'Byzantine Empire', 'Holy Roman Empire'
];

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({ 
  onTopicCreated,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form fields
  const [period, setPeriod] = useState('');
  const [location, setLocation] = useState('');
  const [theme, setTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  
  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    errors: []
  });
  
  // Server validation state
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateTopicId, setDuplicateTopicId] = useState<string>();
  
  // Reset form
  const resetForm = useCallback(() => {
    setPeriod('');
    setLocation('');
    setTheme('');
    setCustomTheme('');
    setValidation({ isValid: false, errors: [] });
    setIsDuplicate(false);
    setDuplicateTopicId(undefined);
  }, []);

  // Client-side validation
  const validateForm = useCallback(() => {
    const actualTheme = theme === 'custom' ? customTheme : theme;
    const result = validateTopicInput(period, location, actualTheme);
    setValidation({
      isValid: result.valid,
      errors: result.errors,
      normalized: result.normalized
    });
    return result.valid;
  }, [period, location, theme, customTheme]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const actualTheme = theme === 'custom' ? customTheme : theme;
    
    try {
      setIsValidating(true);
      setIsDuplicate(false);
      
      // Server-side validation and duplicate check
      const validateResponse = await apiClient.validateTopic({
        period,
        location,
        theme: actualTheme
      });

      if (!validateResponse.ok) {
        if (validateResponse.duplicateOf) {
          setIsDuplicate(true);
          setDuplicateTopicId(validateResponse.duplicateOf);
          return;
        }
        throw new Error('Validation failed');
      }

      const { normalized } = validateResponse;
      if (!normalized) throw new Error('No normalized data received');

      setIsCreating(true);
      
      // Create topic
      const desiredCount = estimateEventCount(
        normalized.period.start_year,
        normalized.period.end_year,
        normalized.theme
      );

      const createResponse = await apiClient.createTopic({
        period: normalized.period,
        location: normalized.location,
        theme: normalized.theme,
        desiredCount
      });

      setIsGenerating(true);

      // Generate events
      await apiClient.generateTopic(createResponse.id, {});

      toast({
        title: 'Topic Created Successfully!',
        description: `Generated ${desiredCount} events for ${normalized.period.label} in ${normalized.location}`
      });

      onTopicCreated(createResponse.id);
      setIsOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: 'Error Creating Topic',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
      setIsCreating(false);
      setIsGenerating(false);
    }
  };

  const getProgressMessage = () => {
    if (isGenerating) return 'Cooking up events...';
    if (isCreating) return 'Creating topic...';
    if (isValidating) return 'Validating...';
    return '';
  };

  const isFormValid = validation.isValid && period && location;
  const isLoading = isValidating || isCreating || isGenerating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Topic
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Topic</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Field */}
          <div className="space-y-2">
            <Label htmlFor="period" className="text-sm font-medium">
              Historical Period
            </Label>
            <Input
              id="period"
              placeholder="e.g., Victorian Era, 1837-1901, World War I"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setTimeout(validateForm, 100);
              }}
              className={validation.errors.some(e => e.field === 'period') ? 'border-red-500' : ''}
            />
            <div className="text-xs text-muted-foreground">
              Try: {getHistoricalPeriods().slice(0, 3).join(', ')}...
            </div>
            
            {/* Period validation feedback */}
            {validation.normalized?.period && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Resolved to: {validation.normalized.period.start_year}–{validation.normalized.period.end_year}
                  ({validation.normalized.period.end_year - validation.normalized.period.start_year + 1} years)
                </span>
              </div>
            )}
          </div>

          {/* Location Field */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., England, Ottoman Empire, New York"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setTimeout(validateForm, 100);
              }}
              className={validation.errors.some(e => e.field === 'location') ? 'border-red-500' : ''}
            />
            <div className="text-xs text-muted-foreground">
              Suggestions: {MAJOR_LOCATIONS.slice(0, 4).join(', ')}...
            </div>
          </div>

          {/* Theme Field */}
          <div className="space-y-2">
            <Label htmlFor="theme" className="text-sm font-medium">
              Theme (Optional)
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme or leave blank for general" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">General (All Events)</SelectItem>
                {COMMON_THEMES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Theme...</SelectItem>
              </SelectContent>
            </Select>
            
            {theme === 'custom' && (
              <Input
                placeholder="Enter custom theme"
                value={customTheme}
                onChange={(e) => {
                  setCustomTheme(e.target.value);
                  setTimeout(validateForm, 100);
                }}
              />
            )}
          </div>

          {/* Event Count Estimate */}
          {validation.normalized && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="h-4 w-4" />
                <span className="font-medium">Event Estimate</span>
              </div>
              <div className="text-sm text-blue-700">
                {getEstimationBreakdown(
                  validation.normalized.period.start_year,
                  validation.normalized.period.end_year,
                  validation.normalized.theme
                ).reasoning}
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                ~{estimateEventCount(
                  validation.normalized.period.start_year,
                  validation.normalized.period.end_year,
                  validation.normalized.theme
                )} events
              </Badge>
            </div>
          )}

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {isDuplicate && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This looks a lot like an existing topic. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2 text-blue-600"
                  onClick={() => {
                    if (duplicateTopicId) {
                      onTopicCreated(duplicateTopicId);
                      setIsOpen(false);
                      resetForm();
                    }
                  }}
                >
                  Open that topic instead?
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="font-medium">{getProgressMessage()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create & Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};