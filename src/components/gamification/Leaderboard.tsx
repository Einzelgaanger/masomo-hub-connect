import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Crown, Star, Zap, Gem, Flame } from 'lucide-react';
import { LeaderboardEntry, Character } from '@/types/gamification';
import { RARITY_COLORS, CHARACTER_TIERS } from '@/data/characters';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onCharacterClick?: (character: Character) => void;
}

const RANK_ICONS = {
  1: <Trophy className="h-5 w-5 text-yellow-500" />,
  2: <Medal className="h-5 w-5 text-gray-400" />,
  3: <Award className="h-5 w-5 text-amber-600" />
};

const RARITY_ICONS = {
  common: <Star className="h-4 w-4" />,
  uncommon: <Zap className="h-4 w-4" />,
  rare: <Gem className="h-4 w-4" />,
  epic: <Crown className="h-4 w-4" />,
  legendary: <Flame className="h-4 w-4" />,
  mythic: <Crown className="h-4 w-4" />
};

export function Leaderboard({ entries, currentUserId, onCharacterClick }: LeaderboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'academic' | 'social' | 'creative'>('overall');

  const filteredEntries = entries
    .filter(entry => {
      // Filter by timeframe (this would need actual data filtering)
      return true;
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-blue-500';
    if (rank <= 50) return 'text-green-500';
    return 'text-gray-500';
  };

  const getTierColor = (tier: string) => {
    return CHARACTER_TIERS[tier as keyof typeof CHARACTER_TIERS]?.color || '#gray';
  };

  const getLevelProgress = (level: number) => {
    // Calculate progress to next level
    const currentLevelXP = level * 100; // Simplified calculation
    const nextLevelXP = (level + 1) * 100;
    const progress = ((currentLevelXP % 1000) / 1000) * 100;
    return Math.min(progress, 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
            <TabsList>
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="creative">Creative</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredEntries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.userId === currentUserId;
            const levelProgress = getLevelProgress(entry.level);

            return (
              <Card
                key={entry.userId}
                className={`transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                  isCurrentUser ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => onCharacterClick?.(entry.character)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <div className={`text-2xl font-bold ${getRankColor(rank)}`}>
                        {rank <= 3 ? RANK_ICONS[rank as keyof typeof RANK_ICONS] : `#${rank}`}
                      </div>
                      {rank <= 3 && (
                        <div className="text-xs text-gray-500">
                          {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Third Place'}
                        </div>
                      )}
                    </div>

                    {/* Character Avatar */}
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={entry.character.image} alt={entry.character.name} />
                        <AvatarFallback>{entry.character.name[0]}</AvatarFallback>
                      </Avatar>
                      <Badge
                        className={`absolute -top-2 -right-2 ${
                          RARITY_COLORS[entry.character.rarity]
                        } text-white text-xs`}
                      >
                        {RARITY_ICONS[entry.character.rarity]}
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{entry.username}</h3>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{entry.character.name}</span>
                        <Badge
                          variant="outline"
                          style={{ 
                            borderColor: getTierColor(entry.character.tier),
                            color: getTierColor(entry.character.tier)
                          }}
                        >
                          {entry.character.tier}
                        </Badge>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{entry.totalPoints.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">pts</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          <span>Lv.{entry.level}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>{entry.achievements}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>{entry.streak}d</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Level Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Level {entry.level}</span>
                      <span>Level {entry.level + 1}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current User Highlight */}
        {currentUserId && !filteredEntries.some(entry => entry.userId === currentUserId) && (
          <Card className="mt-4 border-dashed">
            <CardContent className="p-4 text-center text-gray-500">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>You're not on the leaderboard yet. Keep participating to climb the ranks!</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
