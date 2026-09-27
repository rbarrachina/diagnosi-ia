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

  if (!request.body) {
    if (!options.allowEmpty) {
      throw new RequestBodyError("El cos de la petició és obligatori");
    }
  }

  let text = "";
  if (request.body) {
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytesRead = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > options.maxBytes) {
          await reader.cancel();
          throw new RequestBodyError("El cos de la petició és massa gran");
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      if (error instanceof RequestBodyError) throw error;
      throw new RequestBodyError("El cos de la petició ha de ser un JSON vàlid");
    } finally {
      reader.releaseLock();
    }
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
