import { connect } from 'mongoose';

const connectDB = async (URI: string) => {
    try {
        await connect(URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.log(err.message);
        process.exit(1);
    }
};

export default connectDB;
