import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        });

        if (!usuario) {
          throw new Error("Usuário não encontrado.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.senha, usuario.senha);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta.");
        }

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
