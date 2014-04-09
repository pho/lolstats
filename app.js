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
		obj = {}
        obj[nextRow] = {
        	1: "Date",
        	2: "Mode",
        	3: "Type",
        	4: "IP",
        	5: "Team",
        	6: "Champion",
        	7: "Spell1",
        	8: "Spell2",
        	9: "Result"
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


				lastDate = rows["" + (nextRow-1)];
				lastTime = new Date( lastDate ? lastDate["1"] : 0 ).getTime();

				var tmp = parseInt(game.createDate/1000)*1000;
				
				if (lastTime >= tmp){
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
			        	1: date.toString(),
			        	2: game.gameMode,
			        	3: game.subType,
			        	4: game.ipEarned,
			        	5: team,
			        	6: champ.name,
			        	7: game.spell1,
			        	8: game.spell2,
			        	9: win
			        };
			        
			        spreadsheet.add(obj);
			        nextRow += 1;


		      	 	spreadsheet.send(function(err) {
		           		if(err) throw err;
						cb()
		        	});

		        })
				
	      	}, function(err){
           		console.log("Done");
	      	});
	        
      	});
	})
}


recent(config.lol.summonerID, parseRecent);
//summID("phofe", console.log)