const prisma = require("../../config/db");
const { success, error, paginated } = require("../../utils/apiResponse");

exports.getVendors = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.isActive!==undefined) where.isActive=req.query.isActive==="true";
    if(req.query.search) where.OR=[{name:{contains:req.query.search,mode:"insensitive"}},{company:{contains:req.query.search,mode:"insensitive"}},{email:{contains:req.query.search,mode:"insensitive"}}];
    const [data,total]=await Promise.all([
      prisma.vendor.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{_count:{select:{purchaseOrders:true}}}}),
      prisma.vendor.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getVendor = async (req, res) => {
  try {
    const v=await prisma.vendor.findUnique({where:{id:req.params.id},include:{purchaseOrders:{orderBy:{createdAt:"desc"},take:10,include:{items:true}}}});
    if(!v) return error(res,"Not found",404);
    return success(res,v);
  } catch(e){return error(res,e.message);}
};

exports.createVendor = async (req, res) => {
  try {
    const {name,email,phone,company,address,city,state,country,pincode,gstin,pan,bankName,bankAccount,bankIfsc,notes}=req.body;
    const v=await prisma.vendor.create({data:{name,email,phone,company,address,city,state,country,pincode,gstin,pan,bankName,bankAccount,bankIfsc,notes}});
    return success(res,v,"Vendor created",201);
  } catch(e){return error(res,e.message);}
};

exports.updateVendor = async (req, res) => {
  try {
    const ex=await prisma.vendor.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    const {name,email,phone,company,address,city,state,country,pincode,gstin,pan,bankName,bankAccount,bankIfsc,notes,isActive}=req.body;
    const v=await prisma.vendor.update({where:{id:req.params.id},data:{name,email,phone,company,address,city,state,country,pincode,gstin,pan,bankName,bankAccount,bankIfsc,notes,isActive}});
    return success(res,v,"Updated");
  } catch(e){return error(res,e.message);}
};

exports.deleteVendor = async (req, res) => {
  try {
    const ex=await prisma.vendor.findUnique({where:{id:req.params.id}});
    if(!ex) return error(res,"Not found",404);
    await prisma.vendor.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};