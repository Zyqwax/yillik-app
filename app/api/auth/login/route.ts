import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Kullanıcı adı ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Geçersiz kullanıcı adı veya şifre.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Geçersiz kullanıcı adı veya şifre.' },
        { status: 401 }
      );
    }

    await setSession(user.id, user.username, user.name);

    return NextResponse.json({ message: 'Giriş başarılı.', user: { id: user.id, username: user.username, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Bir hata oluştu.' },
      { status: 500 }
    );
  }
}
