// Gamification System Types

export interface Character {
  id: string;
  name: string;
  image: string;
  rarity: CharacterRarity;
  tier: CharacterTier;
  unlockRequirements: UnlockRequirement[];
  baseStats: CharacterStats;
  specialAbilities: string[];
  description: string;
  category: CharacterCategory;
}

export type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type CharacterTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export type CharacterCategory = 'hero' | 'villain' | 'neutral' | 'mystical' | 'sci-fi' | 'fantasy' | 'academic';

export interface CharacterStats {
  intelligence: number;
  creativity: number;
  leadership: number;
  teamwork: number;
  determination: number;
  charisma: number;
}

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'points' | 'activity' | 'streak';
  value: number;
  description: string;
}

export interface UserCharacter {
  characterId: string;
  unlockedAt: Date;
  currentLevel: number;
  totalXP: number;
  equipped: boolean;
  customizations: CharacterCustomization[];
}

export interface CharacterCustomization {
  type: 'color' | 'accessory' | 'background' | 'effect';
  value: string;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: CharacterRarity;
  points: number;
  xpReward: number;
  characterUnlock?: string;
  requirements: AchievementRequirement[];
}

export type AchievementCategory = 'academic' | 'social' | 'creative' | 'leadership' | 'participation' | 'special';

export interface AchievementRequirement {
  type: 'posts' | 'comments' | 'likes' | 'attendance' | 'assignments' | 'events' | 'streak' | 'points';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  completed: boolean;
}

export interface PointsSystem {
  activity: {
    post: number;
    comment: number;
    like: number;
    share: number;
    attendance: number;
  };
  academic: {
    assignment: number;
    quiz: number;
    exam: number;
    project: number;
    participation: number;
  };
  social: {
    helpPeer: number;
    leadDiscussion: number;
    organizeEvent: number;
    mentor: number;
  };
  special: {
    firstPost: number;
    perfectAttendance: number;
    topPerformer: number;
    streak: number;
  };
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  character: Character;
  totalPoints: number;
  level: number;
  rank: number;
  achievements: number;
  streak: number;
}

export interface CharacterProgression {
  characterId: string;
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  levelBonuses: LevelBonus[];
}

export interface LevelBonus {
  level: number;
  statBonus: Partial<CharacterStats>;
  unlockable: string[];
  title: string;
}
