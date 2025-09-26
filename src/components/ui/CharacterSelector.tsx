import React from 'react';
import { CHARACTERS } from '../../data/characters';
import { Character } from '../../types/gamification';
import { CharacterCard } from './CharacterCard';
import { Trophy, Star } from 'lucide-react';
import { Badge } from './badge';

interface CharacterSelectorProps {
  currentPoints: number;
  currentCharacterId?: string;
}

// Helper function to get character by points using new system
const getCharacterByPoints = (points: number) => {
  const availableCharacters = CHARACTERS
    .filter(char => {
      const pointsReq = char.unlockRequirements.find(req => req.type === 'points');
      return pointsReq ? points >= pointsReq.value : true;
    })
    .sort((a, b) => {
      const aPoints = a.unlockRequirements.find(req => req.type === 'points')?.value || 0;
      const bPoints = b.unlockRequirements.find(req => req.type === 'points')?.value || 0;
      return aPoints - bPoints;
    });
  
  return availableCharacters[availableCharacters.length - 1] || CHARACTERS[0];
};

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  currentPoints,
  currentCharacterId
}) => {
  const currentCharacter = getCharacterByPoints(currentPoints);
  const currentCharacterData = CHARACTERS.find(c => c.id === currentCharacterId) || currentCharacter;

  const sortedCharacters = CHARACTERS.sort((a, b) => a.rank - b.rank);

  const unlockedCount = CHARACTERS.filter(char => {
    const pointsReq = char.unlockRequirements.find(req => req.type === 'points');
    return pointsReq ? currentPoints >= pointsReq.value : true;
  }).length;
  const totalCount = CHARACTERS.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Character Collection</h2>
            <p className="text-gray-600">Unlock characters as you earn points and climb the academic ranks!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{unlockedCount}/{totalCount}</div>
            <div className="text-sm text-gray-600">Characters Unlocked</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4">
          <Badge variant="default" className="bg-blue-500 text-white">
            <Trophy className="h-3 w-3 mr-1" />
            Current: {currentCharacterData.name}
          </Badge>
          <Badge variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            {currentPoints.toLocaleString()} Points
          </Badge>
        </div>
      </div>


      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedCharacters.map((character) => {
          const pointsReq = character.unlockRequirements.find(req => req.type === 'points');
          const isUnlocked = pointsReq ? currentPoints >= pointsReq.value : true;
          const isCurrentCharacter = character.id === currentCharacterData.id;
          
          return (
            <CharacterCard
              key={character.id}
              character={character}
              currentPoints={currentPoints}
              isUnlocked={isUnlocked}
              isCurrentCharacter={isCurrentCharacter}
              onClick={() => {
                // Could add character preview modal here
                console.log('Selected character:', character.name);
              }}
            />
          );
        })}
      </div>

      {/* Character Progress */}
      {currentCharacterData && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Current Character</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentCharacterData.image}
                  alt={currentCharacterData.name}
                  className="w-12 h-12 object-contain rounded-lg border-2 border-gray-300"
                />
                <div>
                  <div className="font-semibold text-gray-900">{currentCharacterData.name}</div>
                  <div className="text-sm text-gray-600">{currentCharacterData.rarity} • {currentCharacterData.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{currentPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-600">total points</div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {currentCharacterData.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
