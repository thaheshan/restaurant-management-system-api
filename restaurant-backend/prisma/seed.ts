import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPwd   = await bcrypt.hash("admin123",   10);
  const managerPwd = await bcrypt.hash("manager123", 10);
  const guestPwd   = await bcrypt.hash("guest123",   10);

  const guest = await prisma.user.upsert({
    where:  { email: "admin@nuvola.com" },
    update: {},
    create: { name:"Alessandro Romano", email:"admin@nuvola.com", passwordHash:adminPwd, role:"super_admin" },
  });
  await prisma.user.upsert({
    where:  { email: "manager@nuvola.com" },
    update: {},
    create: { name:"Sofia Chen", email:"manager@nuvola.com", passwordHash:managerPwd, role:"manager" },
  });
  const customer = await prisma.user.upsert({
    where:  { email: "guest@nuvola.com" },
    update: {},
    create: { name:"James Harrington", email:"guest@nuvola.com", passwordHash:guestPwd, role:"customer" },
  });

  await prisma.customerProfile.upsert({
    where:  { userId: customer.id },
    update: {},
    create: { userId:customer.id, loyaltyPoints:1240, totalOrders:18 },
  });

  const menuItems = [
    { name:"Truffle Risotto",     description:"Creamy Arborio rice with black truffle",           category:"main_course", price:38,  imageEmoji:"R", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:true,  isPopular:true,  preparationTime:25, calories:520, rating:4.9, reviewCount:142 },
    { name:"Burrata Caprese",     description:"Fresh burrata with heirloom tomatoes and basil",   category:"appetizer",   price:22,  imageEmoji:"S", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:true,  isPopular:true,  preparationTime:10, calories:310, rating:4.8, reviewCount:98  },
    { name:"Wagyu Tenderloin",    description:"A5 Wagyu 200g with bone marrow sauce",             category:"main_course", price:95,  imageEmoji:"M", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:true,  isPopular:false, preparationTime:35, calories:780, rating:5.0, reviewCount:87  },
    { name:"Chocolate Fondant",   description:"Warm dark chocolate with molten Valrhona center",  category:"dessert",     price:16,  imageEmoji:"C", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:true,  preparationTime:15, calories:480, rating:4.9, reviewCount:203 },
    { name:"Elderflower Spritz",  description:"St-Germain, Prosecco, cucumber, fresh mint",       category:"beverage",    price:14,  imageEmoji:"D", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:true,  preparationTime:5,  calories:180, rating:4.7, reviewCount:64  },
    { name:"Lobster Bisque",      description:"Velvety bisque with Cognac and cream",             category:"appetizer",   price:32,  imageEmoji:"L", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:true,  isPopular:true,  preparationTime:18, calories:390, rating:4.9, reviewCount:115 },
    { name:"Duck Confit",         description:"48-hour duck leg with cherry jus",                 category:"main_course", price:42,  imageEmoji:"K", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:false, preparationTime:30, calories:640, rating:4.7, reviewCount:91  },
    { name:"Tiramisu Classico",   description:"Traditional Savoiardi with Mascarpone",            category:"dessert",     price:14,  imageEmoji:"T", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:true,  preparationTime:10, calories:420, rating:4.8, reviewCount:189 },
    { name:"Negroni",             description:"Campari, Carpano Antica, Tanqueray No. Ten",       category:"beverage",    price:18,  imageEmoji:"N", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:true,  preparationTime:3,  calories:210, rating:4.9, reviewCount:132 },
    { name:"Truffle Fries",       description:"Hand-cut fries with truffle oil and parmesan",     category:"side_dish",   price:12,  imageEmoji:"F", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:false, isPopular:true,  preparationTime:12, calories:380, rating:4.8, reviewCount:244 },
    { name:"Chefs Tasting Menu",  description:"7-course journey curated by our head chef",        category:"special",     price:145, imageEmoji:"V", ingredients:"[]", allergens:"[]", dietaryTags:"[]", isAvailable:true, isFeatured:true,  isPopular:false, preparationTime:90, calories:1800,rating:5.0, reviewCount:52  },
  ];

  for (const item of menuItems) {
    const id = item.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.menuItem.upsert({ where:{ id }, update:{}, create:{ id, ...item } });
  }

  await prisma.promoCode.upsert({
    where:  { code: "NUVOLA10" },
    update: {},
    create: { code:"NUVOLA10", discount:10, type:"percentage", maxUses:1000, isActive:true },
  });
  await prisma.promoCode.upsert({
    where:  { code: "WELCOME20" },
    update: {},
    create: { code:"WELCOME20", discount:20, type:"percentage", maxUses:500, isActive:true },
  });

  console.log("Database seeded successfully!");
  console.log("  Admin:   admin@nuvola.com   / admin123");
  console.log("  Manager: manager@nuvola.com / manager123");
  console.log("  Guest:   guest@nuvola.com   / guest123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });