import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/lib/store/memory-store";
import { captureOtel, captureWebhook } from "../src/modules/capture";

describe("capture", () => {
  it("persists webhook turns", async () => {
    const store = new MemoryStore();
    const result = await captureWebhook(store, {
      conversationId: "c1",
      model: "m1",
      prompt: "hi",
      response: "hello",
      provider: "local",
    });
    expect(result.accepted).toBe(1);
    expect((await store.listTurns()).length).toBe(1);
  });

  it("extracts gen_ai spans from OTLP JSON and skips others", async () => {
    const store = new MemoryStore();
    const result = await captureOtel(store, {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  traceId: "abc",
                  spanId: "s1",
                  name: "chat",
                  attributes: [
                    { key: "gen_ai.system", value: { stringValue: "local" } },
                    {
                      key: "gen_ai.request.model",
                      value: { stringValue: "llama" },
                    },
                    {
                      key: "gen_ai.prompt",
                      value: { stringValue: "ping" },
                    },
                    {
                      key: "gen_ai.completion",
                      value: { stringValue: "pong" },
                    },
                  ],
                },
                {
                  spanId: "s2",
                  name: "http.request",
                  attributes: [
                    { key: "http.method", value: { stringValue: "GET" } },
                  ],
                },
                {
                  traceId: "abc",
                  spanId: "s3",
                  name: "gen_ai.chat",
                  attributes: [
                    { key: "gen_ai.system", value: { stringValue: "bedrock" } },
                    {
                      key: "gen_ai.request.model",
                      value: { stringValue: "claude" },
                    },
                    { key: "gen_ai.prompt", value: { stringValue: "q" } },
                    { key: "gen_ai.completion", value: { stringValue: "a" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.accepted).toBe(2);
    expect((await store.listTurns()).map((t) => t.spanId).sort()).toEqual([
      "s1",
      "s3",
    ]);
  });

  it("deduplicates by spanId", async () => {
    const store = new MemoryStore();
    const payload = {
      conversationId: "c1",
      spanId: "dup",
      model: "m",
      prompt: "p",
      response: "r",
    };
    await captureWebhook(store, payload);
    const second = await captureWebhook(store, payload);
    expect(second.accepted).toBe(0);
    expect(second.skipped).toBe(1);
  });
});
