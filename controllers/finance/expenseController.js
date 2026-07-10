const prisma = require("../../config/db");
const { success, error, paginated } = require("../../utils/apiResponse");

exports.getExpenses = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.status) where.status=req.query.status;
    if(req.query.category) where.category=req.query.category;
    if(req.query.search) where.OR=[{title:{contains:req.query.search,mode:"insensitive"}}];
    const [data,total]=await Promise.all([
      prisma.expense.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{submittedBy:{select:{id:true,name:true,email:true,avatar:true}}}}),
      prisma.expense.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getExpense = async (req, res) => {
  try {
    const ex=await prisma.expense.findUnique({where:{id:req.params.id},include:{submittedBy:{select:{id:true,name:true,email:true}}}});
    if(!ex) return error(res,"Not found",404);
    return success(res,ex);
  } catch(e){return error(res,e.message);}
};

exports.createExpense = async (req, res) => {
  try {
    const {title,description,amount,category,expenseDate,notes}=req.body;
    const billUrl=req.file?"/uploads/"+req.file.filename:null;
    const ex=await prisma.expense.create({data:{title,description,amount:parseFloat(amount),category:category||"MISC",expenseDate:expenseDate?new Date(expenseDate):new Date(),billUrl,submittedById:req.user.id,notes,status:"PENDING"},include:{submittedBy:{select:{id:true,name:true,email:true}}}});
    return success(res,ex,"Expense submitted",201);
  } catch(e){return error(res,e.message);}
};

exports.updateExpense = async (req, res) => {
  try {
    const ex=await prisma.expense.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    if(ex.status!=="PENDING") return error(res,"Only pending expenses can be edited",400);
    const {title,description,amount,category,expenseDate,notes}=req.body;
    const billUrl=req.file?"/uploads/"+req.file.filename:ex.billUrl;
    const updated=await prisma.expense.update({where:{id:req.params.id},data:{title,description,amount:parseFloat(amount),category,expenseDate:expenseDate?new Date(expenseDate):ex.expenseDate,billUrl,notes},include:{submittedBy:{select:{id:true,name:true,email:true}}}});
    return success(res,updated,"Updated");
  } catch(e){return error(res,e.message);}
};

exports.approveExpense = async (req, res) => {
  try {
    const ex=await prisma.expense.update({where:{id:req.params.id},data:{status:"APPROVED",approvedById:req.user.id,approvedAt:new Date()}});
    return success(res,ex,"Approved");
  } catch(e){return error(res,e.message);}
};

exports.rejectExpense = async (req, res) => {
  try {
    const ex=await prisma.expense.update({where:{id:req.params.id},data:{status:"REJECTED",approvedById:req.user.id,approvedAt:new Date(),notes:req.body.reason||undefined}});
    return success(res,ex,"Rejected");
  } catch(e){return error(res,e.message);}
};

exports.deleteExpense = async (req, res) => {
  try {
    const ex=await prisma.expense.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    await prisma.expense.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};