const express = require('express');
const axios = require('axios');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../../../test-application/javascript/AppUtil.js');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const walletPath = path.join(__dirname, '../../wallet');

//private
var private_blockchain = require('../backend.js');
let gateway=null;
let network;
// Middleware to manage Fabric connections
async function DefaultConnection(req, res, next) {
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
            console.log('Connect Success');
        }
        catch(error){
            //network = null;
            network = null;
            //res.status(400).send(error.toString());
        }
    next();
}

// Disconnect middleware
async function DefaultDisconnect() {
    try{
        console.log('Disconnecting from Gateway');
        gateway.disconnect();
        gateway = null;
        network = null;
        //req.session.isConnect = false;
        console.log('Close Success');
    } catch {
        console.log('No active connection found');
    }
}

router.use(DefaultConnection);
//main page
router.get('/', function(req,res){
    return res.render('Emission', { title: 'Emission Explorer' });
  });
/*-------------------------------------------------------------------*/
/*------------------------Apply Network password---------------------*/
/*-------------------------------------------------------------------*/
router.get('/CreateWallet', async (req, res, next) => {
    const orgUserId = req.query.CompanyName.toString();
    const caHostName = 'ca.org'+ req.query.OrgNumber.toString()+'.example.com';
    const affiliation = 'org'+req.query.OrgNumber.toString()+'.department1';//+req.query.SectionNumber.toString();
    const mspOrg = 'Org'+req.query.OrgNumber.toString()+'MSP';
    const adminUserId = 'admin';
    req.session.OrgNumber = req.query.OrgNumber;
    const adminUserAccount = 'admin';
    const adminUserPasswd = 'adminpw';
    let ccp;
    if(req.session.OrgNumber==1){
        ccp = buildCCPOrg1(); 
    }
    if(req.session.OrgNumber==2){
        ccp = buildCCPOrg2(); 
    }
    const caClient = buildCAClient(FabricCAServices, ccp, caHostName);
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, mspOrg, adminUserId, adminUserAccount, adminUserPasswd);
    await registerAndEnrollUser(caClient, wallet, mspOrg, orgUserId, affiliation, adminUserId);  
});
/*
router.post('/Connect', async (req, res, next) => {
    const wallet = await buildWallet(Wallets, walletPath);
    let NewGateway;
    let NewNetwork;
    const orgUserId = req.body.CompanyName.toString();
    if (!req.session.newConnect) {
        let ccp;
        if(req.session.OrgNumber==1){
            ccp = buildCCPOrg1(); 
        }
        if(req.session.OrgNumber==2){
            ccp = buildCCPOrg2(); 
        }
        else{
            res.status(500).send('Not Correct Org,Failed to connect to Fabric network');
            return;
        }
        try {
            await gateway.connect(ccp, {
				wallet,
				identity: orgUserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});
            NewNetwork = await gateway.getNetwork('carbon');
            req.session.newConnect = true;
        } catch (error) {
            console.error(`Error connecting to Fabric network: ${error}`);
            res.status(500).send('Not Correct identity,Failed to connect to Fabric network');
            return;
        }
    }
});
*/
/*-------------------------------------------------------------------*/
/*------------------------Emission Data------------------------------*/
/*-------------------------------------------------------------------*/
//CreateData 1.Parameter 2.Source 3.Emission
/*MaterialType,EmissionType,EmissionFactor,ParameterUncertainty,Resource*/
router.post('/Create/Parameter', async (req, res, next) => {
    var MaterialType=req.body.MaterialType.toString();
    var EmissionType=req.body.EmissionType.toString();
    var EmissionFactor=req.body.EmissionFactor;
    var ParameterUncertainty=req.body.ParameterUncertainty;
    var Resource=req.body.Resource.toString();
    var result = await private_blockchain.CreateParameter(network,MaterialType,EmissionType,EmissionFactor,ParameterUncertainty,Resource);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    if(result.toString()=='true'){
        res.status(200).send('Parameter Created Success!'); 
    }
    else{
        res.status(200).send('Parameter Created Fail!');
    }
});
/*Company,Source,MonitorType,ActivityUncertainty,ParameterID*/
router.post('/Create/Source', async (req, res, next) => {
    var Company=req.body.CompanyID.toString();
    var Source=req.body.SourceID.toString();
    var MonitorType=req.body.MonitorType.toString();
    var ActivityUncertainty=req.body.ActivityUncertainty;
    var ParameterID=req.body.ParameterID.toString();
    const result = await private_blockchain.CreateSource(network,Company,Source,MonitorType,ActivityUncertainty,ParameterID);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    if(result.toString()=='true'){
        res.status(200).send('Source Created Success!'); 
    }
    else{
        res.status(200).send(result);
    }
});
/*Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag*/
router.post('/Create/Emission', async (req, res, next) => {
    var Company=req.body.CompanyID.toString();
    var Source=req.body.SourceID.toString();
    var MaterialType=req.body.MaterialType.toString();
    var EmissionType=req.body.EmissionType.toString();
    var ActivityData = req.body.ActivityData;
    var EmissionFactor=req.body.EmissionFactor;
    var EmissionValue=req.body.EmissionValue;    
    var TimeTag=req.body.TimeTag.toString();
    const result = await private_blockchain.CreateEmission(network,Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    if(result.toString()=='true'){
        res.status(200).send('Emission Created Success!'); 
    }
    else{
        res.status(200).send(result);
    }
});
//ReadData 1.Parameter 2.Source 3.Emission
router.get('/Read/Parameter', async (req, res, next) => {
    var MaterialType=req.query.MaterialType.toString();
    var EmissionType=req.query.EmissionType.toString();
    const result = await private_blockchain.ReadParameter(network,MaterialType,EmissionType);
    DefaultDisconnect();
    res.send(result);
});
router.get('/Read/Source', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    if(!Company.length){
        DefaultDisconnect();
        res.status(200).send("");
    }
    else{
        const result = await private_blockchain.ReadSource(network,Company);
        DefaultDisconnect();
        res.status(200).send(result); 
    }
});
router.get('/Read/ReadEmissionByCompanyID', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    if(!Company.length){
        res.status(200).send("");
        DefaultDisconnect();
    }
    else{
        const result = await private_blockchain.ReadEmissionByCompanyID(network,Company);
        DefaultDisconnect();
        res.status(200).send(result);
    }
});
router.get('/Read/ReadEmissionBySource', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    var Source=req.query.SourceID.toString();
    const result = await private_blockchain.ReadEmissionBySource(network,Company,Source);
    DefaultDisconnect();
    res.status(200).send(result);
});
router.get('/Read/ReadSourceByDate', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    var Source=req.query.SourceID.toString();
    var ParameterID=req.query.ParameterID.toString();
    var StartDate=req.query.StartDate.toString();
    var EndDate=req.query.EndDate.toString();
    const result = await private_blockchain.ReadSourceByDate(network,Company,Source,ParameterID, StartDate, EndDate);
    DefaultDisconnect();
    res.status(200).send(result);
});
router.get('/Read/ReadSingleEmission', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    var Source=req.query.SourceID.toString();
    var MaterialType=req.query.MaterialType.toString();
    var EmissionType=req.query.EmissionType.toString();
    var TimeTag=req.query.TimeTag.toString();
    const result = await private_blockchain.ReadSingleEmission(network,Company,Source,MaterialType,EmissionType,TimeTag);
    DefaultDisconnect();
    console.log(result)
    res.send(result);
});
//Get On-site Check Spot List
router.get('/getSpotList', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    var StartDate=req.query.StartDate.toString();
    var EndDate=req.query.EndDate.toString();
    console.log(Company,StartDate,EndDate);
    const result = await private_blockchain.GetSpotList(network, Company, StartDate, EndDate);
    DefaultDisconnect();
    res.send(result);
    console.log(result);
});

/*-------------------------------------------------------------------*/
/*----------------------------Token----------------------------------*/
/*-------------------------------------------------------------------*/
//Market Administrator
router.get('/Admin/Initialize', async (req, res, next) => {
    //var name=req.body.name.toString();
    //var symbol=req.body.symbol.toString();
    let result = await private_blockchain.InitializeController(network, 'carbon', 'carbon');
    DefaultDisconnect();
    res.send(result);
});
//User 1.BindingComapny 2.GetAccountInfo (Account -> Comapny) (Company -> Account)
router.post('/User/BindCompany', async (req, res, next) => {
    var Company=req.body.CompanyID.toString();
    const result = await private_blockchain.BindCompany(network, Company);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    res.status(200).send(result);
});
router.get('/User/getBindingCompany', async (req, res, next) => {
    let result = await private_blockchain.getBindingCompanyID(network);
    DefaultDisconnect();
    res.send(result);
});
router.get('/User/getBindingAccount', async (req, res, next) => {
    if(!req.query.CompanyID){
        DefaultDisconnect();
        res.status(400).send('Please input CompanyID');
    }
    var Company=req.query.CompanyID.toString();
    const result = await private_blockchain.getBindingAccount(network,Company);
    DefaultDisconnect();
    res.send(result.toString());
});
router.get('/User/BalanceOf', async (req, res, next) => {
    var CompanyID=req.query.CompanyID.toString();
    const result = await private_blockchain.BalanceOf(network,CompanyID);
    DefaultDisconnect();
    res.send(result.toString());
});
router.get('/User/TotalSupply', async (req, res, next) => {
    const result = await private_blockchain.TotalSupply(network);
    DefaultDisconnect();
    res.send(result.toString());
});
router.post('/User/TokenTransferToMarket', async (req, res, next) => {
    var tokenId=req.body.TokenID; 
    if(!req.body.TokenID){
        DefaultDisconnect();
        res.status(400).send('Please input TokenID');
    }
    const result = await private_blockchain.TransferToMarket(network, tokenId);
    DefaultDisconnect();
        // 調用外部API
    /*await axios.get('http://140.116.234.100:1314/Event/ReConnect');*/
    res.send(result);
});

/*-------------------------------------------------------------------*/
/*----------------------------Accounting-----------------------------*/
/*-------------------------------------------------------------------*/
//Verifier Only 1.Add On-site Check Result
//StartDate: YYYY-MM-DD
//EndDate: YYYY-MM-DD
//OnSiteData: {Source: string,
//             ParameterID: string,
//             EmissionValue: number}
router.post('/Verifier/AddOnsiteEmission', async (req, res, next) => {
    var Company=req.body.CompanyID.toString();
    console.log(Company);
    var StartDate=req.body.StartDate.toString();
    var EndDate=req.body.EndDate.toString(); 
    var OnSiteData = req.body.OnSiteData;
    console.log(OnSiteData); 
    const result = await private_blockchain.AddOnsiteData(network, Company, StartDate, EndDate, OnSiteData);
    console.log(result);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    // await axios.post('http://140.116.234.100:1314/VerifiedBuyerNFT');
    res.send(result);
});
//User 1.Calculate Company Total Emission 2. Get Accounting History
router.get('/User/getCompanyEmissionValue', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    if(!Company.length){
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
        res.status(200).send("");
    }
    else{
        var StartDate=req.query.StartDate.toString();
        var EndDate=req.query.EndDate.toString();
        if (StartDate=="")
        {
            StartDate="0000";
        }
        if (EndDate=="")
        {
            EndDate="9999";
        }
        const result = await private_blockchain.CompanyEmissionValue(network,Company,StartDate,EndDate);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
        res.status(200).send(result);
    }
});
router.get('/User/getCompanyAccountingHistory', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    const result = await private_blockchain.CompanyAccountingHistory(network,Company);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    res.send(result);
});
router.get('/User/getCompanyAccountingHistoryByDate', async (req, res, next) => {
    var Company=req.query.CompanyID.toString();
    var StartDate=req.query.StartDate.toString();
    var EndDate=req.query.EndDate.toString();
    const result = await private_blockchain.CompanyAccountingHistoryByDate(network,Company,StartDate,EndDate);
    DefaultDisconnect();
        // 調用外部API
    //await axios.get('http://140.116.234.100:1314/Event/ReConnect');
    res.send(result);
});

module.exports = router;
