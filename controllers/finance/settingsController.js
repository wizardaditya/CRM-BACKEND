const { prisma } = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

// GET /api/cfo/settings
const getSettings = async (req, res) => {
  try {
    const settings = await prisma.financeSettings.findFirst();
    return successResponse(res, settings || {});
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/cfo/settings
const upsertSettings = async (req, res) => {
  try {
    const {
      companyName, companyAddress, companyPhone, companyEmail, companyWebsite,
      gstin, pan, currency, currencySymbol, financialYearStart,
      invoicePrefix, quotationPrefix, purchaseOrderPrefix,
      defaultTaxRate, gstType, cgstRate, sgstRate, igstRate,
      bankAccounts,
    } = req.body;

    const companyLogo = req.file ? `/uploads/${req.file.filename}` : undefined;

    const existing = await prisma.financeSettings.findFirst();

    const data = {
      companyName, companyAddress, companyPhone, companyEmail, companyWebsite,
      gstin, pan, currency, currencySymbol, financialYearStart,
      invoicePrefix, quotationPrefix, purchaseOrderPrefix,
      defaultTaxRate: parseFloat(defaultTaxRate || 18),
      gstType: gstType || 'CGST_SGST',
      cgstRate: parseFloat(cgstRate || 9),
      sgstRate: parseFloat(sgstRate || 9),
      igstRate: parseFloat(igstRate || 18),
      bankAccounts: bankAccounts ? JSON.parse(bankAccounts) : undefined,
    };

    if (companyLogo) data.companyLogo = companyLogo;

    let settings;
    if (existing) {
      settings = await prisma.financeSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await prisma.financeSettings.create({ data });
    }

    return successResponse(res, settings, 'Settings saved');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = { getSettings, upsertSettings };
