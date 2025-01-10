const express = require('express');
const path = require('path')
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const newsAdminRoutes = require('./routes/newsRoutes')
require('dotenv').config();
const fs = require('fs');
const cors = require('cors')
const cookieParser = require ('cookie-parser');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Ensure the 'uploads' folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const corsOptions = {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5174',
        'http://localhost:5173',
        'https://ksucu-mc-backend.onrender.com',
        'https://ksucu-mc-frontend.vercel.app'
      ];
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        // Allow requests from the allowed origins or from no origin (e.g., non-browser clients)
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow credentials (cookies) to be sent
};
app.use(cors(corsOptions));

mongoose.connect(process.env.DB_CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(()=>{
    console.log('db connected succesfully');

}).catch((err)=>{
    console.log(err);
});

app.use('/users', userRoutes);
app.use('/adminnews', newsAdminRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

if(process.env.NODE_ENV === 'production'){
    app.use(express.static(path.join(__dirname, '../k-s-frontend/dist')));

    app.get('*', (req,res) => {
        res.sendFile(
            path.resolve(__dirname, '../', 'k-s-frontend', 'dist', 'index.html')
        )
    })
} else{
    console.log('Please set to production');
    app.get('/', (req, res) => res.send('Please set to production'));
    
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));                     