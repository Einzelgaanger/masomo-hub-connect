import React from 'react';
import { CHARACTERS, Character, getCharacterByPoints } from '../../types/characters';
import { CharacterCard } from './CharacterCard';
import { Trophy, Star } from 'lucide-react';
import { Badge } from './badge';

interface CharacterSelectorProps {
  currentPoints: number;
  currentCharacterId?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  currentPoints,
  currentCharacterId
}) => {
  const currentCharacter = getCharacterByPoints(currentPoints);
  const currentCharacterData = CHARACTERS.find(c => c.id === currentCharacterId) || currentCharacter;

  const sortedCharacters = CHARACTERS.sort((a, b) => a.rank - b.rank);

  const unlockedCount = CHARACTERS.filter(char => char.pointsRequired <= currentPoints).length;
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
          const isUnlocked = character.pointsRequired <= currentPoints;
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

      {/* Progress to Next Character */}
      {currentCharacterData && currentCharacterData.rank < CHARACTERS.length && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress to Next Character</h3>
          {(() => {
            const nextCharacter = CHARACTERS.find(c => c.rank === currentCharacterData.rank + 1);
            if (!nextCharacter) return null;
            
            const pointsNeeded = nextCharacter.pointsRequired - currentPoints;
            const progress = (currentPoints / nextCharacter.pointsRequired) * 100;
            
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={nextCharacter.image}
                      alt={nextCharacter.name}
                      className="w-12 h-12 object-contain rounded-lg border-2 border-gray-300 grayscale"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{nextCharacter.name}</div>
                      <div className="text-sm text-gray-600">{nextCharacter.category} • {nextCharacter.pointsRequired.toLocaleString()} points</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{pointsNeeded.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">points needed</div>
                  </div>
                </div>
                
                <div className="bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-600">
                  {nextCharacter.description}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
