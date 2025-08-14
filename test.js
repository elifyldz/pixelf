import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // key'i terminalde environment olarak ver

async function runTest() {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Merhaba, beni duyuyor musun?" }]
  });
  console.log(completion.choices[0].message);
}

runTest();
