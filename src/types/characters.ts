export interface Character {
  id: string;
  name: string;
  image: string;
  description: string;
  pointsRequired: number;
  rank: number;
  category: 'starter' | 'intermediate' | 'advanced' | 'legendary' | 'ultimate';
  specialTraits: string[];
}

export const CHARACTERS: Character[] = [
  // Starter characters (least cool)
  {
    id: 'people',
    name: 'Regular',
    image: '/characters/people.png',
    description: 'A regular student starting their academic journey. Everyone begins here!',
    pointsRequired: 0,
    rank: 1,
    category: 'starter',
    specialTraits: ['Beginner', 'Determined']
  },
  {
    id: 'pinocchio',
    name: 'Pinocchio',
    image: '/characters/pinocchio.png',
    description: 'The wooden puppet who dreams of becoming real. Perfect for students learning to be honest in their studies.',
    pointsRequired: 100,
    rank: 2,
    category: 'starter',
    specialTraits: ['Honest', 'Dreamer', 'Growing']
  },
  {
    id: 'guard',
    name: 'Guardian',
    image: '/characters/guard.png',
    description: 'A vigilant protector of knowledge. Students who help others and maintain academic integrity.',
    pointsRequired: 250,
    rank: 3,
    category: 'starter',
    specialTraits: ['Protective', 'Reliable', 'Helpful']
  },

  // Intermediate characters
  {
    id: 'elf',
    name: 'Elf',
    image: '/characters/elf.png',
    description: 'A mystical being with ancient wisdom. For students who excel in research and critical thinking.',
    pointsRequired: 500,
    rank: 4,
    category: 'intermediate',
    specialTraits: ['Wise', 'Ancient Knowledge', 'Mystical']
  },
  {
    id: 'leonardo',
    name: 'Leonardo',
    image: '/characters/leonardo.png',
    description: 'The Renaissance master of learning. For creative students who excel in multiple subjects.',
    pointsRequired: 850,
    rank: 5,
    category: 'intermediate',
    specialTraits: ['Renaissance', 'Creative', 'Multi-talented']
  },
  {
    id: 'swordsman',
    name: 'Swordsman',
    image: '/characters/swordsman.png',
    description: 'A warrior of knowledge, cutting through ignorance with sharp intellect.',
    pointsRequired: 1300,
    rank: 6,
    category: 'intermediate',
    specialTraits: ['Sharp Mind', 'Determined', 'Warrior Spirit']
  },

  // Advanced characters
  {
    id: 'pirate',
    name: 'Pirate',
    image: '/characters/pirate.png',
    description: 'Sailing the seas of academia, collecting treasures of knowledge and sharing them freely.',
    pointsRequired: 2000,
    rank: 7,
    category: 'advanced',
    specialTraits: ['Adventurous', 'Treasure Hunter', 'Free Spirit']
  },
  {
    id: 'superhero',
    name: 'Superhero',
    image: '/characters/superhero.png',
    description: 'Using the power of knowledge to help fellow students and make the world a better place.',
    pointsRequired: 3000,
    rank: 8,
    category: 'advanced',
    specialTraits: ['Heroic', 'Helpful', 'Inspiring']
  },
  {
    id: 'angel',
    name: 'Angel',
    image: '/characters/angel.png',
    description: 'A divine being who guides lost students and spreads wisdom throughout the academic realm.',
    pointsRequired: 4500,
    rank: 9,
    category: 'advanced',
    specialTraits: ['Divine', 'Guiding', 'Pure Heart']
  },

  // Legendary characters
  {
    id: 'assasin',
    name: 'Assassin',
    image: '/characters/assasin.png',
    description: 'A stealthy master of learning, silently acquiring knowledge and eliminating ignorance.',
    pointsRequired: 6500,
    rank: 10,
    category: 'legendary',
    specialTraits: ['Stealthy', 'Precise', 'Master of Secrets']
  },
  {
    id: 'zombie',
    name: 'Zombie',
    image: '/characters/zombie.png',
    description: 'A relentless pursuer of knowledge, never stopping in the quest for academic excellence.',
    pointsRequired: 9000,
    rank: 11,
    category: 'legendary',
    specialTraits: ['Relentless', 'Unstoppable', 'Undying Dedication']
  },
  {
    id: 'halloween',
    name: 'Ghost',
    image: '/characters/halloween.png',
    description: 'A shadowy figure who emerges during the most challenging academic periods, mastering the dark arts of learning.',
    pointsRequired: 15000,
    rank: 12,
    category: 'legendary',
    specialTraits: ['Mysterious', 'Dark Arts', 'Shadow Master']
  },

  // Ultimate character (most cool)
  {
    id: 'anonymous',
    name: 'Anonymous',
    image: '/characters/anonymous.png',
    description: 'The ultimate enigma. A legendary figure whose true identity remains unknown, but whose impact on the academic world is undeniable.',
    pointsRequired: 25000,
    rank: 13,
    category: 'ultimate',
    specialTraits: ['Legendary', 'Mysterious', 'Ultimate Power', 'Unknown Identity']
  }
];

export const getCharacterById = (id: string): Character | undefined => {
  return CHARACTERS.find(char => char.id === id);
};

export const getCharacterByPoints = (points: number): Character => {
  // Return the highest character the user can achieve with their points
  const availableCharacters = CHARACTERS.filter(char => char.pointsRequired <= points);
  return availableCharacters[availableCharacters.length - 1] || CHARACTERS[0];
};

export const getNextCharacter = (currentCharacter: Character): Character | null => {
  const currentIndex = CHARACTERS.findIndex(char => char.id === currentCharacter.id);
  if (currentIndex >= CHARACTERS.length - 1) return null;
  return CHARACTERS[currentIndex + 1];
};

export const getPointsToNextCharacter = (currentPoints: number): { character: Character | null; pointsNeeded: number } => {
  const currentCharacter = getCharacterByPoints(currentPoints);
  const nextCharacter = getNextCharacter(currentCharacter);
  
  if (!nextCharacter) {
    return { character: null, pointsNeeded: 0 };
  }
  
  return {
    character: nextCharacter,
    pointsNeeded: nextCharacter.pointsRequired - currentPoints
  };
};
