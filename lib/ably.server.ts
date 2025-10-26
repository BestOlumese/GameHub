// lib/ably.server.ts
import Ably from "ably";

if (!process.env.ABLY_API_KEY) throw new Error("Missing ABLY_API_KEY env var");

export const ablyRest = new Ably.Rest(process.env.ABLY_API_KEY);

// convenience publish
export async function publishToChannel(channelName: string, event: string, data: any) {
  const ch = ablyRest.channels.get(channelName);
  await ch.publish(event, data);
}
