import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: '.env' });

async function seedAdmin() {
  try {
    const MONGODB_URI = process.env.DATABASE_URL;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Veritabanına bağlanıldı.');

    const adminUsername = 'admin';
    const adminPassword = 'adminpassword';
    const adminName = 'Sistem Yöneticisi';

    let adminUser = await User.findOne({ username: adminUsername });

    if (adminUser) {
      console.log('Admin kullanıcısı zaten mevcut.');
      // Şifreyi güncelle (opsiyonel)
      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(adminPassword, salt);
      await adminUser.save();
      console.log('Admin şifresi güncellendi.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      adminUser = new User({
        username: adminUsername,
        password: hashedPassword,
        name: adminName,
      });

      await adminUser.save();
      console.log('Admin kullanıcısı başarıyla oluşturuldu.');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Seed sırasında hata oluştu:', error);
    process.exit(1);
  }
}

seedAdmin();
