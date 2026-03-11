import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not defined in environment variables. Database connection will fail.');
}

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    try {
        console.log('[DB] Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        });
        console.log('✅ Connected to MongoDB (Keygen Server)');
        return mongoose.connection;
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        throw err;
    }
};

export { connectDB };
export default mongoose.connection;

