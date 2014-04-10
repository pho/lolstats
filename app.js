var config = require("./config")
var request = require("./request").request
var util = require("util");
var sp = require("./spreadsheet");
var async = require("async");

console.log("ApiKey:", config.lol.apikey);
console.log("Region:", config.lol.region);
console.log("Player Name:", config.lol.name);

baseurl = "https://prod.api.pvp.net/"

summoner = baseurl + "api/lol/" + config.lol.region + "/v1.4/summoner"
game = baseurl + "api/lol/" + config.lol.region + "/v1.3/game"
staticdata = baseurl + "api/lol/static-data/"+ config.lol.region +"/v1.2"

function recent(summonerID, cb){
	url = util.format("%s/by-summoner/%s/recent", game, summonerID);
	request(url, cb);
}

function champion(championID, cb){
	url = util.format("%s/champion/%s", staticdata, championID);
	request(url, cb);
}

function summID(player, cb){
	url = util.format("%s/by-name/%s", summoner, player);
	request(url, cb);
}


function checkLabels(nextRow, sheet){
	if(nextRow == 1){
		console.log("Setting labels");
		obj = {}
        obj[nextRow] = {
        	1: "Date",
        	2: "Time",
        	3: "Mode",
        	4: "Type",
        	5: "IP",
        	6: "Team",
        	7: "Champion",
        	8: "Spell1",
        	9: "Spell2",
        	10: "Result"
        };
        sheet.add(obj);
        return true;
	}
	else
		return false;
}

function parseRecent(data){
	
	data = JSON.parse(data);

	var games = data.games.sort(function(a, b){
		return a.createDate > b.createDate;
	})

	sp.open(function(spreadsheet){
    	spreadsheet.receive(function(err, rows, info) {
	        if (err) {
	            throw err;
	        }

	        nextRow = info.nextRow;
	        
	        if(checkLabels(nextRow, spreadsheet)) nextRow += 1;

			async.eachSeries(games, function(game, cb){

				lastDateRow = rows[(nextRow-1).toString()];
				lastDate = (lastDateRow ? lastDateRow["1"] : "1/1/1970").split("/");
				lastTime = (lastDateRow ? lastDateRow["2"] : "00:00:00").split(":");
				var d = new Date(lastDate[2], lastDate[1], lastDate[0], lastTime[0], lastTime[1], lastTime[2]);

				var tmp = parseInt(game.createDate/1000)*1000;
				q
				if (d.getTime() >= tmp){
					console.log("Game already recorded", game.subType, game.stats.win);
					cb();
					return; // wtf.
				}

				champ = ""
				champion(game.championId, function(champ){
					champ = JSON.parse(champ);

					date = new Date(0);
					date.setUTCSeconds(game.createDate/1000);

					win = game.stats.win ? "Win": "Loss"
					team = game.teamId == 100 ? "Blue": "Purple"

					console.log("GameID:", game.gameId);
					console.log("  Mode:", game.gameMode);
					console.log("  Submode:", game.subType);
					console.log("  Result:", game.stats.win);
					console.log("  Champ:", champ.name);
					console.log("");

			        obj = {}
			        obj[nextRow] = {
			        	1: util.format("%s/%s/%s", date.getDate(), date.getMonth()+1, date.getFullYear()),
			        	2: util.format("%s:%s:%s", date.getHours(), date.getMinutes(), date.getSeconds()),
			        	3: game.gameMode,
			        	4: game.subType,
			        	5: game.ipEarned,
			        	6: team,
			        	7: champ.name,
			        	8: game.spell1,
			        	9: game.spell2,
			        	10: win
			        };
			        
			        spreadsheet.add(obj);
			        nextRow += 1;


		      	 	spreadsheet.send(function(err) {
		           		if(err) throw err;
						cb()
		        	});

		        })
				
	      	}, function(err){
	      		console.log("Done.")
	      	});
	        
      	});
	})
}


recent(config.lol.summonerID, parseRecent);
//summID("phofe", console.log)
