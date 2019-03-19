const fs = require('fs');
const readline = require('readline');
const https = require('https');
var inquirer = require('inquirer');
var chalkPipe = require('chalk-pipe');
const bitcore = require('bitcore-lib');
delete global._bitcore; // remove in production
const explorers  = require('bitcore-explorers');
const figlet = require('figlet');
// it's recommended run this script on virtual machine.
const privkey = bitcore.PrivateKey(); // important
const publickey_uncompressed = privkey.toPublicKey();
const publickey = publickey_uncompressed.toAddress().toString(); // PUBLIC KEY TO ADDRESS


figlet('BIT STABLE', function(err, logo) {
  if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
  }

  console.log(logo)
  console.log('Do you wanna to help? 1AGyqezdgfCKUbHSpfhForTzxHuE3oaDzM')
  console.log('it\'s recommended run this script on virtual machine.\n\n\n\n\n')


  if (fs.existsSync('bitcoinWallet.txt')) {
      const rl = readline.createInterface({
          input: fs.createReadStream('bitcoinWallet.txt'),
          crlfDelay: Infinity
      });

      var lineCounter = 0;
      var wantedLines = [];
      rl.on('line', function(line) {
          lineCounter++;
          wantedLines.push(line);
          if (lineCounter == 3) {
              rl.close();
          }
      });
      rl.on('close', function() {
          Oldprivkey = wantedLines[1]; // important
          Oldpublickey = wantedLines[2];
          console.log(`your BTC wallet is: ${Oldpublickey} \n send BTC to it to start the tradebot 🤖`);
          BTCRecived(Oldpublickey,Oldprivkey);
      });


  } else {
      fs.writeFile("bitcoinWallet.txt", `${Date()} THIS FILE IS VERY SENSITIVE AND IMPORTANT DON'T SHARE/DELETE IT DOING THAT IS ON YOUR OWN RISK\n${privkey}\n${publickey}`, function(err) {
          if (err) {
              return console.log(err);
          }
          console.log(`Created Wallet for the script! \n SEND BTC TO ${publickey}`);
          BTCRecived(publickey,privkey);
      });
  }


  function BTCRecived(address,privatekey) {
          https.get(`https://blockchain.info/q/addressbalance/${address}?confirmations=6` , (resp) => {
              //change 'confirmations=6' to any number of confirmation to transcation confirmation you want but please note 6 is the min.
          let balance = '';
          resp.on('data', (chunk) => {
              balance += chunk;
          });
          resp.on('end', () => {
              if(balance != 0) {
                  console.log(`Recived  ${balance * 0.00000001} ฿ `);
                  var questions = [
                      {
                        type: 'input',
                        name: 'usdt',
                        message: "What's your USDT address?"
                      },
                      {
                        type: 'input',
                        name: 'Satoshiamount',
                        message: "What's your BTC amount you want to trade with? (IN SATOSHI)",
                        default: function() {
                          return '3600000'; //min.
                        }
                        ,
                        validate: value =>
                        new Promise(resolve => {
                          setTimeout(
                            () =>
                              resolve(
                                (value.length && !Number.isNaN(Number(value))) ||
                                  'You must provide a number(IN SATOSHI).'
                              ),
                            0
                          );
                        })
                      },
                      {
                        type: 'input',
                        name: 'usd',
                        message: "What's the amount of USD you want to exchange to when BTC reach to it?",
                        validate: value =>
                        new Promise(resolve => {
                          setTimeout(
                            () =>
                              resolve(
                                (value.length && !Number.isNaN(Number(value))) ||
                                  'You must provide a valid USD amount.'
                              ),
                            0
                          );
                        }),
                        default: function() {
                          return '140'; //max. you can receive on your teather non-confirmed account.
                        }
                      }
                    ];

                    inquirer.prompt(questions).then(answers => {
                      const usdtwallet = answers.usdt;
                      const satoshiTrade = answers.Satoshiamount;
                      const usd = answers.usd;
                      const SatoshitoBTC = satoshiTrade * 0.00000001;
                      inquirer.prompt([
                          {
                            type: 'list',
                            name: 'sure',
                            message: `ARE YOU SURE YOU WANT TO EXCHANGE ${SatoshitoBTC} ฿TC to THIS ${usdtwallet} USDT WALLET ADDRESS when BTC reaches ${usd} USD ?`,
                            choices: [
                              'YES I WANT TO MAKE THIS TRANSCATION!',
                              'NO!',
                            ]
                          },

                        ])
                        .then(answers => {
                          answer = answers.sure;
                          if(answer == 'NO!') {
                            process.exit(1);
                            //CLOSING THE APP.
                          } else {
                            exchangeAddress(usdtwallet,SatoshitoBTC,address,privatekey);
                          }
                        });
                    });
              } else {
                  setInterval(() => {
                      if(balance == 0) {
                          BTCprice();
                      }
                  }, 120000);
              }
          });

          }).on("error", (err) => {
          console.log("Error: " + err.message);
          });
  }

  function BTCprice() {
      //GETTING THE PRICE OF BITCOIN
      // THIS FUNCTION IS FORKED FROM https://github.com/momenbasel/cryptowatcher IF YOU WANT TO USE IT MORE;
      https.get(`https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD`,
      res => {
          var data = "";
          res.on("data", chunk => {
          data += chunk;
          });

          res
          .on("end", () => {
              var result = JSON.parse(data);
              var old_price = result.USD;
              console.log(`The price OF BTC is competing it reached ${old_price} USD now.`);
              setInterval(() => {
              https.get(`https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD`,
                  res => {
                  var newdata = "";
                  res.on("data", chunk => {
                      newdata += chunk;
                  });
                  res.on("end", () => {
                      newResult = JSON.parse(newdata);
                      var new_price = newResult.USD;
                      if (old_price !== new_price) {
                  console.log(`The price of BTC changed to ${new_price} USD Hurry up!`);
                      old_price = new_price;
                      }
                  });
                  }
              );
              }, 10000);
          })
          .on("error", err => {
              console.log("Error on printing the : " + err.message);
          });
      }
      );
    }

  //FIRST 2 ARGUMENT FOR EXCHANGEADDRESS THE LAST 3 FOR SENDBTC
  function exchangeAddress(USDTaddress,BTCamount,from,PrivateKey) {

      //PLEASE NOTE THAT BTCAMOUNT IS IN BTC NOT IN SATOSHI!!!
      const api_key = "4358392c41dc988cec69e9196d98c43595c273bc950bd6afc157327a712bf1cf";  //IT'S SAFE TO KEEP IT IN PRODUCATION DON'T CHANGE IT PLEASE(it give me Affiliatefee).
      const data = JSON.stringify({
          from:'BTC',
          to:'USDT',  //(USDC MAYBE?)
          address: USDTaddress,
          amount: BTCamount
        })

        const options = {
          hostname: 'changenow.io',
          port: 443,
          path: `/api/v1/transactions/${api_key}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        }

        const req = https.request(options, (res) => {
          console.log(`--CHANGENOW API ${res.statusCode} Everything is working well!`)

          res.on('data', (data) => {
            const parseddata = JSON.parse(data);
            const BTCTO = parseddata.payinAddress;
            console.log(`sending BTC to ${BTCTO}`);
            sendBTC(from,BTCTO,BTCamount,PrivateKey);

          })
        })

        req.on('error', (error) => {
          console.error(error)
        })

        req.write(data)
        req.end()
    }


  function sendBTC(from,to,amount,PrivateKey) {
    return new Promise((resolve, reject) => {


      const unit = bitcore.Unit;
      const insight = new explorers.Insight();
      const minerFee = unit.fromMilis(0.128).toSatoshis(); //cost of transaction in satoshis (minerfee)
      const transactionAmount = unit.fromMilis(amount).toSatoshis(); //convert mBTC to Satoshis using bitcore unit

      insight.getUnspentUtxos(from, function(error, utxos) {
        if (error) {
          //any other error
          console.log(error);
          return reject(error);
        } else {
          if (utxos.length == 0) {
            //if no transactions have happened, there is no balance on the address.
            return reject("You don't have enough Satoshis to cover the miner fee.");
          }
          //get balance
          let balance = unit.fromSatoshis(0).toSatoshis();
          for (var i = 0; i < utxos.length; i++) {
            balance += unit.fromSatoshis(parseInt(utxos[i]['satoshis'])).toSatoshis();
          }

          //check whether the balance of the address covers the miner fee
          if ((balance - transactionAmount - minerFee) > 0) {

            //create a new transaction
            try {
              let bitcore_transaction = new bitcore.Transaction()
                .from(utxos)
                .to(to, amount)
                .fee(minerFee)
                .change(from)
                .sign(PrivateKey);

              //handle serialization errors
              if (bitcore_transaction.getSerializationError()) {
                let error = bitcore_transaction.getSerializationError().message;
                switch (error) {
                  case 'Some inputs have not been fully signed':
                    return reject('Please check your private key');
                    break;
                  default:
                    return reject(error);
                }
              }

              // broadcast the transaction to the blockchain
              insight.broadcast(bitcore_transaction, function(error, body) {
                if (error) {
                  reject('Error in broadcast: ' + error);
                } else {
                  resolve({
                    transactionId: body
                  });
                }
              });

            } catch (error) {

              return reject(error.message);
            }
          } else {
            return reject("You don't have enough Satoshis to cover the miner fee.");
          }
        }
      });
    });
  }

})


//A CUP OF COFFE WELL BE APPRECIATED  BTC: 1AGyqezdgfCKUbHSpfhForTzxHuE3oaDzM
// CODED WITH LOVE IN CRYPTOCURRENCY<3
