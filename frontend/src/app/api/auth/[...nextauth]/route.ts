import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import axios from 'axios';

const handler = NextAuth({
  debug: true, // Enable debug logging to see detailed OAuth errors
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    // Credentials provider allowing any new or existing user to sign in
    CredentialsProvider({
      name: "Email Sign In",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials.email.includes('@')) {
          const email = credentials.email.trim().toLowerCase();
          const rawName = email.split('@')[0];
          // Format name (e.g. "john.doe" -> "John Doe")
          const name = rawName
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

          return {
            id: email,
            name: name,
            email: email,
            image: null,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Sync user with backend
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/sync`, {
          email: user.email,
          name: user.name,
          avatar: user.image,
        });
        return true;
      } catch (e) {
        console.error("Failed to sync user with backend", e);
        return true; // Still allow login for demo purposes
      }
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/sync`, {
            email: session.user.email,
            name: session.user.name,
            avatar: session.user.image,
          });
          (session.user as any).id = res.data.user.id;
        } catch(e) {
          (session.user as any).id = session.user.email;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret",
})

export { handler as GET, handler as POST }
