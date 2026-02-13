import { Project, RenderJob } from "../types";

// Mock backend state store
const jobs: Record<string, RenderJob> = {};

export const videoRenderingService = {
  /**
   * Initiates a video rendering job.
   * In a real app, this would POST to a Python/FastAPI endpoint running Celery/Redis.
   */
  startRender: async (project: Project): Promise<string> => {
    const jobId = `job_${Date.now()}`;
    jobs[jobId] = {
      id: jobId,
      status: 'queued',
      progress: 0,
      currentStep: 'Initializing backend engine...',
      logs: ['Received project data', `Project ID: ${project.id}`, `Resolution: 1080p`, `Format: MP4 (H.264)`]
    };
    
    // Start background simulation
    simulateBackendProcessing(jobId, project);
    
    return jobId;
  },

  /**
   * Polls for the current status of a job.
   */
  getJobStatus: async (jobId: string): Promise<RenderJob> => {
    return jobs[jobId];
  }
};

/**
 * Simulates the steps of a FFmpeg/MoviePy video rendering pipeline.
 */
const simulateBackendProcessing = async (jobId: string, project: Project) => {
    const job = jobs[jobId];
    if (!job) return;

    const update = (progress: number, step: string, log: string) => {
        job.progress = progress;
        job.currentStep = step;
        job.logs.push(`[${new Date().toLocaleTimeString()}] ${log}`);
        job.status = 'processing';
    };

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const sceneCount = project.scenes.length;

    // Step 1: Analyze & Prepare
    await delay(1000);
    update(5, "Analyzing Assets", "Validating media assets and manifest...");
    
    // Step 2: Download Assets
    await delay(1500);
    update(15, "Fetching Media", `Downloading ${sceneCount} video clips/images to render node...`);
    job.logs.push("Cache hit: 0 assets. Downloading all from source.");

    // Step 3: Audio Synthesis & Mixing
    await delay(2000);
    update(30, "Audio Engineering", "Merging TTS tracks with background score...");
    if (project.backgroundMusicUrl) {
        job.logs.push(`Mixing background track: ${project.backgroundMusicUrl.substring(0, 30)}...`);
        job.logs.push("Applying side-chain compression to music for voice clarity.");
    }
    
    // Step 4: Video Stitching (MoviePy Simulation)
    await delay(1000);
    update(45, "Video Assembly", "Initializing MoviePy engine...");
    
    for (let i = 0; i < sceneCount; i++) {
        await delay(800);
        update(45 + Math.floor((20 * (i + 1)) / sceneCount), "Video Assembly", `Processing Scene ${i + 1}/${sceneCount}...`);
        job.logs.push(`Concatenating clip ${i + 1}: ${project.scenes[i].duration}s`);
        job.logs.push(`Applying transition: CrossFade (0.5s)`);
    }
    
    // Step 5: Subtitles (Vosk Simulation)
    await delay(1500);
    update(75, "Generating Subtitles", "Running Vosk speech-to-text alignment...");
    job.logs.push("Generating .srt file for burn-in...");
    
    // Step 6: Final Encoding (FFmpeg Simulation)
    await delay(2000);
    update(85, "Final Encoding", "Running FFmpeg encoding pass...");
    job.logs.push("Command: ffmpeg -i temp_concat.mp4 -vf subtitles=subs.srt -c:v libx264 -preset medium -crf 23 output.mp4");
    
    await delay(2500);
    update(95, "Finalizing", "Optimizing for web streaming (MOOV atom)...");

    // Complete
    await delay(1000);
    job.progress = 100;
    job.status = 'completed';
    job.currentStep = 'Ready to Download';
    
    // Populate with mock assets for the simulation
    job.assets = {
        video1080p: 'https://cdn.coverr.co/videos/coverr-cloudy-sky-2751/1080p.mp4',
        video720p: 'https://cdn.coverr.co/videos/coverr-cloudy-sky-2751/1080p.mp4', // Using same for demo
        audio: project.backgroundMusicUrl || 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_14233a73df.mp3',
        subtitles: 'data:text/plain;charset=utf-8,1%0A00%3A00%3A00%2C500%20--%3E%2000%3A00%3A03%2C000%0AWelcome%20to%20DocuGen%20AI.%0A%0A2%0A00%3A00%3A03%2C200%20--%3E%2000%3A00%3A05%2C500%0AGenerating%20professional%20videos%20instantly.'
    };
    job.outputUrl = job.assets.video1080p;
    
    job.logs.push("Render complete. Assets generated: 1080p, 720p, MP3, SRT.");
};