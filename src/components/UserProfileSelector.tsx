import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Check, Pencil, Trash2, MoreHorizontal } from 'lucide-react';

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
			const [manageOpen, setManageOpen] = useState(false);

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
															<DropdownMenuItem key={u.id} onClick={() => switchUser(u.id)} className="flex items-center justify-between">
																<span className="truncate">{u.name}</span>
																{u.id === activeUserId && <Check className="h-4 w-4" />}
															</DropdownMenuItem>
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
														<DropdownMenuItem onClick={() => setManageOpen(true)}>
															<Pencil className="h-4 w-4 mr-2" /> Manage profiles
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

							{/* Quick manage button */}
							<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Manage profiles" onClick={() => setManageOpen(true)}>
								<MoreHorizontal className="h-4 w-4" />
							</Button>

							{/* Manage Profiles Dialog */}
					<Dialog open={manageOpen} onOpenChange={setManageOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Manage profiles</DialogTitle>
								<DialogDescription>Switch, rename, or remove profiles.</DialogDescription>
							</DialogHeader>
							<div className="space-y-2">
								{users.map((u) => (
									<div key={u.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
										<div className="min-w-0">
											<div className="truncate font-medium">{u.name}</div>
											{u.id === activeUserId && <div className="text-xs text-muted-foreground">Active</div>}
										</div>
										<div className="flex items-center gap-2">
											{u.id !== activeUserId && (
												<Button variant="secondary" size="sm" onClick={() => { switchUser(u.id); }}>
													Switch
												</Button>
											)}
											<Button variant="outline" size="sm" onClick={() => { setName(u.name); setTargetUserId(u.id); setRenameOpen(true); }}>
												Rename
											</Button>
											<Button variant="destructive" size="sm" disabled={users.length <= 1} onClick={() => { setTargetUserId(u.id); setDeleteOpen(true); }}>
												Remove
											</Button>
										</div>
									</div>
								))}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setManageOpen(false)}>Close</Button>
								<Button onClick={() => { setManageOpen(false); setName(''); setAddOpen(true); }}>Add profile</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
		</div>
	);
}
