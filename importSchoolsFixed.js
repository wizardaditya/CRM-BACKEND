require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importSchoolsFixed() {
  console.log('🏫 IMPORTING JABALPUR SCHOOLS (WITHOUT BOARDS FIELD)...\n');
  
  const schoolsData = [
    { sno: 1, name: "Army School G.R.C.", phone: "0761-2668543", email: "asjbp_1@rediffmail.com", board: "CBSE", level: "High" },
    { sno: 2, name: "Army School No.2, C/O Jak Rif. R.C.", phone: "0761-2678715", email: "asjak@rediffmail.com", board: "CBSE", level: "High" },
    { sno: 3, name: "Central Academy Eng Med School", phone: "0761-2643690", email: "central-academy009@rediffmail.com", board: "CBSE", level: "High" },
    { sno: 4, name: "Christ Church Boys' Senior Secondary School", phone: "0761-2323182", email: "ccbss_jbp@rediffmail.com", board: "CBSE", level: "High", address: "Sleeman Road, North Civil Lines" },
    { sno: 5, name: "Christ Church Girls' Senior Secondary School", phone: "0761-2623289", email: "ccgirls@airtelmail.in", board: "CBSE", level: "High", address: "North Civil Lines" },
    { sno: 6, name: "Delhi Public School, Nagpur Rd Tilwara", phone: "0761-6451459", email: "principaldpsnrjabalpur@ymail.com", board: "CBSE", level: "High" },
    { sno: 7, name: "Desilva Ratanshi Higher Secondary School", phone: "0761-4739724", email: "", board: "State", level: "High", address: "New Ramnagar, Adhartal" },
    { sno: 8, name: "Johnson English Medium Higher Secondary School", phone: "0761-4034114", email: "", board: "State", level: "High", address: "Narmada Road" },
    { sno: 9, name: "Joy Senior Secondary School", phone: "0761-2641726", email: "jsschool@gmail.com", board: "CBSE", level: "High", address: "Vijay Nagar" },
    { sno: 10, name: "Leonard Higher Secondary School", phone: "0761-2764984", email: "", board: "State", level: "High", address: "Ridge Road" },
    { sno: 11, name: "MGM Higher Secondary School", phone: "0761-2427842", email: "", board: "ICSE", level: "High", address: "Hathital, Gupteshwar Road" },
    { sno: 12, name: "Maharishi Vidya Mandir, Lamti Vijaynagar", phone: "0761-4054029", email: "mvnvnjbp@rediffmail.com", board: "CBSE", level: "High" },
    { sno: 13, name: "Mar Thoma Gram Jyoti School, Khitola", phone: "91-9300669864", email: "sihoragramjyoti@yahoo.co.in", board: "CBSE", level: "High" },
    { sno: 14, name: "Nachiketa Higher Secondary School", phone: "0761-4041192", email: "nachiketa83@yahoo.co.in", board: "CBSE", level: "High" },
    { sno: 15, name: "Noble Children Academy Higher Secondary School", phone: "0761-2648800", email: "", board: "CBSE", level: "High", address: "MR-4 Road, Vijay Nagar" },
    { sno: 16, name: "Royal Hr Sec School, Sanjeevani Nagar", phone: "0761-2423344", email: "royalschooljbp@hotmail.com", board: "CBSE", level: "High" },
    { sno: 17, name: "Royal Senior Secondary School", phone: "9993204840", email: "", board: "CBSE", level: "High", address: "Sanjeevani Nagar" },
    { sno: 18, name: "Ryan International School", phone: "", email: "", board: "CBSE", level: "High" },
    { sno: 19, name: "Small Wonders, Jeevan Colony Baldeo Bagh", phone: "0761-4003803", email: "ajaytdm@yahoo.com", board: "CBSE", level: "High" },
    { sno: 20, name: "St Aloysius School, Rimjhai", phone: "0761-2688477", email: "staloysiusrimjha@rediffmail.com", board: "CBSE", level: "High" },
    { sno: 21, name: "St Augustine School, Sagda", phone: "0761-2671561", email: "sojanjohn2003@yahoo.com", board: "CBSE", level: "High" },
    { sno: 22, name: "St Joseph's Conv Sr Sec School, Ranjhi", phone: "0761-2632224", email: "sjcrjbp@yahoo.com", board: "CBSE", level: "High" },
    { sno: 23, name: "St. Aloysius School, Polypathar", phone: "0761-2668877", email: "staloysiuspolipatharJBP@gmail.com", board: "CBSE", level: "High" },
    { sno: 24, name: "St. Aloysius Senior Secondary School", phone: "0761-2688476", email: "principal@staloysius@ymail.com", board: "CBSE", level: "High", address: "Katangi Bypass Road, Rimjha" },
    { sno: 25, name: "St. Aloysius Senior Secondary School - Gwarighat Road", phone: "0761-2668877", email: "", board: "CBSE", level: "High", address: "Gwarighat Road, Polipathar" },
    { sno: 26, name: "St. Gabriel Higher Secondary School", phone: "0761-2337944", email: "gabrielsjbp@yahoo.com", board: "CBSE", level: "High", address: "Ranjhi, Khamaria" },
    { sno: 27, name: "St. Gabriels Higher Secondary School", phone: "0761-2874906", email: "", board: "State", level: "High", address: "Bhawartal Garden, Main Gate, Wright Town" },
    { sno: 28, name: "St. Joseph's Convent Girls Senior Secondary School", phone: "0761-4020444", email: "sjcjbporg@yahoo.com", board: "CBSE", level: "High", address: "1, Ahilya Bai Marg, Sadar" },
    { sno: 29, name: "St. Norbert Convent Girls Higher Secondary School", phone: "0761-2874906", email: "", board: "State", level: "High", address: "Bhawartal Garden, Main Gate, Wright Town" },
    { sno: 30, name: "The Royal Heritage Public School", phone: "0761-6543397", email: "theroyalheritage9999@gmail.com", board: "CBSE", level: "High" },
  ];
  
  try {
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@a5xcrm.in' } });
    let imported = 0;
    
    for (const school of schoolsData) {
      try {
        const leadNumber = `A5X-${String(school.sno).padStart(4, '0')}`;
        
        const leadData = {
          leadNumber: leadNumber,
          organization: school.name,
          contactPerson: 'Principal',
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
        console.log(`✅ ${imported}. ${school.name}`);
        
      } catch (error) {
        console.log(`❌ Error importing ${school.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 FIRST BATCH COMPLETE!`);
    console.log(`✅ Successfully imported: ${imported} schools`);
    console.log(`\n📊 Your CRM now has ${imported} leads!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importSchoolsFixed().catch(console.error).finally(() => prisma.$disconnect());