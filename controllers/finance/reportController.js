const prisma = require("../../config/db");
const { success, error } = require("../../utils/apiResponse");
const parseRange=(from,to)=>({gte:from?new Date(from):new Date(new Date().getFullYear(),0,1),lte:to?new Date(to):new Date()});

exports.getRevenueReport = async (req, res) => {
  try {
    const range=parseRange(req.query.from,req.query.to);
    const payments=await prisma.payment.findMany({where:{status:"PAID",paymentDate:range},include:{invoice:{include:{contact:{select:{id:true,firstName:true,lastName:true}}}}},orderBy:{paymentDate:"asc"}});
    const total=payments.reduce((s,p)=>s+p.amount,0);
    return success(res,{payments,total});
  } catch(e){return error(res,e.message);}
};

exports.getExpenseReport = async (req, res) => {
  try {
    const range=parseRange(req.query.from,req.query.to);
    const expenses=await prisma.expense.findMany({where:{status:"APPROVED",expenseDate:range},include:{submittedBy:{select:{name:true}}},orderBy:{expenseDate:"asc"}});
    const total=expenses.reduce((s,e)=>s+e.amount,0);
    const byCategory=expenses.reduce((a,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a},{});
    return success(res,{expenses,total,byCategory});
  } catch(e){return error(res,e.message);}
};

exports.getProfitLoss = async (req, res) => {
  try {
    const range=parseRange(req.query.from,req.query.to);
    const [rev,exp]=await Promise.all([
      prisma.payment.aggregate({_sum:{amount:true},where:{status:"PAID",paymentDate:range}}),
      prisma.expense.aggregate({_sum:{amount:true},where:{status:"APPROVED",expenseDate:range}}),
    ]);
    const revenue=rev._sum.amount||0, expenses=exp._sum.amount||0, profit=revenue-expenses;
    return success(res,{revenue,expenses,profit,profitMargin:revenue>0?((profit/revenue)*100).toFixed(2):0});
  } catch(e){return error(res,e.message);}
};

exports.getCashFlow = async (req, res) => {
  try {
    const range=parseRange(req.query.from,req.query.to);
    const [inflow,outflow]=await Promise.all([
      prisma.payment.findMany({where:{status:"PAID",paymentDate:range},select:{amount:true,paymentDate:true}}),
      prisma.expense.findMany({where:{status:"APPROVED",expenseDate:range},select:{amount:true,expenseDate:true}}),
    ]);
    const totalIn=inflow.reduce((s,p)=>s+p.amount,0), totalOut=outflow.reduce((s,e)=>s+e.amount,0);
    return success(res,{inflow,outflow,totalInflow:totalIn,totalOutflow:totalOut,netCashFlow:totalIn-totalOut});
  } catch(e){return error(res,e.message);}
};

exports.getOutstandingReport = async (req, res) => {
  try {
    const invoices=await prisma.invoice.findMany({where:{status:{in:["SENT","PARTIAL","OVERDUE"]}},include:{contact:{select:{id:true,firstName:true,lastName:true,email:true}}},orderBy:{dueDate:"asc"}});
    const total=invoices.reduce((s,i)=>s+i.balanceDue,0);
    const overdue=invoices.filter(i=>new Date(i.dueDate)<new Date());
    return success(res,{invoices,total,overdueCount:overdue.length,overdueTotal:overdue.reduce((s,i)=>s+i.balanceDue,0)});
  } catch(e){return error(res,e.message);}
};

exports.getPayrollReport = async (req, res) => {
  try {
    const where={};
    if(req.query.month) where.month=parseInt(req.query.month);
    if(req.query.year) where.year=parseInt(req.query.year);
    const payrolls=await prisma.payroll.findMany({where,include:{employee:{select:{name:true,email:true,role:true}}},orderBy:[{year:"desc"},{month:"desc"}]});
    return success(res,{payrolls,totalGross:payrolls.reduce((s,p)=>s+p.grossSalary,0),totalNet:payrolls.reduce((s,p)=>s+p.netSalary,0),totalDeductions:payrolls.reduce((s,p)=>s+p.totalDeductions,0)});
  } catch(e){return error(res,e.message);}
};

exports.getInvoiceReport = async (req, res) => {
  try {
    const range=parseRange(req.query.from,req.query.to);
    const where={issueDate:range};
    if(req.query.status) where.status=req.query.status;
    const invoices=await prisma.invoice.findMany({where,include:{contact:{select:{id:true,firstName:true,lastName:true}},payments:true},orderBy:{issueDate:"asc"}});
    return success(res,{invoices,totals:{count:invoices.length,grandTotal:invoices.reduce((s,i)=>s+i.grandTotal,0),amountPaid:invoices.reduce((s,i)=>s+i.amountPaid,0),balanceDue:invoices.reduce((s,i)=>s+i.balanceDue,0)}});
  } catch(e){return error(res,e.message);}
};