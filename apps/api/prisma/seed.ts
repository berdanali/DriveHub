import { PrismaClient, RoleType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create roles
    console.log('Creating roles...');
    const roles = await Promise.all([
        prisma.role.upsert({
            where: { name: RoleType.SUPER_ADMIN },
            update: {},
            create: { name: RoleType.SUPER_ADMIN, description: 'Platform administrator with full access' },
        }),
        prisma.role.upsert({
            where: { name: RoleType.VEHICLE_OWNER },
            update: {},
            create: { name: RoleType.VEHICLE_OWNER, description: 'Vehicle owner who can list and manage vehicles' },
        }),
        prisma.role.upsert({
            where: { name: RoleType.CUSTOMER },
            update: {},
            create: { name: RoleType.CUSTOMER, description: 'Customer who can rent vehicles' },
        }),
    ]);
    console.log(`✓ Created ${roles.length} roles`);

    // Hash passwords
    const hashOptions = {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    };

    const adminPassword = await argon2.hash('Admin123!', hashOptions);
    const ownerPassword = await argon2.hash('Owner123!', hashOptions);
    const owner2Password = await argon2.hash('Owner123!', hashOptions);
    const customerPassword = await argon2.hash('Customer123!', hashOptions);

    const adminRole = roles.find(r => r.name === RoleType.SUPER_ADMIN)!;
    const ownerRole = roles.find(r => r.name === RoleType.VEHICLE_OWNER)!;
    const customerRole = roles.find(r => r.name === RoleType.CUSTOMER)!;

    // ==========================================
    // USERS
    // ==========================================

    console.log('Creating users...');

    const admin = await prisma.user.upsert({
        where: { email: 'admin@carrental.com' },
        update: {},
        create: {
            email: 'admin@carrental.com',
            password: adminPassword,
            firstName: 'Super',
            lastName: 'Admin',
            phone: '+905551234567',
            isActive: true,
            isVerified: true,
            roleId: adminRole.id,
        },
    });
    console.log(`  ✓ Admin: ${admin.email}`);

    const owner1 = await prisma.user.upsert({
        where: { email: 'owner@carrental.com' },
        update: {},
        create: {
            email: 'owner@carrental.com',
            password: ownerPassword,
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            phone: '+905559876543',
            isActive: true,
            isVerified: true,
            roleId: ownerRole.id,
        },
    });
    console.log(`  ✓ Owner 1: ${owner1.email}`);

    const owner2 = await prisma.user.upsert({
        where: { email: 'owner2@carrental.com' },
        update: {},
        create: {
            email: 'owner2@carrental.com',
            password: owner2Password,
            firstName: 'Mehmet',
            lastName: 'Demir',
            phone: '+905553456789',
            isActive: true,
            isVerified: true,
            roleId: ownerRole.id,
        },
    });
    console.log(`  ✓ Owner 2: ${owner2.email}`);

    const customer = await prisma.user.upsert({
        where: { email: 'customer@carrental.com' },
        update: {},
        create: {
            email: 'customer@carrental.com',
            password: customerPassword,
            firstName: 'Elif',
            lastName: 'Kaya',
            phone: '+905557654321',
            isActive: true,
            isVerified: true,
            roleId: customerRole.id,
        },
    });
    console.log(`  ✓ Customer: ${customer.email}`);

    // ==========================================
    // VEHICLES
    // ==========================================

    console.log('Creating vehicles...');

    // Toplam 9 araç - çeşitli segmentlerden
    const vehicleData = [
        // ---- Owner 1 Vehicles (Ahmet Yılmaz - İstanbul) ----
        {
            make: 'BMW',
            model: '320i',
            year: 2023,
            licensePlate: '34ABC123',
            color: 'Siyah',
            seats: 5,
            fuelType: 'Benzin',
            transmission: 'Otomatik',
            dailyRate: 1500,
            description: 'BMW 320i, sportif tasarımı ve dinamik sürüş keyfi ile öne çıkan premium bir sedan. Deri koltuklar, panoramik cam tavan ve tam donanım.',
            images: [
                'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
                'https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?w=800',
            ],
            features: ['GPS', 'Deri Koltuk', 'Cam Tavan', 'Bluetooth', 'Geri Görüş Kamerası', 'Isıtmalı Koltuk'],
            latitude: 41.0082,
            longitude: 28.9784,
            address: 'Şişli, İstanbul',
            city: 'İstanbul',
            ownerId: owner1.id,
        },
        {
            make: 'Mercedes-Benz',
            model: 'C200',
            year: 2024,
            licensePlate: '34DEF456',
            color: 'Beyaz',
            seats: 5,
            fuelType: 'Dizel',
            transmission: 'Otomatik',
            dailyRate: 1800,
            description: 'Yeni kasa Mercedes C200, şık ve konforlu bir sedan. MBUX multimedya sistemi, 360 derece kamera ve çevresel aydınlatma.',
            images: [
                'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
                'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
            ],
            features: ['GPS', 'Deri Koltuk', 'Isıtmalı Koltuk', 'Geri Görüş Kamerası', '360 Kamera', 'Apple CarPlay'],
            latitude: 41.0422,
            longitude: 29.0083,
            address: 'Kadıköy, İstanbul',
            city: 'İstanbul',
            ownerId: owner1.id,
        },
        {
            make: 'Audi',
            model: 'A4',
            year: 2023,
            licensePlate: '34GHI789',
            color: 'Gri',
            seats: 5,
            fuelType: 'Benzin',
            transmission: 'Otomatik',
            dailyRate: 1600,
            description: 'Audi A4, Quattro çekiş sistemi ve S-Line paket ile sportifliliği zarafet ile birleştiriyor. Virtual Cockpit dijital gösterge paneli.',
            images: [
                'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
                'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800',
            ],
            features: ['GPS', 'Sport Modu', 'Deri Koltuk', 'Apple CarPlay', 'Virtual Cockpit', 'Quattro AWD'],
            latitude: 40.9892,
            longitude: 29.0294,
            address: 'Ataşehir, İstanbul',
            city: 'İstanbul',
            ownerId: owner1.id,
        },
        {
            make: 'Toyota',
            model: 'Corolla',
            year: 2024,
            licensePlate: '34MNO345',
            color: 'Gümüş',
            seats: 5,
            fuelType: 'Hybrid',
            transmission: 'Otomatik',
            dailyRate: 850,
            description: 'Toyota Corolla Hybrid, çevre dostu yakıt tüketimi ve güvenilirliğiyle öne çıkan ekonomik sedan. Toyota Safety Sense güvenlik paketi.',
            images: [
                'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
                'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800',
            ],
            features: ['GPS', 'Bluetooth', 'Geri Görüş Kamerası', 'Şerit Takip', 'Çarpışma Önleme', 'Hybrid Motor'],
            latitude: 41.0634,
            longitude: 29.0076,
            address: 'Sarıyer, İstanbul',
            city: 'İstanbul',
            ownerId: owner1.id,
        },
        {
            make: 'Tesla',
            model: 'Model 3',
            year: 2024,
            licensePlate: '34STU901',
            color: 'Kırmızı',
            seats: 5,
            fuelType: 'Elektrik',
            transmission: 'Otomatik',
            dailyRate: 2000,
            description: 'Tesla Model 3, tam elektrikli performans sedanı. 0-100 km/h 3.3 saniye, 500 km menzil. Autopilot ve dev dokunmatik ekran.',
            images: [
                'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
                'https://images.unsplash.com/photo-1571987502227-9231b837d92a?w=800',
            ],
            features: ['Autopilot', 'Tam Elektrik', '15" Dokunmatik Ekran', 'OTA Güncelleme', 'Frunk', 'Süper Şarj'],
            latitude: 41.0371,
            longitude: 28.9850,
            address: 'Maslak, İstanbul',
            city: 'İstanbul',
            ownerId: owner1.id,
        },

        // ---- Owner 2 Vehicles (Mehmet Demir - Ankara/İzmir) ----
        {
            make: 'Renault',
            model: 'Clio',
            year: 2023,
            licensePlate: '06VWX234',
            color: 'Turuncu',
            seats: 5,
            fuelType: 'Benzin',
            transmission: 'Otomatik',
            dailyRate: 600,
            description: 'Renault Clio, şehir içi kullanım için tasarlanmış kompakt ve ekonomik araç. Dar sokaklarda kolay manevra, düşük yakıt tüketimi.',
            images: [
                'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
            ],
            features: ['GPS', 'Bluetooth', 'Park Sensörü', 'Klima', 'Cruise Control'],
            latitude: 39.9334,
            longitude: 32.8597,
            address: 'Çankaya, Ankara',
            city: 'Ankara',
            ownerId: owner2.id,
        },
        {
            make: 'Honda',
            model: 'Civic',
            year: 2023,
            licensePlate: '06BCD890',
            color: 'Siyah',
            seats: 5,
            fuelType: 'Benzin',
            transmission: 'Otomatik',
            dailyRate: 1100,
            description: 'Honda Civic, sportif tasarım ve güvenilir Japon mühendisliği. VTEC turbo motor, Honda Sensing güvenlik teknolojileri.',
            images: [
                'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800',
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
            ],
            features: ['GPS', 'Apple CarPlay', 'Android Auto', 'Honda Sensing', 'Şerit Takip', 'Otomatik Klima'],
            latitude: 39.9120,
            longitude: 32.8543,
            address: 'Eryaman, Ankara',
            city: 'Ankara',
            ownerId: owner2.id,
        },
        {
            make: 'Hyundai',
            model: 'Tucson',
            year: 2024,
            licensePlate: '06EFG123',
            color: 'Yeşil',
            seats: 5,
            fuelType: 'Hybrid',
            transmission: 'Otomatik',
            dailyRate: 1400,
            description: 'Hyundai Tucson Hybrid, fütüristik tasarımı ve hibrid teknolojisi ile çevreci SUV. Geniş iç mekan, panoramik cam tavan.',
            images: [
                'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
                'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
            ],
            features: ['GPS', 'Panoramik Cam Tavan', 'Isıtmalı Koltuk', 'Kablosuz Şarj', 'Blind Spot', 'Hybrid Motor'],
            latitude: 38.4192,
            longitude: 27.1287,
            address: 'Alsancak, İzmir',
            city: 'İzmir',
            ownerId: owner2.id,
        },
        {
            make: 'Volkswagen',
            model: 'Passat',
            year: 2023,
            licensePlate: '16WXY901',
            color: 'Gri',
            seats: 5,
            fuelType: 'Dizel',
            transmission: 'Otomatik',
            dailyRate: 1100,
            description: 'VW Passat, iş dünyasının vazgeçilmez sedan modeli. TDI dizel motor ile düşük tüketim, geniş iç mekan ve yüksek konfor.',
            images: [
                'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800',
                'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
            ],
            features: ['GPS', 'Deri Koltuk', 'Adaptif Hız Sabitleyici', 'Park Assist', 'Matrix LED Far', 'Dijital Cockpit'],
            latitude: 40.1826,
            longitude: 29.0674,
            address: 'Nilüfer, Bursa',
            city: 'Bursa',
            ownerId: owner2.id,
        },
    ];

    let createdCount = 0;
    for (const v of vehicleData) {
        await prisma.vehicle.upsert({
            where: { licensePlate: v.licensePlate },
            update: {},
            create: {
                ...v,
                status: 'AVAILABLE',
                isApproved: true,
            },
        });
        createdCount++;
    }
    console.log(`✓ Created ${createdCount} vehicles`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('   Admin:    admin@carrental.com / Admin123!');
    console.log('   Owner 1:  owner@carrental.com / Owner123!   (Ahmet Yılmaz - İstanbul)');
    console.log('   Owner 2:  owner2@carrental.com / Owner123!  (Mehmet Demir - Ankara/İzmir/Antalya/Bursa)');
    console.log('   Customer: customer@carrental.com / Customer123!  (Elif Kaya)');
    console.log(`\n🚗 Total vehicles: ${createdCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
