const prisma = require("../../config/db");
const { generateNumber } = require("../../utils/counterHelper");
const { success, error, paginated } = require("../../utils/apiResponse");

const calcTotals = (items, dType, dVal, gst, c=9, s=9, i=18) => {
  const sub = items.reduce((a,x)=>a+(+x.quantity||0)*(+x.unitPrice||0)*(1-(+x.discountPct||0)/100),0);
  const disc = dType==="percentage"?(sub*dVal)/100:(dVal||0);
  const tax = sub-disc;
  let cg=0,sg=0,ig=0,ta=0;
  if(gst==="CGST_SGST"){cg=(tax*c)/100;sg=(tax*s)/100;ta=cg+sg;}
  else if(gst==="IGST"){ig=(tax*i)/100;ta=ig;}
  return{subtotal:sub,discountAmount:disc,taxableAmount:tax,cgstAmount:cg,sgstAmount:sg,igstAmount:ig,taxAmount:ta,grandTotal:tax+ta};
};

const getQuotations = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const skip=(page-1)*limit;
    const where={};
    if(req.query.status) where.status=req.query.status;
    if(req.query.contactId) where.contactId=req.query.contactId;
    if(req.query.search) where.OR=[
      {quotationNumber:{contains:req.query.search,mode:"insensitive"}},
      {title:{contains:req.query.search,mode:"insensitive"}},
      {contact:{firstName:{contains:req.query.search,mode:"insensitive"}}},
    ];
    const [data,total]=await Promise.all([
      prisma.quotation.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{contact:{select:{id:true,firstName:true,lastName:true,email:true}},items:true}}),
      prisma.quotation.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

const getQuotation = async (req, res) => {
  try {
    const q=await prisma.quotation.findUnique({where:{id:req.params.id},include:{contact:true,items:true}});
    if(!q) return error(res,"Not found",404);
    return success(res,q);
  } catch(e){return error(res,e.message);}
};

const createQuotation = async (req, res) => {
  try {
    const {title,contactId,expiryDate,items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate,notes,terms}=req.body;
    const s=await prisma.financeSettings.findFirst();
    const qn=await generateNumber("quotation",s?.quotationPrefix||"QT");
    const t=calcTotals(items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate);
    const q=await prisma.quotation.create({data:{quotationNumber:qn,title,contactId,expiryDate:new Date(expiryDate),status:"DRAFT",discountType,discountValue:discountValue||0,gstType:gstType||"CGST_SGST",notes,terms,...t,items:{create:items.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,discountPct:+i.discountPct||0,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)*(1-(+i.discountPct||0)/100)}))}},include:{contact:true,items:true}});
    return success(res,q,"Quotation created",201);
  } catch(e){return error(res,e.message);}
};

const updateQuotation = async (req, res) => {
  try {
    const {id}=req.params;
    const ex=await prisma.quotation.findUnique({where:{id}});
    if(!ex) return error(res,"Not found",404);
    if(ex.convertedToInvoice) return error(res,"Cannot edit converted quotation",400);
    const {title,contactId,expiryDate,items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate,notes,terms,status}=req.body;
    const t=calcTotals(items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate);
    await prisma.quotationItem.deleteMany({where:{quotationId:id}});
    const q=await prisma.quotation.update({where:{id},data:{title,contactId,expiryDate:new Date(expiryDate),status,discountType,discountValue:discountValue||0,gstType:gstType||"CGST_SGST",notes,terms,...t,items:{create:items.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,discountPct:+i.discountPct||0,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)*(1-(+i.discountPct||0)/100)}))}},include:{contact:true,items:true}});
    return success(res,q,"Updated");
  } catch(e){return error(res,e.message);}
};

const deleteQuotation = async (req, res) => {
  try {
    const ex=await prisma.quotation.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    await prisma.quotation.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};

const convertToInvoice = async (req, res) => {
  try {
    const {id}=req.params;
    const q=await prisma.quotation.findUnique({where:{id},include:{items:true}});
    if(!q) return error(res,"Not found",404);
    if(q.convertedToInvoice) return error(res,"Already converted",400);
    if(q.status!=="ACCEPTED") return error(res,"Only accepted quotations can be converted",400);
    const s=await prisma.financeSettings.findFirst();
    const inv=await prisma.invoice.create({data:{invoiceNumber:await generateNumber("invoice",s?.invoicePrefix||"INV"),title:q.title,contactId:q.contactId,quotationId:q.id,dueDate:new Date(req.body.dueDate||Date.now()+30*86400000),status:"DRAFT",subtotal:q.subtotal,discountType:q.discountType,discountValue:q.discountValue,discountAmount:q.discountAmount,taxableAmount:q.taxableAmount,gstType:q.gstType,cgstAmount:q.cgstAmount,sgstAmount:q.sgstAmount,igstAmount:q.igstAmount,taxAmount:q.taxAmount,grandTotal:q.grandTotal,balanceDue:q.grandTotal,notes:q.notes,terms:q.terms,items:{create:q.items.map(i=>({description:i.description,quantity:i.quantity,unitPrice:i.unitPrice,discountPct:i.discountPct,taxRate:i.taxRate,amount:i.amount}))}},include:{contact:true,items:true}});
    await prisma.quotation.update({where:{id},data:{convertedToInvoice:true,invoiceId:inv.id}});
    return success(res,inv,"Converted to invoice",201);
  } catch(e){return error(res,e.message);}
};

const updateStatus = async (req, res) => {
  try {
    const q=await prisma.quotation.update({where:{id:req.params.id},data:{status:req.body.status}});
    return success(res,q,"Status updated");
  } catch(e){return error(res,e.message);}
};

module.exports = { getQuotations, getQuotation, createQuotation, updateQuotation, deleteQuotation, convertToInvoice, updateStatus };