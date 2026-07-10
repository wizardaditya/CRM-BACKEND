const prisma = require("../../config/db");
const { generateNumber } = require("../../utils/counterHelper");
const { success, error, paginated } = require("../../utils/apiResponse");

const calc = (items, dType, dVal, gst, c=9, s=9, i=18) => {
  const sub=items.reduce((a,x)=>a+(+x.quantity||0)*(+x.unitPrice||0)*(1-(+x.discountPct||0)/100),0);
  const disc=dType==="percentage"?(sub*dVal)/100:(dVal||0);
  const tax=sub-disc; let cg=0,sg=0,ig=0,ta=0;
  if(gst==="CGST_SGST"){cg=(tax*c)/100;sg=(tax*s)/100;ta=cg+sg;}
  else if(gst==="IGST"){ig=(tax*i)/100;ta=ig;}
  return{subtotal:sub,discountAmount:disc,taxableAmount:tax,cgstAmount:cg,sgstAmount:sg,igstAmount:ig,taxAmount:ta,grandTotal:tax+ta};
};

exports.getInvoices = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.status) where.status=req.query.status;
    if(req.query.contactId) where.contactId=req.query.contactId;
    if(req.query.search) where.OR=[
      {invoiceNumber:{contains:req.query.search,mode:"insensitive"}},
      {contact:{firstName:{contains:req.query.search,mode:"insensitive"}}},
    ];
    const [data,total]=await Promise.all([
      prisma.invoice.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{contact:{select:{id:true,firstName:true,lastName:true,email:true}},items:true,payments:true}}),
      prisma.invoice.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getInvoice = async (req, res) => {
  try {
    const inv=await prisma.invoice.findUnique({where:{id:req.params.id},include:{contact:true,items:true,payments:true}});
    if(!inv) return error(res,"Not found",404);
    return success(res,inv);
  } catch(e){return error(res,e.message);}
};

exports.createInvoice = async (req, res) => {
  try {
    const {title,contactId,dueDate,items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate,notes,terms}=req.body;
    const s=await prisma.financeSettings.findFirst();
    const t=calc(items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate);
    const inv=await prisma.invoice.create({data:{invoiceNumber:await generateNumber("invoice",s?.invoicePrefix||"INV"),title,contactId,dueDate:new Date(dueDate),status:"DRAFT",discountType,discountValue:discountValue||0,gstType:gstType||"CGST_SGST",notes,terms,balanceDue:t.grandTotal,...t,items:{create:items.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,discountPct:+i.discountPct||0,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)*(1-(+i.discountPct||0)/100)}))}},include:{contact:true,items:true}});
    return success(res,inv,"Invoice created",201);
  } catch(e){return error(res,e.message);}
};

exports.updateInvoice = async (req, res) => {
  try {
    const {id}=req.params;
    const ex=await prisma.invoice.findUnique({where:{id},include:{payments:true}});
    if(!ex) return error(res,"Not found",404);
    if(["PAID","CANCELLED"].includes(ex.status)) return error(res,"Cannot edit paid/cancelled invoice",400);
    const {title,contactId,dueDate,items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate,notes,terms,status}=req.body;
    const t=calc(items,discountType,discountValue,gstType,cgstRate,sgstRate,igstRate);
    await prisma.invoiceItem.deleteMany({where:{invoiceId:id}});
    const inv=await prisma.invoice.update({where:{id},data:{title,contactId,dueDate:new Date(dueDate),status,discountType,discountValue:discountValue||0,gstType:gstType||"CGST_SGST",notes,terms,balanceDue:t.grandTotal-ex.amountPaid,...t,items:{create:items.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,discountPct:+i.discountPct||0,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)*(1-(+i.discountPct||0)/100)}))}},include:{contact:true,items:true,payments:true}});
    return success(res,inv,"Updated");
  } catch(e){return error(res,e.message);}
};

exports.deleteInvoice = async (req, res) => {
  try {
    const ex=await prisma.invoice.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    if(ex.status==="PAID") return error(res,"Cannot delete paid invoice",400);
    await prisma.invoice.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};

exports.updateStatus = async (req, res) => {
  try {
    const inv=await prisma.invoice.update({where:{id:req.params.id},data:{status:req.body.status}});
    return success(res,inv,"Status updated");
  } catch(e){return error(res,e.message);}
};