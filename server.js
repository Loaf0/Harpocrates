const express = require('express');
const app = express();
const port = 47000;

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
