import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema } from "@shared/schema";
import { Edit, Plus, UserCog } from "lucide-react";
import type { Student, InsertStudent } from "@shared/schema";
import { z } from "zod";

interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
}

const formSchema = insertStudentSchema.extend({
  worksWellWithText: z.string().optional(),
  avoidPairingText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function StudentTable({ students, isLoading }: StudentTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      primaryLanguage: "",
      skillLevel: "beginner",
      worksWellWithText: "",
      avoidPairingText: "",
      notes: "",
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: (data: InsertStudent) => apiRequest('POST', '/api/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDialogOpen(false);
      setEditingStudent(null);
      form.reset();
      toast({
        title: "Success",
        description: "Student saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertStudent> }) =>
      apiRequest('PUT', `/api/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDialogOpen(false);
      setEditingStudent(null);
      form.reset();
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      primaryLanguage: student.primaryLanguage,
      skillLevel: student.skillLevel as "beginner" | "intermediate" | "advanced",
      worksWellWithText: (student.worksWellWith || []).join(', '),
      avoidPairingText: (student.avoidPairing || []).join(', '),
      notes: student.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    const studentData: InsertStudent = {
      name: data.name,
      primaryLanguage: data.primaryLanguage,
      skillLevel: data.skillLevel,
      worksWellWith: data.worksWellWithText
        ? data.worksWellWithText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      avoidPairing: data.avoidPairingText
        ? data.avoidPairingText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      notes: data.notes || "",
    };

    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data: studentData });
    } else {
      createStudentMutation.mutate(studentData);
    }
  };

  const getSkillLevelBadge = (level: string) => {
    const getBadgeStyle = (level: string) => {
      switch (level) {
        case 'beginner': return 'bg-green-500 text-white hover:bg-green-600';
        case 'intermediate': return 'bg-yellow-500 text-white hover:bg-yellow-600';
        case 'advanced': return 'bg-blue-500 text-white hover:bg-blue-600';
        default: return 'bg-muted text-muted-foreground';
      }
    };
    
    return (
      <Badge className={getBadgeStyle(level)}>
        {level}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading students...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            <UserCog className="w-6 h-6 inline mr-2 text-secondary" />
            Student Information
          </h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddStudent} data-testid="button-add-student">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-student-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="primaryLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Language</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-primary-language" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  

                  
                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-skill-level">
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="worksWellWithText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Works Well With (names, comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Alex, Maria" data-testid="input-works-well-with" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avoidPairingText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avoid Pairing With (names, comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John, Sarah" data-testid="input-avoid-pairing" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} data-testid="textarea-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                      data-testid="button-save-student"
                    >
                      {editingStudent ? 'Update' : 'Add'} Student
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students added yet. Upload a CSV file or add students manually.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Primary Language</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Works Well With</TableHead>
                  <TableHead>Avoid Pairing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {student.primaryLanguage}
                    </TableCell>
                    <TableCell>
                      {getSkillLevelBadge(student.skillLevel)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(student.worksWellWith || []).join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(student.avoidPairing || []).join(', ') || '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditStudent(student)}
                        data-testid={`button-edit-${student.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {students.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-right">
            Showing {students.length} students
          </div>
        )}
      </CardContent>
    </Card>
  );
}
