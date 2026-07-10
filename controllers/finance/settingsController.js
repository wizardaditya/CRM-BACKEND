const prisma = require("../../config/db");
const { success, error } = require("../../utils/apiResponse");

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.financeSettings.findFirst();
    return success(res, settings || {});
  } catch (e) { return error(res, e.message); }
};

const upsertSettings = async (req, res) => {
  try {
    const {
      companyName, companyAddress, companyPhone, companyEmail, companyWebsite,
      gstin, pan, currency, currencySymbol, financialYearStart,
      invoicePrefix, quotationPrefix, purchaseOrderPrefix,
      defaultTaxRate, gstType, cgstRate, sgstRate, igstRate, bankAccounts,
    } = req.body;
    const companyLogo = req.file ? "/uploads/" + req.file.filename : undefined;
    const existing = await prisma.financeSettings.findFirst();
    const data = {
      companyName: companyName || "My Company",
      companyAddress, companyPhone, companyEmail, companyWebsite,
      gstin, pan,
      currency: currency || "INR",
      currencySymbol: currencySymbol || "₹",
      financialYearStart: financialYearStart || "04",
      invoicePrefix: invoicePrefix || "INV",
      quotationPrefix: quotationPrefix || "QT",
      purchaseOrderPrefix: purchaseOrderPrefix || "PO",
      defaultTaxRate: parseFloat(defaultTaxRate || 18),
      gstType: gstType || "CGST_SGST",
      cgstRate: parseFloat(cgstRate || 9),
      sgstRate: parseFloat(sgstRate || 9),
      igstRate: parseFloat(igstRate || 18),
      bankAccounts: bankAccounts ? JSON.parse(bankAccounts) : undefined,
    };
    if (companyLogo) data.companyLogo = companyLogo;
    const settings = existing
      ? await prisma.financeSettings.update({ where: { id: existing.id }, data })
      : await prisma.financeSettings.create({ data });
    return success(res, settings, "Settings saved");
  } catch (e) { return error(res, e.message); }
};

module.exports = { getSettings, upsertSettings };