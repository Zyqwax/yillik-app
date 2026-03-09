import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const students = [
  { "ad_soyad": "Abdulkadir Örgeç", "kullanici_adi": "abdulkadir.orgec", "sifre": "aO!92kLp#x" },
  { "ad_soyad": "Aren Boğaç Han Alçın", "kullanici_adi": "aren.alcin", "sifre": "bH4$mNq8rZ" },
  { "ad_soyad": "Aybüke Tosun", "kullanici_adi": "aybuke.tosun", "sifre": "tS2&vW7yQp" },
  { "ad_soyad": "Azra Girgin", "kullanici_adi": "azra.girgin", "sifre": "gI8*nR4wVx" },
  { "ad_soyad": "Berrak Şahin", "kullanici_adi": "berrak.sahin", "sifre": "sH5^jK9tLm" },
  { "ad_soyad": "Beyza Çelik", "kullanici_adi": "beyza.celik", "sifre": "cE3@fR6gHj" },
  { "ad_soyad": "Beyzanur Bodur", "kullanici_adi": "beyzanur.bodur", "sifre": "bO7!nD2mKq" },
  { "ad_soyad": "Efecan Sağır", "kullanici_adi": "efecan.sagir", "sifre": "sA4%xV8bNl" },
  { "ad_soyad": "Enes Samed Gözlü", "kullanici_adi": "enes.gozlu", "sifre": "gO9&pM3cXt" },
  { "ad_soyad": "Eren Boncuk", "kullanici_adi": "eren.boncuk", "sifre": "bO6$wQ1yZa" },
  { "ad_soyad": "Hasan Hüseyin Kül", "kullanici_adi": "hasan.kul", "sifre": "kU8*fL4vRr" },
  { "ad_soyad": "Hüseyin Uygun", "kullanici_adi": "huseyin.uygun", "sifre": "uY2^zX5mNq" },
  { "ad_soyad": "Kaan Emre Akın", "kullanici_adi": "kaan.akin", "sifre": "aK5@qW9sDf" },
  { "ad_soyad": "Lale Kaya", "kullanici_adi": "lale.kaya", "sifre": "kY7!rT3vBn" },
  { "ad_soyad": "Mayra Önal", "kullanici_adi": "mayra.onal", "sifre": "oN4%jK8pLm" },
  { "ad_soyad": "Metehan Kılıç", "kullanici_adi": "metehan.kilic", "sifre": "kI9&bC2xZq" },
  { "ad_soyad": "Mustafa Rasim Yıldırım", "kullanici_adi": "mustafa.yildirim", "sifre": "yI3$mN7vBt" },
  { "ad_soyad": "Naile Berra Palaz", "kullanici_adi": "naile.palaz", "sifre": "pA6*hS4dQw" },
  { "ad_soyad": "Nebi Dağdelen", "kullanici_adi": "nebi.dagdelen", "sifre": "dG8^zX1mVr" },
  { "ad_soyad": "Ömer Faruk Özkan", "kullanici_adi": "omer.ozkan", "sifre": "oZ2@qW5sNk" },
  { "ad_soyad": "Orçun Aydın", "kullanici_adi": "orcun.aydin", "sifre": "aY7!lK9mXp" },
  { "ad_soyad": "Sare Şarbak", "kullanici_adi": "sare.sarbak", "sifre": "sA3%cV6bNh" },
  { "ad_soyad": "Yiğit Tunç", "kullanici_adi": "yigit.tunc", "sifre": "tU5&rM8pLq" },
  { "ad_soyad": "Yusuf Bedir Sametoğlu", "kullanici_adi": "yusuf.sametoglu", "sifre": "sA9$vB4nKh" }
]

async function main() {
  console.log('Clearing old data and seeding database with actual students...')

  // Clear existing votes, photos, and users to start fresh mapping
  await prisma.vote.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.user.deleteMany();

  for (const student of students) {
    const passwordHash = await bcrypt.hash(student.sifre, 10)

    await prisma.user.create({
      data: {
        username: student.kullanici_adi,
        name: student.ad_soyad,
        password: passwordHash,
      },
    })
  }

  console.log('Database has been seeded with new real users.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
