import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
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
		const [targetUserId, setTargetUserId] = useState<string | null>(null);

		const onAdd = () => {
			const trimmed = name.trim();
			if (!trimmed) { return; }
			addUser(trimmed);
			setName('');
			setAddOpen(false);
		};
		const onRename = () => {
			if (!name.trim()) return;
			const id = targetUserId || active?.id;
			if (!id) return;
			renameUser(id, name.trim());
			setRenameOpen(false);
			setTargetUserId(null);
		};
		const onDelete = () => {
			const id = targetUserId || active?.id;
			if (!id) return;
			removeUser(id);
			setDeleteOpen(false);
			setTargetUserId(null);
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
												<DropdownMenuSub key={u.id}>
													<DropdownMenuSubTrigger className="flex items-center justify-between gap-2">
														<span className="truncate">{u.name}</span>
														{u.id === activeUserId && <Check className="h-4 w-4" />}
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent className="w-48">
														<DropdownMenuItem onClick={() => switchUser(u.id)}>Switch to this profile</DropdownMenuItem>
														<DropdownMenuItem onClick={() => { setName(u.name); setTargetUserId(u.id); setRenameOpen(true); }}>Rename</DropdownMenuItem>
														<DropdownMenuItem disabled={users.length <= 1} onClick={() => { setTargetUserId(u.id); setDeleteOpen(true); }}>Remove</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
											))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => { setName(''); setAddOpen(true); }}>
						<Plus className="h-4 w-4 mr-2" /> Add profile
					</DropdownMenuItem>
								<DropdownMenuItem onClick={() => { setTargetUserId(active?.id || null); setName(active?.name || ''); setRenameOpen(true); }}>
						<Pencil className="h-4 w-4 mr-2" /> Rename current
					</DropdownMenuItem>
								<DropdownMenuItem disabled={users.length <= 1} onClick={() => { setTargetUserId(active?.id || null); setDeleteOpen(true); }}>
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
									<Button variant="outline" onClick={() => { setName(''); setAddOpen(false); }}>Cancel</Button>
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
