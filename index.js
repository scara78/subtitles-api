import WebTorrent from 'webtorrent';
import cors from 'cors';
import express from 'express';
const app = express();
const port = 8080;
import wrtc from 'wrtc';
import { announceList as defaultAnnounceList } from 'create-torrent';

globalThis.WEBTORRENT_ANNOUNCE = defaultAnnounceList
  .map((arr) => arr[0])
  .filter((url) => url.indexOf('wss://') === 0 || url.indexOf('ws://') === 0);

globalThis.WRTC = wrtc;

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

app.get('/', (req, res, next) => {
	returnJSON({ req, res, next, code: 200, status: 'ok', message: '', torrents: client.torrents });
})

app.post('/download', (req, res, next) => {
  try {
    const { id: torrentId } = req.body;
    const torrentWasAdded = client.get(torrentId);
    if (!torrentWasAdded) {
      client.add(torrentId, { path: 'downloads' }, (t) => {
				if (t.ready) {
					// const video = t.files.find((file) => file.name.endsWith('.mp4'));
        	returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Torrent downloading', magnet: t.magnetURI, path: t.path, files: t.files });
				}
      });
    } else {
      returnJSON({ req, res, next, code: 400, status: 'error', message: 'Torrent was already added' });
    }
  } catch (error) {
    returnJSON({ req, res, next, code: 400,status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});