import { Realtime, InferRealtimeEvents } from "@upstash/realtime";
import { Redis } from "@upstash/redis";
import { UIMessageChunk } from "ai";
import z from "zod/v4";
/**
 * Initializes Upstash Redis + Realtime for workflow streaming.
 *
 * Features:
 * - Connects to Upstash Redis
 * - Defines typed realtime workflow events
 * - Streams workflow/AI message chunks in real time
 * - Provides TypeScript-safe event inference
 *
 * Event Schema:
 * - workflow.chunk → streamed UI message chunk
 *
 * Exports:
 * - redis: Redis client instance
 * - realtime: Realtime event system
 * - RealtimeEvents: inferred TypeScript event types
 */

// 1. Connect to Upstash Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 2. Define realtime workflow event schema
const schema = {
  workflow: {
    chunk: z.any() as z.ZodType<UIMessageChunk>,
  },
};

// 3. Create realtime event system using Redis
export const realtime = new Realtime({ schema, redis });

// 4. Infer TypeScript-safe realtime event types
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
