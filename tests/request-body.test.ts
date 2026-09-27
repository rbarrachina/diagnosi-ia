import { readJsonRequestBody, RequestBodyError } from "@/lib/http/request";

function jsonRequest(body: string, headers?: HeadersInit): Request {
  return new Request("http://localhost/api/test", {
    body,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    method: "POST",
  });
}

describe("readJsonRequestBody", () => {
  it("parses bounded JSON payloads", async () => {
    await expect(
      readJsonRequestBody(jsonRequest('{"ok":true}'), { maxBytes: 32 }),
    ).resolves.toEqual({ ok: true });
  });

  it("rejects oversized, invalid and non-JSON payloads", async () => {
    await expect(
      readJsonRequestBody(jsonRequest('{"tooLarge":true}', { "Content-Length": "1024" }), {
        maxBytes: 16,
      }),
    ).rejects.toBeInstanceOf(RequestBodyError);

    await expect(
      readJsonRequestBody(jsonRequest("{"), { maxBytes: 16 }),
    ).rejects.toBeInstanceOf(RequestBodyError);

    await expect(
      readJsonRequestBody(
        new Request("http://localhost/api/test", {
          body: "{}",
          headers: { "Content-Type": "text/plain" },
          method: "POST",
        }),
        { maxBytes: 16 },
      ),
    ).rejects.toBeInstanceOf(RequestBodyError);
  });

  it("allows empty bodies only when explicitly configured", async () => {
    await expect(
      readJsonRequestBody(jsonRequest(""), { allowEmpty: true, maxBytes: 16 }),
    ).resolves.toEqual({});

    await expect(
      readJsonRequestBody(jsonRequest(""), { maxBytes: 16 }),
    ).rejects.toBeInstanceOf(RequestBodyError);
  });

  it("rejects a streamed body as soon as it exceeds the byte limit", async () => {
    const request = new Request("http://localhost/api/test", {
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"first":1}'));
          controller.enqueue(new TextEncoder().encode('{"second":2}'));
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      // Node's Request implementation requires this for streaming uploads.
      // @ts-expect-error duplex is supported by the runtime Request constructor.
      duplex: "half",
    });

    await expect(
      readJsonRequestBody(request, { maxBytes: 12 }),
    ).rejects.toBeInstanceOf(RequestBodyError);
  });
});
