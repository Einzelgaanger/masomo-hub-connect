import React from 'react';
import { Character } from '../../types/characters';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { CheckCircle, Lock, Star, Trophy } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  currentPoints: number;
  isUnlocked: boolean;
  isCurrentCharacter: boolean;
  onClick?: () => void;
}

const getCategoryColor = (category: Character['category']): string => {
  switch (category) {
    case 'starter':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'intermediate':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'advanced':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'legendary':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'ultimate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoryIcon = (category: Character['category']) => {
  switch (category) {
    case 'starter':
      return <Star className="h-3 w-3" />;
    case 'intermediate':
      return <Star className="h-3 w-3" />;
    case 'advanced':
      return <Trophy className="h-3 w-3" />;
    case 'legendary':
      return <Trophy className="h-3 w-3" />;
    case 'ultimate':
      return <Trophy className="h-3 w-3" />;
    default:
      return <Star className="h-3 w-3" />;
  }
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  currentPoints,
  isUnlocked,
  isCurrentCharacter,
  onClick
}) => {
  const categoryColor = getCategoryColor(character.category);
  const pointsNeeded = character.pointsRequired - currentPoints;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isCurrentCharacter 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : isUnlocked 
            ? 'hover:ring-2 hover:ring-blue-300' 
            : 'opacity-60'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{character.name}</CardTitle>
          <div className="flex items-center gap-2">
            {isCurrentCharacter && (
              <Badge variant="default" className="bg-blue-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Current
              </Badge>
            )}
            {!isUnlocked && (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={categoryColor}>
            {getCategoryIcon(character.category)}
            <span className="ml-1 capitalize">{character.category}</span>
          </Badge>
          <Badge variant="secondary">
            Rank #{character.rank}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col items-center space-y-4">
          {/* Character Image */}
          <div className="relative">
            <img
              src={character.image}
              alt={character.name}
              className={`w-24 h-24 object-contain rounded-lg border-2 ${
                isUnlocked ? 'border-blue-300' : 'border-gray-300 grayscale'
              }`}
            />
            {isCurrentCharacter && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            {character.description}
          </p>

          {/* Points Requirement */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Points Required:</span>
              <span className={`text-sm font-bold ${isUnlocked ? 'text-green-600' : 'text-gray-500'}`}>
                {character.pointsRequired.toLocaleString()}
              </span>
            </div>
            
            {!isUnlocked && pointsNeeded > 0 && (
              <div className="bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((currentPoints / character.pointsRequired) * 100, 100)}%` 
                  }}
                />
              </div>
            )}
            
            {!isUnlocked && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                {pointsNeeded.toLocaleString()} more points needed
              </p>
            )}
          </div>

          {/* Special Traits */}
          <div className="w-full">
            <p className="text-xs font-medium text-gray-700 mb-2">Special Traits:</p>
            <div className="flex flex-wrap gap-1">
              {character.specialTraits.map((trait, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
