// imports
require('dotenv').config()
const Web3 = require('web3')
const axios = require('axios')
const EthereumTx = require('ethereumjs-tx')
const log = require('ololog').configure({ time: true })
const ansi = require('ansicolor').nice
const fs = require('fs'); 
const parse = require('csv-parse');

// CSV parsing variables
var csvData = [];
var total = 0;

let live = true;

// check call
if (process.argv.length < 3) {
    log(`Call is: node apollo18 input.csv`.red)
    process.exit()
}

//  Network configuration
const testnet = `https://rinkeby.infura.io/${process.env.INFURA_ACCESS_TOKEN}`

// Change the provider that is passed to HttpProvider to `mainnet` for live transactions.
const web3 = new Web3( new Web3.providers.HttpProvider(testnet) )
 
// Set the web3 default account to use as your public wallet address
web3.eth.defaultAccount = process.env.WALLET_ADDRESS

// setup variable to hold gas price data
var gasPrices;

// determine current balance
const myBalanceWei = web3.eth.getBalance(web3.eth.defaultAccount).toNumber()
const myBalance = web3.fromWei(myBalanceWei, 'ether')
log(`Your wallet balance is currently ${myBalance} ETH`.green)
const payoutPool = myBalance - .001;
log(`The payout pool is currently ${payoutPool} ETH`.green)

// process input file
fs.createReadStream(process.argv[2])
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
            var payout = payoutPool * percent; 

            console.log("Address:" + address + " Ownership:" + ownership + " Percent:" + percent + " Payout:" + payout);
            transfer(address, payout);
        }
    });
 
/**
 * Fetch the current transaction gas prices from https://ethgasstation.info/
 * 
 * @return {object} Gas prices at different priorities
 */
const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    }
   
    console.log("\r\n")
    log (`Current ETH Gas Prices (in GWEI):`.cyan)
    console.log("\r\n")
    log(`Low: ${prices.low} (transaction completes in < 30 minutes)`.green)
    log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`.yellow)
    log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`.red)
    console.log("\r\n")
   
    return prices
}

var nonce = -1;

/**
 * This is the process that will run when you execute the program.
 */
const transfer = async (recipient, amount) => {
    // Fetch the current transaction gas prices from https://ethgasstation.info/
    gasPrices = await getCurrentGasPrices()

    // get new nonce
    if (nonce == -1) {
        nonce = web3.eth.getTransactionCount(web3.eth.defaultAccount)
    } else {
        nonce++;
    }
    log(`The outgoing transaction count for your wallet address is: ${nonce}`.magenta)
   
    let gasPrice = gasPrices.low * 1000000000; // converts the gwei price to wei
    let amountToSend = amount - web3.fromWei(gasPrice, 'ether');
    // Build a new transaction object and sign it locally.
    let details = {
      "to": recipient,
      "value": web3.toHex( web3.toWei(amountToSend, 'ether') ),
      "gas": 21000,
      "gasPrice": gasPrice,
      "nonce": nonce,
      "chainId": 4 // EIP 155 chainId - mainnet: 1, rinkeby: 4
    }

    log(`Sending ${amountToSend} to ${recipient}, gas costs ${gasPrice}`)
   
    if (live) {
        // Create new transaction
        const transaction = new EthereumTx(details)
    
        // Authorize transaction
        transaction.sign( Buffer.from(process.env.WALLET_PRIVATE_KEY, 'hex') )
    
        // Now, we'll compress the transaction info down into a transportable object.
        const serializedTransaction = transaction.serialize()
    
        // We're ready! Submit the raw transaction details to the provider configured above.
        const transactionId = web3.eth.sendRawTransaction('0x' + serializedTransaction.toString('hex') )
    
        // We now know the transaction ID, so let's build the public Etherscan url where the transaction details can be viewed.
        const url = `https://rinkeby.etherscan.io/tx/${transactionId}`
        log(url.cyan)

        log(`Note: please allow for 30 seconds before transaction appears on Etherscan`.magenta)
    }
}
