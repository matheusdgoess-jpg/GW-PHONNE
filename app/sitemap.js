import { getPublishedPosts } from '@/lib/data';

const SITE_URL = 'https://gw-phonne.vercel.app';

export default async function sitemap() {
  let posts = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    // se o Blob falhar, o sitemap ainda sai com as páginas fixas
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/dicas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/dicas/${post.slug}`,
      lastModified: post.createdAt ? new Date(post.createdAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
