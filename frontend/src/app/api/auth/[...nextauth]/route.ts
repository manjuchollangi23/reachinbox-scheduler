import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import axios from 'axios';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
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
        // Find user by email in backend to get the actual ID if needed, 
        // For simplicity we will use the email as senderId since it's unique, or fetch the ID from DB.
        // Let's assume frontend passes email as senderId to backend APIs for simplicity, 
        // or we fetch user from our backend DB.
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
  secret: process.env.NEXTAUTH_SECRET || "super-secret",
})

export { handler as GET, handler as POST }
