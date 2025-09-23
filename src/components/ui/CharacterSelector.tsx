import React, { useState } from 'react';
import { CHARACTERS, Character, getCharacterByPoints } from '../../types/characters';
import { CharacterCard } from './CharacterCard';
import { Button } from './button';
import { Input } from './input';
import { Search, Filter, Trophy, Star } from 'lucide-react';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface CharacterSelectorProps {
  currentPoints: number;
  currentCharacterId?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  currentPoints,
  currentCharacterId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'points' | 'name'>('rank');

  const currentCharacter = getCharacterByPoints(currentPoints);
  const currentCharacterData = CHARACTERS.find(c => c.id === currentCharacterId) || currentCharacter;

  const filteredCharacters = CHARACTERS
    .filter(character => {
      const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           character.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || character.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return a.rank - b.rank;
        case 'points':
          return a.pointsRequired - b.pointsRequired;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return a.rank - b.rank;
      }
    });

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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search characters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
            <SelectItem value="ultimate">Ultimate</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: 'rank' | 'points' | 'name') => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rank">Rank</SelectItem>
            <SelectItem value="points">Points Required</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCharacters.map((character) => {
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

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No characters found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

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
