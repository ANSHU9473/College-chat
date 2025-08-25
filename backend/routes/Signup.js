const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
	try {
		const { email, password, name } = req.body;
		// Only allow emails from the same college/school domain
		const allowedDomain = "college.edu"; // Change this to your domain
		if (!email.endsWith(`@${allowedDomain}`)) {
			return res.status(400).json({ msg: `Only ${allowedDomain} emails are allowed` });
		}
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ msg: "User already exists" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const user = new User({ email, password: hashedPassword, name });
		await user.save();
		res.status(201).json({ msg: "Signup successful" });
	} catch (err) {
		console.error("Signup error:", err);
		res.status(500).json({ msg: "Server error", error: err.message });
	}
});
module.exports = router;