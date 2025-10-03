import { CHARACTERS } from '@/data/characters';

// Simple cache to prevent excessive character lookups
const characterCache = new Map();

// Clear cache function for development
export const clearCharacterCache = () => {
  characterCache.clear();
};

// Helper function to get character by points using the same logic everywhere
export const getCharacterByPoints = (points: number) => {
  // Check cache first
  const cacheKey = `points_${points}`;
  if (characterCache.has(cacheKey)) {
    return characterCache.get(cacheKey);
  }
  
  // Sort characters by points required and find the highest one the user can unlock
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
  
  const result = availableCharacters[availableCharacters.length - 1] || CHARACTERS[0];
  
  // Cache the result
  characterCache.set(cacheKey, result);
  return result;
};

// Helper function to get character by ID (for database character_id)
export const getCharacterById = (characterId: string | number) => {
  // Check cache first
  const cacheKey = `id_${characterId}`;
  if (characterCache.has(cacheKey)) {
    return characterCache.get(cacheKey);
  }
  
  // Handle common character ID variations
  let searchId = characterId;
  if (characterId === 'guard') {
    searchId = 'guardian'; // Map 'guard' to 'guardian'
  }
  
  // Find character by ID or rank in the CHARACTERS array
  const character = CHARACTERS.find(char => 
    char.id === searchId || 
    char.rank === searchId ||
    char.id === characterId || 
    char.rank === characterId
  );
  
  const result = character || CHARACTERS.find(char => char.id === 'anonymous') || CHARACTERS[0];
  
  // Cache the result
  characterCache.set(cacheKey, result);
  return result;
};

// Helper function to get character image (unified approach)
export const getCharacterImage = (profile: any): string => {
  // If profile has character_id, use that first
  if (profile?.character_id) {
    const character = getCharacterById(profile.character_id);
    return character.image;
  }
  
  // Otherwise, calculate based on points
  const character = getCharacterByPoints(profile?.points || 0);
  return character.image;
};

// Helper function to get character name (unified approach)
export const getCharacterName = (profile: any): string => {
  // If profile has character_id, use that first
  if (profile?.character_id) {
    const character = getCharacterById(profile.character_id);
    return character.name;
  }
  
  // Otherwise, calculate based on points
  const character = getCharacterByPoints(profile?.points || 0);
  return character.name;
};

// Helper function to get character object (unified approach)
export const getCharacter = (profile: any) => {
  // If profile has character_id, use that first
  if (profile?.character_id) {
    return getCharacterById(profile.character_id);
  }
  
  // Otherwise, calculate based on points
  return getCharacterByPoints(profile?.points || 0);
};
