const prisma = require("../../config/db");
const { success, error, paginated } = require("../../utils/apiResponse");
const fs = require("fs"), path = require("path");

exports.getDocuments = async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20, skip=(page-1)*limit;
    const where={};
    if(req.query.type) where.type=req.query.type;
    if(req.query.search) where.OR=[{title:{contains:req.query.search,mode:"insensitive"}}];
    const [data,total]=await Promise.all([
      prisma.financeDocument.findMany({where,skip,take:limit,orderBy:{createdAt:"desc"},include:{uploadedBy:{select:{id:true,name:true,email:true}}}}),
      prisma.financeDocument.count({where}),
    ]);
    return paginated(res,data,{total,page,limit,totalPages:Math.ceil(total/limit)});
  } catch(e){return error(res,e.message);}
};

exports.getDocument = async (req, res) => {
  try {
    const d=await prisma.financeDocument.findUnique({where:{id:req.params.id},include:{uploadedBy:{select:{id:true,name:true,email:true}}}});
    if(!d) return error(res,"Not found",404);
    return success(res,d);
  } catch(e){return error(res,e.message);}
};

exports.uploadDocument = async (req, res) => {
  try {
    if(!req.file) return error(res,"No file uploaded",400);
    const {title,type,description}=req.body;
    const d=await prisma.financeDocument.create({data:{title:title||req.file.originalname,type:type||"OTHER",fileUrl:"/uploads/"+req.file.filename,fileSize:req.file.size,mimeType:req.file.mimetype,description,uploadedById:req.user.id},include:{uploadedBy:{select:{id:true,name:true,email:true}}}});
    return success(res,d,"Document uploaded",201);
  } catch(e){return error(res,e.message);}
};

exports.deleteDocument = async (req, res) => {
  try {
    const d=await prisma.financeDocument.findUnique({where:{id:req.params.id}});
    if(!d) return error(res,"Not found",404);
    const fp=path.join(__dirname,"../../",d.fileUrl);
    if(fs.existsSync(fp)) fs.unlinkSync(fp);
    await prisma.financeDocument.delete({where:{id:req.params.id}});
    return success(res,null,"Deleted");
  } catch(e){return error(res,e.message);}
};