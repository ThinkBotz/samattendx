import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Check, Pencil, Trash2 } from 'lucide-react';

export default function UserProfileSelector() {
	const users = useAppStore((s) => s.users);
	const activeUserId = useAppStore((s) => s.activeUserId);
	const addUser = useAppStore((s) => s.addUser);
	const switchUser = useAppStore((s) => s.switchUser);
	const removeUser = useAppStore((s) => s.removeUser);
	const renameUser = useAppStore((s) => s.renameUser);

	const active = useMemo(() => users.find(u => u.id === activeUserId), [users, activeUserId]);

	const [addOpen, setAddOpen] = useState(false);
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [name, setName] = useState('');

	const onAdd = () => {
		if (!name.trim()) return;
		addUser(name.trim());
		setName('');
		setAddOpen(false);
	};
	const onRename = () => {
		if (!name.trim() || !active) return;
		renameUser(active.id, name.trim());
		setRenameOpen(false);
	};
	const onDelete = () => {
		if (!active) return;
		removeUser(active.id);
		setDeleteOpen(false);
	};

	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="px-2">
						<div className="flex items-center gap-2">
							<Avatar className="h-6 w-6">
								<AvatarFallback>{(active?.name || 'U').slice(0,1).toUpperCase()}</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium max-w-[120px] truncate">{active?.name || 'Profile'}</span>
						</div>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Profiles</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{users.map(u => (
						<DropdownMenuItem key={u.id} onClick={() => switchUser(u.id)} className="flex items-center justify-between">
							<span className="truncate">{u.name}</span>
							{u.id === activeUserId && <Check className="h-4 w-4" />}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => { setName(''); setAddOpen(true); }}>
						<Plus className="h-4 w-4 mr-2" /> Add profile
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => { setName(active?.name || ''); setRenameOpen(true); }}>
						<Pencil className="h-4 w-4 mr-2" /> Rename current
					</DropdownMenuItem>
					<DropdownMenuItem disabled={users.length <= 1} onClick={() => setDeleteOpen(true)}>
						<Trash2 className="h-4 w-4 mr-2" /> Remove current
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Add Profile Dialog */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add profile</DialogTitle>
						<DialogDescription>Create a new profile with its own subjects, timetable, and attendance.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2">
						<Label htmlFor="profile-name">Name</Label>
						<Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sam (Evening)" autoFocus />
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
						<Button onClick={onAdd} disabled={!name.trim()}>Add</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Rename Dialog */}
			<Dialog open={renameOpen} onOpenChange={setRenameOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename profile</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2">
						<Label htmlFor="rename-profile">Name</Label>
						<Input id="rename-profile" value={name} onChange={(e) => setName(e.target.value)} placeholder="New name" autoFocus />
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
						<Button onClick={onRename} disabled={!name.trim()}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm */}
			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this profile?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove the current profile and all its data (subjects, timetable, attendance). This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
