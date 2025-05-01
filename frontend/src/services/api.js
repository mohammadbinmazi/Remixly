import axios from "axios";

// Create an instance of Axios with the backend URL
const api = axios.create({
  baseURL: "http://localhost:5000", // Backend URL
  headers: {
    "Content-Type": "application/json", // Sending JSON, not FormData now
  },
});

// Updated function to call the backend API for YouTube URL
export const processVideo = async (url, subtitles) => {
  try {
    // Send a POST request with the YouTube URL
    const response = await api.post("/process-video", {
      url,
      subtitles,
    });
    return response.data.finalSubtitledVideo;
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
};
