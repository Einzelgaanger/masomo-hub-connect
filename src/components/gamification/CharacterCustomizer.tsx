import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Sparkles, Shield, Zap } from 'lucide-react';
import { Character, CharacterCustomization } from '@/types/gamification';

interface CharacterCustomizerProps {
  character: Character;
  currentCustomizations: CharacterCustomization[];
  onApplyCustomization: (customization: CharacterCustomization) => void;
  onResetCustomizations: () => void;
}

const CUSTOMIZATION_OPTIONS = {
  color: [
    { id: 'default', name: 'Default', value: 'default', unlocked: true },
    { id: 'gold', name: 'Golden', value: 'gold', unlocked: false },
    { id: 'silver', name: 'Silver', value: 'silver', unlocked: false },
    { id: 'rainbow', name: 'Rainbow', value: 'rainbow', unlocked: false },
    { id: 'neon', name: 'Neon', value: 'neon', unlocked: false },
    { id: 'dark', name: 'Dark Mode', value: 'dark', unlocked: false }
  ],
  accessory: [
    { id: 'none', name: 'None', value: 'none', unlocked: true },
    { id: 'crown', name: 'Crown', value: 'crown', unlocked: false },
    { id: 'glasses', name: 'Smart Glasses', value: 'glasses', unlocked: false },
    { id: 'hat', name: 'Wizard Hat', value: 'hat', unlocked: false },
    { id: 'mask', name: 'Mystery Mask', value: 'mask', unlocked: false },
    { id: 'wings', name: 'Angel Wings', value: 'wings', unlocked: false }
  ],
  background: [
    { id: 'default', name: 'Default', value: 'default', unlocked: true },
    { id: 'space', name: 'Space', value: 'space', unlocked: false },
    { id: 'forest', name: 'Forest', value: 'forest', unlocked: false },
    { id: 'ocean', name: 'Ocean', value: 'ocean', unlocked: false },
    { id: 'city', name: 'City', value: 'city', unlocked: false },
    { id: 'magic', name: 'Magic Realm', value: 'magic', unlocked: false }
  ],
  effect: [
    { id: 'none', name: 'None', value: 'none', unlocked: true },
    { id: 'sparkles', name: 'Sparkles', value: 'sparkles', unlocked: false },
    { id: 'glow', name: 'Glow', value: 'glow', unlocked: false },
    { id: 'fire', name: 'Fire Aura', value: 'fire', unlocked: false },
    { id: 'ice', name: 'Ice Crystals', value: 'ice', unlocked: false },
    { id: 'lightning', name: 'Lightning', value: 'lightning', unlocked: false }
  ]
};

export function CharacterCustomizer({
  character,
  currentCustomizations,
  onApplyCustomization,
  onResetCustomizations
}: CharacterCustomizerProps) {
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string>>(() => {
    const customizations: Record<string, string> = {};
    currentCustomizations.forEach(custom => {
      customizations[custom.type] = custom.value;
    });
    return customizations;
  });

  const handleCustomizationChange = (type: string, value: string) => {
    setSelectedCustomizations(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleApplyCustomization = (type: string, value: string) => {
    const customization: CharacterCustomization = {
      type: type as any,
      value,
      unlocked: true
    };
    onApplyCustomization(customization);
  };

  const getCustomizationIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="h-4 w-4" />;
      case 'accessory': return <Shield className="h-4 w-4" />;
      case 'background': return <Sparkles className="h-4 w-4" />;
      case 'effect': return <Zap className="h-4 w-4" />;
      default: return null;
    }
  };

  const isCustomizationUnlocked = (type: string, value: string) => {
    if (value === 'default' || value === 'none') return true;
    // This would check against user's unlocked customizations
    return Math.random() > 0.5; // Placeholder - 50% chance
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src={character.image} alt={character.name} className="w-8 h-8 rounded" />
          Customize {character.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="color" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color
            </TabsTrigger>
            <TabsTrigger value="accessory" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Accessory
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Background
            </TabsTrigger>
            <TabsTrigger value="effect" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Effect
            </TabsTrigger>
          </TabsList>

          {Object.entries(CUSTOMIZATION_OPTIONS).map(([type, options]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {options.map(option => {
                  const isUnlocked = isCustomizationUnlocked(type, option.value);
                  const isSelected = selectedCustomizations[type] === option.value;

                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      } ${!isUnlocked ? 'opacity-50' : ''}`}
                      onClick={() => isUnlocked && handleCustomizationChange(type, option.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{option.name}</span>
                          {!isUnlocked && <Badge variant="secondary">Locked</Badge>}
                        </div>
                        
                        {/* Preview */}
                        <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center mb-2">
                          {type === 'color' && (
                            <div 
                              className={`w-8 h-8 rounded-full ${
                                option.value === 'default' ? 'bg-blue-500' :
                                option.value === 'gold' ? 'bg-yellow-500' :
                                option.value === 'silver' ? 'bg-gray-400' :
                                option.value === 'rainbow' ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' :
                                option.value === 'neon' ? 'bg-green-400' :
                                'bg-gray-800'
                              }`}
                            />
                          )}
                          {type === 'accessory' && (
                            <div className="text-2xl">
                              {option.value === 'crown' ? '👑' :
                               option.value === 'glasses' ? '🤓' :
                               option.value === 'hat' ? '🎩' :
                               option.value === 'mask' ? '🎭' :
                               option.value === 'wings' ? '👼' : '👤'}
                            </div>
                          )}
                          {type === 'background' && (
                            <div className="text-2xl">
                              {option.value === 'space' ? '🌌' :
                               option.value === 'forest' ? '🌲' :
                               option.value === 'ocean' ? '🌊' :
                               option.value === 'city' ? '🏙️' :
                               option.value === 'magic' ? '✨' : '⬜'}
                            </div>
                          )}
                          {type === 'effect' && (
                            <div className="text-2xl">
                              {option.value === 'sparkles' ? '✨' :
                               option.value === 'glow' ? '💫' :
                               option.value === 'fire' ? '🔥' :
                               option.value === 'ice' ? '❄️' :
                               option.value === 'lightning' ? '⚡' : '👤'}
                            </div>
                          )}
                        </div>

                        {isUnlocked && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyCustomization(type, option.value);
                            }}
                          >
                            Apply
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Preview</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={character.image}
                alt={character.name}
                className="w-16 h-16 rounded-lg"
                style={{
                  filter: selectedCustomizations.color !== 'default' ? 
                    `hue-rotate(${selectedCustomizations.color === 'gold' ? '45deg' : 
                                 selectedCustomizations.color === 'silver' ? '0deg' : 
                                 selectedCustomizations.color === 'rainbow' ? '180deg' : 
                                 selectedCustomizations.color === 'neon' ? '120deg' : 
                                 selectedCustomizations.color === 'dark' ? '0deg saturate(0.5) brightness(0.7)' : 'none'})` : 'none'
                }}
              />
              {selectedCustomizations.effect !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">
                    {selectedCustomizations.effect === 'sparkles' ? '✨' :
                     selectedCustomizations.effect === 'glow' ? '💫' :
                     selectedCustomizations.effect === 'fire' ? '🔥' :
                     selectedCustomizations.effect === 'ice' ? '❄️' :
                     selectedCustomizations.effect === 'lightning' ? '⚡' : ''}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-medium">{character.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedCustomizations.color !== 'default' && `Color: ${selectedCustomizations.color}`}
                {selectedCustomizations.accessory !== 'none' && ` • Accessory: ${selectedCustomizations.accessory}`}
                {selectedCustomizations.background !== 'default' && ` • Background: ${selectedCustomizations.background}`}
                {selectedCustomizations.effect !== 'none' && ` • Effect: ${selectedCustomizations.effect}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onResetCustomizations} variant="outline">
            Reset
          </Button>
          <Button className="flex-1">
            Save Customization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
