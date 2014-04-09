var https = require("https");
var config = require("./config");


function request(url, cb){	

	url = url + "?api_key=" + config.lol.apikey
	data = []

	https.get(url, function(res){

		res.on("data", function(d){
			data.push(d);
		})

		res.on("end", function(){
			var d = Buffer.concat(data).toString();
			cb(d);
		})

	})
}


exports.request = request