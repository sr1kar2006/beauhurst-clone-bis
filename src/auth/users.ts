/** 30 seeded, fictional users in the client organisation (3 Administrators, 27 Members). */
export type Role = 'Administrator' | 'Member';
export type UserStatus = 'Active' | 'Invited' | 'Deactivated';
export interface User { id: string; name: string; email: string; role: Role; status: UserStatus; created: string; team: string }

const NAMES = [
  'Simone Hartley', 'Rajesh Kanwar', 'Imogen Pryce', 'Tobias Wren', 'Aisling Doherty', 'Marcus Oyelaran', 'Felicity Crane', 'Dev Malhotra',
  'Harriet Ashdown', 'Callum Fraser', 'Niamh Ruddock', 'Oluwaseun Adeyemi', 'Beatrix Lowe', 'Kieran Molloy', 'Priya Ramanathan', 'Hugo Stannard',
  'Eleanor Vance', 'Samuel Okafor', 'Rosalind Kemp', 'Jonah Whitlock', 'Freya Lindqvist', 'Arjun Batra', 'Clementine Hale', 'Declan Royce',
  'Martha Penrose', 'Yusuf Demir', 'Georgina Blake', 'Ibrahim Saleh', 'Lucy Fairbairn', 'Theo Marchetti',
];
const TEAMS = ['Mergers', 'Markets', 'Consumer protection', 'Economics', 'Legal', 'Data & analytics'];

export const SEED_USERS: User[] = NAMES.map((name, i) => ({
  id: `u${String(i + 1).padStart(2, '0')}`,
  name,
  email: `${name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /, '.').replace(/ /g, '')}@example.org`,
  role: i < 3 ? 'Administrator' : 'Member',
  status: i === 27 ? 'Invited' : i === 29 ? 'Deactivated' : 'Active',
  created: `2024-${String(1 + (i % 9)).padStart(2, '0')}-${String(3 + i).padStart(2, '0')}`,
  team: TEAMS[i % TEAMS.length],
}));

/** Users who never or rarely sign in (makes the usage reports realistic). */
export const INACTIVE_USERS = new Set(['u24', 'u28', 'u30']);
