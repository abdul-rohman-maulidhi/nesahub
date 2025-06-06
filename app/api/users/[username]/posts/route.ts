import { db } from "@/lib/db";
import { getPosts } from "@/services/post";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { userId } = await auth();
    const { username } = await params;

    let internalUserId: number | null = null;

    if (userId) {
      const user = await db.user.findUnique({
        where: { clerk_id: userId },
        select: { id: true },
      });
      internalUserId = user?.id ?? null;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const posts = await getPosts({
      where: {
        author: {
          username: username,
        },
      },
      limit,
      skip,
      userId: internalUserId,
    });

    for (const post of posts as any[]) {
      post.is_liked = post.liked_by?.length > 0;
      post.is_disliked = post.disliked_by?.length > 0;
      post.is_reposted = post.reposted_by?.length > 0;
      post.is_saved = post.saved_by?.length > 0;

      delete post.liked_by;
      delete post.disliked_by;
      delete post.reposted_by;
      delete post.saved_by;
    }

    return NextResponse.json({
      message: "Posts fetched successfully",
      data: posts,
      meta: {
        page,
        limit,
      },
    });
  } catch (error) {
    console.log("Error: Error while fetching posts:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
