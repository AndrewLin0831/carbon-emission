var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var common = require('@ethereumjs/common');
const Common = common.default;  
var usersRouter = require('./routes/users');
var registryRouter = require('./routes/registry');

var session = require('express-session');
const Web3 = require('web3');
var NFTJson = require('./json/iMRCNFT.json');
var TokenJson = require('./json/iMRCToken.json');
var RetirementJson = require('./json/iMRCRetirement.json');
const AdminAddress = '0xEfEA16dBC0D65b822fd80ed0D31496DC0f14Fd53';
const web3 = new Web3('https://long-cool-cherry.matic-testnet.discover.quiknode.pro/7df014dde8c338ff7cb16a4968b6c3eea21b9556/');
const eth_web3 = new Web3("https://eth.getblock.io/94cc53b0-ae83-40aa-ae57-73d024dce3be/mainnet/");
const NFTAddress = '0xa31eda9b2d01b0396e765939aE20153b6E5cd8A3';
const TokenAddress = '0x69d33Fba8D84Fcc69567a3bf41C9783210155E0A';
const RetireAddress = '0x09fe18F26cBF7630b54E3EA50F8C66A368bcDDC9';
const NFTContract = new web3.eth.Contract(NFTJson.abi,NFTAddress);
const TokenContract = new web3.eth.Contract(TokenJson.abi,TokenAddress);
const RetirementContract = new web3.eth.Contract(RetirementJson.abi,RetireAddress);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const db_verify = new sqlite3.Database('verify_database.db');
// 創建表格
db.run('CREATE TABLE IF NOT EXISTS users (Address TEXT,CompanyId TEXT,CompanyName TEXT)');
db_verify.run('CREATE TABLE IF NOT EXISTS users (Address TEXT,TokenId TEXT)');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//constant
app.use(session({
    secret: 'mySecret',
    saveUninitialized: false,
    resave: true,
    cookie:{maxAge: 3600000}
    //accont
    //isLogin
}));

//page

app.get('/', function(req,res){
  return res.redirect('/home');
});

app.get('/home', function(req,res){
  return res.render('Home', { title: 'Cabon Emission Exchange Platform' });
});

app.get('/registry/user', function(req,res){
  return res.render('Registry', { title: 'registry' });
});

app.get('/registry/admin', async function(req,res){
const AdminAddress = await NFTContract.methods.owner().call();
if(String(AdminAddress).toLowerCase()==String(req.session.account)){
  return res.render('Admin', { title: 'admin registry' });
  }
  return res.redirect('/registry/user');
});

app.get('/registry/enroll', function(req,res){
  return res.render('Registry', { title: 'registry' });
});

app.get('/registry/nft', function(req,res){
  return res.render('Registry', { title: 'registry' });
});

app.get('/transfer', function(req,res){
  return res.render('Transfer', { title: 'transfer' });
});

app.get('/transfer/fraction', function(req,res){
  return res.render('Transfer', { title: 'transfer' });
});

app.get('/transfer/nft', function(req,res){
  return res.render('Transfer', { title: 'transfer' });
});

app.get('/transfer/token', function(req,res){
  return res.render('Transfer', { title: 'transfer' });
});

app.get('/retire', function(req,res){
  return res.render('Retire', { title: 'retire' });
});

app.get('/retire/enroll', function(req,res){
  return res.render('Retire', { title: 'retire' });
});

app.get('/retire/nft', function(req,res){
  return res.render('Retire', { title: 'retire' });
});

app.get('/retire/token', function(req,res){
  return res.render('Retire', { title: 'retire' });
});
app.get('/retire/search', function(req,res){
  return res.render('Retire', { title: 'retire' });
});

app.get('/trace', function(req,res){
  return res.render('Trace', { title: 'trace' });
});

app.get('/trace/companyId', function(req,res){
  return res.render('Trace', { title: 'trace' });
});

app.get('/trace/nft', function(req,res){
  return res.render('Trace', { title: 'trace' });
});

app.post('/connectWallet', function (req, res) {
    var account = req.body.account;
    req.session.account = account;
    req.session.isLogin = true;
    console.log(req.session.account)
    console.log(req.session.isLogin)
    res.send(account);
});

app.get('/connectCheck', function (req, res) {
  if(req.session.isLogin){
    var element = [String(req.session.account),req.session.isLogin];
    res.send(element);}
    else{res.send(req.session.isLogin);}
});

app.get('/maxSupply', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const maxSupplyNFT = await NFTContract.methods.CarbonNftMaxSupply().call();
      const maxSupplyToken = await TokenContract.methods.CarbonTokenMaxSupply().call();
      var maxSupply = [maxSupplyNFT,maxSupplyToken];
      res.send(maxSupply);
    }
});

app.get('/userInfo/getBalance', function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      web3.eth.getBalance(req.session.account, (error, wei) => {
          if (!error) {
          const balance = req.session.web3.utils.fromWei(wei, 'ether');
          res.send(balance);
          }
      });
    }
});

app.get('/userInfo/membership',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
    var result=[];
    try{
       const NFT_membership = await NFTContract.methods.EnrollmentList(String(req.session.account)).call();
       result.push(NFT_membership);
       const Retire_membership = await RetirementContract.methods.CompanyList(String(req.session.account)).call();
       result.push(Retire_membership);
       res.send(result);
       }
       catch(err){res.send(false);}
    }
})

app.get('/userInfo/getCarbonTokenBalance', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const balanceToken = await TokenContract.methods.balanceOf(req.session.account).call();
      const decimal = await TokenContract.methods.decimals().call();
      //const decimals = Math.pow(10, Number(decimal));
      const decimals =BigInt(10) ** BigInt(decimal);
      const money = BigInt(String(balanceToken));
      const balance1 = String(money/decimals);
      const balance2 = String(money%decimals);
      const balance = String(Number(balance1)+Number('0.'+balance2));
      res.send(balance);
    }
});

app.get('/userInfo/getCarbonNFTBalance', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const balanceToken = await NFTContract.methods.balanceOf(req.session.account).call();
      var balance = balanceToken;
      res.send(balance);
    }
});

app.get('/userInfo/getRetirementAmount', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const CompanyId = await RetirementContract.methods.CompanyList(req.session.account).call();
      const RetiredAmount = await RetirementContract.methods.RetirementDataList(CompanyId.CompanyIdEnrollment).call();
      const decimal = await this.erc20.methods.decimals().call();
      var amount = (RetiredAmount.RetirementAmount)/(10**decimal);
      res.send(amount);
    }
});

app.post('/userInfo/getNFTInfo', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      var tokenId = req.body.tokenId;
      var each_id=tokenId.split(',');
      var data=[];
      for(var i =0;i<each_id.length-1;i++){
      await NFTContract.methods.nftList(each_id[i]).call()
      .then((result) => {
          data.push(result);
          check();
      }).catch((err) => {
          res.send(err);
      });
      }
      function check(){
        if(data.length==each_id.length-1){
        res.send(data);
        }
      }
    }
});

app.get('/userInfo/getNFTList', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
    var element = [NFTJson,String(req.session.account),NFTAddress];
    res.send(element);
    }
});

app.get('/userInfo/getYourCompanyRetirementInfo', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      try{
        const CompanyEnrollmentInfo = await RetirementContract.methods.CompanyList(String(req.session.account)).call();
        const RetiredAmount = await RetirementContract.methods.RetirementDataList(CompanyEnrollmentInfo.CompanyIdEnrollment).call();
        const UsedAmount = await NFTContract.methods.getCompanyCarbonInfo(CompanyEnrollmentInfo.CompanyIdEnrollment).call();
        const decimal = await TokenContract.methods.decimals().call();
        const decimals =BigInt(10) ** BigInt(decimal);
        const amount = BigInt(String(RetiredAmount.RetirementAmount));
        const result1 = String(amount/decimals);
        const result2 = String(amount%decimals);
        var result = String(Number(result1)+Number('0.'+result2));
        var data = [String(CompanyEnrollmentInfo.CompanyIdEnrollment),String(CompanyEnrollmentInfo.CompanyNameEnrollment),String(UsedAmount.carbonAmount),result];
        res.send(data);
      }
      catch(err){
      res.send(err.message);
      }
    }
});

app.get('/userInfo/CarbonNFTFactoryEnrollment',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    await NFTContract.methods.EnrollmentList(req.session.account).call()
    .then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err.reason);
    });
});

app.post('/userInfo/RetirementFactoryEnrollment',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    await RetirementContract.methods.CompanyList(req.session.account).call()
    .then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err.reason);
    });
});

app.post('/userInfo/addEnrollmentData',async function (req,res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
  var id = req.body.id;
  var name = req.body.name;
  var text='';
  db.get('SELECT EXISTS(SELECT 1 FROM users WHERE Address = ?) AS result', [String(req.session.account)], function(err, row) {
  if (err) {
    console.error('fail:', err);
    res.send(false);
  }
  const exists = row.result === 1;
  if (exists) {
    console.log('already have this element');
    res.send(false);
  } 
  else {
  console.log('no this element');
  db.run('INSERT INTO users (Address, CompanyId, CompanyName) VALUES (?, ?, ?)', [String(req.session.account), id, name], function(err) {
    if (err) {
      console.error('fail:', err);
      res.send("fail");
    }
    else{
      console.log('success:', this.lastID);
      var element = [RetirementJson,String(req.session.account),RetireAddress];
      res.send(element);
    }
  });
  }
  });
});

app.get('/userInfo/searchEnrollmentData',async function (req,res) {
  db.all('SELECT * FROM users', function(err, rows) {
    if (err) {
      res.send(err);
    }
    else{
      if(String(rows)==''){res.send(false);}
      else{res.send(rows);}
      }
  });
});

app.get('/CarbonNFTFactory/mintNFT', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    /*try{
      var account = req.session.account;
      await NFTContract.methods.mintEmptyNft(account).send({ from: account });
      const NftCounter = await NFTContract.methods.NftTokenCounter().call();
      res.send(NftCounter);
    }
    catch(err){
        res.send(String(err));
    };
    res.send(req.session.account);*/
    var element = [NFTJson,String(req.session.account),NFTAddress];
    res.send(element);
});

app.post('/CarbonNFTFactory/updateNFT', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      var element = [NFTJson,String(req.session.account),NFTAddress];
      res.send(element);
    }
});

app.post('/CarbonNFTFactory/addVerifyNFT', async function (req, res) {
  var TokenId = req.body.tokenId; 
  
  if(!req.session.isLogin){
        res.send("noWallet");
    }
    
  const owner = await NFTContract.methods.ownerOf(String(TokenId)).call();
  const verify_or_not = await NFTContract.methods.nftList(String(TokenId)).call();
  if(String(verify_or_not.status)!="0"){res.send("verified");}
  else{
    if(String(owner.toLowerCase())==String(req.session.account)){
      db_verify.get('SELECT EXISTS(SELECT 1 FROM users WHERE Address = ? AND TokenId = ?) AS result', [String(req.session.account),String(TokenId)], function(err, row) {
        if (err) {
          console.error('fail:', err);
          res.send(err);
        }
        else{
          const exists = row.result === 1;
          if (exists) {
            console.log('already have this element');
            res.send(false);
          } 
          else {
            console.log('no this element');
            db_verify.run('INSERT INTO users (Address, TokenId) VALUES (?, ?)', [String(req.session.account), String(TokenId)], function(err) {
              if (err) {
                console.error('fail:', err);
                res.send(err);
              }
              else{
              console.log('success:', this.lastID);
              res.send(true);
              }
            });
          }
        }
      });
    } 
    else{res.send('you are not owner')}
  }
});
//owner

app.get('/CarbonNFTFactory/searchSingleVerifyNFT', async function (req, res) {
    var TokenId = req.query.id;
    console.log(TokenId)
    db_verify.get('SELECT EXISTS(SELECT 1 FROM users WHERE TokenId = ?) AS result', [TokenId], function(err, row) {
    if (err) {
      console.error('fail:', err);
      res.send(false);
    }
    else{
    const exists = row.result === 1;
    if (exists) {
    console.log('element exist');
    res.send(true);
    }
    else{
    console.log('element not exist');
    res.send(false);
    }
    }  
    });
});

app.get('/CarbonNFTFactory/searchVerifyNFT', async function (req, res) {
    db_verify.all('SELECT * FROM users', function(err, rows) {
    if (err) {
      res.send(err);
    }
    else{
      if(String(rows)==''){res.send(false);}
      else{res.send(rows);}
      }
  });
});

app.post('/CarbonNFTFactory/verifyNFT', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const tokenId = req.body.tokenId;
      const sql = 'DELETE FROM users WHERE TokenId = ?';
      db_verify.run(sql, [String(tokenId)], function(err) {
        if (err) {
          console.error(err.message);
          res.send(err.message);
        } else {
          console.log('ID:'+String(tokenId)+', verify complete');
          var element = [NFTJson,String(req.session.account),NFTAddress];
          res.send(element);
        }
      });
    }
});

app.post('/CarbonTokenFactory/fractionNFT', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    var element = [NFTJson,String(req.session.account),NFTAddress];
    res.send(element);
});

app.post('/Transfer/transferNFT', function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    var element = [NFTJson,String(req.session.account),NFTAddress];
    res.send(element);
});

app.post('/Transfer/transferToken',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    if(req.body.tokenAmount==0||req.body.tokenAmount=='undefined'){
        res.send(false);
    }
    const decimal = await TokenContract.methods.decimals().call();
    const decimals =BigInt(10) ** BigInt(decimal);    
    if(Boolean(String(req.body.tokenAmount).includes("."))==false){
    const money = BigInt(String(req.body.tokenAmount));
    amount = String(money*decimals);
    }
    else{
    var amountSplit = String(req.body.tokenAmount).split(".");
    let minusDecimal =decimal-(amountSplit[1].length);
    let minusDecimals =BigInt(10) ** BigInt(minusDecimal);
    amount = String(BigInt(amountSplit[0])*decimals+BigInt(amountSplit[1])*minusDecimals);
    }    
    var element = [TokenJson,String(req.session.account),amount,TokenAddress];
    res.send(element);
});

app.post('/RetirementFactory/retirementNFT', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    /*const tokenId = req.body.tokenId;
    await NFTContract.methods.Retired(tokenId).send({ from: req.session.account })
    .then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err.reason);
    });*/
    var element = [NFTJson,String(req.session.account),NFTAddress];
    res.send(element);
});

app.post('/RetirementFactory/retirementToken', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    let amount = req.body.amount;
    var amounts=0;
    /*await TokenContract.methods.Retire(tokenAmount).send({ from: req.session.account })
    .then((result) => {
        res.send(result);
    }).catch((err) => {
        res.send(err.reason);
    });*/
    const decimal = await TokenContract.methods.decimals().call();
    if(Boolean(amount.includes("."))==false){
    let decimals =BigInt(10) ** BigInt(decimal);
    amounts = String(BigInt(amount)*decimals);
    }
    else{
    var amountSplit = String(amount).split(".");
    let decimals =BigInt(10) ** BigInt(decimal);
    let minusDecimal =decimal-(amountSplit[1].length);
    let minusDecimals =BigInt(10) ** BigInt(minusDecimal);
    amounts = String(BigInt(amountSplit[0])*decimals+BigInt(amountSplit[1])*minusDecimals);
    }
    var element = [TokenJson,String(req.session.account),amounts,TokenAddress];
    res.send(element);
});

//owner
app.post('/Company/enrollCarbonNFTFactory',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    else{
      const address = req.body.address;
      const sql = 'DELETE FROM users WHERE Address = ?';
      db.run(sql, [address], function(err) {
        if (err) {
          console.error(err.message);
          res.send(err.message);
        } else {
          console.log('address:'+address+', enroll complete');
          var element = [NFTJson,String(req.session.account),NFTAddress];
          res.send(element);
        }
      });
    }
});

app.post('/Company/enrollRetirementFactory',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    var element = [RetirementJson,String(req.session.account),RetireAddress];
    res.send(element);
});

app.post('/Company/enrollCarbonNFTFactory&RetirementFactory',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    const address = req.body.address;
    const id = req.body.id;
    const name = req.body.name;
    await NFTContract.methods.setCompanyEnrollment(address,id,name).send({ from: req.session.account });
    await RetirementContract.methods.setEnrollment(id,name).send({ from: req.session.account });
    res.send("true");
});

app.get('/Company/getCarbonUsedAmount',async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    try{
    const EnrollmentList = await NFTContract.methods.EnrollmentList(String(req.session.account)).call();
    const UsedAmount = await NFTContract.methods.getCompanyCarbonUsed(EnrollmentList.CompanyIdEnrollment).call();
    res.send(UsedAmount);
    }
    catch(err){
    res.send(err);
    }
});

app.get('/Company/getRetirementInfo', async function (req, res) {
    if(!req.session.isLogin){
        res.send("noWallet");
    }
    try{
    var CompanyId = req.query.id;
    const RetiredAmount = await RetirementContract.methods.RetirementDataList(CompanyId).call();
    const decimal = await TokenContract.methods.decimals().call();
    const decimals =BigInt(10) ** BigInt(decimal);
    const amount = BigInt(String(RetiredAmount.RetirementAmount));
    const result1 = String(amount/decimals);
    const result2 = String(amount%decimals);
    var result = String(Number(result1)+Number('0.'+result2));
    res.send(result);
    }
    catch(err){
    res.send(err.message);
    }
});

app.get('/trace/getSingleNFTInfo', async function (req, res) {
    var tokenId = req.query.tokenId;
    console.log(tokenId);
    try{
    var data = await NFTContract.methods.nftList(tokenId).call();
    var owner = await NFTContract.methods.ownerOf(tokenId).call();
    var result=[];
    result.push(data);
    result.push(owner);
    res.send(result);
    }
    catch(err){
    res.send(err.message);
    }
});

app.get('/trace/getSingleCompanyInfo', async function (req, res) {
    var Id = req.query.Id;
    try{
    var data_name = await NFTContract.methods.CompanyDataList(Id).call();
    var data_used = await NFTContract.methods.getCompanyCarbonInfo(Id).call();
    var data_retired = await RetirementContract.methods.RetirementDataList(Id).call();
    const decimal = await TokenContract.methods.decimals().call();
    const decimals =BigInt(10) ** BigInt(decimal);
    const amount = BigInt(String(data_retired.RetirementAmount));
    const number1 = String(amount/decimals);
    const number2 = String(amount%decimals);
    data_retired[2] = String(Number(number1)+Number('0.'+number2));
    var RetiredList = await RetirementContract.methods.getRetirementDataList(Id).call();
    var result = [data_name,data_used,data_retired,RetiredList];
    res.send(result);
    }
    catch(err){
    res.send(false);
    }
});

app.get('/trace/getSingleCertificate', async function (req, res) {
    var Id = req.query.Id;
    var results=[];
    var IdList=[];
    try{
    console.log(Id)
    const decimal = await TokenContract.methods.decimals().call();
    const decimals =BigInt(10) ** BigInt(decimal);
    for(var i=0;i<Id.length;i++){
    var result = await RetirementContract.methods.CertificateList(Id[i]).call();
    const amount = BigInt(String(result.RetirementAmount));
    const number1 = String(amount/decimals);
    const number2 = String(amount%decimals);
    result[3] = String(Number(number1)+Number('0.'+number2));
    results.push(result);
    IdList.push(Id[i]);
    }
    var data = [];
    data.push(results);
    data.push(IdList);
    res.send(data);
    }
    catch(err){
    res.send(false);
    }
});


//資料收集器(騰清)
app.get('/collect', function(req,res){
  return res.render('Collect', { title: 'Blockchain Tx Collection' });
});
//合約提供器
app.post('/Contract/NFT', async function (req, res) {
    var element = [NFTJson,NFTAddress];
    res.send(element);
});
app.post('/Contract/Token', async function (req, res) {
    var element = [TokenJson,TokenAddress];
    res.send(element);
});
app.post('/Contract/Retire', async function (req, res) {
    var element = [RetirementJson,RetireAddress];
    res.send(element);
});
//網路連接
app.post('/testnet', async function (req, res) {
    const element = Common.forCustomChain(
      'mainnet',
      {
        name: 'matic-mumbai', //polygon-mainnet
        networkId: 80001, //137
        chainId: 80001, //137
      },
      'petersburg',
    );
    res.send(element);
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

module.exports = app;
