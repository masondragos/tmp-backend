import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient().$extends(withAccelerate())

async function main() {
  console.log(`Start seeding ...`)
  
  const userData = [
    {
      name: 'John Smith',
      email: 'john.smith@mortgagebroker.com',
      password: await bcrypt.hash('password123', 10),
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@mortgagebroker.com',
      password: await bcrypt.hash('password123', 10),
    },
    {
      name: 'Mike Wilson',
      email: 'mike.wilson@mortgagebroker.com',
      password: await bcrypt.hash('password123', 10),
    },
  ]

  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log(`Seeding finished.`)
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
