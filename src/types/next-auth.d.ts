import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      emailVerified?: Date | null;
      twoFactorRequired?: boolean;
      twoFactorEnabled?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    emailVerified?: Date | null;
    twoFactorRequired?: boolean;
    twoFactorEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string;
    emailVerified?: Date | null;
    twoFactorRequired?: boolean;
    twoFactorEnabled?: boolean;
  }
}
