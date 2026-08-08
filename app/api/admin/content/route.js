import { NextResponse } from 'next/server';
import { getContent, saveContent } from '@/lib/data';

export async function GET() {
  try {
    const content = await getContent();
    return NextResponse.json({ content });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao carregar conteúdo.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const saved = await saveContent(body);
    return NextResponse.json({ content: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao salvar conteúdo.' }, { status: 500 });
  }
}
