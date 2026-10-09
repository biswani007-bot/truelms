/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { blogRepository } from "../../../repositories/blog.repository";
import { connectDB } from "../../../config/db";
import "../../../models/category.model";
import "../../../models/author.model";

export const metadata = {
  title: "Engineering Blog | TrueLern",
  description: "Read engineering blogs, architecture deep dives, and product designs written by TrueLern faculty.",
};

export default async function BlogPage() {
  await connectDB();
  const posts = await blogRepository.findMany({}, { populate: ["category", "author"] } as any);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white">Engineering Blog</h1>
        <p className="mt-3 text-gray-500 text-sm">
          Technical insights, system design reviews, and modern software guidelines written by active cohort developers.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No blog posts found. Seed the database to view.</div>
      ) : (
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post: any) => (
            <article key={post._id} className="group flex flex-col bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden transition-all duration-300">
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  {post.category?.name || "Uncategorized"}
                </span>
                <h3 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="mt-3 text-gray-500 text-xs line-clamp-3 leading-relaxed">
                  {post.seoDescription || "Explore dynamic platform code blogs..."}
                </p>
                <div className="mt-auto pt-6 flex items-center gap-3 border-t border-gray-100">
                  {post.author?.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div className="text-xs">
                    <span className="font-semibold text-white block">{post.author?.name || "Author"}</span>
                    <span className="text-gray-400">{post.readingTime || 5} min read</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
