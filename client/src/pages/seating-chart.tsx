import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import UploadArea from "@/components/upload-area";
import SeatingChartGrid from "@/components/seating-chart-grid";
import StudentTable from "@/components/student-table";
import { generateSeatingChart } from "@/lib/seating-algorithms";
import { Download, Save, Users, ALargeSmall, UserCog, Shuffle, Eraser, Printer } from "lucide-react";
import type { Student, SeatingChart as SeatingChartType } from "@shared/schema";

export default function SeatingChart() {
  const [layout, setLayout] = useState<'rows' | 'groups' | 'u-shape'>('rows');
  const [strategy, setStrategy] = useState<string>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChart, setCurrentChart] = useState<{position: number, studentId: string | null}[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: seatingCharts = [] } = useQuery<SeatingChartType[]>({
    queryKey: ['/api/seating-charts'],
  });

  const deleteAllStudentsMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/students'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setCurrentChart([]);
      toast({
        title: "Success",
        description: "All students cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear students",
        variant: "destructive",
      });
    },
  });

  const saveChartMutation = useMutation({
    mutationFn: (chartData: { name: string; layout: string; strategy: string; seats: any[] }) =>
      apiRequest('POST', '/api/seating-charts', chartData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seating-charts'] });
      toast({
        title: "Success",
        description: "Seating chart saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save seating chart",
        variant: "destructive",
      });
    },
  });

  const handleGenerateChart = async () => {
    if (students.length === 0) {
      toast({
        title: "No Students",
        description: "Please upload student data first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const totalSeats = layout === 'rows' ? 24 : layout === 'groups' ? 16 : 32;
      const chart = generateSeatingChart(students, strategy, totalSeats);
      setCurrentChart(chart);
      
      toast({
        title: "Success",
        description: "Seating chart generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate seating chart",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const handleSaveChart = () => {
    const chartName = `${strategy} Layout - ${new Date().toLocaleDateString()}`;
    saveChartMutation.mutate({
      name: chartName,
      layout,
      strategy,
      seats: currentChart,
    });
  };

  const handleShuffleAll = () => {
    if (students.length === 0) return;
    
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const newChart = currentChart.map((seat, index) => ({
      ...seat,
      studentId: shuffled[index]?.id || null,
    }));
    setCurrentChart(newChart);
  };

  const handleClearChart = () => {
    setCurrentChart([]);
  };

  const handlePrintChart = () => {
    window.print();
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-primary';
      case 'intermediate': return 'bg-accent';
      case 'advanced': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  const getLayoutName = (layout: string) => {
    switch (layout) {
      case 'rows': return 'Traditional Rows';
      case 'groups': return 'Group Tables';
      case 'u-shape': return 'U-Shape';
      default: return layout;
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'mixed': return 'Mixed ability grouping promotes peer learning by pairing students of different skill levels.';
      case 'skill-based': return 'Groups students by similar skill levels for targeted instruction.';
      case 'language-support': return 'Pairs students who share languages to provide mutual support.';
      case 'collaborative': return 'Places students who work well together in proximity.';
      case 'random': return 'Randomly assigns students to seats.';
      default: return 'Select a grouping strategy to see description.';
    }
  };

  const uniqueLanguages = [...new Set(students.flatMap(s => [s.primaryLanguage, ...s.secondaryLanguages]))].length;
  const constraintCount = students.reduce((count, student) => 
    count + student.worksWellWith.length + student.avoidPairing.length, 0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Classroom Seating Chart Generator</h1>
                <p className="text-sm text-muted-foreground">Organize your students effectively</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                onClick={handlePrintChart}
                data-testid="button-export-chart"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Chart
              </Button>
              <Button 
                onClick={handleSaveChart}
                disabled={currentChart.length === 0 || saveChartMutation.isPending}
                data-testid="button-save-layout"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Data Upload Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">
                  <Users className="w-5 h-5 inline mr-2 text-primary" />
                  Student Data
                </h2>
                
                <UploadArea />
                
                {/* Data Summary */}
                <div className="bg-muted rounded-md p-3 mt-4">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium" data-testid="text-student-count">{students.length}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Languages:</span>
                      <span className="font-medium" data-testid="text-language-count">{uniqueLanguages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Constraints:</span>
                      <span className="font-medium" data-testid="text-constraint-count">{constraintCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout Options */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">
                  <ALargeSmall className="w-5 h-5 inline mr-2 text-secondary" />
                  Layout Options
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="rows" 
                      checked={layout === 'rows'}
                      onChange={(e) => setLayout(e.target.value as 'rows')}
                      className="text-primary"
                      data-testid="input-layout-rows"
                    />
                    <span className="text-sm">Traditional Rows</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="groups" 
                      checked={layout === 'groups'}
                      onChange={(e) => setLayout(e.target.value as 'groups')}
                      className="text-primary"
                      data-testid="input-layout-groups"
                    />
                    <span className="text-sm">Group Tables</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="u-shape" 
                      checked={layout === 'u-shape'}
                      onChange={(e) => setLayout(e.target.value as 'u-shape')}
                      className="text-primary"
                      data-testid="input-layout-u-shape"
                    />
                    <span className="text-sm">U-Shape</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Grouping Strategies */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">
                  <UserCog className="w-5 h-5 inline mr-2 text-accent" />
                  Grouping Strategy
                </h2>
                
                <div className="space-y-3">
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger data-testid="select-grouping-strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed Ability</SelectItem>
                      <SelectItem value="skill-based">Skill-Based</SelectItem>
                      <SelectItem value="language-support">Language Support</SelectItem>
                      <SelectItem value="collaborative">Collaborative Pairs</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="mr-1">ℹ️</span>
                      {getStrategyDescription(strategy)}
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleGenerateChart}
                  disabled={isGenerating || students.length === 0}
                  data-testid="button-generate-chart"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  ) : (
                    <Shuffle className="w-4 h-4 mr-2" />
                  )}
                  Generate Chart
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">Quick Actions</h2>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={handleShuffleAll}
                    disabled={students.length === 0}
                    data-testid="button-shuffle-all"
                  >
                    <Shuffle className="w-4 h-4 mr-2 text-muted-foreground" />
                    Shuffle All Students
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={handleClearChart}
                    data-testid="button-clear-chart"
                  >
                    <Eraser className="w-4 h-4 mr-2 text-muted-foreground" />
                    Clear Chart
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={handlePrintChart}
                    data-testid="button-print-chart"
                  >
                    <Printer className="w-4 h-4 mr-2 text-muted-foreground" />
                    Print Chart
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm text-destructive hover:text-destructive" 
                    onClick={() => deleteAllStudentsMutation.mutate()}
                    disabled={students.length === 0 || deleteAllStudentsMutation.isPending}
                    data-testid="button-clear-all-students"
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Clear All Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Seating Chart Display */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-card-foreground">
                    <Users className="w-6 h-6 inline mr-2 text-primary" />
                    Seating Chart
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">Layout:</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-current-layout">
                      {getLayoutName(layout)}
                    </span>
                  </div>
                </div>
                
                {/* Teacher's Desk Indicator */}
                <div className="flex justify-center mb-4">
                  <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium">
                    📚 Teacher's Desk / Board
                  </div>
                </div>
                
                <SeatingChartGrid 
                  layout={layout}
                  students={students}
                  currentChart={currentChart}
                  onChartChange={setCurrentChart}
                />
                
                {/* Legend */}
                <div className="mt-6 bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">Skill Level Legend</h3>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-primary"></span>
                      <span className="text-muted-foreground">Beginner</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-accent"></span>
                      <span className="text-muted-foreground">Intermediate</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-secondary"></span>
                      <span className="text-muted-foreground">Advanced</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Student Management Panel */}
            <StudentTable students={students} isLoading={studentsLoading} />
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-8 text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-card-foreground mb-2">Generating Seating Chart</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing student data and applying grouping strategy...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
