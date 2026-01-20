const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB (Keygen Server)');
    } catch (err) {
        console.error('❌ MongoDB Connection Error (Keygen Server):', err.message);
        process.exit(1);
    }
};

// Start connection
connectDB();

module.exports = mongoose.connection;

