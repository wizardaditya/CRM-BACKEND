require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importExcelData() {
  console.log('📊 EXCEL DATA IMPORT - A5X CRM\n');
  
  try {
    // This function will read your Excel data and import to database
    console.log('🔍 Looking for Excel data file...');
    
    // You can put your Excel file in the backend folder
    // Supported formats: .csv (Excel exported as CSV)
    const dataFile = path.join(__dirname, 'leads_data.csv');
    
    if (!fs.existsSync(dataFile)) {
      console.log('❌ Excel data file not found!');
      console.log('📋 Please follow these steps:');
      console.log('   1. Open your Excel file with 130+ leads');
      console.log('   2. Save As → CSV format');
      console.log('   3. Save it as "leads_data.csv" in the backend folder');
      console.log('   4. Run this script again');
      console.log('\n📄 Expected CSV columns:');
      console.log('   - organization, contactPerson, mobile, email, status, etc.');
      return;
    }
    
    console.log('✅ Found data file, starting import...');
    
    // Read CSV file
    const csvData = fs.readFileSync(dataFile, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('❌ CSV file seems empty or invalid');
      return;
    }
    
    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('📋 Found columns:', headers.join(', '));
    
    // Parse data rows
    const dataRows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    console.log(`📊 Found ${dataRows.length} leads to import`);
    
    // Get admin user for createdBy
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@a5xcrm.in' }
    });
    
    let imported = 0;
    let errors = 0;
    
    // Import each lead
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      try {
        // Generate lead number
        const leadNumber = `A5X-${String(i + 1).padStart(4, '0')}`;
        
        // Map Excel columns to database fields
        const leadData = {
          leadNumber: leadNumber,
          organization: row['Organization'] || row['organization'] || row['Company'] || 'Unknown',
          contactPerson: row['Contact Person'] || row['contactPerson'] || row['Name'] || 'Unknown',
          designation: row['Designation'] || row['designation'] || row['Title'] || null,
          mobile: row['Mobile'] || row['mobile'] || row['Phone'] || '',
          whatsapp: row['WhatsApp'] || row['whatsapp'] || row['Mobile'] || row['mobile'] || null,
          email: row['Email'] || row['email'] || null,
          website: row['Website'] || row['website'] || null,
          address: row['Address'] || row['address'] || null,
          city: row['City'] || row['city'] || null,
          state: row['State'] || row['state'] || null,
          country: row['Country'] || row['country'] || 'India',
          industry: row['Industry'] || row['industry'] || 'Education',
          source: row['Source'] || row['source'] || 'Other',
          interestedService: row['Service'] || row['interestedService'] || row['Interested Service'] || null,
          status: row['Status'] || row['status'] || 'NEW_LEAD',
          priority: row['Priority'] || row['priority'] || 'MEDIUM',
          expectedValue: row['Expected Value'] || row['expectedValue'] || 0,
          probability: row['Probability'] || row['probability'] || 0,
          remarks: row['Remarks'] || row['remarks'] || row['Notes'] || null,
          createdById: adminUser?.id || null,
          isActive: true,
        };
        
        // Create lead in database
        await prisma.lead.create({
          data: leadData
        });
        
        imported++;
        console.log(`✅ Imported ${imported}/${dataRows.length}: ${leadData.organization}`);
        
      } catch (error) {
        errors++;
        console.log(`❌ Error importing row ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 IMPORT COMPLETE!`);
    console.log(`✅ Successfully imported: ${imported} leads`);
    console.log(`❌ Errors: ${errors} leads`);
    console.log(`\n📊 Your CRM now has ${imported} leads!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importExcelData().catch(console.error).finally(() => prisma.$disconnect());