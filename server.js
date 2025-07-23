import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors({
  origin: [ 'https://shimmering-horse-0fa49c.netlify.app' ] 
}));
app.use(express.json());

// Секрет для валидации initData (WEBAPP_SECRET)
const SECRET = process.env.WEBAPP_SECRET;

// Проверка подписи Telegram WebApp initData
function checkSignature(initData) {
  const params = initData.split('&').map(p => p.split('='));
  const hashParam = params.find(p => p[0] === 'hash')[1];
  const dataCheckString = params
    .filter(p => p[0] !== 'hash')
    .sort()
    .map(p => `${p[0]}=${p[1]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', SECRET)
    .update('WebAppData')
    .digest();
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  return hmac === hashParam;
}

// GET /user?initData=...
app.get('/user', (req, res) => {
  const { initData } = req.query;
  if (!initData || !checkSignature(initData)) {
    return res.status(400).json({ error: 'Invalid initData' });
  }
  // Распарсим user из initData
  const userParam = initData
    .split('&')
    .find(p => p.startsWith('user='))
    .split('=')[1];
  const user = JSON.parse(decodeURIComponent(userParam));
  res.json({ firstName: user.first_name, userId: user.id });
});

// GET /cat
app.get('/cat', async (_, res) => {
  try {
    const { data } = await axios.get('https://api.thecatapi.com/v1/images/search');
    res.json({ url: data[0].url });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch cat' });
  }
});

// POST /feedback
app.post('/feedback', (req, res) => {
  const { rating, comment, initData } = req.body;

  if (!initData || !checkSignature(initData)) {
    return res.status(400).json({ error: 'Invalid initData' });
  }

  const userParam = initData
    .split('&')
    .find(p => p.startsWith('user='))
    ?.split('=')[1];

  if (!userParam) {
    return res.status(400).json({ error: 'User not found in initData' });
  }

  const user = JSON.parse(decodeURIComponent(userParam));
  const userId = user.id;
  const fullName = `${user.first_name} ${user.last_name || ''}`.trim();

  console.log('📩 Отзыв получен:', {
    userId,
    fullName,
    rating,
    comment,
    time: new Date().toISOString()
  });

  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
