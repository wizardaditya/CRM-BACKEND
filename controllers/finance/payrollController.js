const prisma = require("../../config/db");
const { success, error, paginated } = require("../../utils/apiResponse");

exports.getPayrolls = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||50, skip=(page-1)*limit;
    const where={};
    if(req.query.month) where.month=parseInt(req.query.month);
    if(req.query.year) where.year=parseInt(req.query.year);
    if(req.query.isPaid!==undefined) where.isPaid=req.query.isPaid==="true";
    if(req.query.employeeId) where.employeeId=req.query.employeeId;
    const [data,total]=await Promise.all([
      prisma.payroll.findMany({where,skip,take:limit,orderBy:[{year:"desc"},{month:"desc"}],include:{employee:{select:{id:true,name:true,email:true,avatar:true,role:true}}}}),
      prisma.payroll.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getPayroll = async (req, res) => {
  try {
    const p=await prisma.payroll.findUnique({where:{id:req.params.id},include:{employee:{select:{id:true,name:true,email:true,role:true,phone:true}}}});
    if(!p) return error(res,"Not found",404);
    return success(res,p);
  } catch(e){return error(res,e.message);}
};

exports.createPayroll = async (req, res) => {
  try {
    const {employeeId,month,year,basicSalary,hra=0,allowances=0,commission=0,bonus=0,pf=0,esi=0,tds=0,otherDeductions=0,notes}=req.body;
    const emp=await prisma.user.findUnique({where:{id:employeeId}});
    if(!emp) return error(res,"Employee not found",404);
    const existing=await prisma.payroll.findUnique({where:{employeeId_month_year:{employeeId,month:parseInt(month),year:parseInt(year)}}});
    if(existing) return error(res,"Payroll already exists for this month",409);
    const gross=+basicSalary+(+hra)+(+allowances)+(+commission)+(+bonus);
    const deduct=(+pf)+(+esi)+(+tds)+(+otherDeductions);
    const p=await prisma.payroll.create({data:{employeeId,month:parseInt(month),year:parseInt(year),basicSalary:+basicSalary,hra:+hra,allowances:+allowances,commission:+commission,bonus:+bonus,grossSalary:gross,pf:+pf,esi:+esi,tds:+tds,otherDeductions:+otherDeductions,totalDeductions:deduct,netSalary:gross-deduct,notes},include:{employee:{select:{id:true,name:true,email:true,role:true}}}});
    return success(res,p,"Payroll created",201);
  } catch(e){return error(res,e.message);}
};

exports.updatePayroll = async (req, res) => {
  try {
    const ex=await prisma.payroll.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    if(ex.isPaid) return error(res,"Cannot edit paid payroll",400);
    const {basicSalary,hra=0,allowances=0,commission=0,bonus=0,pf=0,esi=0,tds=0,otherDeductions=0,notes}=req.body;
    const gross=+basicSalary+(+hra)+(+allowances)+(+commission)+(+bonus);
    const deduct=(+pf)+(+esi)+(+tds)+(+otherDeductions);
    const p=await prisma.payroll.update({where:{id:req.params.id},data:{basicSalary:+basicSalary,hra:+hra,allowances:+allowances,commission:+commission,bonus:+bonus,grossSalary:gross,pf:+pf,esi:+esi,tds:+tds,otherDeductions:+otherDeductions,totalDeductions:deduct,netSalary:gross-deduct,notes},include:{employee:{select:{id:true,name:true,email:true}}}});
    return success(res,p,"Updated");
  } catch(e){return error(res,e.message);}
};

exports.markPaid = async (req, res) => {
  try {
    const p=await prisma.payroll.update({where:{id:req.params.id},data:{isPaid:true,paidAt:new Date()}});
    return success(res,p,"Marked as paid");
  } catch(e){return error(res,e.message);}
};

exports.deletePayroll = async (req, res) => {
  try {
    const ex=await prisma.payroll.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    if(ex.isPaid) return error(res,"Cannot delete paid payroll",400);
    await prisma.payroll.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};

exports.getEmployees = async (req, res) => {
  try {
    const employees=await prisma.user.findMany({where:{isActive:true},select:{id:true,name:true,email:true,role:true,avatar:true},orderBy:{name:"asc"}});
    return success(res,employees);
  } catch(e){return error(res,e.message);}
};