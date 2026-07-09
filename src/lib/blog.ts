import { createServerFn } from "@tanstack/react-start";
import matter from "gray-matter";
import { Marked } from "marked";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const marked = new Marked();

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: string;
  html: string;
  readTime: string;
}

const BLOG_DIR = join(process.cwd(), "src", "content", "blog");

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function parsePost(file: string): BlogPost {
  const raw = readFileSync(join(BLOG_DIR, file), "utf-8");
  const { data, content } = matter(raw);
  const html = marked.parse(content) as string;
  const slug = data.slug || file.replace(/\.md$/, "");
  return {
    slug,
    title: data.title || "Untitled",
    date: data.date ? new Date(data.date).toISOString().split("T")[0] : "Unknown",
    excerpt: data.excerpt || "",
    tags: data.tags || [],
    content,
    html,
    readTime: estimateReadTime(content),
  };
}

export const getAllPosts = createServerFn({ method: "GET" }).handler(async () => {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => parsePost(file));
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

export const getPostBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    try {
      const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
      const file = files.find((f) => {
        const slugFromFile = getSlugFromFile(f);
        return f.replace(/\.md$/, "") === slug || slugFromFile === slug;
      });
      if (!file) return null;
      return parsePost(file);
    } catch {
      return null;
    }
  });

function getSlugFromFile(filename: string): string {
  try {
    const raw = readFileSync(join(BLOG_DIR, filename), "utf-8");
    const frontmatter = matter(raw);
    return frontmatter.data.slug || filename.replace(/\.md$/, "");
  } catch {
    return filename.replace(/\.md$/, "");
  }
}