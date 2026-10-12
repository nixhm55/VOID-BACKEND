const express = require('express');
const cors = require('cors');
const yts = require('yt-search');

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
      downloadUrl: `https://void-backend-n0jb.onrender.com/stream?url=${encodeURIComponent(v.url)}`,
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
  if (!videoUrl) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'VOID-Music-Player/1.0'
      },
      body: JSON.stringify({
        url: videoUrl,
        isAudioOnly: true,
        aFormat: 'mp3'
      })
    });

    if (!cobaltResponse.ok) {
      throw new Error(`Cobalt API failed with status: ${cobaltResponse.status}`);
    }

    const data = await cobaltResponse.json();
    
    if (data && data.url) {
      res.redirect(data.url);
    } else {
      res.status(500).send('Stream URL extraction failed');
    }
  } catch (error) {
    console.error("Stream proxy error:", error);
    res.status(500).send('Stream failed');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VOID backend running on port ${PORT}`);
});
