const express = require("express");
const messageHelper = require("../helper/helper");
const sendMessage = require("../helper/message");
const sendMediaMessage = require("../helper/mediamessage");
const getmedia = require("../helper/mediamessage");
const admin = require("../config/firebase");
const router = express.Router();
const db = admin.firestore();
const {FieldValue,Timestamp} = admin.firestore;
const { default: axios } = require("axios");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const uuid = uuidv4();


const storageRef = admin.storage().bucket(`gs://reverr-25fb3.appspot.com`);
var outputPath = ''


async function uploadFile(path, filename,mediaid,messageFrom,mediatype) {

  // Upload the File
  const storage = await storageRef.upload(path, {
      public: true,
      destination: `Whatsappclouduploads/${filename}`,
      metadata: {
        metadata :{
          firebaseStorageDownloadTokens: uuid,
       }
    },
     
  });

  fs.stat(`${path}`, function (err, stats) {
    // console.log(stats);
    if (err) {
        return console.error(err);
    }
    fs.unlink(`${path}`,function(err){
         if(err) return console.log(err);
    });  
 });

 await db.collection("WhatsappMessages").doc(`${messageFrom}`).update({
  messages: FieldValue.arrayUnion(
    {status: "success",
       messageId: mediaid,
   date: Timestamp.now(),
   url: storage[0].metadata.mediaLink,
   previevUrl: `https://firebasestorage.googleapis.com/v0/b/reverr-25fb3.appspot.com/o/${storage[0].id}?alt=media&token=${storage[0].metadata.metadata.firebaseStorageDownloadTokens}`,
   mediatype: mediatype
  })
});
  

// console.log(storage[0].metadata.metadata.firebaseStorageDownloadTokens);
// console.log(storage[0].id);
  return  storage[0].metadata.mediaLink;
}


router.get("/whatsapp", (req, res) => {
  res.send("lets GOOO");
});

router.post("/messages", async (req, res) => {
  const recipient = req.body.recipient;
  // const messageInput = messageHelper.getTemplateTextInput(
  //   // "917007393348",
  //   recipient,
  //   "Template Name Here"
  // );
  const messageInput = messageHelper.getCustomTextInput(
    // "917007393348",
    recipient,
    "Thank you for your message. We will get back to you soon."
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
  try {
    const  payload  = req.body;
    const messageReceived = payload.entry[0].changes[0].value.messages;
    // console.log(messageReceived);
    const messageFrom = messageReceived[0].from;
    let mediaid = " "
    let mediatype = " "
    //for media files start
    if(messageReceived[0].type === "image" || messageReceived[0].type === "audio" || messageReceived[0].type === "video"){
      if(messageReceived[0].type === "image"){
        mediaid= messageReceived[0].image.id;
        mediatype = "png"
      }
      if(messageReceived[0].type === "audio"){
        mediaid= messageReceived[0].audio.id;
        mediatype = "mp3"
      }
      if(messageReceived[0].type === "video"){
        mediaid= messageReceived[0].video.id;
        mediatype = "mp4"
      }
      
      const media = await getmedia(mediaid)
      const mediaurl = media.data.url
     outputPath = `${mediaid}.${mediatype}`
    res.send(mediaurl);
    
     axios(mediaurl,{
      method: 'GET',
      responseType: 'stream',
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}` ,
      },
    }).then((response) => {
      //  console.log(response);

      const writer = fs.createWriteStream(outputPath);
       response.data.pipe(writer);
      // writer.pipe(uploadStream);
      writer.on('finish', () => {
    const url =  uploadFile(outputPath, outputPath,mediaid,messageFrom,mediatype);
    // return  console.log(url);
        console.log(`File saved as ${outputPath}`);
      });
  
      writer.on('error', (err) => {
        console.error('Error saving file:', err);
      });
    })
    .catch((error) => {
      console.error('Error making request:', error);
    });
  
    //  console.log("done");
    
  
    }
    //for media files end

    else{

    


    //for text below
    const messageText = messageReceived[0].text.body;
    const messageFrom = messageReceived[0].from;
    const usermessage = messageReceived[0].text.body;

    let messageInput;
   
    if (["hi", "hii", "hello"].includes(messageText.toLowerCase())) {
      // Use a template or custom message here
      messageInput = messageHelper.getTemplateTextInput(
        // "917007393348",
        messageFrom,
        "hello_world"
      );
    } else {
      messageInput = messageHelper.getCustomTextInput(
        // "917007393348",
        messageFrom,
        "Thank you for your message. We will get back to you soon."
      );
    }

    const { data } = await sendMessage(messageInput);
  
  
    // Store in Firestore if needed
    // await db.collection("WhatsappMessages").add({
    //   status: "success",
    //   messageId: data.messages[0].id,
    //   message: JSON.parse(messageInput),
    // });
   const userexist = await db.collection("WhatsappMessages").doc(`${messageFrom}`).get()
   if(!userexist.exists){
    console.log("no doc");
    await db.collection('WhatsappMessages').doc(`${messageFrom}`).set(
     {exists: "true"})
     await db.collection("WhatsappMessages").doc(`${messageFrom}`).update({
      messages: FieldValue.arrayUnion(
        {status: "success",
           messageId: data.messages[0].id,
       message: JSON.parse(messageInput),
       date: Timestamp.now(),
       usermessage,
      })
    }) 
   }else{
    await db.collection("WhatsappMessages").doc(`${messageFrom}`).update({
      messages: FieldValue.arrayUnion(
        {status: "success",
           messageId: data.messages[0].id,
       message: JSON.parse(messageInput),
       date: Timestamp.now(),
       usermessage,
      })
    });
   }
     
    res.json({
      status: "success",
     
    });
  }} catch (error) {
 
    console.error("Error:", error);
    const statusCode = error.response ? error.response.status : 500;
    res.status(statusCode).json({
      message: error.message,
     
    });
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
