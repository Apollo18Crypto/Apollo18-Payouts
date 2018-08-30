# Apollo18 Dividend Transfer

This codebase includes three JavaScript files

## Parsing Sample - [parse.js](parse.js)
The parsing demo includes the code to parse the sample.csv file as well as functionality to sum ownership. The output is the data from the CSV file with the percentage of tokens the user would receive from the dividend payout. 

## Transfer Sample - [transfer.js](transfer.js)
The transfer code shows how to transfer Ethereum tokens from one user to another. The sample will transfer between accounts listed in the [.env](.env) file. 

## Dividend Transfer Utility - [apollo18.js](apollo18.js)
The transfer utility uses the code from the above two samples to transfer coins between accounts. The CSV file should be provided to the script as a command line argument.