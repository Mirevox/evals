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

  it("keeps prompt and completion distinct from OTel span events", async () => {
    const store = new MemoryStore();
    const result = await captureOtel(store, {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  traceId: "t1",
                  spanId: "evt1",
                  name: "chat",
                  attributes: [
                    {
                      key: "gen_ai.system",
                      value: { stringValue: "local" },
                    },
                    {
                      key: "gen_ai.request.model",
                      value: { stringValue: "m" },
                    },
                  ],
                  events: [
                    {
                      name: "gen_ai.content.prompt",
                      attributes: [
                        {
                          key: "content",
                          value: { stringValue: "Prompt via event" },
                        },
                      ],
                    },
                    {
                      name: "gen_ai.content.completion",
                      attributes: [
                        {
                          key: "content",
                          value: { stringValue: "Completion via event" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.accepted).toBe(1);
    const turn = (await store.listTurns())[0];
    expect(turn.prompt).toBe("Prompt via event");
    expect(turn.response).toBe("Completion via event");
  });

  it("auto-judges captured webhook turns when autoJudge is enabled", async () => {
    const store = new MemoryStore();
    const result = await captureWebhook(
      store,
      {
        conversationId: "c-auto",
        model: "m1",
        prompt: "Say hello",
        response: "Hello there!",
        provider: "local",
      },
      { autoJudge: true },
    );
    expect(result.accepted).toBe(1);
    expect(result.evalIds.length).toBe(1);
    expect((await store.listEvals()).length).toBe(1);
  });
});
