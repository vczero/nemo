/**
 * A user object.
 */
export interface User {
  id: string;
  email: string;
  avatarUrl: string;
  nickname: string;
  organization: string;
  membership: 'free' | 'premium' | 'enterprise';
}
