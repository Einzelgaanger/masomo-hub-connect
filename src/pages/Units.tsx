import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Users, 
  FileText,
  Clock,
  ChevronRight,
  GraduationCap,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";

interface Unit {
  id: string;
  name: string;
  description: string;
  created_at: string;
  classes: {
    course_name: string;
    course_year: number;
    semester: number;
    course_group: string;
    universities: {
      name: string;
      countries: {
        name: string;
      };
    };
  };
  uploads_count?: number;
  assignments_count?: number;
  events_count?: number;
}

export default function Units() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  useEffect(() => {
    if (user) {
      fetchUnits();
    }
  }, [user]);

  useEffect(() => {
    filterUnits();
  }, [units, searchQuery, selectedSemester, selectedYear]);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          classes!inner(
            id,
            course_name,
            course_year,
            semester,
            course_group,
            universities(
              name,
              countries(name)
            ),
            units(
              id,
              name,
              description,
              created_at
            )
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data?.classes?.units) {
        // Add class information to each unit and fetch additional stats
        const unitsWithStats = await Promise.all(
          data.classes.units.map(async (unit: any) => {
            // Fetch uploads count
            const { count: uploadsCount } = await supabase
              .from('uploads')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unit.id);

            // Fetch assignments count
            const { count: assignmentsCount } = await supabase
              .from('assignments')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unit.id);

            // Fetch events count
            const { count: eventsCount } = await supabase
              .from('events')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unit.id);

            return {
              ...unit,
              classes: data.classes,
              uploads_count: uploadsCount || 0,
              assignments_count: assignmentsCount || 0,
              events_count: eventsCount || 0
            };
          })
        );

        setUnits(unitsWithStats);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to load units.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUnits = () => {
    let filtered = units;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(unit =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by semester
    if (selectedSemester !== "all") {
      filtered = filtered.filter(unit =>
        unit.classes.semester.toString() === selectedSemester
      );
    }

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter(unit =>
        unit.classes.course_year.toString() === selectedYear
      );
    }

    setFilteredUnits(filtered);
  };

  const getUniqueYears = () => {
    const years = Array.from(new Set(units.map(unit => unit.classes.course_year)));
    return years.sort((a, b) => b - a); // Sort descending (newest first)
  };

  const getUniqueSemesters = () => {
    const semesters = Array.from(new Set(units.map(unit => unit.classes.semester)));
    return semesters.sort((a, b) => a - b); // Sort ascending
  };

  const getTotalContent = (unit: Unit) => {
    return unit.uploads_count + unit.assignments_count + unit.events_count;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              My Units
            </h1>
            <p className="text-muted-foreground mt-2">
              All your units from {units[0]?.classes?.universities?.name} • {units[0]?.classes?.universities?.countries?.name}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {units.length} Units
            </Badge>
            <Badge variant="outline" className="text-sm">
              {units[0]?.classes?.course_name} - Year {units[0]?.classes?.course_year}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search units..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  title="Filter by year"
                  aria-label="Filter by year"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year.toString()}>
                      Year {year}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  title="Filter by semester"
                  aria-label="Filter by semester"
                >
                  <option value="all">All Semesters</option>
                  {getUniqueSemesters().map(semester => (
                    <option key={semester} value={semester.toString()}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units Grid */}
        {filteredUnits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || selectedSemester !== "all" || selectedYear !== "all" 
                  ? "No units found" 
                  : "No units available"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedSemester !== "all" || selectedYear !== "all"
                  ? "Try adjusting your filters to see more units."
                  : "You don't have any units assigned yet. Contact your admin if this is unexpected."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredUnits.map((unit) => (
              <Card 
                key={unit.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/unit/${unit.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {unit.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          Year {unit.classes.course_year}, Sem {unit.classes.semester}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {unit.classes.course_group}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {unit.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {unit.description}
                    </p>
                  )}
                  
                  {/* Content Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{unit.uploads_count} notes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{unit.assignments_count} assignments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{unit.events_count} events</span>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Created {format(new Date(unit.created_at), 'MMM dd, yyyy')}
                    </span>
                    <span className="font-medium text-primary">
                      {getTotalContent(unit)} items
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredUnits.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredUnits.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Units</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredUnits.reduce((sum, unit) => sum + unit.uploads_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredUnits.reduce((sum, unit) => sum + unit.assignments_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Assignments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredUnits.reduce((sum, unit) => sum + unit.events_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
