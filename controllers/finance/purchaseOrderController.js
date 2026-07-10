const prisma = require("../../config/db");
const { generateNumber } = require("../../utils/counterHelper");
const { success, error, paginated } = require("../../utils/apiResponse");

exports.getPurchaseOrders = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.status) where.status=req.query.status;
    if(req.query.vendorId) where.vendorId=req.query.vendorId;
    if(req.query.search) where.OR=[{poNumber:{contains:req.query.search,mode:"insensitive"}},{vendor:{name:{contains:req.query.search,mode:"insensitive"}}}];
    const [data,total]=await Promise.all([
      prisma.purchaseOrder.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{vendor:{select:{id:true,name:true,company:true,email:true}},items:true}}),
      prisma.purchaseOrder.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const po=await prisma.purchaseOrder.findUnique({where:{id:req.params.id},include:{vendor:true,items:true}});
    if(!po) return error(res,"Not found",404);
    return success(res,po);
  } catch(e){return error(res,e.message);}
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const {vendorId,expectedDelivery,items,notes}=req.body;
    const parsedItems=typeof items==="string"?JSON.parse(items):items;
    const vnd=await prisma.vendor.findUnique({where:{id:vendorId}});
    if(!vnd) return error(res,"Vendor not found",404);
    const s=await prisma.financeSettings.findFirst();
    const sub=parsedItems.reduce((a,i)=>a+(+i.quantity||0)*(+i.unitPrice||0),0);
    const tax=parsedItems.reduce((a,i)=>a+((+i.quantity||0)*(+i.unitPrice||0)*(+i.taxRate||0)/100),0);
    const ia=req.file?"/uploads/"+req.file.filename:null;
    const po=await prisma.purchaseOrder.create({data:{poNumber:await generateNumber("purchase_order",s?.purchaseOrderPrefix||"PO"),vendorId,expectedDelivery:expectedDelivery?new Date(expectedDelivery):null,status:"DRAFT",subtotal:sub,taxAmount:tax,grandTotal:sub+tax,notes,invoiceAttachment:ia,items:{create:parsedItems.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)}))}},include:{vendor:true,items:true}});
    return success(res,po,"Purchase order created",201);
  } catch(e){return error(res,e.message);}
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const {id}=req.params;
    const ex=await prisma.purchaseOrder.findUnique({where:{id}});
    if(!ex) return error(res,"Not found",404);
    if(["DELIVERED","CANCELLED"].includes(ex.status)) return error(res,"Cannot edit delivered/cancelled PO",400);
    const {vendorId,expectedDelivery,items,notes,status}=req.body;
    const parsedItems=typeof items==="string"?JSON.parse(items):items;
    const sub=parsedItems.reduce((a,i)=>a+(+i.quantity||0)*(+i.unitPrice||0),0);
    const tax=parsedItems.reduce((a,i)=>a+((+i.quantity||0)*(+i.unitPrice||0)*(+i.taxRate||0)/100),0);
    const ia=req.file?"/uploads/"+req.file.filename:ex.invoiceAttachment;
    await prisma.purchaseOrderItem.deleteMany({where:{purchaseOrderId:id}});
    const po=await prisma.purchaseOrder.update({where:{id},data:{vendorId,expectedDelivery:expectedDelivery?new Date(expectedDelivery):null,status,subtotal:sub,taxAmount:tax,grandTotal:sub+tax,notes,invoiceAttachment:ia,items:{create:parsedItems.map(i=>({description:i.description,quantity:+i.quantity,unitPrice:+i.unitPrice,taxRate:+i.taxRate||0,amount:(+i.quantity||0)*(+i.unitPrice||0)}))}},include:{vendor:true,items:true}});
    return success(res,po,"Updated");
  } catch(e){return error(res,e.message);}
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const ex=await prisma.purchaseOrder.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    await prisma.purchaseOrder.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};