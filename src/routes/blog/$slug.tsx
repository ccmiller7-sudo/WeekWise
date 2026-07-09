import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPostBySlug } from "~/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  head: ({ loaderData }) => {
    const post = loaderData;
    if (!post) {
      return {
        meta: [
          { title: "Post Not Found — WeekWise Blog" },
          { name: "description", content: "The blog post you're looking for doesn't exist." },
        ],
      };
    }
    return {
      meta: [
        { title: `${post.title} — WeekWise Blog` },
        { name: "description", content: post.excerpt },
        { name: "og:title", content: post.title },
        { name: "og:description", content: post.excerpt },
        { name: "og:type", content: "article" },
        { name: "og:url", content: `https://6519b91b66901f3f0d85d0e9e833a163.ctonew.app/blog/${post.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.excerpt },
      ],
    };
  },
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return post;
  },
  errorComponent: () => (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl">📝</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Post not found</h1>
      <p className="mt-2 text-gray-500">This blog post doesn't exist or may have been removed.</p>
      <Link to="/blog" className="btn-primary mt-6">
        ← Back to Blog
      </Link>
    </div>
  ),
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        <span>←</span>
        <span>Back to all posts</span>
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <time dateTime={post.date}>{post.date}</time>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-3 text-lg leading-relaxed text-gray-500">{post.excerpt}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="blog-content">
        <div
          className="space-y-4 text-gray-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:text-indigo-600 [&_a]:underline [&_a:hover]:text-indigo-800 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-6 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_pre]:rounded-xl [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-gray-700 [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-gray-600 [&_img]:rounded-xl [&_img]:my-6 [&_hr]:my-8 [&_hr]:border-gray-200"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 text-center">
        <p className="text-lg font-semibold text-gray-800">Ready to take control of your money?</p>
        <p className="mt-1 text-sm text-gray-500">Get your spending sorted in one minute a week with WeekWise.</p>
        <Link to="/auth" className="btn-primary mt-4 inline-block">Start Free Trial</Link>
      </div>
    </div>
  );
}