import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import fs from 'fs';
import srtToVtt from 'srt-to-vtt';
import request from 'request';
import { unzip } from 'zlib';
import path from 'path';
import OS from 'opensubtitles-api';

const OpenSubtitles = new OS({
    useragent: 'Popcorn Time NodeJS',
    username: '',
    password: '',
    ssl: true
});

const app = express();
const port = 8080;
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, './')));

const API_URL = `https://bitflix-subs.herokuapp.com`;

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

const returnFinalSubs = ({ req, res, next, imdbid, subs }) => {
  let finalSubs = {};
  Object.keys(subs).forEach((lang, index) => {
    request({
      url: subs[lang].url,
      encoding: null
    }, (error, response, data) => {
      if (error) throw error;
      unzip(data, (error, buffer) => {
        const srtFile = `./${imdbid}-${lang}-srt.srt`;
        fs.writeFile(srtFile, buffer, {}, async () => {
          await fs.createReadStream(srtFile)
          .pipe(srtToVtt())
          .pipe(fs.createWriteStream(`./${imdbid}-${lang}-vtt.vtt`));
          finalSubs = {...finalSubs, [lang]: {
            ...subs[lang],
            vtt: `${API_URL}/${imdbid}-${lang}-vtt.vtt`
          }};
          if (index === Object.keys(subs).length - 1) {
            returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs: finalSubs });
          }
        })
      });
    });
  });
}

app.get('/subs/:id', async (req, res, next) => {
  try {
    const { id: imdbid } = req.params;
    const subs = await OpenSubtitles.search({ imdbid, gzip: true });
    returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.get('/subs/movie/:id', async (req, res, next) => {
  try {
    const { id: imdbid } = req.params;
    const subs = await OpenSubtitles.search({ imdbid, gzip: true });
    returnFinalSubs({ req, res, next, imdbid, subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.get('/subs/tv/:query/:season/:episode', async (req, res, next) => {
  try {
    const { query, season, episode } = req.params;
    const subs = await OpenSubtitles.search({ query, season, episode, gzip: true });
    returnFinalSubs({ req, res, next, imdbid: `${query}-S${season}-E${episode}`, subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Subtitles API for Bitflix listening at http://localhost:${port}`);
});