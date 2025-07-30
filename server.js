import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'https://shimmering-horse-0fa49c.netlify.app',                    
  ]
}));
app.use(express.json());

app.post('/feedback', (req, res) => {
  const { rating, comment } = req.body;
  console.log('📩 Отзыв получен:', {
    rating,
    comment,
    time: new Date().toISOString()
  });
  
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
