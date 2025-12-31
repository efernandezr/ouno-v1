/**
 * VoiceRecorder Class
 *
 * A class that encapsulates MediaRecorder functionality with audio level monitoring.
 * Uses WebM with Opus codec for efficient voice recording.
 */

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export interface RecorderOptions {
  onAudioLevel?: (level: number) => void;
  onStatusChange?: (status: RecorderStatus) => void;
  onError?: (error: Error) => void;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrame: number | null = null;
  private dataArray: Uint8Array | null = null;

  private status: RecorderStatus = "idle";
  private options: RecorderOptions;

  constructor(options: RecorderOptions = {}) {
    this.options = options;
  }

  /**
   * Request microphone permission and set up the recorder
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });

      // Set up audio context for visualization
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Set up MediaRecorder with optimal settings for voice
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 32000, // 32kbps for voice is plenty
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event.type}`);
        this.options.onError?.(error);
      };

      this.setStatus("idle");
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to initialize recorder");
      this.options.onError?.(err);
      throw err;
    }
  }

  /**
   * Get supported MIME type for audio recording
   */
  private getSupportedMimeType(): string {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    // Fallback - let the browser decide
    return "";
  }

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (!this.mediaRecorder) {
      await this.initialize();
    }

    if (this.mediaRecorder?.state === "inactive") {
      this.audioChunks = [];
      this.mediaRecorder.start(1000); // Collect data every second
      this.setStatus("recording");
      this.startAudioLevelMonitoring();
    }
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.pause();
      this.setStatus("paused");
      this.stopAudioLevelMonitoring();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder?.state === "paused") {
      this.mediaRecorder.resume();
      this.setStatus("recording");
      this.startAudioLevelMonitoring();
    }
  }

  /**
   * Stop recording and return the audio blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Recorder not initialized"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.setStatus("stopped");
        this.stopAudioLevelMonitoring();
        resolve(audioBlob);
      };

      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      } else {
        // Already stopped, return empty blob
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        resolve(new Blob([], { type: mimeType }));
      }
    });
  }

  /**
   * Get current audio level (0-100)
   */
  getAudioLevel(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

     
    this.analyser.getByteFrequencyData(this.dataArray as any);

    // Calculate average volume
    let sum = 0;
    const dataLength = this.dataArray.length;
    for (let i = 0; i < dataLength; i++) {
      sum += this.dataArray[i] ?? 0;
    }
    const average = sum / dataLength;

    // Normalize to 0-100
    return Math.min(100, Math.round((average / 128) * 100));
  }

  /**
   * Start monitoring audio levels for visualization
   */
  private startAudioLevelMonitoring(): void {
    const monitor = () => {
      if (this.status === "recording") {
        const level = this.getAudioLevel();
        this.options.onAudioLevel?.(level);
        this.animationFrame = requestAnimationFrame(monitor);
      }
    };
    monitor();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Set status and notify
   */
  private setStatus(status: RecorderStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  /**
   * Get current status
   */
  getStatus(): RecorderStatus {
    return this.status;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.status === "recording";
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAudioLevelMonitoring();

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.mediaRecorder = null;
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.audioChunks = [];
    this.status = "idle";
  }
}

/**
 * Check if the browser supports audio recording
 */
export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof window.AudioContext !== "undefined"
  );
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
