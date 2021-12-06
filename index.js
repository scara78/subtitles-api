import WebTorrent from 'webtorrent';
import cors from 'cors';
import express from 'express';
import wrtc from 'wrtc';
import parseTorrent from 'parse-torrent'
import { announceList as defaultAnnounceList } from 'create-torrent';

globalThis.WEBTORRENT_ANNOUNCE = defaultAnnounceList
  .map((arr) => arr[0])
  .filter((url) => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0);

globalThis.WRTC = wrtc;

const app = express();
const port = 8080;
const downloadsPath = 'downloads';

const client = new WebTorrent();

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

app.use(express.static(downloadsPath));

const checkIfTorrentIsValid = (torrentId) => new Promise((resolve) => {
  try {
    parseTorrent(torrentId);
    resolve(torrentId);
  } catch {
    parseTorrent.remote(torrentId, (err, parsedTorrent) => {
      if (err) {
        resolve(false);
      } else {
        resolve(parsedTorrent);
      }
    });
  }
});

app.post('/download', async (req, res, next) => {
  try {
    const { id: torrentId } = req.body;
    const torrentIsValid = await checkIfTorrentIsValid(torrentId);
    const torrentHash = await torrentIsValid.infoHash;
    const torrentWasAdded = client.get(await torrentHash);
    if (!torrentWasAdded && torrentHash) {
      client.add(await torrentHash, { path: downloadsPath }, (t) => {
				const video = t.files.find((file) => file.name.endsWith('.mp4') || file.name.endsWith('.mkv'));
				returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Torrent downloading', magnet: t.magnetURI, video: video.path });
      });
    } else {
      returnJSON({ req, res, next, code: 400, status: 'error', message: 'Torrent was already added' });
    }
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Bitflix API listening at http://localhost:${port}`);
});