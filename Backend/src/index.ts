import './types/express';
import 'dotenv/config';
import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api-docs`);
});
