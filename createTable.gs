const playerId = 86136386; //dota2 player ID
const end = 7139275252; //id of the match from which we start collecting statistics
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("[private] tableData"); //Specify the name of the Google spreadsheet page I'm working with
let count = 0; //I count how many lines I added, then I will display this info in the bot report

function getPlayerMatchResult(playerSlot, radiantWin) { //return win/loss depending on the magic numbers of openDotaAPI
  if ((playerSlot < 128 && radiantWin) || (playerSlot >= 128 && !radiantWin)) {
    return "Win";
  } else {
    return "Loss";
  }
}

function formatSeconds(seconds) { //convert seconds to hh:mm:ss format. Return as a string
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const hoursString = hours.toString().padStart(2, '0');
  const minutesString = minutes.toString().padStart(2, '0');
  const secondsString = remainingSeconds.toString().padStart(2, '0');
  
  return `${hoursString}:${minutesString}:${secondsString}`;
}

function getHeroNameById(heroId, data) { //pass the hero ID and data with info for all heroes, return the name of the hero you need
  const hero = data.find(h => h.id === heroId);
  return hero ? hero.localized_name : "Unknown";
}

function getHeroImgById(heroId, data) { //pass the hero ID and data with info for all heroes, return the image url of the hero you need
  const url = "https://cdn.cloudflare.steamstatic.com";
  const hero = data.find(h => h.id === heroId);
  const imgUrl = hero ? url + hero.img : "https://i.imgur.com/RQDavkM.png";
  return `=image("${imgUrl}")`;
}

function getHeroItemImgById(itemId, data) { //pass the item ID and data with info for all items, return the url of the item you want
  const url = "https://cdn.cloudflare.steamstatic.com";
  const itemsArr = Object.values(data);
  const item = itemsArr.find(i => i.id === itemId);
  const imgUrl = item ? url + item.img : "https://cdn.discordapp.com/attachments/1100421141048332319/1100823520327507978/empty.png";
  return `=image("${imgUrl}")`;
}

function getPlayerItemsFromMatchById(matchId) { //pass match id, return our player's items
  let dataCurrentMatch = getData(`https://api.opendota.com/api/matches/${matchId}`);
  const player = dataCurrentMatch.players.find(p => p.account_id === playerId);
  const items = [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5];
  count++; //count how many lines added
  return items;
}

function getData(url){ //get the data by url. Return JSON
  let response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}

function extractMatchId(sheet, lastMatchRow, lastMatchColumn) { //retrieve the id of the last recorded match from the link to the dotabuff
  const url = sheet.getRange(lastMatchRow, lastMatchColumn).getFormula();
  if(url == "") return 0;
  const regex = /(\d+)/;
  const matchId = regex.exec(url)[1];
  return matchId;
}

async function createTable() { //main function
  let dataMatches = getData(`https://api.opendota.com/api/players/${playerId}/matches?limit=57`); //last 57 matches from history. more/less possible
  let dataHeroes = getData("https://api.opendota.com/api/heroStats"); //total stat for all heroes. We get from there a pair of id / name of the hero, id / imgUrl of the hero
  let dataItems = getData("https://api.opendota.com/api/constants/items"); //general info for all items. We get a couple of id / imgUrl of the item from there

  const startRow = 2; //Here is the line number from which the table starts to fill
  const startColumn = 1; //Here is the ordinal number of the column from which the table starts to fill
  let stop = true;
  let sheetLastMatch = extractMatchId(sheet, startRow, startColumn+13); //if available, take the ID of the last match in the table
  /* temporary workaround with copy buffer. idk better option yet */
  const range1 = sheet.getRange(startRow, startColumn, 500, startColumn + 13); //third argument "500" is the last line of the range to be copied. I don't know how to specify better
  let rangeBuffer = sheet.getRange("Z1"); //Anchor for building a buffer table
  range1.copyTo(rangeBuffer);
  rangeBuffer = sheet.getRange(1, 26,502, 26 + 13); //get data from buffer. 500 lines (26 - serial number "Z")
  /* temporary workaround with copy buffer. idk better option yet */
   while(stop){
    for (let i = 0; i < dataMatches.length; i++) {
      if(end === dataMatches[i].match_id){
        stop = false;
        rangeBuffer.clear();
        return false;
      }
      if(sheetLastMatch == dataMatches[i].match_id){
        stop = false;
        const range2 = sheet.getRange(startRow+i, startColumn);
        rangeBuffer.copyTo(range2);
        rangeBuffer.clear();
        return false;
      }
      const items = getPlayerItemsFromMatchById(dataMatches[i].match_id);
      const heroImg = getHeroImgById(dataMatches[i].hero_id, dataHeroes);
      const heroName = getHeroNameById(dataMatches[i].hero_id, dataHeroes);
      console.log(heroName);
      const hyperlinkFormula = `=HYPERLINK("https://www.dotabuff.com/matches/${dataMatches[i].match_id}")`;
      const result = getPlayerMatchResult(dataMatches[i].player_slot, dataMatches[i].radiant_win);
      const kills = dataMatches[i].kills;
      const deaths = dataMatches[i].deaths;
      const assists = dataMatches[i].assists;
      const time = formatSeconds(dataMatches[i].duration);
      const item_0 = getHeroItemImgById(items[0], dataItems);
      const item_1 = getHeroItemImgById(items[1], dataItems);
      const item_2 = getHeroItemImgById(items[2], dataItems);
      const item_3 = getHeroItemImgById(items[3], dataItems);
      const item_4 = getHeroItemImgById(items[4], dataItems);
      const item_5 = getHeroItemImgById(items[5], dataItems);
      sheet.getRange(startRow+i, startColumn).setValue(heroImg);
      sheet.getRange(startRow+i, startColumn+1).setValue(heroName);
      sheet.getRange(startRow+i, startColumn+2).setValue(result);
      sheet.getRange(startRow+i, startColumn+3).setValue(time);
      sheet.getRange(startRow+i, startColumn+4).setValue(kills);
      sheet.getRange(startRow+i, startColumn+5).setValue(deaths);
      sheet.getRange(startRow+i, startColumn+6).setValue(assists);
      sheet.getRange(startRow+i, startColumn+7).setValue(item_0);
      sheet.getRange(startRow+i, startColumn+8).setValue(item_1);
      sheet.getRange(startRow+i, startColumn+9).setValue(item_2);
      sheet.getRange(startRow+i, startColumn+10).setValue(item_3);
      sheet.getRange(startRow+i, startColumn+11).setValue(item_4);
      sheet.getRange(startRow+i, startColumn+12).setValue(item_5);
      sheet.getRange(startRow+i, startColumn+13).setFormula(hyperlinkFormula);
    }
  }
}
