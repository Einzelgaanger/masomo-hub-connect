import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Star, Zap, Crown, Gem, Flame } from 'lucide-react';
import { Character, UserCharacter } from '@/types/gamification';
import { CHARACTERS, RARITY_COLORS, CHARACTER_TIERS } from '@/data/characters';
import { useToast } from '@/hooks/use-toast';

interface CharacterSelectorProps {
  userCharacters: UserCharacter[];
  currentCharacter?: UserCharacter;
  onSelectCharacter: (characterId: string) => void;
  onUnlockCharacter: (characterId: string) => void;
  userLevel: number;
  userPoints: number;
}

const RARITY_ICONS = {
  common: <Star className="h-4 w-4" />,
  uncommon: <Zap className="h-4 w-4" />,
  rare: <Gem className="h-4 w-4" />,
  epic: <Crown className="h-4 w-4" />,
  legendary: <Flame className="h-4 w-4" />,
  mythic: <Crown className="h-4 w-4" />
};

export function CharacterSelector({
  userCharacters,
  currentCharacter,
  onSelectCharacter,
  onUnlockCharacter,
  userLevel,
  userPoints
}: CharacterSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const { toast } = useToast();

  const categories = ['all', 'hero', 'villain', 'neutral', 'mystical', 'sci-fi', 'fantasy', 'academic'];
  const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

  const filteredCharacters = CHARACTERS.filter(character => {
    const categoryMatch = selectedCategory === 'all' || character.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || character.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  });

  const isCharacterUnlocked = (characterId: string) => {
    return userCharacters.some(uc => uc.characterId === characterId);
  };

  const canUnlockCharacter = (character: Character) => {
    return character.unlockRequirements.every(req => {
      switch (req.type) {
        case 'level':
          return userLevel >= req.value;
        case 'points':
          return userPoints >= req.value;
        case 'achievement':
          // This would need to be checked against user achievements
          return true; // Placeholder
        default:
          return true;
      }
    });
  };

  const getUnlockProgress = (character: Character) => {
    const completed = character.unlockRequirements.filter(req => {
      switch (req.type) {
        case 'level':
          return userLevel >= req.value;
        case 'points':
          return userPoints >= req.value;
        default:
          return false;
      }
    }).length;
    return (completed / character.unlockRequirements.length) * 100;
  };

  const handleUnlockAttempt = (character: Character) => {
    if (canUnlockCharacter(character)) {
      onUnlockCharacter(character.id);
      toast({
        title: "Character Unlocked!",
        description: `You've unlocked ${character.name}!`,
      });
    } else {
      toast({
        title: "Requirements Not Met",
        description: "You need to meet more requirements to unlock this character.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Rarity</label>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCharacters.map(character => {
          const isUnlocked = isCharacterUnlocked(character.id);
          const canUnlock = canUnlockCharacter(character);
          const isSelected = currentCharacter?.characterId === character.id;
          const unlockProgress = getUnlockProgress(character);

          return (
            <Card
              key={character.id}
              className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              } ${!isUnlocked ? 'opacity-60' : ''}`}
              onClick={() => isUnlocked && onSelectCharacter(character.id)}
            >
              <CardHeader className="p-3">
                <div className="relative">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${
                      RARITY_COLORS[character.rarity]
                    } text-white`}
                  >
                    {RARITY_ICONS[character.rarity]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <CardTitle className="text-sm font-bold mb-2">{character.name}</CardTitle>
                
                {/* Character Stats */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Intelligence</span>
                    <span>{character.baseStats.intelligence}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Leadership</span>
                    <span>{character.baseStats.leadership}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Creativity</span>
                    <span>{character.baseStats.creativity}</span>
                  </div>
                </div>

                {/* Unlock Progress */}
                {!isUnlocked && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      Unlock Progress: {Math.round(unlockProgress)}%
                    </div>
                    <Progress value={unlockProgress} className="h-2" />
                    <div className="text-xs space-y-1">
                      {character.unlockRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {req.type === 'level' && userLevel >= req.value ? (
                            <span className="text-green-500">✓</span>
                          ) : req.type === 'points' && userPoints >= req.value ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span className="text-xs">{req.description}</span>
                        </div>
                      ))}
                    </div>
                    {canUnlock && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockAttempt(character);
                        }}
                      >
                        Unlock
                      </Button>
                    )}
                  </div>
                )}

                {/* Special Abilities */}
                {isUnlocked && (
                  <div className="text-xs text-gray-600">
                    <div className="font-medium mb-1">Abilities:</div>
                    {character.specialAbilities.slice(0, 2).map((ability, index) => (
                      <div key={index} className="truncate">• {ability}</div>
                    ))}
                    {character.specialAbilities.length > 2 && (
                      <div>+{character.specialAbilities.length - 2} more</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
