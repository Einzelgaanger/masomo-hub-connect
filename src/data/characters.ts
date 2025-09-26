import { Character, CharacterRarity, CharacterTier, CharacterCategory } from '@/types/gamification';

export const CHARACTERS: Character[] = [
  // TIER 1 - STARTERS (Rank 1-5) - Common Rarity
  {
    id: 'freshman',
    name: 'Freshman',
    image: '/characters/Freshman.png',
    rarity: 'common',
    tier: 'bronze',
    rank: 1,
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 50,
      creativity: 45,
      leadership: 40,
      teamwork: 60,
      determination: 70,
      charisma: 55
    },
    specialAbilities: ['Eager Learning', 'Fresh Perspective', 'Growth Potential'],
    description: 'New to the academic journey, full of potential and ready to learn.',
    category: 'academic'
  },

  {
    id: 'regular',
    name: 'Regular Student',
    image: '/characters/regular.png',
    rarity: 'common',
    tier: 'bronze',
    rank: 2,
    unlockRequirements: [
      { type: 'level', value: 2, description: 'Reach level 2' },
      { type: 'points', value: 100, description: 'Earn 100 points' }
    ],
    baseStats: {
      intelligence: 55,
      creativity: 50,
      leadership: 45,
      teamwork: 70,
      determination: 65,
      charisma: 60
    },
    specialAbilities: ['Balanced Approach', 'Reliable Performance', 'Steady Progress'],
    description: 'The reliable choice, balanced in all aspects of learning.',
    category: 'academic'
  },

  {
    id: 'pinocchio',
    name: 'Pinocchio',
    image: '/characters/pinocchio.png',
    rarity: 'common',
    tier: 'bronze',
    rank: 3,
    unlockRequirements: [
      { type: 'level', value: 3, description: 'Reach level 3' },
      { type: 'points', value: 250, description: 'Earn 250 points' }
    ],
    baseStats: {
      intelligence: 60,
      creativity: 70,
      leadership: 40,
      teamwork: 65,
      determination: 80,
      charisma: 70
    },
    specialAbilities: ['Honest Heart', 'Creative Spirit', 'Growth Mindset'],
    description: 'Young and curious, always seeking to grow and learn truthfully.',
    category: 'fantasy'
  },

  {
    id: 'zombie',
    name: 'Zombie Scholar',
    image: '/characters/zombie.png',
    rarity: 'common',
    tier: 'bronze',
    rank: 4,
    unlockRequirements: [
      { type: 'level', value: 4, description: 'Reach level 4' },
      { type: 'points', value: 500, description: 'Earn 500 points' }
    ],
    baseStats: {
      intelligence: 45,
      creativity: 50,
      leadership: 35,
      teamwork: 55,
      determination: 95,
      charisma: 40
    },
    specialAbilities: ['Unstoppable Drive', 'Persistence', 'Undying Will'],
    description: 'Slow but steady, with an unbreakable determination to succeed.',
    category: 'neutral'
  },

  {
    id: 'anonymous',
    name: 'Anonymous',
    image: '/characters/anonymous.png',
    rarity: 'common',
    tier: 'bronze',
    rank: 5,
    unlockRequirements: [
      { type: 'level', value: 5, description: 'Reach level 5' },
      { type: 'points', value: 750, description: 'Earn 750 points' }
    ],
    baseStats: {
      intelligence: 65,
      creativity: 60,
      leadership: 50,
      teamwork: 70,
      determination: 75,
      charisma: 55
    },
    specialAbilities: ['Mysterious Presence', 'Hidden Potential', 'Quiet Strength'],
    description: 'Mysterious and enigmatic, with hidden depths and potential.',
    category: 'neutral'
  },

  // TIER 2 - RISING STARS (Rank 6-10) - Uncommon Rarity
  {
    id: 'angel',
    name: 'Guardian Angel',
    image: '/characters/angel.png',
    rarity: 'uncommon',
    tier: 'bronze',
    rank: 6,
    unlockRequirements: [
      { type: 'level', value: 6, description: 'Reach level 6' },
      { type: 'points', value: 1000, description: 'Earn 1,000 points' },
      { type: 'activity', value: 5, description: 'Help 5 fellow students' }
    ],
    baseStats: {
      intelligence: 70,
      creativity: 75,
      leadership: 80,
      teamwork: 90,
      determination: 75,
      charisma: 85
    },
    specialAbilities: ['Divine Guidance', 'Healing Touch', 'Pure Heart'],
    description: 'Pure of heart with a natural inclination to help others.',
    category: 'mystical'
  },

  {
    id: 'halloween',
    name: 'Halloween Spirit',
    image: '/characters/halloween.png',
    rarity: 'uncommon',
    tier: 'bronze',
    rank: 7,
    unlockRequirements: [
      { type: 'level', value: 7, description: 'Reach level 7' },
      { type: 'points', value: 1250, description: 'Earn 1,250 points' },
      { type: 'activity', value: 10, description: 'Create 10 creative posts' }
    ],
    baseStats: {
      intelligence: 65,
      creativity: 85,
      leadership: 60,
      teamwork: 70,
      determination: 70,
      charisma: 80
    },
    specialAbilities: ['Creative Flair', 'Festive Spirit', 'Imaginative Mind'],
    description: 'Full of creative spirit and imaginative flair.',
    category: 'neutral'
  },

  {
    id: 'king',
    name: 'Academic King',
    image: '/characters/king.png',
    rarity: 'uncommon',
    tier: 'bronze',
    rank: 8,
    unlockRequirements: [
      { type: 'level', value: 8, description: 'Reach level 8' },
      { type: 'points', value: 1500, description: 'Earn 1,500 points' },
      { type: 'activity', value: 3, description: 'Lead 3 discussions' }
    ],
    baseStats: {
      intelligence: 75,
      creativity: 70,
      leadership: 85,
      teamwork: 80,
      determination: 80,
      charisma: 90
    },
    specialAbilities: ['Royal Authority', 'Noble Bearing', 'Command Presence'],
    description: 'Natural leader with regal bearing and commanding presence.',
    category: 'neutral'
  },

  {
    id: 'assassin',
    name: 'Silent Scholar',
    image: '/characters/assasin.png',
    rarity: 'uncommon',
    tier: 'bronze',
    rank: 9,
    unlockRequirements: [
      { type: 'level', value: 9, description: 'Reach level 9' },
      { type: 'points', value: 1750, description: 'Earn 1,750 points' },
      { type: 'activity', value: 15, description: 'Complete 15 assignments perfectly' }
    ],
    baseStats: {
      intelligence: 85,
      creativity: 75,
      leadership: 60,
      teamwork: 70,
      determination: 90,
      charisma: 70
    },
    specialAbilities: ['Stealth Mastery', 'Precision Strikes', 'Shadow Movement'],
    description: 'Silent and deadly, master of stealth and precision.',
    category: 'neutral'
  },

  {
    id: 'dare-devil',
    name: 'Dare Devil',
    image: '/characters/dare devil.png',
    rarity: 'uncommon',
    tier: 'bronze',
    rank: 10,
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'points', value: 2000, description: 'Earn 2,000 points' },
      { type: 'activity', value: 5, description: 'Take 5 academic risks' }
    ],
    baseStats: {
      intelligence: 80,
      creativity: 70,
      leadership: 75,
      teamwork: 80,
      determination: 95,
      charisma: 75
    },
    specialAbilities: ['Enhanced Senses', 'Fearless Combat', 'Justice Seeking'],
    description: 'Fearless hero who fights for justice despite overwhelming odds.',
    category: 'hero'
  },

  // TIER 3 - SKILLED WARRIORS (Rank 11-15) - Rare Rarity
  {
    id: 'elf',
    name: 'Wise Elf',
    image: '/characters/elf.png',
    rarity: 'rare',
    tier: 'silver',
    rank: 11,
    unlockRequirements: [
      { type: 'level', value: 12, description: 'Reach level 12' },
      { type: 'points', value: 2500, description: 'Earn 2,500 points' },
      { type: 'activity', value: 20, description: 'Research 20 topics deeply' }
    ],
    baseStats: {
      intelligence: 90,
      creativity: 95,
      leadership: 70,
      teamwork: 85,
      determination: 80,
      charisma: 85
    },
    specialAbilities: ['Nature Magic', 'Enhanced Agility', 'Ancient Wisdom'],
    description: 'Graceful and wise, connected to nature and ancient magic.',
    category: 'fantasy'
  },

  {
    id: 'swordsman',
    name: 'Blade Master',
    image: '/characters/swordsman.png',
    rarity: 'rare',
    tier: 'silver',
    rank: 12,
    unlockRequirements: [
      { type: 'level', value: 14, description: 'Reach level 14' },
      { type: 'points', value: 3000, description: 'Earn 3,000 points' },
      { type: 'activity', value: 10, description: 'Master 10 different subjects' }
    ],
    baseStats: {
      intelligence: 75,
      creativity: 70,
      leadership: 75,
      teamwork: 80,
      determination: 90,
      charisma: 75
    },
    specialAbilities: ['Blade Mastery', 'Combat Discipline', 'Honor Code'],
    description: 'Master of the blade with unwavering discipline and honor.',
    category: 'hero'
  },

  {
    id: 'pirate',
    name: 'Knowledge Pirate',
    image: '/characters/pirate.png',
    rarity: 'rare',
    tier: 'silver',
    rank: 13,
    unlockRequirements: [
      { type: 'level', value: 16, description: 'Reach level 16' },
      { type: 'points', value: 3500, description: 'Earn 3,500 points' },
      { type: 'activity', value: 25, description: 'Explore 25 new topics' }
    ],
    baseStats: {
      intelligence: 70,
      creativity: 80,
      leadership: 80,
      teamwork: 85,
      determination: 90,
      charisma: 90
    },
    specialAbilities: ['Sea Mastery', 'Adventure Spirit', 'Crew Leadership'],
    description: 'Bold adventurer of the seven seas with a thirst for exploration.',
    category: 'neutral'
  },

  {
    id: 'paladin-knight',
    name: 'Paladin Knight',
    image: '/characters/paladin knight.png',
    rarity: 'rare',
    tier: 'silver',
    rank: 14,
    unlockRequirements: [
      { type: 'level', value: 18, description: 'Reach level 18' },
      { type: 'points', value: 4000, description: 'Earn 4,000 points' },
      { type: 'activity', value: 15, description: 'Help 15 students in need' }
    ],
    baseStats: {
      intelligence: 80,
      creativity: 70,
      leadership: 90,
      teamwork: 95,
      determination: 95,
      charisma: 85
    },
    specialAbilities: ['Divine Protection', 'Righteous Fury', 'Holy Aura'],
    description: 'Noble warrior dedicated to justice and protecting the innocent.',
    category: 'hero'
  },

  {
    id: 'rocket-raccoon',
    name: 'Tech Genius',
    image: '/characters/rocket raccoon.png',
    rarity: 'rare',
    tier: 'silver',
    rank: 15,
    unlockRequirements: [
      { type: 'level', value: 20, description: 'Reach level 20' },
      { type: 'points', value: 4500, description: 'Earn 4,500 points' },
      { type: 'activity', value: 20, description: 'Build 20 innovative projects' }
    ],
    baseStats: {
      intelligence: 95,
      creativity: 90,
      leadership: 60,
      teamwork: 70,
      determination: 85,
      charisma: 80
    },
    specialAbilities: ['Tech Genius', 'Tactical Brilliance', 'Fierce Loyalty'],
    description: 'Genius engineer with a big attitude and bigger weapons.',
    category: 'sci-fi'
  },

  // TIER 4 - ELITE WARRIORS (Rank 16-20) - Epic Rarity
  {
    id: 'leonardo',
    name: 'Tactical Leader',
    image: '/characters/leonardo.png',
    rarity: 'epic',
    tier: 'gold',
    rank: 16,
    unlockRequirements: [
      { type: 'level', value: 22, description: 'Reach level 22' },
      { type: 'points', value: 5000, description: 'Earn 5,000 points' },
      { type: 'activity', value: 10, description: 'Lead 10 successful teams' }
    ],
    baseStats: {
      intelligence: 90,
      creativity: 85,
      leadership: 95,
      teamwork: 100,
      determination: 80,
      charisma: 85
    },
    specialAbilities: ['Tactical Genius', 'Team Leadership', 'Master Swordsman'],
    description: 'Leader of the Teenage Mutant Ninja Turtles with strategic brilliance.',
    category: 'hero'
  },

  {
    id: 'guardian',
    name: 'Divine Guardian',
    image: '/characters/guardian.png',
    rarity: 'epic',
    tier: 'gold',
    rank: 17,
    unlockRequirements: [
      { type: 'level', value: 24, description: 'Reach level 24' },
      { type: 'points', value: 6000, description: 'Earn 6,000 points' },
      { type: 'activity', value: 30, description: 'Protect 30 students' }
    ],
    baseStats: {
      intelligence: 80,
      creativity: 70,
      leadership: 85,
      teamwork: 95,
      determination: 90,
      charisma: 75
    },
    specialAbilities: ['Protective Aura', 'Shield Mastery', 'Defensive Tactics'],
    description: 'Noble protector dedicated to defending others and maintaining peace.',
    category: 'hero'
  },

  {
    id: 'maverick',
    name: 'Rebel Maverick',
    image: '/characters/Maverick.png',
    rarity: 'epic',
    tier: 'gold',
    rank: 18,
    unlockRequirements: [
      { type: 'level', value: 26, description: 'Reach level 26' },
      { type: 'points', value: 7000, description: 'Earn 7,000 points' },
      { type: 'activity', value: 20, description: 'Break 20 academic conventions' }
    ],
    baseStats: {
      intelligence: 85,
      creativity: 90,
      leadership: 70,
      teamwork: 60,
      determination: 95,
      charisma: 90
    },
    specialAbilities: ['Independent Spirit', 'Creative Freedom', 'Rebel Leadership'],
    description: 'Independent spirit who breaks conventions and charts their own path.',
    category: 'neutral'
  },

  {
    id: 'achilles',
    name: 'Invincible Warrior',
    image: '/characters/achilles.png',
    rarity: 'epic',
    tier: 'gold',
    rank: 19,
    unlockRequirements: [
      { type: 'level', value: 28, description: 'Reach level 28' },
      { type: 'points', value: 8000, description: 'Earn 8,000 points' },
      { type: 'activity', value: 25, description: 'Win 25 academic battles' }
    ],
    baseStats: {
      intelligence: 75,
      creativity: 70,
      leadership: 90,
      teamwork: 85,
      determination: 95,
      charisma: 85
    },
    specialAbilities: ['Invincible Warrior', 'Heroic Leadership', 'Legendary Courage'],
    description: 'Greatest warrior of Greek mythology with unmatched combat skills.',
    category: 'fantasy'
  },

  {
    id: 'saitama',
    name: 'One Punch Scholar',
    image: '/characters/saitama.png',
    rarity: 'epic',
    tier: 'gold',
    rank: 20,
    unlockRequirements: [
      { type: 'level', value: 30, description: 'Reach level 30' },
      { type: 'points', value: 9000, description: 'Earn 9,000 points' },
      { type: 'activity', value: 50, description: 'Complete 50 perfect assignments' }
    ],
    baseStats: {
      intelligence: 60,
      creativity: 50,
      leadership: 70,
      teamwork: 80,
      determination: 100,
      charisma: 70
    },
    specialAbilities: ['One Punch Power', 'Unlimited Potential', 'Simple Wisdom'],
    description: 'The One Punch Man with overwhelming power through simple training.',
    category: 'hero'
  },

  // TIER 5 - LEGENDARY HEROES (Rank 21-24) - Legendary Rarity
  {
    id: 'deadpool',
    name: 'Merc with a Mouth',
    image: '/characters/deadpool.png',
    rarity: 'legendary',
    tier: 'platinum',
    rank: 21,
    unlockRequirements: [
      { type: 'level', value: 35, description: 'Reach level 35' },
      { type: 'points', value: 10000, description: 'Earn 10,000 points' },
      { type: 'activity', value: 30, description: 'Make 30 hilarious posts' }
    ],
    baseStats: {
      intelligence: 80,
      creativity: 95,
      leadership: 60,
      teamwork: 70,
      determination: 100,
      charisma: 100
    },
    specialAbilities: ['Regeneration', 'Fourth Wall Breaking', 'Combat Mastery'],
    description: 'Merc with a mouth, known for humor and unbreakable spirit.',
    category: 'hero'
  },

  {
    id: 'thor',
    name: 'God of Thunder',
    image: '/characters/thor.png',
    rarity: 'legendary',
    tier: 'platinum',
    rank: 22,
    unlockRequirements: [
      { type: 'level', value: 40, description: 'Reach level 40' },
      { type: 'points', value: 12000, description: 'Earn 12,000 points' },
      { type: 'activity', value: 20, description: 'Lead 20 divine missions' }
    ],
    baseStats: {
      intelligence: 75,
      creativity: 70,
      leadership: 100,
      teamwork: 85,
      determination: 95,
      charisma: 90
    },
    specialAbilities: ['God of Thunder', 'Mjolnir Mastery', 'Asgardian Strength'],
    description: 'God of Thunder with divine power and noble leadership qualities.',
    category: 'mystical'
  },

  {
    id: 'ironman',
    name: 'Genius Billionaire',
    image: '/characters/Ironman.png',
    rarity: 'legendary',
    tier: 'platinum',
    rank: 23,
    unlockRequirements: [
      { type: 'level', value: 45, description: 'Reach level 45' },
      { type: 'points', value: 15000, description: 'Earn 15,000 points' },
      { type: 'activity', value: 25, description: 'Invent 25 breakthrough technologies' }
    ],
    baseStats: {
      intelligence: 100,
      creativity: 100,
      leadership: 80,
      teamwork: 60,
      determination: 85,
      charisma: 90
    },
    specialAbilities: ['Genius Inventor', 'Arc Reactor Technology', 'Advanced AI'],
    description: 'Genius billionaire with cutting-edge technology and innovation.',
    category: 'sci-fi'
  },

  {
    id: 'dr-strange',
    name: 'Master of Mystic Arts',
    image: '/characters/dr strange.png',
    rarity: 'legendary',
    tier: 'platinum',
    rank: 24,
    unlockRequirements: [
      { type: 'level', value: 50, description: 'Reach level 50' },
      { type: 'points', value: 18000, description: 'Earn 18,000 points' },
      { type: 'activity', value: 20, description: 'Master 20 mystical arts' }
    ],
    baseStats: {
      intelligence: 100,
      creativity: 95,
      leadership: 85,
      teamwork: 70,
      determination: 90,
      charisma: 80
    },
    specialAbilities: ['Mystic Arts Mastery', 'Time Manipulation', 'Dimensional Travel'],
    description: 'Master of the Mystic Arts with infinite knowledge and magical prowess.',
    category: 'mystical'
  },

  // TIER 6 - ULTIMATE POWER (Rank 25) - Mythic Rarity
  {
    id: 'thanos',
    name: 'The Mad Titan',
    image: '/characters/thanos.png',
    rarity: 'mythic',
    tier: 'diamond',
    rank: 25,
    unlockRequirements: [
      { type: 'level', value: 60, description: 'Reach level 60' },
      { type: 'points', value: 25000, description: 'Earn 25,000 points' },
      { type: 'activity', value: 50, description: 'Achieve 50 perfect scores' },
      { type: 'achievement', value: 10, description: 'Unlock 10 legendary achievements' }
    ],
    baseStats: {
      intelligence: 95,
      creativity: 80,
      leadership: 100,
      teamwork: 60,
      determination: 100,
      charisma: 85
    },
    specialAbilities: ['Reality Manipulation', 'Universal Knowledge', 'Infinite Power'],
    description: 'The Mad Titan with ultimate power and cosmic knowledge. Perfect for those who seek absolute dominance.',
    category: 'villain'
  }
];

export const CHARACTER_TIERS = {
  bronze: { minLevel: 1, maxLevel: 20, color: '#CD7F32' },
  silver: { minLevel: 21, maxLevel: 40, color: '#C0C0C0' },
  gold: { minLevel: 41, maxLevel: 60, color: '#FFD700' },
  platinum: { minLevel: 61, maxLevel: 80, color: '#E5E4E2' },
  diamond: { minLevel: 81, maxLevel: 100, color: '#B9F2FF' },
  master: { minLevel: 101, maxLevel: 120, color: '#8A2BE2' }
};

export const RARITY_COLORS = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  mythic: '#EF4444'
};

export const RARITY_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2.0,
  legendary: 2.5,
  mythic: 3.0
};

// Helper functions for character progression
export const getCharacterByRank = (rank: number): Character | undefined => {
  return CHARACTERS.find(char => char.rank === rank);
};

export const getNextCharacter = (currentCharacter: Character): Character | null => {
  const nextRank = currentCharacter.rank + 1;
  return getCharacterByRank(nextRank);
};

export const getPreviousCharacter = (currentCharacter: Character): Character | null => {
  const prevRank = currentCharacter.rank - 1;
  return getCharacterByRank(prevRank);
};

export const getCharactersByTier = (tier: CharacterTier): Character[] => {
  return CHARACTERS.filter(char => char.tier === tier);
};

export const getCharactersByRarity = (rarity: CharacterRarity): Character[] => {
  return CHARACTERS.filter(char => char.rarity === rarity);
};

export const getCharactersByCategory = (category: CharacterCategory): Character[] => {
  return CHARACTERS.filter(char => char.category === category);
};