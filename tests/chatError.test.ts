import assert from "node:assert/strict";
import test from "node:test";
import { streamText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import {
  CHAT_ERROR_MESSAGE,
  chatErrorResponse,
  chatErrorText
} from "../src/chatError.ts";

test("pre-stream failures return a safe chat stream error", async () => {
  const body = await chatErrorResponse(
    new Error("private setup details")
  ).text();
  assert.match(body, /"type":"error"/);
  assert.ok(body.includes(CHAT_ERROR_MESSAGE));
  assert.ok(!body.includes("private setup details"));
});

test("provider failures are reported through the chat stream without leaking details", async () => {
  const workersai = createWorkersAI({
    binding: {
      run: async () => {
        throw new Error("private provider details");
      }
    } as never
  });
  const response = streamText({
    model: workersai("@cf/qwen/qwen2.5-coder-32b-instruct"),
    prompt: "Hello",
    maxRetries: 0,
    onError: () => {}
  }).toUIMessageStreamResponse({ onError: chatErrorText });
  const body = await response.text();
  assert.match(body, /"type":"error"/);
  assert.ok(body.includes(CHAT_ERROR_MESSAGE));
  assert.ok(!body.includes("private provider details"));
});

test("successful Workers AI responses still stream to the chat", async () => {
  const workersai = createWorkersAI({
    binding: {
      run: async () =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'data: {"response":"Hello!"}\n\ndata: [DONE]\n\n'
              )
            );
            controller.close();
          }
        })
    } as never
  });
  const response = streamText({
    model: workersai("@cf/qwen/qwen2.5-coder-32b-instruct"),
    prompt: "Hello"
  }).toUIMessageStreamResponse({ onError: chatErrorText });
  const body = await response.text();
  assert.match(body, /"delta":"Hello!"/);
  assert.doesNotMatch(body, /"type":"error"/);
});
