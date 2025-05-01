const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ffmpegPath = require("ffmpeg-static");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const formatTime = (seconds) => {
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  const millis = "000";
  return `${hours}:${minutes}:${secs},${millis}`;
};

// Generates .srt subtitle file from Whisper transcript
const generateSubtitlesFileFromWhisper = async (audioPath) => {
  const srtOutputPath = path.join(uploadsDir, `${uuidv4()}.srt`);
  const command = `whisper "${audioPath}" --model base --language en --output_format srt --output_dir "${uploadsDir}"`;

  console.log("Transcribing with Whisper:", command);

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Whisper transcription error:", error);
        return reject(error);
      }

      // Find the SRT file just created
      const audioBase = path.basename(audioPath, path.extname(audioPath));
      const generatedSrt = path.join(uploadsDir, `${audioBase}.srt`);
      if (!fs.existsSync(generatedSrt)) {
        return reject(new Error("Whisper failed to create SRT file"));
      }

      // Rename to avoid filename collision
      fs.renameSync(generatedSrt, srtOutputPath);
      resolve(srtOutputPath);
    });
  });
};

// Add subtitles to any video
const addSubtitlesToVideo = (videoInput, subtitlesFilePath) => {
  return new Promise((resolve, reject) => {
    const outputPath = videoInput.replace(".mp4", "-subtitled.mp4");
    const cleanFfmpegPath = ffmpegPath.replace(/\\/g, "/");
    const escapedInput = videoInput.replace(/\\/g, "/").replace(/'/g, "'\\''");
    const escapedSubtitles = subtitlesFilePath
      .replace(/\\/g, "/")
      .replace(/:/g, "\\:")
      .replace(/'/g, "'\\''");

    const command = `"${cleanFfmpegPath}" -i "${escapedInput}" -vf "subtitles='${escapedSubtitles}':force_style=' Fontsize=24,PrimaryColour=&HFFFFFF&'" -c:a copy "${outputPath}"`;

    console.log("Executing subtitle command:", command);
    exec(command, (error, stdout, stderr) => {
      if (error || stderr.includes("Error")) {
        console.error("Subtitle embedding error:", error || stderr);
        return reject(new Error(stderr || error.message));
      }
      resolve(outputPath);
    });
  });
};

const combineAudioWithImage = async (audioFile) => {
  try {
    const imagePath = path.join(uploadsDir, "background.jpg");
    if (!fs.existsSync(audioFile))
      throw new Error(`Audio not found: ${audioFile}`);
    if (!fs.existsSync(imagePath))
      throw new Error(`Image not found: ${imagePath}`);

    const outputVideoPath = path.join(
      path.dirname(audioFile),
      `${path.basename(audioFile, path.extname(audioFile))}-with-image.mp4`
    );

    const probeCommand = `"${ffmpegPath}" -i "${audioFile}" -hide_banner`;
    const probeResult = await new Promise((resolve) => {
      exec(probeCommand, (error, stdout, stderr) => resolve(stderr));
    });

    const useAudioCopy =
      probeResult.includes("Audio: aac") || probeResult.includes("Audio: mp3");
    const audioCodec = useAudioCopy ? "-c:a copy" : "-c:a aac -b:a 192k";

    const command = [
      `"${ffmpegPath}"`,
      "-y",
      "-loop 1",
      "-framerate 2",
      `-i "${imagePath}"`,
      `-i "${audioFile}"`,
      "-c:v libx264",
      "-preset fast",
      "-tune stillimage",
      '-vf "scale=1280:854:force_original_aspect_ratio=decrease,pad=1280:854:(ow-iw)/2:(oh-ih)/2"',
      "-pix_fmt yuv420p",
      audioCodec,
      "-shortest",
      "-movflags +faststart",
      `"${outputVideoPath}"`,
    ].join(" ");

    console.log("Combining image + audio:", command);

    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Combine Error:", error.message);
          return reject(new Error(stderr || error.message));
        }
        resolve();
      });
    });

    if (!fs.existsSync(outputVideoPath)) {
      throw new Error("Image+Audio video not created");
    }

    return outputVideoPath;
  } catch (err) {
    console.error("combineAudioWithImage error:", err);
    throw err;
  }
};

app.post("/process-video", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "No URL provided" });

  try {
    const cleanFfmpegPath = ffmpegPath.replace(/\\/g, "/");

    // Step 1: Download video using yt-dlp
    const videoOutput = path.join(uploadsDir, `${uuidv4()}.mp4`);
    await new Promise((resolve, reject) => {
      const cmd = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --ffmpeg-location "${cleanFfmpegPath}" -o "${videoOutput}" ${url}`;
      console.log("Downloading:", cmd);
      exec(cmd, (error, stdout, stderr) => {
        if (error || stderr.includes("ERROR")) return reject(new Error(stderr));
        resolve();
      });
    });

    // Step 2: Extract audio
    const audioOutput = path.join(uploadsDir, `${uuidv4()}.mp3`);
    await new Promise((resolve, reject) => {
      exec(
        `"${cleanFfmpegPath}" -i "${videoOutput}" -q:a 0 -map a "${audioOutput}"`,
        (error, stdout, stderr) => {
          if (error || stderr.includes("Error")) {
            return reject(new Error(stderr || "Audio extraction failed"));
          }
          resolve();
        }
      );
    });

    // Step 3: Combine audio with image
    const audioWithImageVideo = await combineAudioWithImage(audioOutput);

    // Step 4: Transcribe with Whisper and generate subtitle file
    const srtFile = await generateSubtitlesFileFromWhisper(audioOutput);

    // Step 5: Add subtitles to image+audio video
    const subtitledImageVideo = await addSubtitlesToVideo(
      audioWithImageVideo,
      srtFile
    );

    // Final response
    res.status(200).json({
      message: "Processing complete",
      audioFile: `/uploads/${path.basename(audioOutput)}`,
      originalVideo: `/uploads/${path.basename(videoOutput)}`,
      audioWithImage: `/uploads/${path.basename(audioWithImageVideo)}`,
      finalSubtitledVideo: `/uploads/${path.basename(subtitledImageVideo)}`,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Processing failed", error: err.message });
  }
});

app.use("/uploads", express.static(uploadsDir));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
