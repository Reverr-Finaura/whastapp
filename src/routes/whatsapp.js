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
    // await db.collection("WhatsappMessages").add({
    //   status: "success",
    //   messageId: data.messages[0].id,
    //   message: JSON.parse(messageInput),
    // });
    res.json({
      status: "success",
      response: data,
    });
  } catch (error) {
    // console.log(error);
    // throw new Error(error.message);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
      message: error.message,
    });
  }
});

// router.get("/webhook", async (req, res) => {
//   await db.collection("WhatsappMessages", "Send").add({
//     status: "success",
//     text: "Testing",
//   });
//   const data = await db.collection("WhatsappMessages", "Send").get();
//   res.json({
//     status: "success",
//     response: data,
//   });
// });
router.post("/webhook", async (req, res) => {
  const { payload } = req.body;
  const data = {
    data: payload.jsonPayload.entry[0].changes[0].value,
  };

  // await db.collection("WhatsappMessages", "Received").add({
  //   status: "success",
  //   data: data,
  // });
  console.log("DATA",data);
  console.log("Payload", payload);

  const messageReceived =
    payload.jsonPayload.entry[0].changes[0].value.messages;
  const messageText = messageReceived[0].text.body;
  const messageFrom = messageReceived[0].from;

  if (
    messageText == "Hi" ||
    messageText == "hii" ||
    messageText == "hello" ||
    messageText == "HI"
  ) {
    const messageInput = messageHelper.getCustomTextInput(
      // "917007393348",
      messageFrom,
      "Hello, How can I help you?"
    );
    try {
      const { data } = await sendMessage(messageInput);
      // Store in Firestore
      // await db.collection("WhatsappMessages", "Send").add({
      //   status: "success",
      //   messageId: data.messages[0].id,
      //   message: JSON.parse(messageInput),
      // });
      res.json({
        status: "success",
        response: data,
      });
    } catch (error) {
      // console.log(error);
      throw new Error(error.message);
    }
  } else {
    const messageInput = messageHelper.getCustomTextInput(
      // "917007393348",
      messageFrom,
      "Thank you for your message. We will get back to you soon."
    );
    try {
      const { data } = await sendMessage(messageInput);
      // Store in Firestore
      await db.collection("WhatsappMessages", "Send").add({
        status: "success",
        messageId: data.messages[0].id,
        message: JSON.parse(messageInput),
      });
      res.json({
        status: "success",
        response: data,
      });
    } catch (error) {
      // console.log(error);
      throw new Error(error.message);
    }
  }
});
module.exports = router;

/**
 * {
 *    "recipient": "917983819529",
 *     "message": "Hello World"
 *      "templateName": "First Message From Nodejs"
 *    status : [success,failed]
 * }
 */
