import app from './app';
import { env } from './config/env.config';

const PORT = parseInt(env.PORT, 10) || 5001;

app.listen(PORT, () => {
  console.log(`[School ERP Server]: Running on http://localhost:${PORT} in ${env.NODE_ENV} mode`);
});
