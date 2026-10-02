import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "@/models/Student";

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI as string);
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "admin",
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"username" | "password", string> | undefined) {
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin", role: "admin" };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "student",
      name: "Student Credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"identifier" | "password", string> | undefined) {
        if (!credentials?.identifier || !credentials?.password) return null;
        await connectDB();

        const student = await Student.findOne({
          $or: [
            { email: credentials.identifier.toLowerCase().trim() },
            { phone: credentials.identifier.trim() },
          ],
        });
        if (!student) return null;

        const validPassword = await bcrypt.compare(credentials.password, student.passwordHash);
        if (!validPassword) return null;

        if (!student.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return { id: student._id.toString(), name: student.name, email: student.email, role: "student" };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
   callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  events: {
    async signIn({ user }: { user: any }) {
      if (user?.role === "student") {
        await connectDB();
        await Student.findByIdAndUpdate(user.id, { isLoggedIn: true });
      }
    },
    async signOut({ token }: { token: any }) {
      if (token?.role === "student" && token?.sub) {
        await connectDB();
        await Student.findByIdAndUpdate(token.sub, { isLoggedIn: false });
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };