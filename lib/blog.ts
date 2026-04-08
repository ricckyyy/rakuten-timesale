import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  content: string;
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8');
      const { data, content } = matter(raw);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        category: data.category as string,
        tags: (data.tags as string[]) || [],
        content,
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    category: data.category as string,
    tags: (data.tags as string[]) || [],
    content,
  };
}
