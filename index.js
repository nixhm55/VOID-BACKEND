const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('VOID Backend is awake and running!');
});

app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 15).map(v => ({
      id: v.videoId,
      name: v.title,
      album: "YouTube",
      artist: v.author.name,
      image: v.thumbnail,
      downloadUrl: `${req.protocol}://${req.get('host')}/stream?url=${encodeURIComponent(v.url)}`,
      duration: v.seconds,
    }));
    res.json(videos);
  } catch (error) {
    console.error("Search error:", error);
    res.json([]);
  }
});

app.get('/stream', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl || !ytdl.validateURL(videoUrl)) {
    return res.status(400).send('Invalid URL');
  }

  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const stream = ytdl(videoUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 25,
    });

    stream.on('error', (err) => {
      console.error("YTDL stream error:", err);
      if (!res.headersSent) {
        res.status(500).send('Stream failed');
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Stream error:", error);
    if (!res.headersSent) {
      res.status(500).send('Stream failed');
    }
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VOID backend running on port ${PORT}`);
});
