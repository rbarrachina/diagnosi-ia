export class RequestBodyError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function readJsonRequestBody(
  request: Request,
  options: {
    maxBytes: number;
    allowEmpty?: boolean;
  },
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > options.maxBytes) {
    throw new RequestBodyError("El cos de la petició és massa gran");
  }

  const text = await request.text();

  if (new TextEncoder().encode(text).byteLength > options.maxBytes) {
    throw new RequestBodyError("El cos de la petició és massa gran");
  }

  if (!text.trim()) {
    if (options.allowEmpty) {
      return {};
    }

    throw new RequestBodyError("El cos de la petició és obligatori");
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    throw new RequestBodyError("El cos de la petició ha de ser JSON");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new RequestBodyError("El cos de la petició ha de ser un JSON vàlid");
  }
}
