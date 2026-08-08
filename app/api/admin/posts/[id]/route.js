import { NextResponse } from 'next/server';
import { updatePost, deletePost } from '@/lib/data';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const post = await updatePost(id, body);
    return NextResponse.json({ post });
  } catch (err) {
    console.error(err);
    const status = /não encontrada/i.test(err.message) ? 404 : 500;
    return NextResponse.json({ error: err.message || 'Falha ao atualizar a dica.' }, { status });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao remover a dica.' }, { status: 500 });
  }
}
