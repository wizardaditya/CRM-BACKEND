const prisma = require("../../config/db");
const { generateNumber } = require("../../utils/counterHelper");
const { success, error, paginated } = require("../../utils/apiResponse");

exports.getPayments = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.status) where.status=req.query.status;
    if(req.query.invoiceId) where.invoiceId=req.query.invoiceId;
    if(req.query.paymentMode) where.paymentMode=req.query.paymentMode;
    if(req.query.search) where.OR=[
      {paymentNumber:{contains:req.query.search,mode:"insensitive"}},
      {reference:{contains:req.query.search,mode:"insensitive"}},
      {invoice:{contact:{firstName:{contains:req.query.search,mode:"insensitive"}}}},
    ];
    const [data,total]=await Promise.all([
      prisma.payment.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{invoice:{include:{contact:{select:{id:true,firstName:true,lastName:true}}}}}}),
      prisma.payment.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getPayment = async (req, res) => {
  try {
    const p=await prisma.payment.findUnique({where:{id:req.params.id},include:{invoice:{include:{contact:true,items:true}}}});
    if(!p) return error(res,"Not found",404);
    return success(res,p);
  } catch(e){return error(res,e.message);}
};

exports.createPayment = async (req, res) => {
  try {
    const {invoiceId,amount,paymentDate,paymentMode,reference,notes}=req.body;
    const inv=await prisma.invoice.findUnique({where:{id:invoiceId}});
    if(!inv) return error(res,"Invoice not found",404);
    if(inv.status==="CANCELLED") return error(res,"Cannot pay cancelled invoice",400);
    if(inv.balanceDue<=0) return error(res,"Already fully paid",400);
    if(+amount>inv.balanceDue) return error(res,"Amount exceeds balance due",400);
    const pn=await generateNumber("payment","PAY");
    const payment=await prisma.payment.create({data:{paymentNumber:pn,invoiceId,amount:+amount,paymentDate:paymentDate?new Date(paymentDate):new Date(),paymentMode:paymentMode||"CASH",status:"PAID",reference,notes}});
    const newPaid=inv.amountPaid+(+amount);
    const newBal=inv.grandTotal-newPaid;
    await prisma.invoice.update({where:{id:invoiceId},data:{amountPaid:newPaid,balanceDue:Math.max(0,newBal),status:newBal<=0?"PAID":newPaid>0?"PARTIAL":inv.status}});
    return success(res,payment,"Payment recorded",201);
  } catch(e){return error(res,e.message);}
};

exports.refundPayment = async (req, res) => {
  try {
    const p=await prisma.payment.findUnique({where:{id:req.params.id},include:{invoice:true}});
    if(!p) return error(res,"Not found",404);
    if(p.status==="REFUNDED") return error(res,"Already refunded",400);
    const up=await prisma.payment.update({where:{id:req.params.id},data:{status:"REFUNDED"}});
    const inv=p.invoice;
    const newPaid=Math.max(0,inv.amountPaid-p.amount);
    await prisma.invoice.update({where:{id:p.invoiceId},data:{amountPaid:newPaid,balanceDue:inv.grandTotal-newPaid,status:newPaid<=0?"SENT":"PARTIAL"}});
    return success(res,up,"Refunded");
  } catch(e){return error(res,e.message);}
};

exports.deletePayment = async (req, res) => {
  try {
    const ex=await prisma.payment.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    await prisma.payment.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};