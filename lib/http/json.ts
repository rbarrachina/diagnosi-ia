import { ZodError } from "zod";

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, init);
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, { status });
}

export function parseJsonError(error: unknown): Response {
  if (error instanceof ZodError) {
    return errorResponse("La petició no és vàlida.", 400);
  }

  return errorResponse("S'ha produït un error inesperat al servidor.", 500);
}
