// Dynamic sitemap generator — automatically includes all blog posts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getAllPosts } from "~/lib/blog";

const BASE_URL = "https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app";

export const APIRoute = createAPIFileRoute("/api/sitemap.xml")({
  GET: async () => {
    const posts = await getAllPosts();

    const urls = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/auth", changefreq: "monthly", priority: "0.7" },
      { loc: "/pricing", changefreq: "monthly", priority: "0.8" },
      { loc: "/blog", changefreq: "weekly", priority: "0.9" },
      ...posts.map((post) => ({
        loc: `/blog/${post.slug}`,
        changefreq: "monthly" as const,
        priority: "0.6",
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  },
});