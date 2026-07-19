import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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

        try {
          const user = await prisma.usuario.findUnique({
            where: { email: credentials.email }
          });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(credentials.password, user.senha);
          if (!passwordsMatch) return null;

          return { id: user.id, name: user.nome, email: user.email };
        } catch (err) {
          console.error("[NextAuth] Erro:", err);
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "chave_secreta_padrao_para_desenvolvimento",
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
