import { useState } from "react";
import { processVideo } from "../services/api";

const YoutubeToAudio = () => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [audioPreview, setAudioPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subtitles, setSubtitles] = useState(null);
  const [progress, setProgress] = useState(0);

  const handlePreview = async () => {
    if (!youtubeUrl.trim()) {
      alert("Please enter a valid YouTube URL.");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      // Simulated progress bar (you can replace this with real progress later)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      const videoUrl = await processVideo(youtubeUrl, subtitles);
      const fullUrl = `http://localhost:5000${videoUrl}`;
      setAudioPreview(fullUrl);
      setProgress(100); // Mark complete
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Failed to fetch video preview!");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioPreview) {
      alert("Preview the video first, then download.");
      return;
    }
    const link = document.createElement("a");
    link.href = audioPreview;
    link.download = "audioWithImageVideo.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      {/* App Name */}
      <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
        Remixly 🎶
      </h1>
      <p className="text-gray-400 mb-8 text-center">
        Turn YouTube sounds into custom videos in seconds!
      </p>

      {/* Input Section */}
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl shadow-lg">
        <input
          type="text"
          placeholder="Paste YouTube link here..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePreview}
            disabled={loading}
            className={`flex-1 mr-2 p-3 rounded-lg ${
              loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
            } text-white font-semibold transition`}
          >
            {loading ? "Processing..." : "Preview"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!audioPreview}
            className="flex-1 ml-2 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>

        {/* Progress Bar */}
        {/* Progress Bar */}
        {loading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span className="text-white">
                Normally it takes 4 to 5 minutes:
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Video Preview */}
        {audioPreview && (
          <div className="mt-6">
            <video
              controls
              src={audioPreview}
              className="w-full rounded-lg border border-gray-700"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default YoutubeToAudio;
