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
});
