/** Shared session config for the Automate-page ELSIAA Secretary voice agent. */
// Edit the prompt in secretary-instructions.md — this file only wires the session.
import secretaryInstructions from "./secretary-instructions.md?raw";

export function getSecretaryRealtimeSession() {
  const model = (process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1").trim();
  const voice = (process.env.OPENAI_REALTIME_VOICE || "marin").trim();

  return {
    type: "realtime" as const,
    model,
    instructions: secretaryInstructions.trim(),
    output_modalities: ["audio"] as string[],
    audio: {
      input: {
        turn_detection: {
          type: "semantic_vad",
        },
        transcription: {
          model: "gpt-4o-mini-transcribe",
        },
      },
      output: {
        voice,
      },
    },
  };
}
