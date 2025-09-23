import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, Navigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users, Trophy, ArrowRight, Shield, Star, Zap, Target, MessageCircle, Upload, Calendar, TrendingUp, Award, Sparkles, Play } from "lucide-react";
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
        <div className="container mx-auto px-4 py-20 relative flex-1 flex flex-col justify-center">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8 animate-fade-in">
              <Logo size="xl" showText={true} className="scale-200" />
            </div>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto fredoka-medium animate-slide-up animation-delay-200">
              Transform your university experience with our revolutionary gamified learning platform. 
              Share, learn, and grow together with your classmates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up animation-delay-400">
              <Link to="/login">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg fredoka-semibold">
                  Start Learning <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="gap-2 border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg fredoka-medium">
                  <Shield className="h-5 w-5" />
                  Admin Portal
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-slide-up animation-delay-600">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 fredoka-bold">10K+</div>
                <div className="text-gray-600 fredoka-medium">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 fredoka-bold">500+</div>
                <div className="text-gray-600 fredoka-medium">Universities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 fredoka-bold">50K+</div>
                <div className="text-gray-600 fredoka-medium">Resources Shared</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 fredoka-bold">99%</div>
                <div className="text-gray-600 fredoka-medium">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 fredoka-bold">
              Why Students Love Bunifu
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto fredoka-medium">
              Discover the features that make learning engaging, collaborative, and fun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Collaborative Learning Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-100">
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-blue-200 group-hover:shadow-blue-500/25 transition-all duration-500">
                    <img 
                      src="/collaborativelearning.png" 
                      alt="Collaborative Learning" 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
                <CardTitle className="text-2xl fredoka-bold group-hover:text-blue-600 transition-colors duration-300">
                  Collaborative Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300">
                  Share notes, past papers, and resources with your classmates. Learn together, grow together in a supportive community.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Gamified Experience Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-200">
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-orange-200 group-hover:shadow-orange-500/25 transition-all duration-500">
                    <img 
                      src="/gamifiedexperience.png" 
                      alt="Gamified Experience" 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-pulse animation-delay-300"></div>
                </div>
                <CardTitle className="text-2xl fredoka-bold group-hover:text-orange-600 transition-colors duration-300">
                  Gamified Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300">
                  Earn points, climb rankings, and unlock unique characters as you contribute to the learning community.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Class Organization Card */}
            <Card className="text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 shadow-lg group animate-fade-in-up animation-delay-300">
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border-2 border-green-200 group-hover:shadow-green-500/25 transition-all duration-500">
                    <img 
                      src="/classorganization.png" 
                      alt="Class Organization" 
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse animation-delay-500"></div>
                </div>
                <CardTitle className="text-2xl fredoka-bold group-hover:text-green-600 transition-colors duration-300">
                  Class Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 fredoka-medium group-hover:text-gray-700 transition-colors duration-300">
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 fredoka-bold">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto fredoka-medium">
              Get started in minutes and transform your learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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

      {/* Ultra Compact CTA Section */}
      <section className="py-8 bg-blue-600 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-2 left-2 w-8 h-8 bg-orange-400/20 rounded-full animate-bounce"></div>
          <div className="absolute top-4 right-4 w-6 h-6 bg-green-400/20 rounded-full animate-bounce animation-delay-200"></div>
          <div className="absolute bottom-2 left-6 w-4 h-4 bg-purple-400/20 rounded-full animate-bounce animation-delay-400"></div>
          <div className="absolute bottom-4 right-2 w-6 h-6 bg-yellow-400/20 rounded-full animate-bounce animation-delay-600"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-orange-500 rounded-full px-4 py-1 mb-3">
              <Trophy className="h-4 w-4 text-white" />
              <span className="fredoka-semibold text-white text-sm">Gamified Learning</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 fredoka-bold">
              Ready to Level Up Your
              <span className="block text-yellow-300">
                Learning Game?
              </span>
            </h2>
            <p className="text-base opacity-90 max-w-xl mx-auto fredoka-medium mb-4">
              Earn points, unlock characters, and climb leaderboards!
            </p>
          </div>

          {/* Ultra Compact Point System */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-orange-500/20 rounded-lg p-3 text-center hover:bg-orange-500/30 transition-all duration-300 hover:scale-105 border border-orange-400/30">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold mb-1 fredoka-bold">Share</h3>
              <div className="inline-flex items-center gap-1 bg-green-500 rounded-full px-2 py-1">
                <span className="text-sm font-bold text-white fredoka-bold">+10-20</span>
              </div>
            </div>

            <div className="bg-blue-500/20 rounded-lg p-3 text-center hover:bg-blue-500/30 transition-all duration-300 hover:scale-105 border border-blue-400/30">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse animation-delay-200">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold mb-1 fredoka-bold">Help</h3>
              <div className="inline-flex items-center gap-1 bg-purple-500 rounded-full px-2 py-1">
                <span className="text-sm font-bold text-white fredoka-bold">+3</span>
              </div>
            </div>

            <div className="bg-green-500/20 rounded-lg p-3 text-center hover:bg-green-500/30 transition-all duration-300 hover:scale-105 border border-green-400/30">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse animation-delay-400">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold mb-1 fredoka-bold">Active</h3>
              <div className="inline-flex items-center gap-1 bg-teal-500 rounded-full px-2 py-1">
                <span className="text-sm font-bold text-white fredoka-bold">+5</span>
              </div>
            </div>
          </div>

          {/* Ultra Compact CTA Buttons */}
          <div className="text-center">
            <div className="mb-3">
              <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="fredoka-medium text-xs">10,000+ Students</span>
                </div>
                <div className="w-px h-3 bg-white/30"></div>
                <div className="flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 text-yellow-300" />
                  <span className="fredoka-medium text-xs">4.9/5 Rating</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/login">
                <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-base fredoka-bold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105">
                  <Play className="h-4 w-4" />
                  Start Journey
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 text-base fredoka-semibold hover:scale-105 transition-all duration-300">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <p className="text-white/80 fredoka-medium mt-3 text-xs">
              🚀 Make learning legendary!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full animate-float opacity-5"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-purple-500 rounded-full animate-float animation-delay-200 opacity-5"></div>
          <div className="absolute bottom-20 left-32 w-16 h-16 bg-orange-500 rounded-full animate-float animation-delay-400 opacity-5"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 bg-green-500 rounded-full animate-float animation-delay-600 opacity-5"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Logo size="md" showText={true} />
              </div>
              <p className="text-gray-300 fredoka-medium mb-6 max-w-md">
                Transform your university experience with our revolutionary gamified learning platform. 
                Share, learn, and grow together with your classmates.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-blue-500/25">
                  <span className="text-sm font-bold text-white">f</span>
                </div>
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center hover:bg-cyan-400 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-cyan-500/25">
                  <span className="text-sm font-bold text-white">t</span>
                </div>
                <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-blue-500/25">
                  <span className="text-sm font-bold text-white">in</span>
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-all duration-300 cursor-pointer hover:scale-110 transform shadow-lg hover:shadow-purple-500/25">
                  <span className="text-sm font-bold text-white">ig</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 fredoka-bold text-orange-400">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link to="/login" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Get Started</Link></li>
                <li><Link to="/login" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Sign In</Link></li>
                <li><Link to="/admin/login" className="text-gray-300 hover:text-orange-400 transition-colors fredoka-medium hover:translate-x-1 transform duration-300 inline-block">Admin Portal</Link></li>
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
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-300 fredoka-medium mb-4 md:mb-0">
                © 2024 Bunifu. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <span className="text-gray-300 fredoka-medium">Made with <span className="text-red-500">❤️</span> for students</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm fredoka-medium">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
