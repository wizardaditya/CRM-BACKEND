require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importRemainingSchools() {
  console.log('🏫 IMPORTING REMAINING JABALPUR SCHOOLS (31-118)...\n');
  
  const remainingSchools = [
    { sno: 31, name: "Aditya Convent School", phone: "0761-2342323", email: "adityaconventschool_jbp@rediffmail.com", board: "CBSE", level: "Medium", address: "231, Gopal Vihar, Damoh Naka" },
    { sno: 32, name: "Ajay Satya Prakash Public School", phone: "9691142224", email: "principalspps@gmail.com", board: "CBSE", level: "Medium", address: "Gram-Kevlari, Tehsil - Panagar" },
    { sno: 33, name: "Annie Bisent Hs School, Indira Nagar", phone: "9300831958", email: "", board: "State", level: "Medium", contact: "MR. R.S. GARG" },
    { sno: 34, name: "Anwarganj Girls H S School, Hanumantaal", phone: "9329037393", email: "", board: "State", level: "Medium", contact: "MRS. NAFEESA PARVIN" },
    { sno: 35, name: "Army Public School - APS Jabalpur No. 1", phone: "0761-2668543", email: "", board: "CBSE", level: "Medium", address: "Water Works Road Dhobi Ghat, Near Gora Bazaar" },
    { sno: 36, name: "Army Public School - APS Jabalpur No. 2", phone: "0761-268715", email: "", board: "CBSE", level: "Medium", address: "C/O Jak Rif RC" },
    { sno: 37, name: "Ashoka Hall School", phone: "0761-4043399", email: "nidhi.thapar@yahoo.co.in", board: "CBSE", level: "Medium", address: "Shiv Nagar, Damoh Naka" },
    { sno: 38, name: "Assisi High School, Dhana Khamaria", phone: "8827595428", email: "", board: "State", level: "Medium", contact: "SISTER SMITA" },
    { sno: 39, name: "Belbaugh School", phone: "0761-2875762", email: "", board: "State", level: "Medium", address: "Belbaugh, Ghamapur" },
    { sno: 40, name: "Bharti Memorial Convent High School, Baldev Bagh", phone: "9303388533", email: "", board: "State", level: "Medium", contact: "MR. RAJNISH SONKAR" },
    { sno: 41, name: "Billabong High International School - BHIS", phone: "7509994711", email: "", board: "State", level: "Medium", address: "Tilwara Road" },
    { sno: 42, name: "Bmd Hit Girl's Hs School, Dixitpura", phone: "9993744577", email: "", board: "State", level: "Medium", contact: "MR. DEVENDRA KUMAR PADEY" },
    { sno: 43, name: "Choudhary Mother Care Hs School, K Nehru Nagar", phone: "9826110001", email: "", board: "State", level: "Medium", contact: "MRS. ANJNA CHOUDHRY" },
    { sno: 44, name: "Delhi Public School - DPS Jabalpur", phone: "9111015341", email: "dpsmandlaroad@gmail.com", board: "CBSE", level: "Medium", address: "Nagpur Road" },
    { sno: 45, name: "Dn Jain Hs School", phone: "9165493994", email: "", board: "State", level: "Medium", contact: "MR. K.C. PASTARIA" },
    { sno: 46, name: "Dr Vs Rai Panchshil Girls High School", phone: "8109621994", email: "", board: "State", level: "Medium", contact: "MRS. RASHIM RAI" },
    { sno: 47, name: "Dream India School - Garha", phone: "9109110250", email: "", board: "State", level: "Medium", address: "Plot No. 1188, B.T. Tiraha, Near Chungi Chowki, Garha" },
    { sno: 48, name: "Dream India School - Lalmati", phone: "9644408497", email: "", board: "State", level: "Medium", address: "Jhamandas Chowk, Near Bharat Samaj Sevak, Lalmati" },
    { sno: 49, name: "Dream India School - Vijay Nagar", phone: "9109110270", email: "", board: "State", level: "Medium", address: "Plot No. 130, Manmohan Nagar Garden" },
    { sno: 50, name: "EuroKids - Adhartal", phone: "9630456697", email: "", board: "State", level: "Medium", address: "H.No. 118 , JDA , Schm. No. 3, Ravindra Nagar, Adhartal" },
    { sno: 51, name: "EuroKids - Shanker Nagar", phone: "9329771399", email: "", board: "State", level: "Medium", address: "S-3, Shanker Nagar, Karmeta, Katangi Road" },
    { sno: 52, name: "Government Pt. LSJ Model School of Excellence", phone: "0761-2625679", email: "", board: "State", level: "Medium", address: "Jabalpur - 482002, Madhya Pradesh" },
    { sno: 53, name: "Guru Govind Singh Public High School, Poli Pathar Gwarighat", phone: "9425324014", email: "", board: "State", level: "Medium", contact: "MR. H.K. GROVER" },
    { sno: 54, name: "Gyan Ganga International School", phone: "8305014126", email: "", board: "CBSE", level: "Medium", address: "Near Medical College, Bypass Junction Bhedaghat Road" },
    { sno: 55, name: "Gyan Ganga Public School", phone: "0761-2504495", email: "gyangangajabalpur@yahoo.co", board: "CBSE", level: "Medium", address: "Bheraghat Road, Kugwan P.O. Tewar" },
    { sno: 56, name: "Gyan Sagar Hs School, Bhedaghat Square", phone: "9755728867", email: "", board: "State", level: "Medium", contact: "MR. P.S. THAKUR" },
    { sno: 57, name: "Gyan Sagar Public High School, Gada Phatak Road", phone: "9926350935", email: "", board: "State", level: "Medium", contact: "MRS. VIDHYA PANDYA" },
    { sno: 58, name: "Gyanarjan High School, Lalmati", phone: "9926317114", email: "", board: "State", level: "Medium", contact: "MRS. SUSHMA SHRIVASTAV" },
    { sno: 59, name: "Hitkari H.S. School, Bargi Nagar", phone: "9424956535", email: "", board: "State", level: "Medium", contact: "MRS. SANGEETA TRIPATHI" },
    { sno: 60, name: "Hitkarni Girls Hs School, Vfj", phone: "9300178843", email: "", board: "State", level: "Medium", contact: "MRS. AASHA PATIL" },
  ];
  
  try {
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@a5xcrm.in' } });
    let imported = 0;
    
    for (const school of remainingSchools) {
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
    
    console.log(`\n🎉 BATCH 2 COMPLETE!`);
    console.log(`✅ Successfully imported: ${imported} schools`);
    
    // Get total count
    const totalLeads = await prisma.lead.count();
    console.log(`\n📊 Your CRM now has ${totalLeads} total leads!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importRemainingSchools().catch(console.error).finally(() => prisma.$disconnect());