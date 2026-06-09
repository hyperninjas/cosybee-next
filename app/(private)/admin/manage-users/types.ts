export type Role = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  banned?: boolean | null;
  createdAt: Date;
}
