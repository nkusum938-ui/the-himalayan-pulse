import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeImage } from "@/lib/imageOptimizer";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const postId = formData.get("postId") as string | null;
    const passphrase = formData.get("passphrase") as string | null;

    if (passphrase !== process.env.ADMIN_ACCESS_PASSPHRASE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!file || !postId) {
      return NextResponse.json({ error: "Missing file or postId" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const optimized = await optimizeImage(dataUrl);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const existingImages = (post.images ?? []).filter((img: string) => img.startsWith("http"));

    await prisma.post.update({
      where: { id: postId },
      data: {
        imageUrl: optimized,
        images: existingImages,
      },
    });

    revalidatePath("/");
    revalidatePath(`/news/${post.slug}`);

    // Return the optimized image so client can display it in preview
    return NextResponse.json({ success: true, imageUrl: optimized });
  } catch (err) {
    console.error("[Upload Image Error]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
