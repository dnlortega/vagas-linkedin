import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const runtime = "nodejs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com";
        const adminPass = process.env.ADMIN_PASSWORD || "admin";

        if (credentials.email === adminEmail && credentials.password === adminPass) {
          return { id: "1", name: "Administrador", email: credentials.email };
        }
        
        return null;
      }
    })
  ],
  session: { 
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 ano para evitar deslogar com facilidade
  },
  secret: process.env.NEXTAUTH_SECRET || "chave_secreta_padrao_para_desenvolvimento",
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
