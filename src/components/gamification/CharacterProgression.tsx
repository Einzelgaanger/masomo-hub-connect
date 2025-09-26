import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Zap, Gem, Crown, Flame, Trophy } from 'lucide-react';
import { Character } from '@/types/gamification';
import { CHARACTERS, RARITY_COLORS, CHARACTER_TIERS } from '@/data/characters';

interface CharacterProgressionProps {
  currentCharacter: Character;
  currentPoints: number;
  currentLevel: number;
  onCharacterClick?: (character: Character) => void;
}

const RARITY_ICONS = {
  common: <Star className="h-4 w-4" />,
  uncommon: <Zap className="h-4 w-4" />,
  rare: <Gem className="h-4 w-4" />,
  epic: <Crown className="h-4 w-4" />,
  legendary: <Flame className="h-4 w-4" />,
  mythic: <Crown className="h-4 w-4" />
};

export function CharacterProgression({
  currentCharacter,
  currentPoints,
  currentLevel,
  onCharacterClick
}: CharacterProgressionProps) {
  const nextCharacter = CHARACTERS.find(char => char.rank === currentCharacter.rank + 1);
  const previousCharacter = CHARACTERS.find(char => char.rank === currentCharacter.rank - 1);
  
  const getProgressToNext = () => {
    if (!nextCharacter) return { progress: 100, pointsNeeded: 0 };
    
    const pointsReq = nextCharacter.unlockRequirements.find(req => req.type === 'points');
    const levelReq = nextCharacter.unlockRequirements.find(req => req.type === 'level');
    
    if (!pointsReq || !levelReq) return { progress: 100, pointsNeeded: 0 };
    
    const pointsProgress = Math.min((currentPoints / pointsReq.value) * 100, 100);
    const levelProgress = Math.min((currentLevel / levelReq.value) * 100, 100);
    
    // Take the minimum of both requirements
    const overallProgress = Math.min(pointsProgress, levelProgress);
    const pointsNeeded = Math.max(0, pointsReq.value - currentPoints);
    
    return { progress: overallProgress, pointsNeeded };
  };

  const { progress, pointsNeeded } = getProgressToNext();

  const getTierColor = (tier: string) => {
    return CHARACTER_TIERS[tier as keyof typeof CHARACTER_TIERS]?.color || '#gray';
  };

  const getRarityIcon = (rarity: string) => {
    return RARITY_ICONS[rarity as keyof typeof RARITY_ICONS] || <Star className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Current Character */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Your Current Character
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentCharacter.image}
                alt={currentCharacter.name}
                className="w-16 h-16 rounded-lg border-2 border-blue-300"
              />
              <Badge
                className={`absolute -top-2 -right-2 ${
                  RARITY_COLORS[currentCharacter.rarity]
                } text-white`}
              >
                {getRarityIcon(currentCharacter.rarity)}
              </Badge>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{currentCharacter.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" style={{ borderColor: getTierColor(currentCharacter.tier), color: getTierColor(currentCharacter.tier) }}>
                  {currentCharacter.tier}
                </Badge>
                <Badge variant="secondary">Rank #{currentCharacter.rank}</Badge>
                <Badge className={RARITY_COLORS[currentCharacter.rarity]}>
                  {currentCharacter.rarity}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{currentCharacter.description}</p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Intelligence:</span>
                  <span className="font-semibold">{currentCharacter.baseStats.intelligence}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leadership:</span>
                  <span className="font-semibold">{currentCharacter.baseStats.leadership}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creativity:</span>
                  <span className="font-semibold">{currentCharacter.baseStats.creativity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Determination:</span>
                  <span className="font-semibold">{currentCharacter.baseStats.determination}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Character Progress */}
      {nextCharacter && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-green-600" />
              Progress to Next Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={nextCharacter.image}
                    alt={nextCharacter.name}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 grayscale"
                  />
                  <Badge
                    className={`absolute -top-1 -right-1 ${
                      RARITY_COLORS[nextCharacter.rarity]
                    } text-white`}
                  >
                    {getRarityIcon(nextCharacter.rarity)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{nextCharacter.name}</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" style={{ borderColor: getTierColor(nextCharacter.tier), color: getTierColor(nextCharacter.tier) }}>
                      {nextCharacter.tier}
                    </Badge>
                    <Badge variant="secondary">Rank #{nextCharacter.rank}</Badge>
                    <Badge className={RARITY_COLORS[nextCharacter.rarity]}>
                      {nextCharacter.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{nextCharacter.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{pointsNeeded.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">points needed</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Overall Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Unlock Requirements:</h5>
                <div className="space-y-1">
                  {nextCharacter.unlockRequirements.map((req, index) => {
                    let isMet = false;
                    let currentValue = 0;
                    let requiredValue = req.value;

                    if (req.type === 'points') {
                      currentValue = currentPoints;
                      isMet = currentPoints >= req.value;
                    } else if (req.type === 'level') {
                      currentValue = currentLevel;
                      isMet = currentLevel >= req.value;
                    }

                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isMet ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isMet ? '✓' : '○'}
                        </div>
                        <span className={isMet ? 'text-green-600' : 'text-gray-600'}>
                          {req.description} {req.type === 'points' || req.type === 'level' ? 
                            `(${currentValue.toLocaleString()}/${requiredValue.toLocaleString()})` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {onCharacterClick && (
                <Button
                  onClick={() => onCharacterClick(nextCharacter)}
                  className="w-full"
                  variant="outline"
                >
                  View Character Details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Character */}
      {previousCharacter && (
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-gray-600 rotate-180" />
              Previous Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={previousCharacter.image}
                alt={previousCharacter.name}
                className="w-12 h-12 rounded-lg border-2 border-gray-300"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{previousCharacter.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" style={{ borderColor: getTierColor(previousCharacter.tier), color: getTierColor(previousCharacter.tier) }}>
                    {previousCharacter.tier}
                  </Badge>
                  <Badge variant="secondary">Rank #{previousCharacter.rank}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Tier Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Character Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(CHARACTER_TIERS).map(([tier, info]) => (
              <div key={tier} className="text-center p-3 rounded-lg border" style={{ borderColor: info.color }}>
                <div className="font-semibold capitalize" style={{ color: info.color }}>
                  {tier}
                </div>
                <div className="text-sm text-gray-600">
                  Level {info.minLevel}-{info.maxLevel}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
