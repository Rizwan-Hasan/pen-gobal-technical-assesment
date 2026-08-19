import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/role";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!submission) {
    return new Response("Not found", { status: 404 });
  }

  if (
    session.role === "STUDENT" &&
    session.actingStudentId !== submission.studentId
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const absolute = path.join(process.cwd(), submission.filePath);
  try {
    await stat(absolute);
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": submission.mimeType,
      "Content-Disposition": `attachment; filename="${submission.fileName}"`,
    },
  });
}
