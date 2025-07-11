var createError = require('http-errors');
var { BigNumber } = require("ethers");
var express = require('express'); 
const axios = require('axios');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Common = require('@ethereumjs/common');
/*const common =  Common.custom({
  name: 'Amoy',
  chainId: 80002,
  networkId: 80002,
});*/
var session = require('express-session');
//private
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../../test-application/javascript/AppUtil.js');
const fs = require('fs');
const walletPath = path.join(__dirname, '../wallet');
var private_blockchain = require('./backend.js');
let isConnect = false;
let gateway=null;
let network=null;
//public
const Web3 = require('web3');
//const web3 = new Web3('wss://patient-soft-diamond.matic-amoy.quiknode.pro/0b9ea5941b20b6fc3109252a732bfc5889ac07fe/');
const web3_http = new Web3('https://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954');
const web3 = new Web3('wss://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954');
//const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954'));
//const web3_http = new Web3('wss://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954');
//const eth_web3 = new Web3("https://eth.getblock.io/94cc53b0-ae83-40aa-ae57-73d024dce3be/mainnet/");
const iMRCNFTAddress = '0xe37Bc9424ef916Fc6643Ff5542ccAe75cAEFAF1d';
const CarbonNFTAddress = '0x348D80173Ad17e5953c5493B31307Ba420FECE9f';
const MarketAddress = '0x7A34d2E78E5186F593e74a0f5A40Fe1fa1F82073';
var iMRCNFTJson = require('./json/iMRCNFT.json');
var CarbonNFTJson = require('./json/CarbonNFT.json');
var MarketJson = require('./json/Market.json');
const iMRCNFTContract = new web3.eth.Contract(iMRCNFTJson.abi,iMRCNFTAddress);
const CarbonNFTContract = new web3.eth.Contract(CarbonNFTJson.abi,CarbonNFTAddress);
const MarketContract = new web3.eth.Contract(MarketJson.abi,MarketAddress);

const AdminPublicKey = '0xEfEA16dBC0D65b822fd80ed0D31496DC0f14Fd53';
const AdminPrivateKey = '9b59211d6b8a942f1128ffe1eb24e6df590ecbc59912cd9ee982d57fe80a98a6';
/*
const sqlite = require('sqlite');
const db = new sqlite.Database('database.db');
const db_verify = new sqlite.Database('verify_database.db');

db.run('CREATE TABLE IF NOT EXISTS users (Address TEXT,CompanyId TEXT,CompanyName TEXT)');
db_verify.run('CREATE TABLE IF NOT EXISTS users (Address TEXT,TokenId TEXT)');
*/

global.app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//constant session
app.use(session({
    secret: 'mySecret',
    saveUninitialized: false,
    resave: true,
    cookie:{maxAge: 1000 * 60 * 60}
    //accont
    //isLogin
}));

var privateBC_Router = require('./routes/privateBC'); 
var publicBC_Router = require('./routes/publicBC'); 

//Default Connect Fabric
async function initializeFabric() {
  const wallet = await buildWallet(Wallets, walletPath);
  gateway = new Gateway();
  try {
      const ccp = buildCCPOrg1();
      await gateway.connect(ccp, {
        wallet,
        identity: 'iMRC',
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });
        //network = gateway;
      network = await gateway.getNetwork('carbon');
        //req.session.isConnect = true;
      console.log('Network Connecting');
    }
    catch(error){
        //network = null;
        network = null;
        //res.status(400).send(error.toString());
    }
  // Setup event listener
  try {
    /*// Accounting, VerifyComplete
    const VerifyEvent = await private_blockchain.AddEvent(network, 'Accounting', 'VerifyComplete');
    console.log('VerifyComplete Event Listener Added');

    // Certificate, Mint
    const MintEvent = await private_blockchain.AddEvent(network, 'Certificate', 'Mint');
    console.log('Mint Event Listener Added');

    // Certificate, Burn
    const BurnEvent = await private_blockchain.AddEvent(network, 'Certificate', 'Burn');
    console.log('Burn Event Listener Added');    // Return handles to the events so they can be removed later*/
    const Event = await private_blockchain.AddEvent(network);
    console.log('Event Listener Added');
    const Block = await private_blockchain.AddBlockEvent(network);
    console.log('Block Listener Added');
    return network;
  } catch (error) {
      console.error('Failed to set up event listeners:', error);
  }
}
//app.use('/emission', privateBC_Router(network)); 

async function initializePolygon() {
  // Setup event listener
  try {
    await iMRCNFTContract.events.BuyerNFTMint().on('data', (event) => {logEventToFile(event,"BuyerNFTMint")}).on('error', console.error);
    await iMRCNFTContract.events.BuyerNFTUpdated().on('data', (event) => {logEventToFile(event,"BuyerNFTUpdated")}).on('error', console.error);
    await iMRCNFTContract.events.BuyerNFTStatus().on('data', (event) => {logEventToFile(event,"BuyerNFTStatus")}).on('error', console.error);
    console.log('iMRCNFT Event Listener Added');
    await CarbonNFTContract.events.SellerNFTMint().on('data', (event) => {logEventToFile(event,"SellerNFTMint")}).on('error', console.error);
    await CarbonNFTContract.events.SellerNFTUpdated().on('data', (event) => {logEventToFile(event,"SellerNFTUpdated")}).on('error', console.error);
    await CarbonNFTContract.events.SellerNFTStatus().on('data', (event) => {logEventToFile(event,"SellerNFTStatus")}).on('error', console.error);
    console.log('CarbonNFT Event Listener Added');
    await MarketContract.events.NewDemand().on('data', (event) => {logEventToFile(event,"NewDemand")}).on('error', console.error);
    await MarketContract.events.NewSupply().on('data', (event) => {logEventToFile(event,"NewSupply")}).on('error', console.error);
    await MarketContract.events.NewMatching().on('data', (event) => {logEventToFile(event,"NewMatching")}).on('error', console.error);
    await MarketContract.events.PaymentReceived().on('data', (event) => {logEventToFile(event,"PaymentReceived")}).on('error', console.error);
    console.log('Market Event Listener Added');
    // Return handles to the events so they can be removed later
  } catch (error) {
      console.error('Failed to set up event listeners:', error);
  }
}
function logEventToFile(event,name) {
  const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}.log`;
  const filePath = path.join(__dirname+'/../', 'logs', fileName);
  const logEntry = `${new Date().toISOString()} - Event: ${name}, Payload: ${JSON.stringify(event)}\n`;

    // 確保目錄存在
    fs.mkdir(path.join(__dirname+'/../', 'logs'), { recursive: true }, (err) => {
      if (err) {
          console.error("Failed to create log directory:", err);
          return;
      }

      // 將日誌寫入對應的檔案
      fs.appendFile(filePath, logEntry, (err) => {
          if (err) {
              console.error("Failed to log event to file:", err);
          } else {
              console.log(`Event logged to file ${fileName}:`, logEntry);
          }
      });
  });
}
//page
app.use('/trading', publicBC_Router);
app.use('/emission', privateBC_Router);
async function Initialize(req, res, next){
  if (isConnect==false){
    await initializeFabric();
    await initializePolygon();
  }
  isConnect=true;
  next();
}
app.use(Initialize);
app.get('/', function(req,res){
  if(isConnect!=true){
    return res.redirect('/Event/ConnectEvent');
  }
  return res.render('Home', { title: 'Blockchain Explorer' });
});
app.get('/registry', function(req,res){
  return res.render('Registry', { title: 'Blockchain Explorer' });
});
app.get('/Home', function(req,res){
  return res.redirect('/Event/ConnectEvent');
});
app.get('/Event/ConnectEvent', function(req,res){
  if(!isConnect){
    initializeFabric();
    initializePolygon();
    isConnect = true;
  }
  return res.redirect('/');
});
app.get('/Event/ReConnect', function(req,res){
  initializeFabric();
  initializePolygon();
  return res.status(200).send('Success ReConnect');
});
app.get('/Event/getEventLogs', function(req,res){
  const AimEvent = req.query.EventID.toString();
  const fileName = `${AimEvent.toLowerCase().replace(/\s+/g, '_')}.log`;
  const filePath = path.join(__dirname+'/../', 'logs', fileName);
  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File does not exist.");
      res.status(200).send(false); 
      return err;// The file does not exist
    }

    console.log("File exists.");
    // Continue with your logic here if the file exists
    // For example, you might want to read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error("Failed to read file:", err);
        res.status(200).send(false);
        return err;
      }
      console.log("Read Success");
      res.status(200).send(data);
      return data;
    });
  });
});
app.get('/VerifiedBuyerNFT', async function (req, res) {
  //const stopWatching = await watchLogFile();
  //console.log(stopWatching);
  const filePath = path.join(__dirname+'/../', 'logs', "verifycomplete.log");
  const filedata = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
  const lines = filedata.split(/\r?\n/); 
  console.log(lines[lines.length - 2]); 
  let result = JSON.parse(lines[lines.length - 2].split("Payload:")[1]);
  res.send(result.NFT.toString());
/*
  res.send('API 调用已接收，正在监控日志文件...');
  const NFTID = req.body.TokenID;
  const result = true;*/
  //Burn........
  if(result!=null){
    //Verifier born NFT
    let address;
    await axios.get('http://140.116.234.100:1314/trading/getAddress?CompanyID='+result.Company.toString())
    .then(response => {
      address = response.data;
    })
    .catch(error => {
      console.error('Error during fetching:', error);
    });
    //const carbonAmount = Number(result.CompanyStorageEmission)*(10**18);
    //let carbonAmount = result.CompanyStorageEmission.toString()+'e18';
    let carbonAmount =BigNumber.from((parseFloat(result.CompanyStorageEmission) * Math.pow(10, 18)).toString()).toString();
    //const carbonAmount = ethers.utils.parseUnits(result.CompanyStorageEmission.toString(), 18);
    let errorRate;
    if(result.CompanyErrorRate==null){
      errorRate=0;
    }
    else{
      errorRate = result.CompanyErrorRate;
    }
    //errorRate = errorRate.toString()+'e18';
    errorRate =BigNumber.from((parseFloat(errorRate) * Math.pow(10, 18)).toString()).toString();
    //errorRate = ethers.utils.parseUnits(errorRate.toString(), 18);
    console.log(address)
    console.log(carbonAmount)
    console.log(errorRate)
    let iMRCNFTContract_http = new web3_http.eth.Contract(iMRCNFTJson.abi,iMRCNFTAddress);
    const data = iMRCNFTContract_http.methods.VerifierMintBuyerNFT(address,carbonAmount,errorRate).encodeABI();
    const tx = {
        from: AdminPublicKey,
        to:   iMRCNFTAddress,
        gas: 2000000, // 設定足夠的gas限制
        data: data
    };
    web3_http.eth.accounts.signTransaction(tx, AdminPrivateKey)
    .then(signedTx => {
        // 發送已簽名的交易
        web3_http.eth.sendSignedTransaction(signedTx.rawTransaction)
            .then(receipt => {
                console.log('Transaction receipt: ', receipt);
            })
            .catch(error => {
                console.error('Transaction error: ', error);
            });
    })
    .catch(error => {
        console.error('Signing error: ', error);
    });
  }
  else{
    res.send('fail');
  }
});

app.post('/VerifiedSellerNFT', async function (req, res) {
  const NFTID = req.body.TokenID;
  const result = true;
  //........
  if(result==true){
    //NFT Status change to verified
    const data = CarbonNFTContract.methods.verifyBuyerNFT(NFTID).encodeABI();
    const tx = {
        from: AdminPublicKey,
        to:   CarbonNFTAddress,
        gas: 2000000, // 設定足夠的gas限制
        data: data
    };
    web3.eth.accounts.signTransaction(tx, AdminPrivateKey)
    .then(signedTx => {
        // 發送已簽名的交易
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .then(receipt => {
                console.log('Transaction receipt: ', receipt);
                //res.send(receipt);
            })
            .catch(error => {
                console.error('Transaction error: ', error);
                //res.send(error);
            });
    })
    .catch(error => {
        console.error('Signing error: ', error);
    });
  }
  else{
    res.send('fail');
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.initializeFabric = initializeFabric;
app.initializePolygon = initializePolygon;
module.exports = app;