import { NextResponse } from 'next/server';
import { getCatalog, addCatalogItem } from '@/lib/data';

export async function GET() {
  try {
    const items = await getCatalog();
    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao carregar catálogo.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.model?.trim()) {
      return NextResponse.json({ error: 'Informe o modelo do aparelho.' }, { status: 400 });
    }
    const item = await addCatalogItem(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Falha ao criar item.' }, { status: 500 });
  }
}
