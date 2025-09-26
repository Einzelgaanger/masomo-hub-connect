import { Character, CharacterRarity, CharacterTier, CharacterCategory } from '@/types/gamification';

export const CHARACTERS: Character[] = [
  // LEGENDARY TIER - Mythic Rarity
  {
    id: 'thanos',
    name: 'Thanos',
    image: '/characters/thanos.png',
    rarity: 'mythic',
    tier: 'diamond',
    unlockRequirements: [
      { type: 'level', value: 50, description: 'Reach level 50' },
      { type: 'achievement', value: 10, description: 'Unlock 10 legendary achievements' },
      { type: 'points', value: 10000, description: 'Earn 10,000 total points' }
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
  },

  // LEGENDARY TIER - Legendary Rarity
  {
    id: 'dr-strange',
    name: 'Dr. Strange',
    image: '/characters/dr strange.png',
    rarity: 'legendary',
    tier: 'platinum',
    unlockRequirements: [
      { type: 'level', value: 40, description: 'Reach level 40' },
      { type: 'achievement', value: 5, description: 'Unlock 5 mystical achievements' },
      { type: 'points', value: 7500, description: 'Earn 7,500 total points' }
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

  {
    id: 'thor',
    name: 'Thor',
    image: '/characters/thor.png',
    rarity: 'legendary',
    tier: 'platinum',
    unlockRequirements: [
      { type: 'level', value: 40, description: 'Reach level 40' },
      { type: 'achievement', value: 5, description: 'Unlock 5 leadership achievements' },
      { type: 'points', value: 7500, description: 'Earn 7,500 total points' }
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

  // EPIC TIER - Epic Rarity
  {
    id: 'ironman',
    name: 'Iron Man',
    image: '/characters/Ironman.png',
    rarity: 'epic',
    tier: 'gold',
    unlockRequirements: [
      { type: 'level', value: 30, description: 'Reach level 30' },
      { type: 'achievement', value: 3, description: 'Unlock 3 innovation achievements' },
      { type: 'points', value: 5000, description: 'Earn 5,000 total points' }
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
    id: 'deadpool',
    name: 'Deadpool',
    image: '/characters/deadpool.png',
    rarity: 'epic',
    tier: 'gold',
    unlockRequirements: [
      { type: 'level', value: 30, description: 'Reach level 30' },
      { type: 'achievement', value: 3, description: 'Unlock 3 humor achievements' },
      { type: 'points', value: 5000, description: 'Earn 5,000 total points' }
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
    id: 'saitama',
    name: 'Saitama',
    image: '/characters/saitama.png',
    rarity: 'epic',
    tier: 'gold',
    unlockRequirements: [
      { type: 'level', value: 30, description: 'Reach level 30' },
      { type: 'achievement', value: 3, description: 'Unlock 3 determination achievements' },
      { type: 'points', value: 5000, description: 'Earn 5,000 total points' }
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

  // RARE TIER - Rare Rarity
  {
    id: 'achilles',
    name: 'Achilles',
    image: '/characters/achilles.png',
    rarity: 'rare',
    tier: 'silver',
    unlockRequirements: [
      { type: 'level', value: 20, description: 'Reach level 20' },
      { type: 'achievement', value: 2, description: 'Unlock 2 warrior achievements' },
      { type: 'points', value: 3000, description: 'Earn 3,000 total points' }
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
    id: 'leonardo',
    name: 'Leonardo',
    image: '/characters/leonardo.png',
    rarity: 'rare',
    tier: 'silver',
    unlockRequirements: [
      { type: 'level', value: 20, description: 'Reach level 20' },
      { type: 'achievement', value: 2, description: 'Unlock 2 leadership achievements' },
      { type: 'points', value: 3000, description: 'Earn 3,000 total points' }
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
    name: 'Guardian',
    image: '/characters/guardian.png',
    rarity: 'rare',
    tier: 'silver',
    unlockRequirements: [
      { type: 'level', value: 20, description: 'Reach level 20' },
      { type: 'achievement', value: 2, description: 'Unlock 2 protection achievements' },
      { type: 'points', value: 3000, description: 'Earn 3,000 total points' }
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
    name: 'Maverick',
    image: '/characters/Maverick.png',
    rarity: 'rare',
    tier: 'silver',
    unlockRequirements: [
      { type: 'level', value: 20, description: 'Reach level 20' },
      { type: 'achievement', value: 2, description: 'Unlock 2 independence achievements' },
      { type: 'points', value: 3000, description: 'Earn 3,000 total points' }
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

  // UNCOMMON TIER - Uncommon Rarity
  {
    id: 'assassin',
    name: 'Assassin',
    image: '/characters/assasin.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 stealth achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 courage achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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

  {
    id: 'elf',
    name: 'Elf',
    image: '/characters/elf.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 magic achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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
    id: 'pirate',
    name: 'Pirate',
    image: '/characters/pirate.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 adventure achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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
    id: 'swordsman',
    name: 'Swordsman',
    image: '/characters/swordsman.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 combat achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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
    id: 'paladin-knight',
    name: 'Paladin Knight',
    image: '/characters/paladin knight.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 virtue achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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
    name: 'Rocket Raccoon',
    image: '/characters/rocket raccoon.png',
    rarity: 'uncommon',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 10, description: 'Reach level 10' },
      { type: 'achievement', value: 1, description: 'Unlock 1 tech achievement' },
      { type: 'points', value: 1500, description: 'Earn 1,500 total points' }
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

  // COMMON TIER - Common Rarity
  {
    id: 'freshman',
    name: 'Freshman',
    image: '/characters/Freshman.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 60,
      creativity: 60,
      leadership: 50,
      teamwork: 70,
      determination: 70,
      charisma: 60
    },
    specialAbilities: ['Eager Learning', 'Fresh Perspective', 'Growth Potential'],
    description: 'New to the journey, full of potential and ready to learn.',
    category: 'academic'
  },

  {
    id: 'regular',
    name: 'Regular',
    image: '/characters/regular.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 65,
      creativity: 65,
      leadership: 60,
      teamwork: 75,
      determination: 70,
      charisma: 65
    },
    specialAbilities: ['Balanced Approach', 'Reliable Performance', 'Steady Progress'],
    description: 'The reliable choice, balanced in all aspects of learning.',
    category: 'academic'
  },

  {
    id: 'angel',
    name: 'Angel',
    image: '/characters/angel.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
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
    id: 'king',
    name: 'King',
    image: '/characters/king.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
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
    id: 'pinocchio',
    name: 'Pinocchio',
    image: '/characters/pinocchio.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 60,
      creativity: 80,
      leadership: 50,
      teamwork: 70,
      determination: 85,
      charisma: 75
    },
    specialAbilities: ['Honest Heart', 'Creative Spirit', 'Growth Mindset'],
    description: 'Young and curious, always seeking to grow and learn.',
    category: 'fantasy'
  },

  {
    id: 'zombie',
    name: 'Zombie',
    image: '/characters/zombie.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 50,
      creativity: 60,
      leadership: 40,
      teamwork: 60,
      determination: 90,
      charisma: 40
    },
    specialAbilities: ['Unstoppable Drive', 'Persistence', 'Undying Will'],
    description: 'Slow but steady, with an unbreakable determination to succeed.',
    category: 'neutral'
  },

  {
    id: 'halloween',
    name: 'Halloween',
    image: '/characters/halloween.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
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
    id: 'anonymous',
    name: 'Anonymous',
    image: '/characters/anonymous.png',
    rarity: 'common',
    tier: 'bronze',
    unlockRequirements: [
      { type: 'level', value: 1, description: 'Start your journey' },
      { type: 'points', value: 0, description: 'Available from the beginning' }
    ],
    baseStats: {
      intelligence: 70,
      creativity: 70,
      leadership: 55,
      teamwork: 75,
      determination: 75,
      charisma: 60
    },
    specialAbilities: ['Mysterious Presence', 'Hidden Potential', 'Quiet Strength'],
    description: 'Mysterious and enigmatic, with hidden depths and potential.',
    category: 'neutral'
  }
];

export const CHARACTER_TIERS = {
  bronze: { minLevel: 1, maxLevel: 10, color: '#CD7F32' },
  silver: { minLevel: 11, maxLevel: 25, color: '#C0C0C0' },
  gold: { minLevel: 26, maxLevel: 40, color: '#FFD700' },
  platinum: { minLevel: 41, maxLevel: 60, color: '#E5E4E2' },
  diamond: { minLevel: 61, maxLevel: 80, color: '#B9F2FF' },
  master: { minLevel: 81, maxLevel: 100, color: '#8A2BE2' }
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
