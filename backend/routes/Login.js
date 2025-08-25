const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
    try{
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ msg: "User doesn't exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({ msg: "Invalid credentials" });
        }

    const jwtSecret = process.env.JWT_SECRET || "dev_secret_key";
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1d" });
        res.json({ msg: "Login successful", token });
    }
    catch(err){
        console.error("Login error:", err);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

module.exports = router;
