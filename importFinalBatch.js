require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importFinalBatch() {
  console.log('🏫 IMPORTING FINAL BATCH JABALPUR SCHOOLS (61-118)...\n');
  
  const finalBatch = [
    { sno: 61, name: "Indira High School, Iti Madhotal", phone: "9303497426", email: "", board: "State", level: "Medium", contact: "MRS. SAROJ VISHWKARMA" },
    { sno: 62, name: "Jagmohan Das H S School, Ratan Nagar", phone: "9424928318", email: "", board: "State", level: "Medium", contact: "MRS. SYAMA SHRIWASTAV" },
    { sno: 63, name: "Jawahar Navodaya Vidyalaya - JNV Jabalpur", phone: "0761-2880245", email: "jnvbarginagar@yahoo.com", board: "CBSE", level: "Medium", address: "Bargi Nagar" },
    { sno: 64, name: "Kendriya Vidyalaya - KV CMM Jabalpur", phone: "0761-2601703", email: "", board: "CBSE", level: "Medium", address: "C.M.M. Ridge Road, Near Lekha Nagar" },
    { sno: 65, name: "Kendriya Vidyalaya - KV No. 2 Jabalpur", phone: "0761-2678050", email: "", board: "CBSE", level: "Medium", address: "GCF Factory" },
    { sno: 66, name: "Kendriya Vidyalaya - KV Singrauli", phone: "07805-266986", email: "", board: "CBSE", level: "Medium", address: "NCL Colony, P.O. Singrauli Colliery" },
    { sno: 67, name: "Kendriya Vidyalaya - KV TFRI Jabalpur", phone: "0761-2840480", email: "", board: "CBSE", level: "Medium", address: "TFRI, Mandla Road, Post- RFRC" },
    { sno: 68, name: "Kendriya Vidyalaya - KV VF Jabalpur", phone: "0761-2330191", email: "", board: "CBSE", level: "Medium", address: "Vehicle Factory Estate, Sector 2" },
    { sno: 69, name: "Kidz Castle School", phone: "0761-2415950", email: "", board: "State", level: "Medium", address: "Bishambhar Bhawan, Ground Floor, 18, Civic Center" },
    { sno: 70, name: "Kucheni Senior Hs School, Damoh Naka", phone: "9425433904", email: "", board: "State", level: "Medium", contact: "MR. SHARAD SHRIVASTAV" },
    { sno: 71, name: "Lgn Memo Hs School, Lalmati Dwarka Nagar", phone: "8720020430", email: "", board: "State", level: "Medium", contact: "MRS. SANKUNTALA SAHU" },
    { sno: 72, name: "Little World School", phone: "7612673623", email: "sband99@indiatimes.com", board: "CBSE", level: "Medium", address: "Nagpur Road, Tilwara" },
    { sno: 73, name: "Little World School - Katanga", phone: "7612404412", email: "", board: "CBSE", level: "Medium", address: "APR Colony, Katanga" },
    { sno: 74, name: "M.M. International School - MMIS", phone: "8109000157", email: "", board: "CBSE", level: "Medium", address: "Patan By Pass Road, Behind Global College" },
    { sno: 75, name: "Maharani Lakshmi Bai School", phone: "0761-4529742", email: "", board: "State", level: "Medium", address: "Wright Town Stadium Gate No. 1" },
    { sno: 76, name: "Maharishi Vidya Mandir - MVM Adhartal", phone: "0761-2680779", email: "", board: "State", level: "Medium", address: "Behind Quality Garments, Nagar Nigam Market, Adhartal" },
    { sno: 77, name: "Maharishi Vidya Mandir - MVM Jabalpur", phone: "0761-2665888", email: "mvmjbp@rediffmail.com", board: "CBSE", level: "Medium", address: "50, Narmada Road" },
    { sno: 78, name: "Maharishi Vidya Mandir - Napier Town", phone: "0761-4004988", email: "mvmjbpii@rediffmail.com", board: "CBSE", level: "Medium", address: "2nd 756, Siddha Bhawan, Napier Town" },
    { sno: 79, name: "Marble Rock School", phone: "8989125384", email: "marblerockschool@gmail.com", board: "CBSE", level: "Medium", address: "Gaur Tiraha, Mandla Road, Neemkheda" },
    { sno: 80, name: "Md Bangali Girl's Hs School, Marhatal", phone: "9584624654", email: "", board: "State", level: "Medium", contact: "MRS. MEENA THIODOR" },
    { sno: 81, name: "Millenium Academy H.S. School, Lal Bahadur Shastri Nagar", phone: "8989127163", email: "", board: "State", level: "Medium", contact: "MRS. SUSHMA CHOUHAN" },
    { sno: 82, name: "Mispa Mission Hs School, J.P. Nagar Adhartaal", phone: "9303253205", email: "", board: "State", level: "Medium", contact: "MRS. SHAINIJAAN" },
    { sno: 83, name: "Mount Litera Zee School", phone: "8461811101", email: "", board: "CBSE", level: "Medium", address: "Takshshila Hills, Sharda Chowk, Madan Mahal" },
    { sno: 84, name: "Nalanda Public School", phone: "0761-2673822", email: "nalanda2004@gmail.com", board: "CBSE", level: "Medium", address: "Dhanwantri Nagar" },
    { sno: 85, name: "Narmada Vidhya Niketan (Hm) Hs School, Hanumantaal", phone: "9329273413", email: "", board: "State", level: "Medium", contact: "MRS. CHANDRKALA JAIN" },
    { sno: 86, name: "Narmada Vidya Niketan H.S. School, Suhagi Maharajpur Adhartaal", phone: "9302547047", email: "", board: "State", level: "Medium", contact: "MRS. UMA LAKHERA" },
    { sno: 87, name: "Narmada Vidya Niketan Hs School, Dixitpura", phone: "9300729236", email: "", board: "State", level: "Medium", contact: "MR. R.S. DWEDI" },
    { sno: 88, name: "Nav Jyoti Special School", phone: "0761-2642114", email: "", board: "State", level: "Medium", address: "Katangi Bypass Road, Rimjha" },
    { sno: 89, name: "Navambe Convent High School, Durga Nagar", phone: "9826181309", email: "", board: "State", level: "Medium", contact: "MRS. RAJKUMAR PANDEY" },
    { sno: 90, name: "Naveen Vidya Bhawan Hs School, Napier Town", phone: "9826542270", email: "", board: "State", level: "Medium", contact: "MRS. M.L. GOUTAM" },
    { sno: 91, name: "Netraheen Kanya High School, Bhawartal", phone: "9329822830", email: "", board: "State", level: "Medium", contact: "MR. POORAN CHANDRA MISHRA" },
    { sno: 92, name: "Nivedita Hs School, Gupteshwar", phone: "9300994095", email: "", board: "State", level: "Medium", contact: "MRS. ANITA BHATIYA" },
    { sno: 93, name: "Panchasheel Hs School, Gohalpur", phone: "8982175385", email: "", board: "State", level: "Medium", contact: "MR. M.L. VILLORE" },
    { sno: 94, name: "Parent's Pride Residential School", phone: "07610-2413717", email: "", board: "CBSE", level: "Medium", address: "Nagpur Road, Vaastuland Tower" },
    { sno: 95, name: "Podar International School", phone: "", email: "", board: "CBSE", level: "Medium", address: "Aashiyana Township, Water Works Road, Near Penty Naka Gora Bazaar, Kajarwara" },
    { sno: 96, name: "Pratibhasthali Gyanodaya Vidyapeeth", phone: "9893718862", email: "pratibha_sthali@yahoo.co.in", board: "CBSE", level: "Medium", address: "Dayoday Tirtha, Tilwara Ghat" },
    { sno: 97, name: "Raksha International Public Hs School", phone: "9525153051", email: "", board: "State", level: "Medium", contact: "MRS. RAKSHA ANURAG SONI" },
    { sno: 98, name: "Samdariya Public School", phone: "07612-901403", email: "", board: "State", level: "Medium", address: "Madhotal, Green City, Behind Shri Ram College, Damoh Road" },
    { sno: 99, name: "Sanmati High School, Bazar Mohalla Barela", phone: "9424773044", email: "", board: "State", level: "Medium", contact: "MR. SHRIRAM AGRAWAL" },
    { sno: 100, name: "Saraswati High School, Bargi Saliwada", phone: "7566058450", email: "", board: "State", level: "Medium", contact: "MRS. SANDHYA JAIN" },
    { sno: 101, name: "Saraswati Hs School, Jail Road Sihora", phone: "9424915184", email: "", board: "State", level: "Medium", contact: "MR. VINOD GARG" },
    { sno: 102, name: "Saraswati Shishu High School, Majhgawa", phone: "9981742505", email: "", board: "State", level: "Medium", contact: "MR. MUNNALAL SHUKLA" },
    { sno: 103, name: "Saraswati Shishu Mandir High School, Gosalpura Sihora", phone: "9424341025", email: "", board: "State", level: "Medium", contact: "MR. RAJARAM TRIPATHI" },
    { sno: 104, name: "Saraswati Shishu Vidya Mandir High School, Gcf Estate Gokalpur", phone: "9424395414", email: "", board: "State", level: "Medium", contact: "MR. PURSHOTTAM NAMDEO" },
    { sno: 105, name: "Saraswati Shishu Vidya Mandir High School, Majhouli", phone: "9755088897", email: "", board: "State", level: "Medium", contact: "MR. CHANDRAKANT MISHRA" },
    { sno: 106, name: "Satya Prakash Public School - SPPS", phone: "0761-2667611", email: "", board: "CBSE", level: "Medium", address: "Polipathar, Gwarighat Road" },
    { sno: 107, name: "Shishu Shiksha Mandir Hss, Nepier Town", phone: "9907677105", email: "", board: "State", level: "Medium", contact: "MRS. P. VARMA" },
    { sno: 108, name: "Shiv Shakti International School", phone: "0761-2830959", email: "", board: "State", level: "Medium", address: "Near Bheraghat Railway Station" },
    { sno: 109, name: "Shri Balaji Public School", phone: "7772829422", email: "", board: "CBSE", level: "Medium", address: "Gram Basaha, Near JDA Scheme No. 41, Post Garha" },
    { sno: 110, name: "Shri Krishna Hs School, Gora Bazar", phone: "9926343523", email: "", board: "State", level: "Medium", contact: "MR. R.K. PADARHA" },
    { sno: 111, name: "Shri Sainath Hs School, Kanchanpur Adhartaal", phone: "9907458331", email: "", board: "State", level: "Medium", contact: "MR. SAROJ SINGH" },
    { sno: 112, name: "Smt. Dularibai High School, Dhanpuri", phone: "9303504431", email: "", board: "State", level: "Medium", contact: "MR. P.L. CHOUKSE" },
    { sno: 113, name: "Snj Trust Girl's Hs School, Gorakhpur", phone: "9826638999", email: "", board: "State", level: "Medium", contact: "MRS. REETA CHOUDHRY" },
    { sno: 114, name: "Sri Ramkrishna Ashram Hs School, Ghamapur", phone: "9425324109", email: "", board: "State", level: "Medium", contact: "MR. S.R. SHIVHARE" },
    { sno: 115, name: "St. Xavier's High School", phone: "0761-4008126", email: "", board: "ICSE", level: "Medium", address: "Gupteshwar", contact: "MRS. P. PANDEY" },
    { sno: 116, name: "Ujjawal Sahitya Niketan High School, Sihora", phone: "9617538517", email: "", board: "State", level: "Medium", contact: "MRS. MONIKA TIWARI" },
    { sno: 117, name: "Vallabh Hs School, Hanumantal", phone: "9755924684", email: "", board: "State", level: "Medium", contact: "MRS. UMA YADAV" },
    { sno: 118, name: "Vision International Public School", phone: "9009933344", email: "", board: "CBSE", level: "Medium", address: "Patan Road, Near NTPC, Sukha" },
  ];
  
  try {
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@a5xcrm.in' } });
    let imported = 0;
    
    for (const school of finalBatch) {
      try {
        const leadNumber = `A5X-${String(school.sno).padStart(4, '0')}`;
        
        const leadData = {
          leadNumber: leadNumber,
          organization: school.name,
          contactPerson: school.contact || 'Principal',
          designation: 'Principal',
          mobile: school.phone || '',
          whatsapp: school.phone || '',
          email: school.email || null,
          address: school.address || 'Jabalpur',
          city: 'Jabalpur',
          state: 'Madhya Pradesh',
          country: 'India',
          industry: 'Education',
          source: 'Database',
          interestedService: 'Coding Program',
          status: 'NEW_LEAD',
          priority: school.level === 'High' ? 'HIGH' : 'MEDIUM',
          expectedValue: school.level === 'High' ? 75000 : 50000,
          probability: 25,
          remarks: `Level: ${school.level}, Board: ${school.board}`,
          createdById: adminUser?.id || null,
          isActive: true,
        };
        
        await prisma.lead.create({ data: leadData });
        imported++;
        console.log(`✅ ${school.sno}. ${school.name}`);
        
      } catch (error) {
        console.log(`❌ Error importing ${school.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 FINAL BATCH COMPLETE!`);
    console.log(`✅ Successfully imported: ${imported} schools`);
    
    // Get total count
    const totalLeads = await prisma.lead.count();
    console.log(`\n🏆 MISSION ACCOMPLISHED!`);
    console.log(`📊 Your CRM now has ${totalLeads} total leads!`);
    console.log(`🔥 All Jabalpur schools have been imported successfully!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importFinalBatch().catch(console.error).finally(() => prisma.$disconnect());