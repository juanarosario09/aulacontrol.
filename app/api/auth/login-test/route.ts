import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Faltan credenciales' }, { status: 400 });
    }

    const cleanEmail = email.trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: `No existe ningún usuario registrado con el correo: ${cleanEmail}`,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña ingresada no coincide con la guardada en la base de datos.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Credenciales 100% válidas en la base de datos',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `Error al consultar la base de datos: ${err?.message || err}`,
    }, { status: 500 });
  }
}
