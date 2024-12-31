import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatSettings } from '@/stores/chatSettings';
import { AdvancedSettingsProps, ChatSettings } from '@/types/chat';
import { HelpCircle, RotateCcw, Settings2 } from 'lucide-react';

function SettingLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function SliderSetting({
  value,
  onChange,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  showValue,
  valueFormat,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  leftLabel: string;
  rightLabel: string;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
}) {
  return (
    <div className="grid gap-2">
      {showValue && (
        <p className="text-xs text-muted-foreground">Current: {valueFormat ? valueFormat(value) : value}</p>
      )}
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([val = 0]) => onChange(val)} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function AdvancedSettings({
  settings,
  onSettingsChange,
  systemContext = '',
  onSystemContextChange,
  disabled,
}: AdvancedSettingsProps) {
  const resetToDefaults = useChatSettings((state) => state.resetToDefaults);

  const handleChange = (field: keyof ChatSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          disabled={disabled}
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Response settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Response Settings</h4>
            <p className="text-sm text-muted-foreground">Customize how the AI generates responses.</p>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="systemContext">
                <SettingLabel
                  label="AI Personality"
                  tooltip="Define how the AI should behave or what role it should take (e.g., 'Act as a math tutor' or 'Be concise and technical')"
                />
              </Label>
              <Textarea
                id="systemContext"
                placeholder="Define AI behavior or role..."
                value={systemContext}
                onChange={(e) => onSystemContextChange?.(e.target.value)}
                className="h-40 resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  <SettingLabel
                    label="Response Length"
                    tooltip="Maximum number of words in the response. Higher values allow for longer responses."
                  />
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetToDefaults}
                  className="h-8 w-8"
                  title="Reset parameters to defaults"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <SliderSetting
                value={settings.maxTokens}
                onChange={(value) => handleChange('maxTokens', value)}
                min={1}
                max={4096}
                step={100}
                leftLabel="Short"
                rightLabel="Long"
                showValue
                valueFormat={(value) => `${value} tokens`}
              />
            </div>

            <div className="space-y-2">
              <Label>
                <SettingLabel
                  label="Creativity"
                  tooltip="Higher values make responses more creative and varied, lower values make them more focused and deterministic."
                />
              </Label>
              <SliderSetting
                value={settings.temperature}
                onChange={(value) => handleChange('temperature', value)}
                min={0}
                max={2}
                step={0.1}
                leftLabel="Focused"
                rightLabel="Creative"
                showValue
              />
            </div>

            <div className="space-y-2">
              <Label>
                <SettingLabel
                  label="Answer Variety"
                  tooltip="Controls how diverse the responses can be. Lower values make responses more focused on the most likely options."
                />
              </Label>
              <SliderSetting
                value={settings.topP}
                onChange={(value) => handleChange('topP', value)}
                min={0}
                max={1}
                step={0.05}
                leftLabel="Focused"
                rightLabel="Varied"
                showValue
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
