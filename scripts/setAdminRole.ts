import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '.env.local' });

async function setAdminRole() {
  try {
    const MONGODB_URI = process.env.DATABASE_URL;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    const username = process.argv[2];
    if (!username) {
      console.error('Kullanım: npm run set-admin <kullanici_adi>');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Veritabanına bağlanıldı.');

    const user = await User.findOne({ username });

    if (!user) {
      console.log(`'${username}' adlı kullanıcı bulunamadı.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`'${username}' adlı kullanıcıya 'admin' rolü verildi.`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('İşlem sırasında hata oluştu:', error);
    process.exit(1);
  }
}

setAdminRole();
