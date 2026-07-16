require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importJabalpurSchools() {
  console.log('🏫 IMPORTING JABALPUR SCHOOLS DATA...\n');
  
  const schoolsData = [
    {
      sno: 1,
      schoolName: "Army School G.R.C.",
      level: "High",
      board: "CBSE-affiliated private school",
      contactPerson: "",
      phone: "0761-2668543, 2663889",
      email: "asjbp_1@rediffmail.com",
      address: "",
      atlStatus: "No record found",
      atlNotes: "Not found in AIM Operational ATL registry"
    },
    {
      sno: 2,
      schoolName: "Army School No.2, C/O Jak Rif. R.C.",
      level: "High",
      board: "CBSE-affiliated private school",
      contactPerson: "",
      phone: "0761-2678715, 4082156",
      email: "asjak@rediffmail.com",
      address: "",
      atlStatus: "No record found",
      atlNotes: "Not found in AIM Operational ATL registry"
    },
    {
      sno: 3,
      schoolName: "Central Academy Eng Med School",
      level: "High",
      board: "CBSE-affiliated private school",
      contactPerson: "",
      phone: "0761-2643690",
      email: "central-academy009@rediffmail.com",
      address: "",
      atlStatus: "No record found",
      atlNotes: "Not found in AIM Operational ATL registry"
    },
    {
      sno: 4,
      schoolName: "Christ Church Boys' Senior Secondary School",
      level: "High",
      board: "CBSE Board | CBSE-affiliated private school",
      contactPerson: "",
      phone: "(0761)-2323182, 2626433, 0761-2623182",
      email: "ccbss_jbp@rediffmail.com",
      address: "Sleeman Road, North Civil Lines",
      atlStatus: "No record found",
      atlNotes: "Not found in AIM Operational ATL registry"
    },
    {
      sno: 5,
      schoolName: "Christ Church Girls' Senior Secondary School",
      level: "High",
      board: "CBSE Board | CBSE-affiliated private school",
      contactPerson: "",
      phone: "(0761)-2623289, 2621027, 4054339",
      email: "ccgirls@airtelmail.in",
      address: "North Civil Lines",
      atlStatus: "No record found",
      atlNotes: "Not found in AIM Operational ATL registry"
    }
  ];
  
  try {
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@a5xcrm.in' }
    });
    
    let imported = 0;
    
    for (let i = 0; i < 50; i++) { // First batch
      const school = schoolsData[i];
      if (!school) break;
      
      const leadNumber = `A5X-${String(school.sno).padStart(4, '0')}`;
      
      const leadData = {
        leadNumber: leadNumber,
        organization: school.schoolName,
        contactPerson: school.contactPerson || 'Principal',
        designation: 'Principal',
        mobile: school.phone ? school.phone.split(',')[0].trim() : '',
        whatsapp: school.phone ? school.phone.split(',')[0].trim() : '',
        email: school.email || null,
        address: school.address || null,
        city: 'Jabalpur',
        state: 'Madhya Pradesh',
        country: 'India',
        industry: 'Education',
        source: 'Database',
        interestedService: 'Coding Program',
        boards: school.board.includes('CBSE') ? 'CBSE' : (school.board.includes('ICSE') ? 'ICSE' : 'State Board'),
        status: 'NEW_LEAD',
        priority: 'MEDIUM',
        expectedValue: 50000,
        probability: 20,
        remarks: `Level: ${school.level}, Board: ${school.board}, ATL: ${school.atlStatus}`,
        createdById: adminUser?.id || null,
        isActive: true,
      };
      
      await prisma.lead.create({ data: leadData });
      imported++;
      console.log(`✅ Imported ${imported}: ${school.schoolName}`);
    }
    
    console.log(`\n🎉 BATCH 1 COMPLETE! Imported ${imported} schools`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importJabalpurSchools().catch(console.error).finally(() => prisma.$disconnect());