import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }) {
      if (user.email && !(user as any).emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
    async linkAccount({ user, account }) {
      if (account.provider !== "credentials" && user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userId: { label: "User ID", type: "text" },
        twoFactorVerified: { label: "2FA Verified", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.userId && credentials?.twoFactorVerified === "true") {
          const user = await prisma.user.findUnique({
            where: { id: credentials.userId as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              emailVerified: true,
              twoFactorEnabled: true,
            },
          });

          if (!user?.twoFactorEnabled) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            passwordHash: true,
            twoFactorEnabled: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        if (user.emailVerified === null) {
          throw new Error("Email non vérifié. Vérifiez votre boîte mail.");
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          return null;
        }

        if (user.twoFactorEnabled && !credentials.twoFactorVerified) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, "")
            : undefined,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        return true;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified;
        if ("twoFactorRequired" in user) {
          token.twoFactorRequired = (user as any).twoFactorRequired;
        }
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, emailVerified: true, twoFactorEnabled: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        (session.user as any).role = token.role ?? undefined;
        (session.user as any).emailVerified = token.emailVerified ?? null;
        (session.user as any).twoFactorRequired =
          token.twoFactorRequired ?? undefined;
        (session.user as any).twoFactorEnabled =
          token.twoFactorEnabled ?? undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
