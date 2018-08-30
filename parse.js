var fs = require('fs'); 
var parse = require('csv-parse');

var csvData = [];
var total = 0;

fs.createReadStream("sample.csv")
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvRow) {
        // add record to list
        csvData.push(csvRow);
        // calculate cumulative total        
        total += Number.parseFloat(csvRow[1]);
    }).on('end', function() {
        // iterate through records
        for(i = 0; i < csvData.length; ++i) {
            var record = csvData[i];
            var address = record[0];
            var ownership = record[1];
            var percent = Number.parseFloat(record[1]) / total;
            console.log("Address:" + address + " Ownership:" + ownership + " Percent:" + percent);
        }
    });