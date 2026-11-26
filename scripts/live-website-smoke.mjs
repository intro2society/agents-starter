const base = "https://theintro2society.org";

async function expectOk(path, options) {
  const response = await fetch(base + path, options);
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
  return { response, body };
}

const llms = await expectOk("/llms.txt");
if (!llms.body.includes("The Intro2Society")) {
  throw new Error("llms.txt did not contain the expected site identity");
}
console.log("PASS: public site discovery file");

const models = await expectOk("/v1/models");
const modelData = JSON.parse(models.body);
if (!Array.isArray(modelData.data) || !modelData.data.length) {
  throw new Error("Model listing did not return any models");
}
console.log("PASS: model discovery endpoint");

const chat = await expectOk("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{
      role: "user",
      content: "Use current public-web research to explain Cloudflare Browser Rendering. Give a short answer and include the source URLs you consulted."
    }]
  })
});
const chatData = JSON.parse(chat.body);
const answer = chatData.choices?.[0]?.message?.content;
if (typeof answer !== "string" || answer.length < 30) {
  throw new Error("Chat endpoint did not return a substantive assistant response");
}
if (!/https?:\/\//i.test(answer)) {
  throw new Error("Chat response did not cite any source URL; current web research could not be verified from the answer");
}
console.log("PASS: website chat returned a researched answer with source URL(s)");

const image = await expectOk("/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "flux",
    stream: false,
    messages: [{
      role: "user",
      content: "Create a clean, simple square editorial icon of a magnifying glass over a small globe, white background, crisp vector-like style."
    }]
  })
});
const imageData = JSON.parse(image.body);
const imageText = imageData.choices?.[0]?.message?.content || "";
const match = imageText.match(/!\[Image\]\((https:\/\/[^)]+)\)/);
if (!match) {
  throw new Error("Image endpoint did not return a generated image URL");
}
const imageResponse = await fetch(match[1]);
if (!imageResponse.ok || !/image\//i.test(imageResponse.headers.get("content-type") || "")) {
  throw new Error(`Generated image could not be retrieved: HTTP ${imageResponse.status}`);
}
console.log("PASS: image generation returned a retrievable image");
console.log(JSON.stringify({
  chatCharacters: answer.length,
  citedUrls: (answer.match(/https?:\/\/[^\s)]+/g) || []).slice(0, 5),
  imageStatus: imageResponse.status,
  imageContentType: imageResponse.headers.get("content-type")
}, null, 2));
