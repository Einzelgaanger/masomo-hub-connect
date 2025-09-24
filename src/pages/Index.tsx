import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users, Trophy, ArrowRight, Shield, Star, Zap, Target, MessageCircle, Upload, Calendar, TrendingUp, Award, Sparkles, Play, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { CHARACTERS } from "@/types/characters";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
          <div className="flex items-start gap-3 mb-4">
            {/* Large Owl Icon filling top-left */}
            <div className="flex-shrink-0 -mt-4">
              <img src="/logo.svg" alt="Bunifu Logo" className="h-40 w-40" />
            </div>
            
            {/* Name and Tagline to the right */}
            <div className="flex-1 min-w-0 text-left">
              <h1 className="text-4xl font-bold fredoka-bold text-gray-900 leading-tight mb-1 text-left">Bunifu</h1>
              <p className="text-lg fredoka-medium text-gray-600 leading-tight text-left">Where learning meets creativity</p>
            </div>
          </div>
        </div>
            
            {/* Desktop: Logo Component */}
            <div className="hidden sm:flex justify-center mb-6 sm:mb-8 animate-fade-in">
              <Logo size="xl" showText={true} className="scale-150 sm:scale-200" />
          </div>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-xs sm:max-w-2xl md:max-w-3xl mx-auto fredoka-medium animate-slide-up animation-delay-200 px-4">
              Transform your university experience with our revolutionary gamified learning platform. 
              Share, learn, and grow together with your classmates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 animate-slide-up animation-delay-400 px-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg fredoka-semibold">
                  Start Learning <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
          <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-2 border-gray-300 hover:border-blue-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg fredoka-medium">
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  Sign In
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
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 fredoka-bold px-4">
              Why Students Love Bunifu
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto fredoka-medium px-4">
              Discover the features that make learning engaging, collaborative, and fun
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            {/* Collaborative Learning Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-100">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-blue-200 group-hover:shadow-blue-500/25 transition-all duration-500">
                    <img 
                      src="/collaborativelearning.png" 
                      alt="Collaborative Learning" 
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-blue-600 transition-colors duration-300">
                  Collaborative Learning
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Share notes, past papers, and resources with your classmates. Learn together, grow together in a supportive community.
              </CardDescription>
            </CardContent>
          </Card>

            {/* Gamified Experience Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-200">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-orange-200 group-hover:shadow-orange-500/25 transition-all duration-500">
                    <img 
                      src="/gamifiedexperience.png" 
                      alt="Gamified Experience" 
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-orange-400 rounded-full animate-pulse animation-delay-300"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-orange-600 transition-colors duration-300">
                  Gamified Experience
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Earn points, climb rankings, and unlock unique characters as you contribute to the learning community.
              </CardDescription>
            </CardContent>
          </Card>

            {/* Class Organization Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-300">
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="relative mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-green-200 group-hover:shadow-green-500/25 transition-all duration-500">
                    <img 
                      src="/classorganization.png" 
                      alt="Class Organization" 
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-400 rounded-full animate-pulse animation-delay-500"></div>
                </div>
                <CardTitle className="text-xl sm:text-2xl fredoka-bold group-hover:text-green-600 transition-colors duration-300">
                  Class Organization
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-sm sm:text-base text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                  Stay organized with your class schedule, assignments, and events all in one beautifully designed platform.
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
          <div className="relative mb-12 -mx-4">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent via-transparent to-white z-10 pointer-events-none w-screen"></div>
            <div className="flex animate-character-tape">
              {/* First set of characters */}
              {CHARACTERS.map((character, index) => (
                <div key={`first-${character.id}`} className="flex-shrink-0 mx-4">
                  <div className="text-center group">
                    <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-full shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 fredoka-semibold mb-1">{character.name}</h3>
                      <p className="text-xs text-gray-500 fredoka-medium">{character.pointsRequired} pts</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-2 ${
                          character.category === 'ultimate' ? 'border-yellow-400 text-yellow-600' :
                          character.category === 'legendary' ? 'border-orange-400 text-orange-600' :
                          character.category === 'advanced' ? 'border-purple-400 text-purple-600' :
                          character.category === 'intermediate' ? 'border-blue-400 text-blue-600' :
                          'border-gray-400 text-gray-600'
                        }`}
                      >
                        {character.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {CHARACTERS.map((character, index) => (
                <div key={`second-${character.id}`} className="flex-shrink-0 mx-4">
                  <div className="text-center group">
                    <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-full shadow-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                      <img
                        src={character.image}
                        alt={character.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-800 fredoka-semibold mb-1">{character.name}</h3>
                      <p className="text-xs text-gray-500 fredoka-medium">{character.pointsRequired} pts</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-2 ${
                          character.category === 'ultimate' ? 'border-yellow-400 text-yellow-600' :
                          character.category === 'legendary' ? 'border-orange-400 text-orange-600' :
                          character.category === 'advanced' ? 'border-purple-400 text-purple-600' :
                          character.category === 'intermediate' ? 'border-blue-400 text-blue-600' :
                          'border-gray-400 text-gray-600'
                        }`}
                      >
                        {character.category}
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

      {/* How It Works */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 fredoka-bold">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto fredoka-medium px-4">
              Get started in minutes and transform your learning experience
            </p>
          </div>

          {/* Mobile: Simple 4 Cards */}
          <div className="block lg:hidden">
            <div className="grid grid-cols-2 gap-4 px-4">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-blue-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold fredoka-bold">
                    1
                  </div>
                  <h3 className="text-base font-semibold mb-2 fredoka-bold">Register</h3>
                  <p className="text-gray-600 fredoka-medium text-xs">Enter your university details and admission number to get started</p>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-orange-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold fredoka-bold">
                    2
                  </div>
                  <h3 className="text-base font-semibold mb-2 fredoka-bold">Share</h3>
                  <p className="text-gray-600 fredoka-medium text-xs">Upload notes, past papers, and help your classmates learn</p>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold fredoka-bold">
                    3
                  </div>
                  <h3 className="text-base font-semibold mb-2 fredoka-bold">Earn Points</h3>
                  <p className="text-gray-600 fredoka-medium text-xs">Get points for sharing content, helping others, and staying active</p>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-lg font-bold fredoka-bold">
                    4
                  </div>
                  <h3 className="text-base font-semibold mb-2 fredoka-bold">Level Up</h3>
                  <p className="text-gray-600 fredoka-medium text-xs">Unlock new characters and climb the leaderboards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold fredoka-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 fredoka-bold">Register</h3>
              <p className="text-gray-600 fredoka-medium">Enter your university details and admission number to get started</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold fredoka-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 fredoka-bold">Share</h3>
              <p className="text-gray-600 fredoka-medium">Upload notes, past papers, and help your classmates learn</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold fredoka-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 fredoka-bold">Earn Points</h3>
              <p className="text-gray-600 fredoka-medium">Get points for sharing content, helping others, and staying active</p>
        </div>

        <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold fredoka-bold">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2 fredoka-bold">Level Up</h3>
              <p className="text-gray-600 fredoka-medium">Unlock new characters and climb the leaderboards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist CTA Section */}
      <section className="py-12 sm:py-16 bg-white text-gray-900 relative overflow-hidden mb-16 sm:mb-20">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 sm:px-4 py-1 sm:py-2 mb-3 sm:mb-4">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span className="fredoka-semibold text-gray-700 text-xs sm:text-sm">Gamified Learning Platform</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 fredoka-bold leading-tight text-gray-900 px-4">
              Ready to Level Up Your
              <span className="block text-gray-600 mt-1">
                Learning Experience?
              </span>
            </h2>
            
            <p className="text-base sm:text-lg text-gray-600 max-w-xs sm:max-w-lg md:max-w-xl mx-auto fredoka-medium mb-4 sm:mb-6 px-4">
              Join thousands of students earning points, unlocking characters, and climbing leaderboards
            </p>
          </div>

          {/* Two Column Layout - Mobile First */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center mb-6 sm:mb-8">
            
            {/* Left Column - Features */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold fredoka-bold mb-0.5 text-gray-900">Share & Earn</h3>
                  <p className="text-gray-600 fredoka-medium text-xs sm:text-xs">Upload notes and resources</p>
                </div>
                <div className="ml-auto bg-gray-800 text-white px-2 py-1 rounded-full fredoka-bold text-xs flex-shrink-0">
                  +10-20 pts
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold fredoka-bold mb-0.5 text-gray-900">Help Others</h3>
                  <p className="text-gray-600 fredoka-medium text-xs sm:text-xs">Comment and provide feedback</p>
                </div>
                <div className="ml-auto bg-gray-800 text-white px-2 py-1 rounded-full fredoka-bold text-xs flex-shrink-0">
                  +3 pts
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold fredoka-bold mb-0.5 text-gray-900">Stay Active</h3>
                  <p className="text-gray-600 fredoka-medium text-xs sm:text-xs">Daily visits and engagement</p>
                </div>
                <div className="ml-auto bg-gray-800 text-white px-2 py-1 rounded-full fredoka-bold text-xs flex-shrink-0">
                  +5 pts
                </div>
              </div>
            </div>

            {/* Right Column - CTA */}
            <div className="text-center lg:text-left">
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="fredoka-medium text-xs text-gray-600">10,000+ Active Students</span>
                  </div>
                  <div className="hidden sm:block w-px h-3 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-gray-600" />
                    <span className="fredoka-medium text-xs text-gray-600">4.9/5 Rating</span>
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold fredoka-bold mb-3 text-gray-900">
                  Start Your Journey Today
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-2 justify-center lg:justify-start">
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 text-base fredoka-bold shadow-lg hover:shadow-gray-900/25 transition-all duration-300 hover:scale-105">
                      <Play className="h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
          <Link to="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white px-6 py-3 text-base fredoka-semibold hover:scale-105 transition-all duration-300">
                      Sign In
            </Button>
          </Link>
        </div>
      </div>
              
              <p className="text-gray-600 fredoka-medium text-xs">
                🚀 Join the revolution and make learning legendary!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 sm:py-16">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Logo and Description */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img src="/logo.svg" alt="Bunifu Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
                  <span className="text-xl sm:text-2xl font-bold fredoka-bold text-white">Bunifu</span>
                </div>
              </div>
              <p className="text-white fredoka-medium mb-4 sm:mb-6 max-w-sm sm:max-w-md text-sm sm:text-base lg:text-lg">
                Transform your university experience with our revolutionary gamified learning platform. 
                Share, learn, and grow together with your classmates.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-blue-500/25">
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-400 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-cyan-500/25">
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-blue-500/25">
                  <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
                <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-purple-500/25">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 fredoka-bold text-orange-400">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/login" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Get Started</Link></li>
                <li><Link to="/login" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Sign In</Link></li>
                <li><a href="#features" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Features</a></li>
                <li><a href="#characters" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Characters</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4 fredoka-bold text-green-400">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-green-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">FAQ</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 sm:pt-8">
            <div className="text-center">
              <p className="text-gray-300 fredoka-medium text-sm sm:text-base">
                © 2025 Bunifu. All rights reserved.
              </p>
            </div>
          </div>
      </div>
      </footer>
    </div>
  );
};

export default Index;
