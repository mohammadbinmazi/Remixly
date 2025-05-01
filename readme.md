# 🎬 Remixly (Full-Stack App)

This is a **full-stack project** built using **React.js (frontend)** and **Node.js (Express backend)**.

It allows users to:

1. Input a YouTube video URL,
2. Extract audio from the video,
3. Merge audio with a background image,
4. Generate subtitles using OpenAI Whisper,
5. Output a final video with **burned-in subtitles**.

---

## 🧱 Tech Stack

| Layer    | Technology        |
| -------- | ----------------- |
| Frontend | React.js          |
| Backend  | Node.js + Express |
| AI       | OpenAI Whisper    |
| Tools    | yt-dlp, ffmpeg    |

---

## ✨ Features

- ✅ Downloads YouTube video via `yt-dlp`
- ✅ Extracts `.mp3` audio from video
- ✅ Combines audio with a background image
- ✅ Generates subtitles using OpenAI Whisper
- ✅ Embeds subtitles into the final video

---

## 🔧 Requirements

Install globally:

- [Node.js](https://nodejs.org/)
- [ffmpeg](https://ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Whisper CLI](https://github.com/openai/whisper)

```bash
pip install git+https://github.com/openai/whisper.git
pip install -U yt-dlp
```
