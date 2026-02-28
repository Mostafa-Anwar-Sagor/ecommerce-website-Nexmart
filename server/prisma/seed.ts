import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NexMart database...');

  // Create categories
  const categories = [
    { id: uuidv4(), name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200', sortOrder: 1 },
    { id: uuidv4(), name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200', sortOrder: 2 },
    { id: uuidv4(), name: 'Home & Living', slug: 'home-living', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=200', sortOrder: 3 },
    { id: uuidv4(), name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200', sortOrder: 4 },
    { id: uuidv4(), name: 'Sports', slug: 'sports', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=200', sortOrder: 5 },
    { id: uuidv4(), name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200', sortOrder: 6 },
    { id: uuidv4(), name: 'Toys & Kids', slug: 'toys-kids', image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200', sortOrder: 7 },
    { id: uuidv4(), name: 'Food & Grocery', slug: 'food-grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200', sortOrder: 8 },
    { id: uuidv4(), name: 'Automotive', slug: 'automotive', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200', sortOrder: 9 },
    { id: uuidv4(), name: 'Health', slug: 'health', image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200', sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexmart.com' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'NexMart Admin',
      email: 'admin@nexmart.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log(`✅ Admin user: admin@nexmart.com / Admin@123456`);

  // Create demo seller
  const sellerPassword = await bcrypt.hash('Seller@123456', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@nexmart.com' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Demo Seller',
      email: 'seller@nexmart.com',
      password: sellerPassword,
      role: 'SELLER',
      isVerified: true,
    },
  });

  const shop = await prisma.shop.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      id: uuidv4(),
      userId: seller.id,
      name: 'TechHub Store',
      slug: 'techhub-store',
      description: 'Your one-stop shop for the latest electronics and gadgets.',
      logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200',
      rating: 4.8,
      status: 'ACTIVE',
      isVerified: true,
    },
  });
  console.log(`✅ Demo seller: seller@nexmart.com / Seller@123456`);

  // Create demo buyer
  const buyerPassword = await bcrypt.hash('Buyer@123456', 12);
  await prisma.user.upsert({
    where: { email: 'buyer@nexmart.com' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Demo Buyer',
      email: 'buyer@nexmart.com',
      password: buyerPassword,
      role: 'BUYER',
      isVerified: true,
    },
  });
  console.log(`✅ Demo buyer: buyer@nexmart.com / Buyer@123456`);

  // Create sample products — fetch persisted IDs from DB (upsert keeps existing IDs)
  const electronicsCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'electronics' } });
  const fashionCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'fashion' } });
  const homeCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'home-living' } });
  const beautyCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'beauty' } });
  const sportsCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'sports' } });
  const booksCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'books' } });
  const toysCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'toys-kids' } });
  const healthCategory = await prisma.category.findUniqueOrThrow({ where: { slug: 'health' } });

  const products = [
    // Electronics
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Premium Wireless Earbuds Pro X', slug: 'premium-wireless-earbuds-pro-x',
      description: 'Experience crystal-clear audio with our Premium Wireless Earbuds Pro X. Featuring advanced Active Noise Cancellation technology, 40-hour battery life, and premium sound quality.',
      shortDescription: 'Premium ANC earbuds with 40hr battery life and Hi-Fi sound.',
      price: 129.99, discountPrice: 89.99, stock: 150, soldCount: 1247, rating: 4.7, reviewCount: 342,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500'],
      tags: ['earbuds', 'wireless', 'anc', 'bluetooth', 'audio'], freeShipping: true, isActive: true, isFeatured: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Smart Watch Ultra Series 5', slug: 'smart-watch-ultra-series-5',
      description: 'The Ultimate Smartwatch for modern life. Track your fitness goals, receive notifications, and stay connected with a stunning AMOLED display and 7-day battery.',
      shortDescription: 'AMOLED smartwatch with health tracking and 7-day battery.',
      price: 299.99, discountPrice: 199.99, stock: 80, soldCount: 856, rating: 4.8, reviewCount: 217,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      tags: ['smartwatch', 'fitness', 'wearable', 'amoled'], freeShipping: true, isActive: true, isFeatured: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Ultra-Slim Laptop 14"', slug: 'ultra-slim-laptop-14',
      description: 'Powerful performance meets stunning portability. This ultra-slim laptop features the latest Intel Core i7 processor, 16GB RAM, and a vibrant 14" display.',
      shortDescription: 'Intel i7, 16GB RAM, ultra-slim design.',
      price: 999.99, discountPrice: 799.99, stock: 45, soldCount: 423, rating: 4.6, reviewCount: 189,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'],
      tags: ['laptop', 'intel', 'ultrabook', 'portable', 'office'], freeShipping: true, isActive: true, isFeatured: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Mechanical Gaming Keyboard RGB', slug: 'mechanical-gaming-keyboard-rgb',
      description: 'Elevate your gaming experience with our RGB Mechanical Keyboard. Cherry MX switches, per-key RGB lighting, and anti-ghosting technology for competitive advantage.',
      shortDescription: 'Cherry MX switches, full RGB, anti-ghosting game keyboard.',
      price: 89.99, discountPrice: 64.99, stock: 120, soldCount: 2108, rating: 4.5, reviewCount: 876,
      images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500'],
      tags: ['keyboard', 'gaming', 'mechanical', 'rgb', 'pc'], freeShipping: false, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: '4K Action Camera Pro', slug: '4k-action-camera-pro',
      description: 'Capture every adventure in stunning 4K resolution. Waterproof up to 30m, 170° wide-angle lens, and advanced image stabilization for smooth footage.',
      shortDescription: '4K/60fps, waterproof 30m, image stabilization.',
      price: 249.99, discountPrice: 179.99, stock: 60, soldCount: 634, rating: 4.7, reviewCount: 298,
      images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'],
      tags: ['camera', 'action', '4k', 'waterproof', 'adventure'], freeShipping: true, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Wireless Gaming Mouse', slug: 'wireless-gaming-mouse',
      description: 'Dominate your game with our Wireless Gaming Mouse. 25,600 DPI optical sensor, 70-hour battery life, and ultra-fast 1ms wireless response.',
      shortDescription: '25,600 DPI, 70hr battery, 1ms wireless response.',
      price: 79.99, discountPrice: 54.99, stock: 200, soldCount: 3421, rating: 4.8, reviewCount: 1243,
      images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
      tags: ['mouse', 'gaming', 'wireless', 'rgb', 'pc'], freeShipping: false, isActive: true,
    },
    // Fashion
    {
      id: uuidv4(), shopId: shop.id, categoryId: fashionCategory.id,
      name: 'Classic Comfort Sneakers', slug: 'classic-comfort-sneakers',
      description: 'Step into comfort with our Classic Comfort Sneakers. Premium leather upper, memory foam insole, and durable rubber sole for all-day wear.',
      shortDescription: 'Premium leather sneakers with memory foam comfort.',
      price: 79.99, discountPrice: 59.99, stock: 200, soldCount: 2341, rating: 4.6, reviewCount: 512,
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
      tags: ['sneakers', 'shoes', 'comfort', 'fashion', 'leather'], freeShipping: false, isActive: true, isFeatured: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: fashionCategory.id,
      name: 'Slim Fit Denim Jacket', slug: 'slim-fit-denim-jacket',
      description: 'Classic denim jacket with a modern slim fit. Crafted from premium heavyweight denim, featuring a button-front closure and multiple pockets.',
      shortDescription: 'Premium heavyweight denim, slim fit, versatile style.',
      price: 69.99, discountPrice: 49.99, stock: 150, soldCount: 1876, rating: 4.5, reviewCount: 432,
      images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500'],
      tags: ['jacket', 'denim', 'fashion', 'casual', 'slim fit'], freeShipping: false, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: fashionCategory.id,
      name: 'Minimalist Analog Watch', slug: 'minimalist-analog-watch',
      description: 'Timeless elegance meets modern minimalism. Sapphire crystal glass, genuine leather strap, and Japanese quartz movement for precise timekeeping.',
      shortDescription: 'Sapphire glass, leather strap, Japanese quartz movement.',
      price: 149.99, discountPrice: 99.99, stock: 90, soldCount: 987, rating: 4.7, reviewCount: 321,
      images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500'],
      tags: ['watch', 'analog', 'minimalist', 'leather', 'quartz'], freeShipping: true, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: fashionCategory.id,
      name: 'Luxury Leather Handbag', slug: 'luxury-leather-handbag',
      description: 'Make a statement with our Luxury Leather Handbag. Full-grain Italian leather, gold-tone hardware, and a spacious interior with multiple compartments.',
      shortDescription: 'Italian leather, gold hardware, multiple compartments.',
      price: 199.99, discountPrice: 149.99, stock: 60, soldCount: 743, rating: 4.8, reviewCount: 187,
      images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500'],
      tags: ['handbag', 'leather', 'luxury', 'fashion', 'women'], freeShipping: true, isActive: true, isFeatured: true,
    },
    // Home & Living
    {
      id: uuidv4(), shopId: shop.id, categoryId: homeCategory.id,
      name: 'Smart LED Desk Lamp', slug: 'smart-led-desk-lamp',
      description: 'Illuminate your workspace with our Smart LED Desk Lamp. App-controlled brightness and color temperature, USB-C charging port, and built-in wireless charger.',
      shortDescription: 'App-controlled, wireless charger, USB-C port.',
      price: 59.99, discountPrice: 42.99, stock: 180, soldCount: 3241, rating: 4.6, reviewCount: 892,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
      tags: ['lamp', 'desk', 'led', 'smart', 'home office'], freeShipping: false, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: homeCategory.id,
      name: 'Premium Coffee Maker Pro', slug: 'premium-coffee-maker-pro',
      description: 'Brew barista-quality coffee at home. Programmable 12-cup capacity, built-in grinder, and customizable brew strength. Thermal carafe keeps coffee hot for 4 hours.',
      shortDescription: '12-cup, built-in grinder, programmable, thermal carafe.',
      price: 129.99, discountPrice: 89.99, stock: 75, soldCount: 1543, rating: 4.7, reviewCount: 654,
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'],
      tags: ['coffee', 'maker', 'kitchen', 'grinder', 'programmable'], freeShipping: true, isActive: true, isFeatured: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: homeCategory.id,
      name: 'Memory Foam Pillow Set', slug: 'memory-foam-pillow-set',
      description: 'Sleep better with our premium Memory Foam Pillow Set. Ergonomic cervical support, hypoallergenic cover, and cooling gel technology for temperature regulation.',
      shortDescription: 'Cervical support, cooling gel, hypoallergenic, set of 2.',
      price: 49.99, discountPrice: 34.99, stock: 300, soldCount: 4532, rating: 4.5, reviewCount: 1876,
      images: ['https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=500'],
      tags: ['pillow', 'memory foam', 'sleep', 'bedding', 'cooling'], freeShipping: true, isActive: true,
    },
    // Beauty
    {
      id: uuidv4(), shopId: shop.id, categoryId: beautyCategory.id,
      name: 'Professional Hair Dryer 2200W', slug: 'professional-hair-dryer-2200w',
      description: 'Salon-quality hair drying at home. 2200W ionic technology reduces frizz and locks in shine. 3 heat settings, 2 speed settings, and cool shot button.',
      shortDescription: '2200W ionic technology, 3 heat settings, foldable design.',
      price: 59.99, discountPrice: 39.99, stock: 140, soldCount: 2876, rating: 4.6, reviewCount: 1043,
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500'],
      tags: ['hair dryer', 'ionic', 'salon', 'beauty', 'hair care'], freeShipping: false, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: beautyCategory.id,
      name: 'Vitamin C Serum with Hyaluronic Acid', slug: 'vitamin-c-serum-hyaluronic-acid',
      description: 'Transform your skin with our powerful Vitamin C Serum. 20% Vitamin C, hyaluronic acid, and vitamin E work together to brighten, plump, and protect your skin.',
      shortDescription: '20% Vitamin C, hyaluronic acid, vegan, dermatologist tested.',
      price: 34.99, discountPrice: 24.99, stock: 220, soldCount: 5234, rating: 4.8, reviewCount: 2341,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'],
      tags: ['serum', 'vitamin c', 'skincare', 'hyaluronic acid', 'brightening'], freeShipping: false, isActive: true, isFeatured: true,
    },
    // Sports
    {
      id: uuidv4(), shopId: shop.id, categoryId: sportsCategory.id,
      name: 'Adjustable Dumbbell Set 2-20kg', slug: 'adjustable-dumbbell-set-20kg',
      description: 'Replace 15 sets of weights with our innovative Adjustable Dumbbell System. Quick-change dial system lets you switch between 2-20kg in seconds.',
      shortDescription: 'Replaces 15 sets, 2-20kg range, quick-change dial.',
      price: 149.99, discountPrice: 109.99, stock: 55, soldCount: 876, rating: 4.7, reviewCount: 432,
      images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500'],
      tags: ['dumbbells', 'gym', 'fitness', 'strength training', 'home gym'], freeShipping: true, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: sportsCategory.id,
      name: 'Yoga Mat Premium Non-Slip', slug: 'yoga-mat-premium-non-slip',
      description: 'Achieve your wellness goals with our Premium Yoga Mat. Extra-thick 6mm TPE foam provides joint protection, while the superior non-slip surface ensures stability.',
      shortDescription: '6mm TPE foam, non-slip, eco-friendly, alignment lines.',
      price: 29.99, discountPrice: 19.99, stock: 400, soldCount: 8234, rating: 4.6, reviewCount: 3421,
      images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
      tags: ['yoga', 'mat', 'fitness', 'non-slip', 'eco-friendly'], freeShipping: false, isActive: true,
    },
    // Books
    {
      id: uuidv4(), shopId: shop.id, categoryId: booksCategory.id,
      name: 'The Complete Python Developer Guide', slug: 'complete-python-developer-guide',
      description: 'Master Python programming from basics to advanced topics. Covers Python 3.12, data structures, OOP, web scraping, automation, and real-world projects.',
      shortDescription: 'Python 3.12, 700+ pages, projects, beginner to advanced.',
      price: 39.99, discountPrice: 27.99, stock: 500, soldCount: 3241, rating: 4.9, reviewCount: 1543,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      tags: ['python', 'programming', 'coding', 'book', 'developer'], freeShipping: false, isActive: true,
    },
    // Toys & Kids
    {
      id: uuidv4(), shopId: shop.id, categoryId: toysCategory.id,
      name: 'STEM Robot Building Kit', slug: 'stem-robot-building-kit',
      description: 'Inspire young engineers with our STEM Robot Building Kit. 300+ pieces, step-by-step instructions, and a free coding app to program your creation.',
      shortDescription: '300+ pieces, coding app included, ages 8+, STEM learning.',
      price: 54.99, discountPrice: 39.99, stock: 120, soldCount: 1234, rating: 4.8, reviewCount: 567,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
      tags: ['robot', 'stem', 'kids', 'building', 'coding'], freeShipping: true, isActive: true,
    },
    // Health
    {
      id: uuidv4(), shopId: shop.id, categoryId: healthCategory.id,
      name: 'Smart Blood Pressure Monitor', slug: 'smart-blood-pressure-monitor',
      description: 'Monitor your cardiovascular health with our Smart Blood Pressure Monitor. Bluetooth connectivity to our app, irregular heartbeat detection, and 120-reading memory.',
      shortDescription: 'Bluetooth, irregular heartbeat detection, 120 memory slots.',
      price: 44.99, discountPrice: 32.99, stock: 90, soldCount: 2134, rating: 4.7, reviewCount: 876,
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'],
      tags: ['blood pressure', 'health', 'monitor', 'bluetooth', 'smart'], freeShipping: false, isActive: true,
    },
    {
      id: uuidv4(), shopId: shop.id, categoryId: electronicsCategory.id,
      name: 'Portable Bluetooth Speaker 360°', slug: 'portable-bluetooth-speaker-360',
      description: 'Take your music anywhere with our 360° Bluetooth Speaker. IPX7 waterproof, 20-hour battery life, bass booster, and built-in microphone for hands-free calls.',
      shortDescription: 'IPX7 waterproof, 20hr battery, 360° surround sound.',
      price: 69.99, discountPrice: 49.99, stock: 160, soldCount: 4321, rating: 4.7, reviewCount: 1876,
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
      tags: ['speaker', 'bluetooth', 'portable', 'waterproof', 'bass'], freeShipping: false, isActive: true, isFeatured: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`✅ Created ${products.length} sample products`);

  // Create flash sale
  const now = new Date();
  const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

  const flashSale = await prisma.flashSale.upsert({
    where: { id: 'flash-sale-demo' },
    update: { endTime },
    create: {
      id: 'flash-sale-demo',
      title: '⚡ Flash Sale — Up to 70% Off!',
      startTime: now,
      endTime,
      isActive: true,
    },
  });

  const dbProducts = await prisma.product.findMany({ take: 3, include: { shop: true } });
  for (const product of dbProducts) {
    const originalPrice = product.discountPrice || product.price;
    const salePrice = originalPrice * 0.7;
    const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    await prisma.flashSaleProduct.upsert({
      where: { flashSaleId_productId: { flashSaleId: flashSale.id, productId: product.id } },
      update: {},
      create: {
        id: uuidv4(),
        flashSaleId: flashSale.id,
        productId: product.id,
        shopId: product.shopId,
        salePrice,
        originalPrice,
        discountPercent,
        stock: 50,
      },
    });
  }
  console.log('✅ Flash sale created');

  // Create vouchers
  await prisma.voucher.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      id: uuidv4(), code: 'WELCOME10', title: 'New User Discount', description: '10% off your first order',
      discountType: 'PERCENTAGE', discountValue: 10, maxDiscount: 20,
      minOrderAmount: 25, maxUses: 1000, isActive: true,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.voucher.upsert({
    where: { code: 'SAVE5' },
    update: {},
    create: {
      id: uuidv4(), code: 'SAVE5', title: 'Save $5', description: '$5 off orders over $30',
      discountType: 'FIXED', discountValue: 5, minOrderAmount: 30,
      maxUses: 5000, isActive: true,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Vouchers created');

  console.log('\n🚀 NexMart database seeded successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:  admin@nexmart.com  / Admin@123456');
  console.log('Seller: seller@nexmart.com / Seller@123456');
  console.log('Buyer:  buyer@nexmart.com  / Buyer@123456');
  console.log('Codes:  WELCOME10, SAVE5');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
