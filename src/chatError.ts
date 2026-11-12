import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

export const CHAT_ERROR_MESSAGE =
  "The AI response failed. Please try again. If the problem persists, check the Worker logs and AI configuration.";

export function chatErrorText(error: unknown): string {
  const status =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : undefined;
  console.error(
    "Chat response failed",
    status === undefined ? "" : `HTTP ${status}`
  );
  return CHAT_ERROR_MESSAGE;
}

export function chatErrorResponse(error: unknown): Response {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute() {
        throw error;
      },
      onError: chatErrorText
    })
  });
}
