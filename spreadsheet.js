var Spreadsheet = require('edit-google-spreadsheet');
var config = require("./config")

exports.open = function(cb){
    Spreadsheet.load({
        debug: true,
        spreadsheetId: config.spreadsheet.file_id,
        worksheetName: config.spreadsheet.title,

        oauth : {
            email: config.oauth.email,
            keyFile: config.oauth.keyFile
        }

    }, function sheetReady(err, spreadsheet){
        if(err) throw err;

        cb(spreadsheet);

        spreadsheet.send(function(err) {
           if(err) throw err;
         });

    });
}
