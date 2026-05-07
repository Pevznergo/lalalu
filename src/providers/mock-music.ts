import type { GeneratedTrack, MusicProvider } from "@/core/types";

export const mockMusicProvider: MusicProvider = {
  async submitSong() {
    return {
      providerTaskId: `mock-task-${Date.now()}`,
      status: "submitted"
    };
  },

  async getMockTracks(taskId: string): Promise<GeneratedTrack[]> {
    return [0, 1].map((variantIndex) => ({
      variantIndex,
      title: `Mock birthday song ${variantIndex + 1}`,
      sourceUrl: `mock://${taskId}/${variantIndex}.mp3`,
      mimeType: "audio/mpeg",
      sizeBytes: 1024,
      durationSec: 90
    }));
  }
};
