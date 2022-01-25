import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import OS from 'opensubtitles-api';

const OpenSubtitles = new OS({
    useragent: 'Popcorn Time NodeJS',
    username: '',
    password: '',
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
    const subs = await OpenSubtitles.search({ imdbid, gzip: true });
    returnJSON({ req, res, next, code: 200, status: 'ok', message: 'Subtitles obtained', subs });
  } catch (error) {
    returnJSON({ req, res, next, code: 400, status:  'error', message: 'Unexpected error' });
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Bitflix API listening at http://localhost:${port}`);
});