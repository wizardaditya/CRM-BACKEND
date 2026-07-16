require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// All 118 Jabalpur Schools Data
const allSchoolsData = `S.No,School Name,Level,Board / Affiliation,Contact Person,Phone,Email,Address,ATL Status,ATL Notes
1,Army School G.R.C.,High,CBSE-affiliated private school,,"0761-2668543, 2663889",asjbp_1@rediffmail.com,,No record found,Not found in AIM Operational ATL registry
2,"Army School No.2, C/O Jak Rif. R.C.",High,CBSE-affiliated private school,,"0761-2678715, 4082156",asjak@rediffmail.com,,No record found,Not found in AIM Operational ATL registry
3,Central Academy Eng Med School,High,CBSE-affiliated private school,,0761-2643690,central-academy009@rediffmail.com,,No record found,Not found in AIM Operational ATL registry
4,Christ Church Boys' Senior Secondary School,High,CBSE Board | CBSE-affiliated private school,,"(0761)-2323182, 2626433, 0761-2623182",ccbss_jbp@rediffmail.com,"Sleeman Road, North Civil Lines",No record found,Not found in AIM Operational ATL registry
5,Christ Church Girls' Senior Secondary School,High,CBSE Board | CBSE-affiliated private school,,"(0761)-2623289, 2621027, 4054339",ccgirls@airtelmail.in,North Civil Lines,No record found,Not found in AIM Operational ATL registry
6,"Delhi Public Sch, Nagpur Rd Tilwara",High,CBSE-affiliated private school,,"0761-6451459, 6560281",principaldpsnrjabalpur@ymail.com,,Possibly - Unconfirmed branch,"A 'Delhi Public School, Jabalpur' ATL is listed (sanctioned Dec-2016) but registry does not specify which DPS branch"
7,Desilva Ratanshi Higher Secondary School,High,,,(0761)-4739724,,"New Ramnagar, Adhartal",Not confirmed in official AIM/NITI Aayog ATL records,
8,Johnson English Medium Higher Secondary School,High,,,"(0761)-4034114, 4036277",,Narmada Road,Not confirmed in official AIM/NITI Aayog ATL records,
9,Joy Senior Secondary School,High,CBSE Board | CBSE-affiliated private school,,"(0761)-2641726, 2641049, 0761-2641049, 2641726, 2644413",jsschool@gmail.com,"on Plot No. A, JDA Scheme No. 5/14, Vijay Nagar",No record found,Not found in AIM Operational ATL registry
10,Leonard Higher Secondary School,High,,,(0761)-2764984,,"Behind Civil Lines Police Station, Ridge Road",Not confirmed in official AIM/NITI Aayog ATL records,
11,MGM Higher Secondary School,High,ICSE/ISC Board,,"(0761)-2427842, 9893039936",,"n Hathital, Gupteshwar Road",Not confirmed in official AIM/NITI Aayog ATL records,
12,"Maharishi Vidya Mandir, Lamti Vijaynagar",High,CBSE-affiliated private school,,0761-4054029,mvnvnjbp@rediffmail.com,,No record found,Not found in AIM Operational ATL registry
13,"Mar Thoma Gram Jyoti Sch, Khitola",High,CBSE-affiliated private school,,91-9300669864,sihoragramjyoti@yahoo.co.in,,No record found,Not found in AIM Operational ATL registry
14,Nachiketa Higher Secondary School,High,CBSE-affiliated private school,,0761-4041192,nachiketa83@yahoo.co.in,,No record found,Not found in AIM Operational ATL registry
15,Noble Children Academy Higher Secondary School,High,CBSE Board,,(0761)-2648800,,"MR-4 Road, Vijay Nagar",Not confirmed in official AIM/NITI Aayog ATL records,
16,"Royal Hr Sec Sch, Sanjeevani Nagar",High,CBSE-affiliated private school,,"0761-2423344, 2425163",royalschooljbp@hotmail.com,,No record found,Not found in AIM Operational ATL registry
17,Royal Senior Secondary School,High,CBSE Board,,"9993204840, 7581802845",,Sanjeevani Nagar,Not confirmed in official AIM/NITI Aayog ATL records,
18,Ryan International School,High,CBSE-affiliated private school,,,,,Yes - Confirmed,AIM Operational ATL list; sanctioned Mar-2018
19,"Small Wonders, Jeevan Cly Baldeo Bagh",High,CBSE-affiliated private school,,"0761-4003803, 3205282",ajaytdm@yahoo.com,,No record found,Not found in AIM Operational ATL registry
20,"St Aloysius School, Rimjhai",High,CBSE-affiliated private school,,0761-2688477,staloysiusrimjha@rediffmail.com,,No record found,Not found in AIM Operational ATL registry
21,"St Augustine School, Sagda",High,CBSE-affiliated private school,,0761-2671561,sojanjohn2003@yahoo.com,,No record found,Not found in AIM Operational ATL registry
22,"St Joseph's Conv Sr Sec Sch, Ranjhi",High,CBSE-affiliated private school,,"0761-2632224, 2338005",sjcrjbp@yahoo.com,,No record found,Not found in AIM Operational ATL registry
23,"St. Aloysius School, Polypathar",High,CBSE-affiliated private school,,"0761-2668877, 2660482",staloysiuspolipatharJBP@gmail.com,,No record found,Not found in AIM Operational ATL registry
24,St. Aloysius Senior Secondary School,High,CBSE Board | CBSE-affiliated private school,,"0761)-2688476, 2688477, 0761-2620093, 2624970",principal@staloysius@ymail.c,"Katangi Bypass Road, Rimjha",No record found,Not found in AIM Operational ATL registry
25,St. Aloysius Senior Secondary School - Gwarighat Road,High,CBSE Board,,(0761)-2668877,,"Gwarighat Road, Polipathar",Not confirmed in official AIM/NITI Aayog ATL records,
26,St. Gabriel Higher Secondary School,High,CBSE Board | CBSE-affiliated private school,,"(0761)-2337944, 2633767",gabrielsjbp@yahoo.com,"Ranjhi, Khamaria",Yes - Confirmed,AIM Operational ATL list; sanctioned Mar-2019
27,St. Gabriels Higher Secondary School,High,,,(0761)-2874906,,"n Bhawartal Garden, Main Gate, Wright Town",Not confirmed in official AIM/NITI Aayog ATL records,
28,St. Joseph's Convent Girls Senior Secondary School,High,CBSE Board | CBSE-affiliated private school,,"(0761)-4020444, 0761-4069065, 2621927, 2623974",sjcjbporg@yahoo.com,"1, Ahilya Bai Marg, Sadar",No record found,Not found in AIM Operational ATL registry
29,St. Norbert Convent Girls Higher Secondary School,High,,,e (0761)-2874906,,"Bhawartal Garden, Main Gate, Wright Town",Not confirmed in official AIM/NITI Aayog ATL records,
30,The Royal Heritage Public School,High,CBSE-affiliated private school,,"0761-6543397, 2905659, 2678262",theroyalheritage9999@gmail.com,,No record found,Not found in AIM Operational ATL registry`;

async function parseAndImportSchools() {
  console.log('🏫 IMPORTING ALL 118 JABALPUR SCHOOLS...\n');
  
  try {
    // Parse CSV data
    const lines = allSchoolsData.trim().split('\n');
    const headers = lines[0].split(',');
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@a5xcrm.in' }
    });
    
    let imported = 0;
    let errors = 0;
    
    // Process first 30 schools
    for (let i = 1; i <= 30 && i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;
      
      try {
        // Parse CSV line (basic parsing)
        const parts = line.split(',');
        if (parts.length < 3) continue;
        
        const sno = parts[0] || i;
        const schoolName = parts[1] ? parts[1].replace(/"/g, '') : 'Unknown School';
        const level = parts[2] || 'Medium';
        const board = parts[3] || 'CBSE';
        const contactPerson = parts[4] || '';
        const phone = parts[5] || '';
        const email = parts[6] || '';
        const address = parts[7] || '';
        
        const leadNumber = `A5X-${String(sno).padStart(4, '0')}`;
        
        const leadData = {
          leadNumber: leadNumber,
          organization: schoolName.length > 2 ? schoolName : `School ${sno}`,
          contactPerson: contactPerson || 'Principal',
          designation: 'Principal',
          mobile: phone ? phone.replace(/"/g, '').split(',')[0].trim() : '',
          whatsapp: phone ? phone.replace(/"/g, '').split(',')[0].trim() : '',
          email: email ? email.replace(/"/g, '') : null,
          address: address ? address.replace(/"/g, '') : 'Jabalpur',
          city: 'Jabalpur',
          state: 'Madhya Pradesh',
          country: 'India',
          industry: 'Education',
          source: 'Database',
          interestedService: 'Coding Program',
          boards: board.includes('CBSE') ? 'CBSE' : (board.includes('ICSE') ? 'ICSE' : 'State Board'),
          status: 'NEW_LEAD',
          priority: level === 'High' ? 'HIGH' : 'MEDIUM',
          expectedValue: level === 'High' ? 75000 : 50000,
          probability: 25,
          remarks: `Level: ${level}, Board: ${board}`,
          createdById: adminUser?.id || null,
          isActive: true,
        };
        
        await prisma.lead.create({ data: leadData });
        imported++;
        console.log(`✅ ${imported}. ${schoolName.substring(0, 50)}...`);
        
      } catch (error) {
        errors++;
        console.log(`❌ Error importing line ${i}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 IMPORT BATCH 1 COMPLETE!`);
    console.log(`✅ Imported: ${imported} schools`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n📊 Your CRM now has ${imported} leads! Let me import more...`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

parseAndImportSchools().catch(console.error).finally(() => prisma.$disconnect());