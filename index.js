// import WebTorrent from 'webtorrent';
import cors from 'cors';
import express from 'express';
// import wrtc from 'wrtc';
// import parseTorrent from 'parse-torrent';
// import torrentStream from 'torrent-stream';
import 'dotenv/config';
// import { announceList as defaultAnnounceList } from 'create-torrent';
import OS from 'opensubtitles-api';

const OpenSubtitles = new OS({
    useragent:'UserAgent',
    username: process.env.OPEN_SUBTITLES_USERNAME,
    password: process.env.OPEN_SUBTITLES_PASSWORD,
    ssl: true
});

// globalThis.WEBTORRENT_ANNOUNCE = defaultAnnounceList
//   .map((arr) => arr[0])
//   .filter((url) => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0);

// globalThis.WRTC = wrtc;

const app = express();
const port = 8080;
// const downloadsPath = 'downloads';

// const client = new WebTorrent();

const returnJSON = ({req, res, next, code, status, message, ...args}) => {
  res.status(code);
  res.json({
    status,
    message,
    ...args,
  });
  next();
};

app.use(express.json());

app.use(cors());

// app.use(express.static(downloadsPath));

// const checkIfTorrentIsValid = (torrentId) => new Promise((resolve) => {
//   try {
//     parseTorrent(torrentId);
//     resolve(torrentId);
//   } catch {
//     parseTorrent.remote(torrentId, (err, parsedTorrent) => {
//       if (err) {
//         resolve(false);
//       } else {
//         resolve(parsedTorrent);
//       }
//     });
//   }
// });

// app.post('/download', async (req, res, next) => {
//   try {
//     const { id: torrentId, imdbid } = req.body;
//     const torrentIsValid = await checkIfTorrentIsValid(torrentId);
//     const torrentHash = await torrentIsValid.infoHash || torrentIsValid;
//     const torrentWasAdded = client.get(await torrentHash);
//     if (!torrentWasAdded && torrentHash) {
//       client.add(await torrentHash, { path: downloadsPath }, async (t) => {
// 				const video = t.files.find((file) => file.name.endsWith('.mp4') || file.name.endsWith('.mkv'));
//         const allSubs = await OpenSubtitles.search({ imdbid });
// 				returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Torrent downloading', magnet: t.magnetURI, video: video.path, progress: t.progress, subs: allSubs });
//       });
//     } else {
//       const video = torrentWasAdded.files.find((file) => file.name.endsWith('.mp4') || file.name.endsWith('.mkv'));
//       const allSubs = await OpenSubtitles.search({ imdbid });
//       returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Torrent is being downloaded', video: video.path, progress: torrentWasAdded.progress, subs: allSubs });
//     }
//   } catch (error) {
//     returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
//   }
// })

app.get('/subs/:id', async (req, res, next) => {
  try {
    const { id: imdbid } = req.params;
    const subs = await OpenSubtitles.search({ imdbid });
    returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Bitflix API listening at http://localhost:${port}`);
});