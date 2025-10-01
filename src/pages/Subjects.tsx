import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const subjectColors = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5A2B', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7'
];

export default function Subjects() {
  const subjects = useAppStore((state) => state.subjects);
  const addSubject = useAppStore((state) => state.addSubject);
  const removeSubject = useAppStore((state) => state.removeSubject);
  const updateSubject = useAppStore((state) => state.updateSubject);
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(subjectColors[0]);
  const [criteria, setCriteria] = useState<string>('75');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    // Validate criteria
    let criteriaValue: number | undefined = undefined;
    if (criteria.trim() !== '') {
      const n = Number(criteria);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        toast.error('Criteria must be a number between 0 and 100');
        return;
      }
      criteriaValue = Math.round(n);
    }

    addSubject({ name: name.trim(), color: selectedColor, criteria: criteriaValue });
    setName('');
    setSelectedColor(subjectColors[0]);
    setCriteria('75');
    setIsOpen(false);
    toast.success('Subject added successfully!');
  };

  const handleDelete = (id: string, name: string) => {
    removeSubject(id);
    toast.success(`${name} deleted successfully!`);
  };

  return (
    <div className="space-y-4 pb-20 xs:pb-24">
      {/* Enhanced mobile header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-foreground">Subjects</h1>
          <p className="text-sm xs:text-base text-muted-foreground mt-1">Manage your subjects</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover min-h-[44px] touch-manipulation w-full xs:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm xs:text-base">Add Subject</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter subject name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="criteria">Attendance Criteria (%)</Label>
                <Input
                  id="criteria"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {subjectColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-primary scale-110' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-primary-hover">
                  Add Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <Card className="bg-gradient-card shadow-card border-0 p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Subjects Yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">Add your first subject to get started</p>
          <Button 
            onClick={() => setIsOpen(true)}
            className="bg-gradient-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Subject
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="bg-gradient-card shadow-card border-0 p-3 hover:shadow-hover transition-all duration-200">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h3 className="text-sm font-semibold text-foreground truncate">{subject.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Subject</DialogTitle>
                      </DialogHeader>
                      <EditSubjectForm
                        id={subject.id}
                        initialName={subject.name}
                        initialColor={subject.color}
                        initialCriteria={typeof subject.criteria === 'number' ? String(subject.criteria) : ''}
                        onSave={(patch) => updateSubject(subject.id, patch)}
                      />
                    </DialogContent>
                  </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(subject.id, subject.name)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {typeof subject.criteria === 'number' && (
                  <div className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground font-medium text-center">
                    Target: {subject.criteria}%
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EditSubjectForm({ id, initialName, initialColor, initialCriteria, onSave }: {
  id: string;
  initialName: string;
  initialColor: string;
  initialCriteria: string;
  onSave: (patch: { name?: string; color?: string; criteria?: number }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [criteria, setCriteria] = useState(initialCriteria);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter a subject name');
    let criteriaValue: number | undefined = undefined;
    if (criteria.trim() !== '') {
      const n = Number(criteria);
      if (Number.isNaN(n) || n < 0 || n > 100) return toast.error('Criteria must be 0-100');
      criteriaValue = Math.round(n);
    }
    onSave({ name: name.trim(), color, criteria: criteriaValue });
    toast.success('Subject updated');
    // Close dialog by simulating click on overlay/Close handled by parent dialog controls
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`name-${id}`}>Subject Name</Label>
        <Input id={`name-${id}`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="grid grid-cols-6 gap-2">
          {subjectColors.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-primary scale-110' : 'border-muted'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`criteria-${id}`}>Attendance Criteria (%)</Label>
        <Input id={`criteria-${id}`} type="number" inputMode="numeric" min={0} max={100} value={criteria} onChange={(e) => setCriteria(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}