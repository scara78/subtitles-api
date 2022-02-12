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

app.get('/subs/:id', async (req, res, next) => {
  try {
    const { id: imdbid } = req.params;
    console.log(imdbid)
    const subs = await OpenSubtitles.search({ imdbid, gzip: true });
    request({
      url: subs.es.utf8,
      encoding: null
  }, (error, response, data) => {
      if (error) throw error;
      unzip(data, (error, buffer) => {
        if (error) throw error;
        fs.writeFile(`${imdbid}-srt.srt`, buffer, {}, () => {
          fs.createReadStream(`${imdbid}-srt.srt`)
          .pipe(srtToVtt())
          .pipe(fs.createWriteStream(`${imdbid}-vtt.vtt`))
          returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', sub: path.resolve(`${imdbid}-vtt.vtt`) });
        })
     });
  });
    // Object.keys(subs).forEach((sub => {
    //   request({
    //     url: subs[sub].url,
    //     encoding: null
    // }, (error, response, data) => {
    //   console.log(data)
    //     if (error) throw error;
    //     unzip(data, (error, buffer) => {
    //         if (error) throw error;
    //         const subtitle_content = buffer.toString(subs[sub].encoding);
    //         console.log('Subtitle content:', subtitle_content);
    //     });
    // });
    // }))
  } catch (error) {
    console.log(error)
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.get('/subs/movie/:id', async (req, res, next) => {
  try {
    const { id: imdbid } = req.params;
    const subs = await OpenSubtitles.search({ imdbid, gzip: true });
    returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.get('/subs/tv/:query/:season/:episode', async (req, res, next) => {
  try {
    const { query, season, episode } = req.params;
    const subs = await OpenSubtitles.search({ query, season, episode, gzip: true });
    returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Bitflix API listening at http://localhost:${port}`);
});