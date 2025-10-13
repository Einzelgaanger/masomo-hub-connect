import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles, Users, BookOpen, MessageSquare, Calendar, Award, Shield, Zap, Heart, Star, Globe, GraduationCap, FileText, Clock, TrendingUp, CheckCircle, Send, Image, Video, Bell, BarChart3, Target, Crown, Trophy, Lightbulb, Share2, Download, Upload, Search, Filter, Plus, Eye, ThumbsUp, MessageCircle, UserPlus, Bookmark, Flag, HelpCircle, Phone, Mail, MapPin, ExternalLink, Briefcase } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { CHARACTERS } from "@/data/characters";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Animated Background Balls - 8 Different Sizes */}
        <div className="absolute inset-0">
          {/* Original 4 balls */}
          <div className="absolute top-20 left-10 w-24 h-24 bg-blue-400/25 rounded-full animate-float blur-sm"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-orange-400/25 rounded-full animate-float animation-delay-300 blur-sm"></div>
          <div className="absolute bottom-40 left-20 w-28 h-28 bg-green-400/25 rounded-full animate-float animation-delay-600 blur-sm"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-400/25 rounded-full animate-float animation-delay-900 blur-sm"></div>
          
          {/* 4 Additional balls with different sizes */}
          <div className="absolute top-60 left-1/4 w-12 h-12 bg-pink-400/25 rounded-full animate-float animation-delay-200 blur-sm"></div>
          <div className="absolute top-10 right-1/3 w-32 h-32 bg-cyan-400/25 rounded-full animate-float animation-delay-500 blur-sm"></div>
          <div className="absolute bottom-60 right-1/4 w-18 h-18 bg-yellow-400/25 rounded-full animate-float animation-delay-800 blur-sm"></div>
          <div className="absolute bottom-10 left-1/3 w-14 h-14 bg-red-400/25 rounded-full animate-float animation-delay-1100 blur-sm"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative flex-1 flex flex-col justify-center z-10">
          <div className="text-center mb-8 sm:mb-16">
            {/* Mobile: Custom Layout, Desktop: Logo Component */}
            <div className="block sm:hidden mb-6 animate-fade-in">
              <div className="flex items-start gap-2 mb-4">
                {/* Large Owl Icon filling top-left */}
                <div className="flex-shrink-0 -mt-4">
                  <img src="/logo.svg" alt="Bunifu Logo" className="h-40 w-40" />
                </div>
                
                {/* Name and Tagline to the right */}
                <div className="flex-1 min-w-0 text-left">
                  <h1 className="text-5xl font-bold fredoka-bold text-gray-900 leading-tight mb-1 text-left">Bunifu</h1>
                  <p className="text-xl fredoka-medium text-gray-600 leading-tight text-left">Where learning meets creativity</p>
                </div>
              </div>
            </div>
            
            {/* Desktop: Logo Component */}
            <div className="hidden sm:flex justify-center mb-6 sm:mb-8 animate-fade-in">
              <Logo size="xl" showText={true} className="scale-150 sm:scale-200" />
            </div>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto fredoka-medium animate-slide-up animation-delay-200 px-4">
              The complete university platform that transforms your academic journey with gamification, collaboration, and smart organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 animate-slide-up animation-delay-400 px-4">
              <Link to="/login?mode=signup">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg fredoka-semibold">
                  Start Learning <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-xs sm:max-w-2xl md:max-w-4xl mx-auto animate-slide-up animation-delay-600 px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 fredoka-bold">10K+</div>
                <div className="text-sm sm:text-base text-gray-600 fredoka-medium">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500 fredoka-bold">500+</div>
                <div className="text-sm sm:text-base text-gray-600 fredoka-medium">Universities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 fredoka-bold">50K+</div>
                <div className="text-sm sm:text-base text-gray-600 fredoka-medium">Resources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 fredoka-bold">99%</div>
                <div className="text-sm sm:text-base text-gray-600 fredoka-medium">Satisfaction</div>
              </div>
            </div>

            {/* Video Section */}
            <div className="mt-12 sm:mt-16 max-w-5xl mx-auto animate-slide-up animation-delay-800 px-4">
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 fredoka-bold text-gray-800">
                See Bunifu in Action
              </h3>
              
              {/* Video with Round Frame */}
              <div className="relative mx-auto max-w-4xl">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50 bg-gradient-to-br from-purple-100 to-pink-100 p-4">
                  <div className="relative rounded-2xl overflow-hidden">
                    <VideoPlayer
                      src="/video/BUNIFU WEBSITE VIDEO FINAL.mp4"
                      poster="/video/poster.jpg"
                      className="w-full h-64 sm:h-80 md:h-96 rounded-2xl"
                      autoPlay={true}
                      muted={false}
                      loop={true}
                      showControls={true}
                    />
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse animation-delay-500"></div>
                  <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-orange-400 rounded-full animate-pulse animation-delay-1000"></div>
                  <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse animation-delay-1500"></div>
                </div>
              </div>
              
              <p className="text-base sm:text-lg text-gray-600 text-center mt-6 fredoka-medium">
                Watch how Bunifu transforms your university experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 fredoka-bold px-4">
              Everything You Need for University Success
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto fredoka-medium px-4">
              A comprehensive platform that brings together all aspects of your academic life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {/* Masomo - Learning Management */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-100">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-blue-200 group-hover:shadow-blue-500/25 transition-all duration-500">
                    <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-blue-600 transition-colors duration-300">
                  Masomo - Smart Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Access your units, assignments, notes, and events. Track your academic progress with intelligent organization and reminders.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Ukumbi - University Chat */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-200">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-green-200 group-hover:shadow-green-500/25 transition-all duration-500">
                    <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-400 rounded-full animate-pulse animation-delay-300"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-green-600 transition-colors duration-300">
                  Ukumbi - University Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Connect with your university mates in real-time. Share images, discuss assignments, and build lasting academic relationships.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Inbox - Direct Messaging */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-300">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-purple-200 group-hover:shadow-purple-500/25 transition-all duration-500">
                    <Send className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-purple-400 rounded-full animate-pulse animation-delay-500"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-purple-600 transition-colors duration-300">
                  Inbox - Direct Messaging
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Private conversations with classmates and professors. Share files, images, and collaborate on projects seamlessly.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Gamification System */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-400">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-orange-200 group-hover:shadow-orange-500/25 transition-all duration-500">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-orange-400 rounded-full animate-pulse animation-delay-600"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-orange-600 transition-colors duration-300">
                  Gamification System
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Earn points, unlock unique characters, climb leaderboards, and turn your academic journey into an engaging adventure.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Alumni Network */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-500">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-indigo-200 group-hover:shadow-indigo-500/25 transition-all duration-500">
                    <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-indigo-400 rounded-full animate-pulse animation-delay-700"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-indigo-600 transition-colors duration-300">
                  Alumni Network
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Connect with graduates, read success stories, and get career guidance from those who've walked your path before.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Smart Dashboard */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-600">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-cyan-200 group-hover:shadow-cyan-500/25 transition-all duration-500">
                    <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-cyan-400 rounded-full animate-pulse animation-delay-800"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-cyan-600 transition-colors duration-300">
                  Smart Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Personalized insights, progress tracking, upcoming deadlines, and intelligent recommendations tailored to your academic journey.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Jobs & Career Opportunities */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-700">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-emerald-200 group-hover:shadow-emerald-500/25 transition-all duration-500">
                    <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-emerald-400 rounded-full animate-pulse animation-delay-900"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-emerald-600 transition-colors duration-300">
                  Jobs & Careers
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Discover internship opportunities, part-time jobs, and career guidance. Connect with employers and build your professional network.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Events & Activities */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 shadow-lg group animate-fade-in-up animation-delay-800">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-rose-200 group-hover:shadow-rose-500/25 transition-all duration-500">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-rose-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-rose-400 rounded-full animate-pulse animation-delay-1000"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-rose-600 transition-colors duration-300">
                  Events & Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Stay updated with university events, workshops, seminars, and social activities. Never miss important academic and networking opportunities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Character Showcase */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 fredoka-bold">
              Unlock Amazing Characters
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto fredoka-medium">
              Earn points and unlock unique characters as you progress through your academic journey
            </p>
          </div>

          {/* Character Tape Animation */}
          <div className="relative mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent via-transparent to-white z-10 pointer-events-none"></div>
            <div className="flex animate-character-tape">
              {/* First set of characters */}
              {CHARACTERS.map((character, index) => (
                <div key={`first-${character.id}`} className="flex-shrink-0 mx-4">
                  <div className="text-center group">
                    <div className="w-32 h-32 mx-auto mb-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-full shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 fredoka-semibold mb-1">{character.name}</h3>
                      <p className="text-xs text-gray-500 fredoka-medium">
                        Rank #{character.rank} • {character.unlockRequirements.find(req => req.type === 'points')?.value || 0} pts
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-2 ${
                          character.rarity === 'mythic' ? 'border-red-400 text-red-600' :
                          character.rarity === 'legendary' ? 'border-orange-400 text-orange-600' :
                          character.rarity === 'epic' ? 'border-purple-400 text-purple-600' :
                          character.rarity === 'rare' ? 'border-blue-400 text-blue-600' :
                          character.rarity === 'uncommon' ? 'border-green-400 text-green-600' :
                          'border-gray-400 text-gray-600'
                        }`}
                      >
                        {character.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {CHARACTERS.map((character, index) => (
                <div key={`second-${character.id}`} className="flex-shrink-0 mx-4">
                  <div className="text-center group">
                    <div className="w-32 h-32 mx-auto mb-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-full shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 fredoka-semibold mb-1">{character.name}</h3>
                      <p className="text-xs text-gray-500 fredoka-medium">
                        Rank #{character.rank} • {character.unlockRequirements.find(req => req.type === 'points')?.value || 0} pts
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-2 ${
                          character.rarity === 'mythic' ? 'border-red-400 text-red-600' :
                          character.rarity === 'legendary' ? 'border-orange-400 text-orange-600' :
                          character.rarity === 'epic' ? 'border-purple-400 text-purple-600' :
                          character.rarity === 'rare' ? 'border-blue-400 text-blue-600' :
                          character.rarity === 'uncommon' ? 'border-green-400 text-green-600' :
                          'border-gray-400 text-gray-600'
                        }`}
                      >
                        {character.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Badge variant="outline" className="px-4 py-2 text-lg fredoka-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              {CHARACTERS.length} Unique Characters to Discover
            </Badge>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 fredoka-bold px-4">
              Why Choose Bunifu?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto fredoka-medium px-4">
              Experience the future of university education with our innovative platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Secure & Private */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Secure & Private</h3>
              <p className="text-gray-600 fredoka-medium">Your academic data is protected with enterprise-grade security. School email verification ensures authentic university community.</p>
            </div>

            {/* Real-time Collaboration */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Real-time Collaboration</h3>
              <p className="text-gray-600 fredoka-medium">Instant messaging, file sharing, and live discussions. Connect with your university community anytime, anywhere.</p>
            </div>

            {/* Smart Organization */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Smart Organization</h3>
              <p className="text-gray-600 fredoka-medium">Intelligent assignment tracking, deadline reminders, and personalized study recommendations based on your progress.</p>
            </div>

            {/* Gamified Learning */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Gamified Learning</h3>
              <p className="text-gray-600 fredoka-medium">Turn your academic journey into an adventure. Earn points, unlock characters, and compete on leaderboards.</p>
            </div>

            {/* University Integration */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">University Integration</h3>
              <p className="text-gray-600 fredoka-medium">Seamlessly integrated with university systems. Access your classes, assignments, and academic calendar in one place.</p>
            </div>

            {/* Mobile First */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Mobile First</h3>
              <p className="text-gray-600 fredoka-medium">Designed for the modern student. Access everything on your phone with a beautiful, responsive interface.</p>
            </div>

            {/* Career Opportunities */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Career Opportunities</h3>
              <p className="text-gray-600 fredoka-medium">Discover internships, part-time jobs, and career guidance. Build your professional network and launch your career.</p>
            </div>

            {/* Events & Networking */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-3">Events & Networking</h3>
              <p className="text-gray-600 fredoka-medium">Stay updated with university events, workshops, and networking opportunities. Never miss important academic and social activities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 fredoka-bold">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto fredoka-medium px-4">
              Get started in minutes and transform your learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold fredoka-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-4">Sign Up with School Email</h3>
              <p className="text-gray-600 fredoka-medium">
                Use your official university email to create your account. We verify your student status to ensure authentic community access.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold fredoka-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-4">Apply for Your Class</h3>
              <p className="text-gray-600 fredoka-medium">
                Select your country, university, and course. Our admin team will approve your application and grant access to your class materials.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold fredoka-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 fredoka-bold mb-4">Start Learning & Connecting</h3>
              <p className="text-gray-600 fredoka-medium">
                Access your units, chat with classmates, track your progress, and unlock characters as you advance in your academic journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 fredoka-bold">
            Ready to Transform Your University Experience?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto fredoka-medium">
            Join thousands of students who are already using Bunifu to make their academic journey more engaging, organized, and successful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login?mode=signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 hover:scale-105 transition-transform duration-200 px-8 py-4 text-lg fredoka-semibold shadow-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Logo size="lg" showText={true} variant="white" className="mx-auto mb-6" />
            <p className="text-gray-400 fredoka-medium mb-6">
              Where learning meets creativity. Transform your university experience today.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="mailto:binfred.ke@gmail.com" className="text-gray-400 hover:text-white transition-colors" title="Email Support">
                <Mail className="h-6 w-6" />
              </a>
              <a href="tel:+254700861129" className="text-gray-400 hover:text-white transition-colors" title="Phone Support">
                <Phone className="h-6 w-6" />
              </a>
              <a href="https://wa.me/254700861129" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="WhatsApp Support">
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
            <p className="text-gray-500 text-sm fredoka-medium mt-6">
              © 2025 Bunifu. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;