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
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage your subjects</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
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
        <Card className="bg-gradient-card shadow-card border-0 p-12 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Subjects Yet</h3>
          <p className="text-muted-foreground mb-6">Add your first subject to get started</p>
          <Button 
            onClick={() => setIsOpen(true)}
            className="bg-gradient-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Subject
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subjects.map((subject) => (
            <Card key={subject.id} className="bg-gradient-card shadow-card border-0 p-6 hover:shadow-hover transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{subject.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Added {new Date(subject.createdAt).toLocaleDateString()}</p>
                      {typeof subject.criteria === 'number' && (
                        <p>Target: <span className="text-foreground font-medium">{subject.criteria}%</span></p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-1" /> Edit
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
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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