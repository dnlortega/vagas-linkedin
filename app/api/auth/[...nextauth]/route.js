import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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
          throw new Error("Dados inválidos");
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        const passwordsMatch = await bcrypt.compare(credentials.password, user.senha);
        if (!passwordsMatch) {
          throw new Error("Senha incorreta");
        }

        return { id: user.id, name: user.nome, email: user.email };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "chave_secreta_padrao_para_desenvolvimento",
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
