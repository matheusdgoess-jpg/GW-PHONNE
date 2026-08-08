import { NextResponse } from 'next/server';
import { getPosts, addPost } from '@/lib/data';

export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao carregar as dicas.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.title?.trim()) {
      return NextResponse.json({ error: 'Informe o título da dica.' }, { status: 400 });
    }
    const post = await addPost(body);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao criar a dica.' }, { status: 500 });
  }
}
