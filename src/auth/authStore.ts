import { create } from 'zustand';
import { load, save } from '../lib/storage';
import { TENDER } from '../config/tender';
import { SEED_USERS, type Role, type User, type UserStatus } from './users';
import { bus } from '../lib/eventBus';

const USERS_KEY = 'nb.users';
const SESSION_KEY = 'nb.currentUser';
/** Default for the demo: signed in as the first Administrator so any link opens straight away. */
const DEFAULT_USER = 'u01';

interface State {
  users: User[];
  currentId: string | null;
  signIn: (id: string) => void;
  signOut: () => void;
  addUser: (u: Pick<User, 'name' | 'email' | 'role' | 'team'>) => { ok: true; user: User } | { ok: false; reason: string };
  removeUser: (id: string) => void;
  setRole: (id: string, role: Role) => void;
  setStatus: (ids: string[], status: UserStatus) => void;
  resendInvite: (id: string) => void;
}

export const seats = () => TENDER.seats.value;

export const useAuth = create<State>((set, get) => {
  const persist = (users: User[]) => { save(USERS_KEY, users); set({ users }); };
  const actor = () => get().users.find((u) => u.id === get().currentId)?.name ?? 'System';
  const audit = (action: string, detail: string) => bus.emit('audit', { action, detail, actor: actor() });
  return {
    users: load<User[]>(USERS_KEY, SEED_USERS),
    currentId: load<string | null>(SESSION_KEY, DEFAULT_USER),
    signIn: (id) => { save(SESSION_KEY, id); set({ currentId: id }); bus.emit('auth:signin', id); },
    signOut: () => { bus.emit('auth:signout', get().currentId); save(SESSION_KEY, null); set({ currentId: null }); },
    addUser: (u) => {
      if (get().users.length >= seats()) return { ok: false, reason: `All ${seats()} licences are assigned. Remove a user first to free a licence.` };
      if (get().users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) return { ok: false, reason: 'A user with this email already exists.' };
      const user: User = { ...u, id: `u${Date.now().toString(36)}`, status: 'Invited', created: new Date().toISOString().slice(0, 10) };
      persist([...get().users, user]);
      audit('User added', `${user.name} (${user.email}) invited as ${user.role}`);
      return { ok: true, user };
    },
    removeUser: (id) => { const u = get().users.find((x) => x.id === id); persist(get().users.filter((x) => x.id !== id)); if (u) audit('User removed', `${u.name} (${u.email})`); },
    setRole: (id, role) => { const u = get().users.find((x) => x.id === id); persist(get().users.map((x) => (x.id === id ? { ...x, role } : x))); if (u) audit('Role changed', `${u.name}: ${u.role} → ${role}`); },
    setStatus: (ids, status) => {
      persist(get().users.map((x) => (ids.includes(x.id) ? { ...x, status } : x)));
      ids.forEach((id) => { const u = get().users.find((x) => x.id === id); if (u) audit(status === 'Deactivated' ? 'User deactivated' : 'User reactivated', u.name); });
    },
    resendInvite: (id) => { const u = get().users.find((x) => x.id === id); if (u) audit('Invite resent', `${u.name} (${u.email})`); },
  };
});

export const useCurrentUser = () => useAuth((s) => s.users.find((u) => u.id === s.currentId) ?? null);
export const currentUser = () => { const s = useAuth.getState(); return s.users.find((u) => u.id === s.currentId) ?? null; };
