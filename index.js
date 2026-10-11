const express = require('express');
const cors = require('cors');
const yts = require('yt-search');

const app = express();
app.use(cors());
app.use(express.json());

// UptimeRobot-ന് വേണ്ടിയുള്ള റൂട്ട് (സെർവർ ഉറങ്ങാതിരിക്കാൻ)
app.get('/', (req, res) => {
  res.status(200).send('VOID Backend is awake and running!');
});

// YouTube Music Search Route
app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 15).map(v => ({
      id: v.videoId,
      name: v.title,
      album: "YouTube Music",
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

// Ultra-fast Audio Stream Converter using Cobalt API
app.get('/stream', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        aFormat: 'mp3',
        isAudioOnly: true
      })
    });

    const data = await response.json();

    if (data && data.url) {
      // ഡയറക്റ്റ് ഓഡിയോ ലിങ്കിലേക്ക് റീഡയറക്റ്റ് ചെയ്യുന്നു (ലാഗ് ഫ്രീ)
      res.redirect(data.url);
    } else {
      res.status(404).send('Audio stream not found');
    }
  } catch (error) {
    console.error("Cobalt Stream error:", error);
    res.status(500).send('Stream failed');
  }
});

// പോർട്ട് കോൺഫിഗറേഷൻ
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VOID backend running on port ${PORT}`);
});
