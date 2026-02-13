import { Subtitle } from "../types";

export const subtitleService = {
  /**
   * Simulates transcribing a video file using Vosk engine logic.
   * In a real app, this would upload the file to Python backend.
   */
  transcribeVideo: async (file: File): Promise<Subtitle[]> => {
    return new Promise((resolve) => {
        // Simulate processing delay
        setTimeout(() => {
            // Generate realistic mock subtitles based on common explainer video structure
            const mockSubtitles: Subtitle[] = [
                { id: '1', startTime: 0.5, endTime: 3.0, text: "Welcome to this specialized video presentation." },
                { id: '2', startTime: 3.2, endTime: 5.5, text: "Today, we are exploring the power of AI automation." },
                { id: '3', startTime: 6.0, endTime: 8.5, text: "Subtitle generation is traditionally a slow process." },
                { id: '4', startTime: 9.0, endTime: 12.0, text: "But with tools like Vosk and DocuGen, it is instant." },
                { id: '5', startTime: 12.5, endTime: 15.0, text: "This technology ensures accessibility for everyone." },
                { id: '6', startTime: 15.5, endTime: 18.0, text: "You can download these captions as an SRT file." },
                { id: '7', startTime: 18.5, endTime: 21.0, text: "Or burn them directly into your final video render." },
            ];
            resolve(mockSubtitles);
        }, 2500);
    });
  },

  /**
   * Generates a standard SRT string from subtitle array.
   */
  generateSRT: (subtitles: Subtitle[]): string => {
    // Helper to format seconds to HH:MM:SS,ms
    const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setMilliseconds(seconds * 1000);
        const iso = date.toISOString();
        // Extract HH:MM:SS.mmm and replace dot with comma for SRT format
        return iso.substr(11, 12).replace('.', ',');
    };

    return subtitles.map((sub, index) => {
        return `${index + 1}\n${formatTime(sub.startTime)} --> ${formatTime(sub.endTime)}\n${sub.text}\n`;
    }).join('\n');
  }
};