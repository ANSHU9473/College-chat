const express=require("express");
const router=express.Router();
const Message=require("../models/Message");
const auth=require("../middleware/authMiddleware");

router.post("/send",auth,async(req,res)=>{
    try{
        const {text}=req.body;
        const msg=new Message({
            user:req.user.id,
            text
        });
        await msg.save();
        res.json({msg:"Message sent successfully"});
    }
    catch(err){
        res.status(500).json({msg:"Server error",error:err.message});
    }
});
router.get("/", auth, async (req, res) => { try { const msgs = await Message.find().populate("user", "email").sort({ createdAt: -1 }); res.json(msgs); } catch (err) { res.status(500).json({ error: err.message }); } });

module.exports = router;