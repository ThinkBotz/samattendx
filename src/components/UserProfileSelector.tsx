import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, User as UserIcon, Check } from 'lucide-react';

export default function UserProfileSelector() {
	const users = useAppStore((s) => s.users);
	const activeUserId = useAppStore((s) => s.activeUserId);
	const addUser = useAppStore((s) => s.addUser);
	const switchUser = useAppStore((s) => s.switchUser);
	const [adding, setAdding] = useState(false);

	const active = users.find(u => u.id === activeUserId);

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
					<DropdownMenuItem onClick={() => { setAdding(true); const name = prompt('New profile name?') || ''; addUser(name); setAdding(false); }}>
						<Plus className="h-4 w-4 mr-2" /> Add profile
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
