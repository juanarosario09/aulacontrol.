import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const cleanEmail = email.trim();
    const user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({
        error: `No se encontró ningún usuario con el correo ${cleanEmail}`,
      }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: `Contraseña actualizada exitosamente para ${user.email}. Ya puedes iniciar sesión con tu nueva contraseña.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al actualizar contraseña' }, { status: 500 });
  }
}
