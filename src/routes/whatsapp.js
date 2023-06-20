const express = require("express");
const messageHelper = require("../helper/helper");
const sendMessage = require("../helper/message");
const admin = require("../config/firebase");
const router = express.Router();
const db = admin.firestore();

router.get("/whatsapp", (req, res) => {
  res.send("lets GOOO");
});

router.post("/messages", async (req, res) => {
  const recipient = req.body.recipient;
  const messageInput = messageHelper.getTemplateTextInput(
    // "917007393348",
    recipient,
    "Template Name Here"
  );
  try {
    const { data } = await sendMessage(messageInput);
    // Store in Firestore
    await db.collection("WhatsappMessages").add({
      status: "success",
      message: JSON.parse(messageInput),
    });
    res.json({
      status: "success",
      response: data,
    });
  } catch (error) {
    throw new Error(error.message)
  }
});

router.get("/webhook", (req, res) => {});
router.post("/webhook", (req, res) => {});
module.exports = router;

/**
 * {
 *    "recipient": "917983819529",
 *     "message": "Hello World"
 *      "templateName": "First Message From Nodejs"
 *    status : [success,failed]
 * }
 */
