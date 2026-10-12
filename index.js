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

const PIPED_INSTANCES = [
  'https://pipedapi.tokhmi.xyz',
  'https://api.piped.projectsegfau.lt',
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org'
];

app.get('/stream', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).send('Invalid URL');
  }

  try {
    let videoId = '';
    try {
      const parsedUrl = new URL(videoUrl);
      if (parsedUrl.hostname.includes('youtube.com')) {
        videoId = parsedUrl.searchParams.get('v');
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1);
      }
    } catch (e) {
      return res.status(400).send('Invalid YouTube URL format');
    }

    if (!videoId) {
      return res.status(400).send('Could not extract Video ID');
    }

    let streamUrl = null;

    for (const instance of PIPED_INSTANCES) {
      try {
        const pipedResponse = await fetch(`${instance}/streams/${videoId}`);
        if (pipedResponse.ok) {
          const data = await pipedResponse.json();
          const audioStreams = data.audioStreams || [];
          if (audioStreams.length > 0) {
            const bestStream = audioStreams.find(s => s.mimeType.includes('mp4') || s.mimeType.includes('m4a')) || audioStreams[0];
            streamUrl = bestStream.url;
            break;
          }
        }
      } catch (err) {
        console.error(`Failed fetching from ${instance}:`, err.message);
      }
    }

    if (streamUrl) {
      res.redirect(streamUrl);
    } else {
      res.status(502).send('All Piped API instances failed to return a stream');
    }

  } catch (error) {
    console.error("Stream proxy error:", error);
    res.status(500).send('Stream extraction failed');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VOID backend running on port ${PORT}`);
});
