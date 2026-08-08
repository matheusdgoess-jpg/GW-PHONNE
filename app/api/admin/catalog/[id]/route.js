import { NextResponse } from 'next/server';
import { updateCatalogItem, deleteCatalogItem } from '@/lib/data';

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const item = await updateCatalogItem(id, body);
    return NextResponse.json({ item });
  } catch (err) {
    console.error(err);
    const status = /não encontrado/i.test(err.message) ? 404 : 500;
    return NextResponse.json({ error: err.message || 'Falha ao atualizar item.' }, { status });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    await deleteCatalogItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao remover item.' }, { status: 500 });
  }
}
