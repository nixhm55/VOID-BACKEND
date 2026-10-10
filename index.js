const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

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
      // localhost മാറ്റി ഡൈനാമിക് ലിങ്ക് ആക്കി
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
    const stream = ytdl(videoUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).send('Stream failed');
  }
});

// പോർട്ട് ഡൈനാമിക് ആക്കി (Render പോലെയുള്ള സൈറ്റുകൾക്ക് വേണ്ടി)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VOID backend running on port ${PORT}`);
});
