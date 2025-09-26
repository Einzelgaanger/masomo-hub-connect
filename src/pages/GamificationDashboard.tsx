import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Zap, 
  Crown, 
  Target, 
  Users, 
  Award,
  Flame,
  Gem,
  Shield,
  Sword,
  BookOpen,
  MessageSquare,
  Heart,
  Share2
} from 'lucide-react';
import { CharacterSelector } from '@/components/gamification/CharacterSelector';
import { CharacterCustomizer } from '@/components/gamification/CharacterCustomizer';
import { Leaderboard } from '@/components/gamification/Leaderboard';
import { CHARACTERS, RARITY_COLORS, CHARACTER_TIERS } from '@/data/characters';
import { POINTS_SYSTEM, ACHIEVEMENTS, STREAK_REWARDS } from '@/data/gamification';
import { Character, UserCharacter, Achievement, UserAchievement } from '@/types/gamification';

// Mock data - in real app, this would come from your backend
const MOCK_USER_DATA = {
  level: 15,
  totalPoints: 3500,
  currentStreak: 7,
  totalAchievements: 8,
  userCharacters: [
    {
      characterId: 'freshman',
      unlockedAt: new Date('2024-01-01'),
      currentLevel: 5,
      totalXP: 1200,
      equipped: true,
      customizations: []
    },
    {
      characterId: 'regular',
      unlockedAt: new Date('2024-01-15'),
      currentLevel: 3,
      totalXP: 800,
      equipped: false,
      customizations: []
    }
  ] as UserCharacter[],
  achievements: [
    {
      achievementId: 'first-post',
      unlockedAt: new Date('2024-01-01'),
      progress: 100,
      completed: true
    },
    {
      achievementId: 'helpful-peer',
      unlockedAt: new Date('2024-01-10'),
      progress: 100,
      completed: true
    }
  ] as UserAchievement[]
};

const MOCK_LEADERBOARD = [
  {
    userId: 'user1',
    username: 'AcademicPro',
    character: CHARACTERS.find(c => c.id === 'dr-strange')!,
    totalPoints: 15000,
    level: 45,
    rank: 1,
    achievements: 25,
    streak: 30
  },
  {
    userId: 'user2',
    username: 'CampusLeader',
    character: CHARACTERS.find(c => c.id === 'thor')!,
    totalPoints: 12000,
    level: 38,
    rank: 2,
    achievements: 20,
    streak: 25
  },
  {
    userId: 'user3',
    username: 'CreativeGenius',
    character: CHARACTERS.find(c => c.id === 'ironman')!,
    totalPoints: 10000,
    level: 35,
    rank: 3,
    achievements: 18,
    streak: 20
  }
];

export default function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [userData, setUserData] = useState(MOCK_USER_DATA);
  const [leaderboardData] = useState(MOCK_LEADERBOARD);

  const currentCharacter = userData.userCharacters.find(uc => uc.equipped);
  const currentCharacterData = currentCharacter ? CHARACTERS.find(c => c.id === currentCharacter.characterId) : null;

  const handleSelectCharacter = (characterId: string) => {
    setUserData(prev => ({
      ...prev,
      userCharacters: prev.userCharacters.map(uc => ({
        ...uc,
        equipped: uc.characterId === characterId
      }))
    }));
  };

  const handleUnlockCharacter = (characterId: string) => {
    const character = CHARACTERS.find(c => c.id === characterId);
    if (character) {
      const newUserCharacter: UserCharacter = {
        characterId,
        unlockedAt: new Date(),
        currentLevel: 1,
        totalXP: 0,
        equipped: false,
        customizations: []
      };
      setUserData(prev => ({
        ...prev,
        userCharacters: [...prev.userCharacters, newUserCharacter]
      }));
    }
  };

  const getLevelProgress = () => {
    const currentLevel = userData.level;
    const currentLevelXP = currentLevel * 100; // Simplified
    const nextLevelXP = (currentLevel + 1) * 100;
    const progress = ((currentLevelXP % 1000) / 1000) * 100;
    return Math.min(progress, 100);
  };

  const getNextLevelXP = () => {
    return (userData.level + 1) * 100 - (userData.level * 100);
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="h-4 w-4" />;
      case 'uncommon': return <Zap className="h-4 w-4" />;
      case 'rare': return <Gem className="h-4 w-4" />;
      case 'epic': return <Crown className="h-4 w-4" />;
      case 'legendary': return <Flame className="h-4 w-4" />;
      case 'mythic': return <Crown className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gamification Hub
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Level up your academic journey with characters, achievements, and friendly competition!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Level</p>
                  <p className="text-2xl font-bold">{userData.level}</p>
                </div>
                <Crown className="h-8 w-8 text-blue-200" />
              </div>
              <div className="mt-2">
                <Progress value={getLevelProgress()} className="h-2" />
                <p className="text-xs text-blue-100 mt-1">
                  {getNextLevelXP()} XP to next level
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Points</p>
                  <p className="text-2xl font-bold">{userData.totalPoints.toLocaleString()}</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Streak</p>
                  <p className="text-2xl font-bold">{userData.currentStreak} days</p>
                </div>
                <Zap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Achievements</p>
                  <p className="text-2xl font-bold">{userData.totalAchievements}</p>
                </div>
                <Award className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Character Display */}
        {currentCharacterData && (
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={currentCharacterData.image}
                    alt={currentCharacterData.name}
                    className="w-20 h-20 rounded-lg border-4 border-white/20"
                  />
                  <Badge
                    className={`absolute -top-2 -right-2 ${
                      RARITY_COLORS[currentCharacterData.rarity]
                    } text-white`}
                  >
                    {getRarityIcon(currentCharacterData.rarity)}
                  </Badge>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{currentCharacterData.name}</h2>
                  <p className="text-indigo-100 mb-3">{currentCharacterData.description}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>Intelligence: {currentCharacterData.baseStats.intelligence}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Crown className="h-4 w-4" />
                      <span>Leadership: {currentCharacterData.baseStats.leadership}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>Creativity: {currentCharacterData.baseStats.creativity}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedCharacter(currentCharacterData)}
                >
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userData.achievements.slice(0, 5).map(achievement => {
                      const achievementData = ACHIEVEMENTS.find(a => a.id === achievement.achievementId);
                      if (!achievementData) return null;
                      
                      return (
                        <div key={achievement.achievementId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">{achievementData.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium">{achievementData.name}</h4>
                            <p className="text-sm text-gray-600">{achievementData.description}</p>
                          </div>
                          <Badge className={RARITY_COLORS[achievementData.rarity]}>
                            +{achievementData.points} pts
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Posts Created</span>
                      <span className="font-semibold">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Comments Made</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Likes Received</span>
                      <span className="font-semibold">342</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Assignments Completed</span>
                      <span className="font-semibold">18</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peers Helped</span>
                      <span className="font-semibold">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="characters">
            <CharacterSelector
              userCharacters={userData.userCharacters}
              currentCharacter={currentCharacter}
              onSelectCharacter={handleSelectCharacter}
              onUnlockCharacter={handleUnlockCharacter}
              userLevel={userData.level}
              userPoints={userData.totalPoints}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ACHIEVEMENTS.map(achievement => {
                const userAchievement = userData.achievements.find(ua => ua.achievementId === achievement.id);
                const isUnlocked = !!userAchievement;
                const progress = userAchievement?.progress || 0;

                return (
                  <Card key={achievement.id} className={`${isUnlocked ? 'ring-2 ring-green-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{achievement.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={RARITY_COLORS[achievement.rarity]}>
                              {getRarityIcon(achievement.rarity)}
                            </Badge>
                            <span className="text-sm font-medium">+{achievement.points} pts</span>
                          </div>
                          {!isUnlocked && (
                            <div className="space-y-1">
                              <Progress value={progress} className="h-2" />
                              <p className="text-xs text-gray-500">{progress}% complete</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard
              entries={leaderboardData}
              currentUserId="current-user"
            />
          </TabsContent>
        </Tabs>

        {/* Character Customizer Modal */}
        {selectedCharacter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CharacterCustomizer
                character={selectedCharacter}
                currentCustomizations={currentCharacter?.customizations || []}
                onApplyCustomization={(customization) => {
                  // Handle customization application
                  console.log('Apply customization:', customization);
                }}
                onResetCustomizations={() => {
                  // Handle reset
                  console.log('Reset customizations');
                }}
              />
              <div className="p-4 border-t">
                <Button
                  onClick={() => setSelectedCharacter(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
