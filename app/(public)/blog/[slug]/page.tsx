/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogRepository } from "../../../../repositories/blog.repository";
import { connectDB } from "../../../../config/db";
import "../../../../models/category.model";
import "../../../../models/author.model";

// Dynamic metadata generation for SEO
export async function generateMetadata(segmentData: any) {
  const params = await segmentData.params;
  const { slug } = params;
  await connectDB();
  const post = await blogRepository.findOne({ slug });
  return {
    title: post ? `${post.title} | TrueLern Blog` : "Blog | TrueLern",
    description: post?.seoDescription || "Read the latest engineering articles on TrueLern.",
  };
}

export default async function BlogDetailsPage(segmentData: any) {
  const params = await segmentData.params;
  const { slug } = params;
  await connectDB();
  const post = (await blogRepository.findOne({ slug }, { populate: ["category", "author"] } as any)) as any;

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      <Link href="/blog" className="text-xs font-semibold text-indigo-600 hover:underline mb-8 block">&larr; Back to all blogs</Link>

      <header className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{post.category?.name || "Strategy"}</span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 leading-tight">{post.title}</h1>
        
        <div className="mt-8 pt-6 border-y border-gray-200 flex items-center gap-4 py-4">
          {post.author?.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover" />
          )}
          <div>
            <span className="font-bold text-white block text-sm">{post.author?.name}</span>
            <span className="text-gray-400 text-xs">{post.author?.bio || "Instructor"}</span>
          </div>
          <div className="ml-auto text-xs text-gray-400 text-right">
            <span>{post.readingTime || 5} min read</span>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <div className="prose prose-invert max-w-none text-gray-600 leading-relaxed text-base space-y-6">
        {post.content.split("\n\n").map((para: string, idx: number) => {
          if (para.startsWith("### ")) {
            return <h3 key={idx} className="text-xl font-bold text-gray-900 pt-4">{para.replace("### ", "")}</h3>;
          }
          if (para.startsWith("#### ")) {
            return <h4 key={idx} className="text-lg font-bold text-gray-900 pt-2">{para.replace("#### ", "")}</h4>;
          }
          if (para.startsWith("- ")) {
            return (
              <ul key={idx} className="list-disc pl-6 space-y-1">
                {para.split("\n").map((li, lidx) => (
                  <li key={lidx}>{li.replace("- ", "")}</li>
                ))}
              </ul>
            );
          }
          return <p key={idx}>{para}</p>;
        })}
      </div>
    </article>
  );
}
