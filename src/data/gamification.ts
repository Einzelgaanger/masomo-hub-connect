import { PointsSystem, Achievement, CharacterProgression, LevelBonus } from '@/types/gamification';

// Points System Configuration
export const POINTS_SYSTEM: PointsSystem = {
  activity: {
    post: 10,
    comment: 5,
    like: 1,
    share: 3,
    attendance: 15
  },
  academic: {
    assignment: 25,
    quiz: 15,
    exam: 50,
    project: 100,
    participation: 20
  },
  social: {
    helpPeer: 30,
    leadDiscussion: 40,
    organizeEvent: 75,
    mentor: 50
  },
  special: {
    firstPost: 100,
    perfectAttendance: 200,
    topPerformer: 150,
    streak: 10 // per day of streak
  }
};

// XP Requirements for each level
export const XP_REQUIREMENTS = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1350,
  8: 1750,
  9: 2200,
  10: 2700,
  11: 3250,
  12: 3850,
  13: 4500,
  14: 5200,
  15: 5950,
  16: 6750,
  17: 7600,
  18: 8500,
  19: 9450,
  20: 10450,
  21: 11500,
  22: 12600,
  23: 13750,
  24: 14950,
  25: 16200,
  26: 17500,
  27: 18850,
  28: 20250,
  29: 21700,
  30: 23200,
  31: 24750,
  32: 26350,
  33: 28000,
  34: 29700,
  35: 31450,
  36: 33250,
  37: 35100,
  38: 37000,
  39: 38950,
  40: 40950,
  41: 43000,
  42: 45100,
  43: 47250,
  44: 49450,
  45: 51700,
  46: 54000,
  47: 56350,
  48: 58750,
  49: 61200,
  50: 63700,
  51: 66250,
  52: 68850,
  53: 71500,
  54: 74200,
  55: 76950,
  56: 79750,
  57: 82600,
  58: 85500,
  59: 88450,
  60: 91450,
  61: 94500,
  62: 97600,
  63: 100750,
  64: 103950,
  65: 107200,
  66: 110500,
  67: 113850,
  68: 117250,
  69: 120700,
  70: 124200,
  71: 127750,
  72: 131350,
  73: 135000,
  74: 138700,
  75: 142450,
  76: 146250,
  77: 150100,
  78: 154000,
  79: 157950,
  80: 161950,
  81: 166000,
  82: 170100,
  83: 174250,
  84: 178450,
  85: 182700,
  86: 187000,
  87: 191350,
  88: 195750,
  89: 200200,
  90: 204700,
  91: 209250,
  92: 213850,
  93: 218500,
  94: 223200,
  95: 227950,
  96: 232750,
  97: 237600,
  98: 242500,
  99: 247450,
  100: 252450
};

// Level Bonuses
export const LEVEL_BONUSES: LevelBonus[] = [
  { level: 5, statBonus: { intelligence: 5, creativity: 5 }, unlockable: ['Custom Avatar Frame'], title: 'Rising Star' },
  { level: 10, statBonus: { leadership: 10, charisma: 10 }, unlockable: ['First Character Unlock'], title: 'Emerging Leader' },
  { level: 15, statBonus: { teamwork: 10, determination: 10 }, unlockable: ['Team Badge'], title: 'Team Player' },
  { level: 20, statBonus: { intelligence: 10, creativity: 10 }, unlockable: ['Rare Character Access'], title: 'Knowledge Seeker' },
  { level: 25, statBonus: { leadership: 15, charisma: 15 }, unlockable: ['Epic Character Access'], title: 'Natural Leader' },
  { level: 30, statBonus: { all: 10 }, unlockable: ['Legendary Character Access'], title: 'Master Student' },
  { level: 40, statBonus: { all: 15 }, unlockable: ['Mythic Character Access'], title: 'Academic Legend' },
  { level: 50, statBonus: { all: 20 }, unlockable: ['Ultimate Customization'], title: 'Campus Icon' },
  { level: 75, statBonus: { all: 25 }, unlockable: ['Exclusive Titles'], title: 'University Legend' },
  { level: 100, statBonus: { all: 30 }, unlockable: ['Hall of Fame'], title: 'Academic Deity' }
];

// Achievement System
export const ACHIEVEMENTS: Achievement[] = [
  // Academic Achievements
  {
    id: 'first-post',
    name: 'First Steps',
    description: 'Make your first post in the community',
    icon: '📝',
    category: 'academic',
    rarity: 'common',
    points: 100,
    xpReward: 50,
    requirements: [{ type: 'posts', value: 1, timeframe: 'all-time' }]
  },
  {
    id: 'perfect-attendance',
    name: 'Perfect Attendance',
    description: 'Attend all classes for a full week',
    icon: '🎯',
    category: 'academic',
    rarity: 'rare',
    points: 500,
    xpReward: 250,
    requirements: [{ type: 'attendance', value: 5, timeframe: 'weekly' }]
  },
  {
    id: 'top-performer',
    name: 'Top Performer',
    description: 'Score highest in a class assignment',
    icon: '🏆',
    category: 'academic',
    rarity: 'epic',
    points: 1000,
    xpReward: 500,
    requirements: [{ type: 'assignments', value: 1, timeframe: 'monthly' }]
  },
  {
    id: 'knowledge-master',
    name: 'Knowledge Master',
    description: 'Complete 50 assignments with perfect scores',
    icon: '🧠',
    category: 'academic',
    rarity: 'legendary',
    points: 2500,
    xpReward: 1000,
    characterUnlock: 'dr-strange',
    requirements: [{ type: 'assignments', value: 50, timeframe: 'all-time' }]
  },

  // Social Achievements
  {
    id: 'helpful-peer',
    name: 'Helpful Peer',
    description: 'Help 10 fellow students with their questions',
    icon: '🤝',
    category: 'social',
    rarity: 'uncommon',
    points: 300,
    xpReward: 150,
    requirements: [{ type: 'helpPeer', value: 10, timeframe: 'all-time' }]
  },
  {
    id: 'discussion-leader',
    name: 'Discussion Leader',
    description: 'Lead 5 meaningful discussions',
    icon: '💬',
    category: 'social',
    rarity: 'rare',
    points: 750,
    xpReward: 375,
    requirements: [{ type: 'leadDiscussion', value: 5, timeframe: 'all-time' }]
  },
  {
    id: 'event-organizer',
    name: 'Event Organizer',
    description: 'Organize 3 successful events',
    icon: '🎉',
    category: 'social',
    rarity: 'epic',
    points: 1500,
    xpReward: 750,
    characterUnlock: 'maverick',
    requirements: [{ type: 'organizeEvent', value: 3, timeframe: 'all-time' }]
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Mentor 5 new students',
    icon: '👨‍🏫',
    category: 'social',
    rarity: 'legendary',
    points: 2000,
    xpReward: 1000,
    characterUnlock: 'guardian',
    requirements: [{ type: 'mentor', value: 5, timeframe: 'all-time' }]
  },

  // Creative Achievements
  {
    id: 'creative-genius',
    name: 'Creative Genius',
    description: 'Create 20 original posts with high engagement',
    icon: '🎨',
    category: 'creative',
    rarity: 'rare',
    points: 800,
    xpReward: 400,
    requirements: [{ type: 'posts', value: 20, timeframe: 'all-time' }]
  },
  {
    id: 'viral-content',
    name: 'Viral Content Creator',
    description: 'Create a post with 100+ likes',
    icon: '🔥',
    category: 'creative',
    rarity: 'epic',
    points: 1200,
    xpReward: 600,
    characterUnlock: 'deadpool',
    requirements: [{ type: 'likes', value: 100, timeframe: 'all-time' }]
  },

  // Leadership Achievements
  {
    id: 'natural-leader',
    name: 'Natural Leader',
    description: 'Lead 10 group activities or discussions',
    icon: '👑',
    category: 'leadership',
    rarity: 'epic',
    points: 1500,
    xpReward: 750,
    characterUnlock: 'thor',
    requirements: [{ type: 'leadDiscussion', value: 10, timeframe: 'all-time' }]
  },
  {
    id: 'campus-influencer',
    name: 'Campus Influencer',
    description: 'Reach 1000 total likes across all posts',
    icon: '⭐',
    category: 'leadership',
    rarity: 'legendary',
    points: 3000,
    xpReward: 1500,
    characterUnlock: 'ironman',
    requirements: [{ type: 'likes', value: 1000, timeframe: 'all-time' }]
  },

  // Participation Achievements
  {
    id: 'active-member',
    name: 'Active Member',
    description: 'Make 100 posts in the community',
    icon: '💪',
    category: 'participation',
    rarity: 'rare',
    points: 1000,
    xpReward: 500,
    requirements: [{ type: 'posts', value: 100, timeframe: 'all-time' }]
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 30-day activity streak',
    icon: '⚡',
    category: 'participation',
    rarity: 'epic',
    points: 2000,
    xpReward: 1000,
    characterUnlock: 'saitama',
    requirements: [{ type: 'streak', value: 30, timeframe: 'all-time' }]
  },

  // Special Achievements
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Be among the first 100 users to join',
    icon: '🐦',
    category: 'special',
    rarity: 'legendary',
    points: 5000,
    xpReward: 2500,
    characterUnlock: 'thanos',
    requirements: [{ type: 'points', value: 0, timeframe: 'all-time' }]
  },
  {
    id: 'perfect-student',
    name: 'Perfect Student',
    description: 'Maintain perfect attendance for an entire semester',
    icon: '✨',
    category: 'special',
    rarity: 'mythic',
    points: 10000,
    xpReward: 5000,
    characterUnlock: 'thanos',
    requirements: [{ type: 'attendance', value: 60, timeframe: 'monthly' }]
  }
];

// Character-specific achievements
export const CHARACTER_ACHIEVEMENTS: Record<string, Achievement[]> = {
  'thanos': [
    {
      id: 'thanos-snap',
      name: 'The Snap',
      description: 'Achieve perfect scores in 10 consecutive assignments',
      icon: '👆',
      category: 'special',
      rarity: 'mythic',
      points: 5000,
      xpReward: 2500,
      requirements: [{ type: 'assignments', value: 10, timeframe: 'monthly' }]
    }
  ],
  'dr-strange': [
    {
      id: 'mystic-master',
      name: 'Mystic Master',
      description: 'Unlock all magical character abilities',
      icon: '🔮',
      category: 'special',
      rarity: 'legendary',
      points: 3000,
      xpReward: 1500,
      requirements: [{ type: 'achievement', value: 5, timeframe: 'all-time' }]
    }
  ],
  'ironman': [
    {
      id: 'genius-billionaire',
      name: 'Genius Billionaire',
      description: 'Create 50 innovative posts or projects',
      icon: '💰',
      category: 'creative',
      rarity: 'epic',
      points: 2000,
      xpReward: 1000,
      requirements: [{ type: 'posts', value: 50, timeframe: 'all-time' }]
    }
  ]
};

// Daily/Weekly/Monthly challenges
export const CHALLENGES = {
  daily: [
    {
      id: 'daily-participant',
      name: 'Daily Participant',
      description: 'Make at least 3 posts today',
      reward: { points: 50, xp: 25 },
      requirements: [{ type: 'posts', value: 3, timeframe: 'daily' }]
    },
    {
      id: 'helpful-today',
      name: 'Helpful Today',
      description: 'Help 2 fellow students today',
      reward: { points: 100, xp: 50 },
      requirements: [{ type: 'helpPeer', value: 2, timeframe: 'daily' }]
    }
  ],
  weekly: [
    {
      id: 'weekly-contributor',
      name: 'Weekly Contributor',
      description: 'Make 20 posts this week',
      reward: { points: 500, xp: 250 },
      requirements: [{ type: 'posts', value: 20, timeframe: 'weekly' }]
    },
    {
      id: 'social-butterfly',
      name: 'Social Butterfly',
      description: 'Engage with 50 posts this week',
      reward: { points: 300, xp: 150 },
      requirements: [{ type: 'likes', value: 50, timeframe: 'weekly' }]
    }
  ],
  monthly: [
    {
      id: 'monthly-champion',
      name: 'Monthly Champion',
      description: 'Earn 5000 points this month',
      reward: { points: 1000, xp: 500, characterUnlock: 'random-rare' },
      requirements: [{ type: 'points', value: 5000, timeframe: 'monthly' }]
    }
  ]
};

// Streak rewards
export const STREAK_REWARDS = {
  3: { points: 100, xp: 50, title: 'Getting Started' },
  7: { points: 300, xp: 150, title: 'Week Warrior' },
  14: { points: 700, xp: 350, title: 'Two Week Titan' },
  30: { points: 2000, xp: 1000, title: 'Monthly Master', characterUnlock: 'random-epic' },
  60: { points: 5000, xp: 2500, title: 'Two Month Legend', characterUnlock: 'random-legendary' },
  100: { points: 10000, xp: 5000, title: 'Century Scholar', characterUnlock: 'thanos' }
};

// Character unlock requirements by activity
export const CHARACTER_UNLOCK_ACTIVITIES = {
  'achilles': { type: 'achievement', value: 'warrior-spirit', description: 'Complete 10 combat-related achievements' },
  'leonardo': { type: 'leadership', value: 5, description: 'Lead 5 group discussions' },
  'guardian': { type: 'helpPeer', value: 20, description: 'Help 20 fellow students' },
  'maverick': { type: 'creativity', value: 15, description: 'Create 15 original posts' },
  'assassin': { type: 'stealth', value: 10, description: 'Complete 10 stealth achievements' },
  'dare-devil': { type: 'courage', value: 5, description: 'Complete 5 courage achievements' },
  'elf': { type: 'magic', value: 8, description: 'Complete 8 magical achievements' },
  'pirate': { type: 'adventure', value: 12, description: 'Complete 12 adventure achievements' },
  'swordsman': { type: 'discipline', value: 7, description: 'Complete 7 discipline achievements' },
  'paladin-knight': { type: 'virtue', value: 6, description: 'Complete 6 virtue achievements' },
  'rocket-raccoon': { type: 'tech', value: 10, description: 'Complete 10 technology achievements' }
};
