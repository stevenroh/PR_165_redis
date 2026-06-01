import { json } from "@sveltejs/kit";
import { getMessages, saveMessage } from "$lib/server/redis.js";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const messages = await getMessages();
  return json(messages.reverse()); // oldest first
}

export async function POST({ request }) {
  const { username, text } = await request.json();

  if (!text?.trim()) {
    return json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const message = {
    id: uuidv4(),
    username: username || "Anonymous",
    text: text.trim(),
    timestamp: Date.now(),
  };

  await saveMessage(message);
  return json(message, { status: 201 });
}
