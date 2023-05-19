const token = "6272073385:AAEg_FLrTxVlB-E3MFy6t_PSSBaBhuPKVFA"; //telegram bot token example. Insert own token
const appLink = "https://script.google.com/macros/s/AKfycbzjcvGtOqoaZdkHqK_6Z-TP03bo0lt_vL1IOtYXoaU8d383wItYayoT1xP2OY8Xfd34/exec"; //example of web application url that we get after deploying the script. Don't forget to run apiConnector
const stickerId = "CAACAgIAAxkBAAMCZGO8TfwsW1kdI1hk_0YX4LeeTIQAAjwaAAJKWkhKEOAZosVnqRwvBA"; //sticker ID is unique for each bot, insert your value

const keyboard = { //optional keyboard that we can insert after the message
  "inline_keyboard": [
      [
          {"text": "Goodoq", "callback_data": "Goodoq"}
      ]
  ]
}

function apiConnector () { //setting up a webhook connection to the Telegram API. After receiving the appLink, you need to run this function
  UrlFetchApp.fetch("https://api.telegram.org/bot"+token+"/setWebHook?url="+appLink);
}

function doPost(e) { //required Apps Script function to handle POST requests
  const update = JSON.parse(e.postData.contents);
  let msgData = {}
  if (update.hasOwnProperty('message')) { //if the post contains 'message' put the necessary fields in msgData
    msgData = {
      id         : update.message.message_id,
      chat_id    : update.message.chat.id,
      user_name  : update.message.from.username,
      date       : (update.message.date/86400)+25569.125,
      text       : update.message.text,
      is_msg     : true
    };
  }

  else if (update.hasOwnProperty('callback_query')) { //if the post contains 'callback_query' put the necessary fields in msgData
    msgData = {
      id         : update.callback_query.message.message_id,
      chat_id    : update.callback_query.message.chat.id,
      user_name  : update.callback_query.from.username,
      first_name : update.callback_query.from.first_name,
      text       : update.callback_query.message.text,
      date       : (update.callback_query.message.date/86400)+25569.125,
      data       : update.callback_query.data,
      is_button  : true
    }
  }
  dataHandler(msgData);
};

async function dataHandler(msgData) { //handle command or button click
  if (msgData.is_msg) {
    if(msgData.text == "/upload"){
      await send(msgData.chat_id, "Выберите профиль игрока: ", keyboard, null);
    }
  } else if (msgData.is_button) {
    if(msgData.data == "Goodoq"){
      const processing_sticker_id = await sendSticker(msgData.chat_id, stickerId, msgData.id);
      const processing_message_id = await send(msgData.chat_id, "Идёт обработка запроса", null, null);
      await createTable();
      await deleteMessage(msgData.chat_id, processing_message_id);
      await deleteMessage(msgData.chat_id, processing_sticker_id);
      await editMsg(`Таблица обновлена, ${count} строк было добавлено`, msgData.chat_id, msgData.id, null);
    }
  }
}

async function send(chat_id, msg, keyboard, replyToId) { //send a text message from a bot to Telegram
  const payload = {
    'method': 'sendMessage',
    'chat_id': String(chat_id),
    'text': msg,
    'parse_mode': 'HTML',
  }
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  if (replyToId) payload.reply_to_message_id = replyToId;
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  }
  const response = await UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
  const responseJson = JSON.parse(response.getContentText());
  return responseJson.result.message_id;
}

async function sendSticker(chat_id, sticker_id, replyToId) { //send a sticker from a bot to Telegram
  const payload = {
    'method': 'sendSticker',
    'chat_id': String(chat_id),
    'sticker': sticker_id,
  };
  if (replyToId) payload.reply_to_message_id = replyToId;
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  };
  const response = await UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
  const responseJson = JSON.parse(response.getContentText());
  return responseJson.result.message_id;
}

function deleteMessage(chat_id, msg_id) { 
  const payload = {
    'method': 'deleteMessage',
    'chat_id': String(chat_id),
    'message_id': String(msg_id)
  }
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  }
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}

function editMsg(msg, chat_id, msg_id, keyboard) {
  const payload = {
    'method': 'editMessageText',
    'chat_id': String(chat_id),
    'message_id': String(msg_id),
    'text': msg,
    'parse_mode': 'HTML'
  }
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  
  const data = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  }
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/', data);
}
