import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllPosts } from "~/lib/blog";

export const Route = createFileRoute("/blog")({
  component: BlogIndex,
  head: () => ({
    meta: [
      { title: "WeekWise Blog — Personal Finance Insights" },
      { name: "description", content: "Practical personal finance insights for busy professionals. AI-powered budgeting tips, spending analysis, and money management advice." },
    ],
  }),
  loader: () => getAllPosts(),
});

function BlogIndex() {
  const posts = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to WeekWise
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          WeekWise Blog
        </h1>
        <p className="mt-2 text-gray-500">
          Practical personal finance insights for busy professionals
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.slug} className="card transition-shadow hover:shadow-md">
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <time dateTime={post.date}>{post.date}</time>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {post.excerpt}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}