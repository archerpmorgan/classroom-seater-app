import { useState, useEffect } from "react";
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
import { Download, Save, GraduationCap, LayoutGrid, UserCog, Shuffle, Eraser, Printer, Users, Database, Eye, EyeOff } from "lucide-react";
import type { Student, SeatingChart as SeatingChartType } from "@shared/schema";

export default function SeatingChart() {
  const [layout, setLayout] = useState<'traditional-rows' | 'stadium' | 'horseshoe' | 'double-horseshoe' | 'circle' | 'groups' | 'pairs'>('traditional-rows');
  const [strategy, setStrategy] = useState<string>('mixed-ability');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentChart, setCurrentChart] = useState<{position: number, studentId: string | null}[]>([]);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: seatingCharts = [] } = useQuery<SeatingChartType[]>({
    queryKey: ['/api/seating-charts'],
  });

  // Clear chart when students change or layout changes
  useEffect(() => {
    setCurrentChart([]);
  }, [students.length, layout]);

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

  const getSeatCount = (layoutType: string, studentCount: number) => {
    // For groups layout, always show complete groups (4 seats per group)
    if (layoutType === 'groups') {
      const groupsNeeded = Math.ceil(studentCount / 4);
      return groupsNeeded * 4;
    }
    
    // For other layouts, show only the seats needed
    const maxSeats = {
      'traditional-rows': 30,
      'stadium': 28,
      'horseshoe': 20,
      'double-horseshoe': 32,
      'circle': 16,
      'pairs': 20
    };
    
    const maxForLayout = maxSeats[layoutType as keyof typeof maxSeats] || 24;
    return Math.min(studentCount, maxForLayout);
  };

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
      const totalSeats = getSeatCount(layout, students.length);
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

  const handleDownloadLayoutImage = async () => {
    try {
      // Get the seating chart grid element
      const chartElement = document.querySelector('[data-testid="seating-chart-grid"]') as HTMLElement;
      
      if (!chartElement) {
        toast({
          title: "Error",
          description: "Could not find seating chart element",
          variant: "destructive",
        });
        return;
      }

      // Use html2canvas to capture the chart as an image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution for better quality
        useCORS: true,
        allowTaint: true,
        width: chartElement.offsetWidth,
        height: chartElement.offsetHeight,
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `classroom-layout-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Success",
            description: "Layout image downloaded successfully",
          });
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error downloading layout image:', error);
      toast({
        title: "Error",
        description: "Failed to download layout image",
        variant: "destructive",
      });
    }
  };

  const handleDownloadUpdatedCSV = () => {
    try {
      if (students.length === 0) {
        toast({
          title: "No Students",
          description: "No students to export",
          variant: "destructive",
        });
        return;
      }

      // Create CSV headers
      const headers = [
        'Name',
        'Primary Language',
        'Secondary Languages',
        'Skill Level',
        'Works Well With',
        'Avoid Pairing',
        'Notes'
      ];

      // Convert students to CSV rows
      const csvRows = students.map(student => [
        student.name,
        student.primaryLanguage,
        (student.secondaryLanguages || []).join(', '),
        student.skillLevel,
        (student.worksWellWith || []).join(', '),
        (student.avoidPairing || []).join(', '),
        student.notes || ''
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students-updated-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${students.length} students to CSV`,
      });

    } catch (error) {
      console.error('Error downloading updated CSV:', error);
      toast({
        title: "Error",
        description: "Failed to download updated CSV",
        variant: "destructive",
      });
    }
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
      case 'traditional-rows': return 'Traditional Rows';
      case 'stadium': return 'Stadium/V-Shape';
      case 'horseshoe': return 'Horseshoe (U-Shape)';
      case 'double-horseshoe': return 'Double Horseshoe';
      case 'circle': return 'Circle/Roundtable';
      case 'groups': return 'Group Tables';
      case 'pairs': return 'Paired Desks';
      default: return layout;
    }
  };

  const getLayoutDescription = (layout: string) => {
    switch (layout) {
      case 'traditional-rows': return 'Classic classroom setup with desks in straight lines facing forward. Maximizes teacher focus and minimizes student-to-student interaction.';
      case 'stadium': return 'Angled rows creating better sightlines to teacher and board. Slight improvement in community feeling over traditional rows.';
      case 'horseshoe': return 'Semi-circle arrangement facilitating whole-class discussions. All students can see teacher and each other.';
      case 'double-horseshoe': return 'Inner and outer horseshoe rings for larger classes. Allows discussion format while accommodating more students.';
      case 'circle': return 'Complete circle creating democratic, non-hierarchical space. Ideal for advanced discussions and Socratic seminars.';
      case 'groups': return 'Clusters of 4-6 desks promoting collaboration. Excellent for group projects and peer learning activities.';
      case 'pairs': return 'Desks arranged in pairs throughout room. Balances collaboration with individual focus.';
      default: return 'Select a layout to see description.';
    }
  };

  const getLayoutPurpose = (layout: string) => {
    switch (layout) {
      case 'traditional-rows': return 'Direct instruction, individual work, assessments';
      case 'stadium': return 'Lectures with improved visibility';
      case 'horseshoe': return 'Class discussions, Q&A sessions';
      case 'double-horseshoe': return 'Large group discussions';
      case 'circle': return 'Socratic seminars, peer reviews';
      case 'groups': return 'Collaborative projects, group work';
      case 'pairs': return 'Peer learning, think-pair-share';
      default: return '';
    }
  };

  const getStrategyResearch = (strategy: string) => {
    switch (strategy) {
      case 'mixed-ability': return 'Research shows heterogeneous grouping benefits both high and low achievers through peer tutoring effects.';
      case 'skill-clustering': return 'Allows for differentiated instruction and reduces achievement gaps within groups.';
      case 'language-support': return 'Bilingual students show increased engagement when paired with same-language peers.';
      case 'collaborative-pairs': return 'Students who choose compatible partners show 23% higher task completion rates.';
      case 'attention-zone': return 'Front-center "action zone" receives 40% more teacher interactions, improving engagement.';
      case 'behavior-management': return 'Strategic separation reduces disruptive behavior by 60-75% compared to student choice.';
      case 'random': return 'Prevents social cliques and creates diverse interaction opportunities.';
      default: return '';
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'mixed-ability': return 'Strategic pairing of different skill levels to promote peer learning and support. Research shows this enhances understanding for both advanced and struggling students.';
      case 'skill-clustering': return 'Groups students with similar skill levels together for targeted, differentiated instruction. Allows teachers to provide level-appropriate challenges.';
      case 'language-support': return 'Places students who share languages together to provide mutual support and reduce language barriers in mathematics learning.';
      case 'collaborative-pairs': return 'Positions students who work well together in close proximity based on their stated preferences and past collaboration success.';
      case 'attention-zone': return 'Places students who need more support in the front-center "action zone" where they receive maximum teacher attention and engagement.';
      case 'behavior-management': return 'Strategic placement to minimize disruptions by separating students with avoidance constraints and positioning high-need students optimally.';
      case 'random': return 'Random assignment that can help break up social cliques and create new working relationships.';
      default: return 'Select a grouping strategy to see description.';
    }
  };

  const uniqueLanguages = Array.from(new Set(students.flatMap(s => [s.primaryLanguage, ...(s.secondaryLanguages || [])]))).length;
  const constraintCount = students.reduce((count, student) => 
    count + (student.worksWellWith?.length || 0) + (student.avoidPairing?.length || 0), 0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Classroom Seating Chart Generator</h1>
                <p className="text-sm text-muted-foreground">Organize your students effectively</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleGenerateChart}
                disabled={isGenerating || students.length === 0}
                data-testid="button-generate-chart-header"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                ) : (
                  <Shuffle className="w-4 h-4 mr-2" />
                )}
                Generate Chart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPrivacyMode(!privacyMode)}
                data-testid="button-privacy-toggle"
                className={privacyMode ? "bg-muted" : ""}
              >
                {privacyMode ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {privacyMode ? "Privacy On" : "Privacy Off"}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleDownloadLayoutImage}
                disabled={currentChart.length === 0}
                data-testid="button-download-layout-image"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Layout as Image
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleDownloadUpdatedCSV}
                disabled={students.length === 0}
                data-testid="button-download-updated-csv"
                title="Download Updated CSV"
              >
                <Download className="w-4 h-4" />
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
                  <Database className="w-5 h-5 inline mr-2 text-primary" />
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
                  <LayoutGrid className="w-5 h-5 inline mr-2 text-secondary" />
                  Classroom Layout
                </h2>
                
                {/* Layout Preview and Info */}
                <div className="mb-4 p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-2">
                    <strong>{getLayoutName(layout)}</strong>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getLayoutDescription(layout)}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="text-xs">
                      <span className="font-medium text-muted-foreground">Seats:</span> 
                      <span className="ml-1 text-foreground">{getSeatCount(layout, students.length)}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium text-muted-foreground">Best for:</span>
                      <div className="ml-0 mt-1 text-muted-foreground leading-relaxed">
                        {getLayoutPurpose(layout)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="traditional-rows" 
                      checked={layout === 'traditional-rows'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-traditional-rows"
                    />
                    <span className="text-sm">Traditional Rows</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="stadium" 
                      checked={layout === 'stadium'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-stadium"
                    />
                    <span className="text-sm">Stadium/V-Shape</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="horseshoe" 
                      checked={layout === 'horseshoe'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-horseshoe"
                    />
                    <span className="text-sm">Horseshoe (U-Shape)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="double-horseshoe" 
                      checked={layout === 'double-horseshoe'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-double-horseshoe"
                    />
                    <span className="text-sm">Double Horseshoe</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="circle" 
                      checked={layout === 'circle'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-circle"
                    />
                    <span className="text-sm">Circle/Roundtable</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="groups" 
                      checked={layout === 'groups'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-groups"
                    />
                    <span className="text-sm">Group Tables</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="layout" 
                      value="pairs" 
                      checked={layout === 'pairs'}
                      onChange={(e) => setLayout(e.target.value as any)}
                      className="text-primary"
                      data-testid="input-layout-pairs"
                    />
                    <span className="text-sm">Paired Desks</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Grouping Strategies */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-card-foreground">
                  <Users className="w-5 h-5 inline mr-2 text-accent" />
                  Grouping Strategy
                </h2>
                
                <div className="space-y-3">
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger data-testid="select-grouping-strategy">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed-ability">Mixed Ability</SelectItem>
                      <SelectItem value="skill-clustering">Skill Clustering</SelectItem>
                      <SelectItem value="language-support">Language Support</SelectItem>
                      <SelectItem value="collaborative-pairs">Collaborative Pairs</SelectItem>
                      <SelectItem value="attention-zone">Attention Zone Focus</SelectItem>
                      <SelectItem value="behavior-management">Behavior Management</SelectItem>
                      <SelectItem value="random">Random Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="bg-muted rounded-md p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="mr-1">📚</span>
                      {getStrategyDescription(strategy)}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Research basis:</strong> {getStrategyResearch(strategy)}
                    </div>
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
                    <LayoutGrid className="w-6 h-6 inline mr-2 text-primary" />
                    Seating Chart
                    {privacyMode && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Privacy Mode
                      </Badge>
                    )}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">Layout:</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-current-layout">
                      {getLayoutName(layout)}
                    </span>
                  </div>
                </div>
                
                {/* Teacher's Desk Indicator */}
                
                <SeatingChartGrid 
                  layout={layout}
                  students={students}
                  currentChart={currentChart}
                  onChartChange={setCurrentChart}
                  privacyMode={privacyMode}
                />
                
                {/* Legend */}
                {!privacyMode && (
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
                )}
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
