import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { nome, email, senha } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json({ message: "Dados incompletos" }, { status: 400 });
    }

    const existe = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existe) {
      return NextResponse.json({ message: "E-mail já cadastrado" }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash
      }
    });

    return NextResponse.json({ message: "Usuário cadastrado com sucesso", id: usuario.id }, { status: 201 });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ message: "Erro interno no servidor" }, { status: 500 });
  }
}
