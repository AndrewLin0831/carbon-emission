const Web3 = require('web3');
const axios = require('axios');
//const web3 = new Web3('https://patient-soft-diamond.matic-amoy.quiknode.pro/0b9ea5941b20b6fc3109252a732bfc5889ac07fe/');
//const eth_web3 = new Web3("https://eth.getblock.io/94cc53b0-ae83-40aa-ae57-73d024dce3be/mainnet/");
const web3 = new Web3('wss://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954');
const web3_http = new Web3('https://omniscient-bitter-tree.matic-amoy.quiknode.pro/8e46b9c5edb7cbbaface3c4bf2476dafb9e03954');
const iMRCNFTAddress = '0xe37Bc9424ef916Fc6643Ff5542ccAe75cAEFAF1d';
const CarbonNFTAddress = '0x348D80173Ad17e5953c5493B31307Ba420FECE9f';
const MarketAddress = '0x7A34d2E78E5186F593e74a0f5A40Fe1fa1F82073';
var iMRCNFTJson = require('../json/iMRCNFT.json');
var CarbonNFTJson = require('../json/CarbonNFT.json');
var MarketJson = require('../json/Market.json');
const iMRCNFTContract = new web3_http.eth.Contract(iMRCNFTJson.abi,iMRCNFTAddress);
const CarbonNFTContract = new web3_http.eth.Contract(CarbonNFTJson.abi,CarbonNFTAddress);
const MarketContract = new web3_http.eth.Contract(MarketJson.abi,MarketAddress);
const express = require('express');
const internal = require('stream');
const router = express.Router();
let addressList=[];
//main page
router.get('/', function(req,res){
    return res.render('Trading', { title: 'Trading Explorer' });
  });
router.get('/testnet', async function (req, res) {
    const element = Common.custom({
        name: 'Amoy',
        chainId: 80002,
        networkId: 80002,
      });
    res.send(element);
});
router.get('/AddressStorage', async function (req, res) {
    let address = req.query.Address.toString();
    let find =false;
    for (let i = 0; i < addressList.length; i++) {
        if (addressList[i][0] === address) {
            // 找到相同的a值，返回false表示不能添加
            find = true;
            break;
        }
    }
    if(find==false){
        let CompanyID;
        await axios.get('http://140.116.234.100:1314/trading/iMRCNFT/getCompanyID?Address='+address)
        .then(response => {
            CompanyID = response.data;
          })
          .catch(error => {
            console.error('Error during fetching:', error);
          });
        addressList.push([address,CompanyID]);   
        console.log([address,CompanyID]);
    }
    res.send(addressList.toString());
});
router.get('/getAddress', async function (req, res) {
    let CompanyID = req.query.CompanyID.toString();
    let result = false;
    for (let i = 0; i < addressList.length; i++) {
        if (addressList[i][1] === CompanyID) {
            // 找到相同的a值，返回false表示不能添加
            result = addressList[i][0];
            break;
        }
    }
    res.send(result);
    return 0;
});
router.get('/Contracts', async function (req, res) {
    const Contracts = req.query.Contract.toString();
    let result;
    switch(Contracts){
        case "iMRCNFTContract":
            result = [iMRCNFTAddress,iMRCNFTJson];
            break;
        case "CarbonNFTContract":
            result = [CarbonNFTAddress,CarbonNFTJson];
            break;
        case "MarketContract":
            result = [MarketAddress,MarketJson];
            break;
        default:
            result = false;        
    }
    res.send(result);
});
//Data Read
/*-------------------------------------------------------------------*/
/*----------------------------iMRC NFT-------------------------------*/
/*-------------------------------------------------------------------*/
router.get('/iMRCNFT/balanceOf', async function (req, res) {
    const Address = req.query.Address.toString();
    await axios.get('http://140.116.234.100:1314/trading/AddressStorage?Address='+Address);
    const balanceOf = await iMRCNFTContract.methods.balanceOf(Address).call();
    res.send(balanceOf);
});
router.get('/iMRCNFT/getCompanyID', async function (req, res) {
    const address = req.query.Address.toString();
    const CompanyID = await iMRCNFTContract.methods.getCompanyId(address).call();
    res.send(CompanyID[0]);
    return CompanyID[0];
});
router.get('/iMRCNFT/totalSupply', async function (req, res) {
    const NFTInfo = await iMRCNFTContract.methods.BuyerNFTtotalSupply().call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/name', async function (req, res) {
    const NFTInfo = await iMRCNFTContract.methods.name().call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/symbol', async function (req, res) {
    const NFTInfo = await iMRCNFTContract.methods.symbol().call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/NFTURI', async function (req, res) {
    const NFTInfo = await iMRCNFTContract.methods.BuyerURI().call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/NFTInfo', async function (req, res) {
    const NFTID = req.query.TokenID;
    const NFTInfo = await iMRCNFTContract.methods.BuyerNFTList(NFTID).call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/ownOf', async function (req, res) {
    const NFTID = req.query.TokenID;
    const NFTInfo = await iMRCNFTContract.methods.ownOf(NFTID).call();
    res.send(NFTInfo);
});
router.get('/iMRCNFT/CompanyInfo', async function (req, res) {
    const CompanyID = req.query.CompanyID.toString();
    const CompanyInfo = await iMRCNFTContract.methods.CompanyDataList(CompanyID).call();
    res.send(CompanyInfo);
});
router.get('/iMRCNFT/BindingCompany', async function (req, res) {
    const aimAddress = req.query.Address.toString();
    const BindingCompany = await iMRCNFTContract.methods.EnrollmentList(aimAddress).call();
    res.status(200).send(BindingCompany);
});
router.get('/iMRCNFT/YourNFTList', async function (req, res) {
    let ResultList=[];
    const aimAddress = req.query.Address.toString();
    await axios.get('http://140.116.234.100:1314/Event/getEventLogs?EventID=buyernftmint')
        .then(response => {            
            response = response.data.split('\n');
            response.splice(-1);  
            let processedCount = 0;
            response.forEach(async function(event) {
                event = event.split("Payload:")[1];
                event = JSON.parse(event);
                console.log(event.returnValues.sender);
                if(event.returnValues.sender.toLowerCase()==aimAddress){
                    const NFTInfo = await iMRCNFTContract.methods.BuyerNFTList(event.returnValues.tokenId).call();
                    //ResultList.push({tokenID: event.returnValues.tokenId,carbonAmount: (NFTInfo.carbonAmount/(10**18)).toFixed(3),errorRate: (NFTInfo.errorRate/(10**18)).toFixed(3),reputation: (NFTInfo.reputation/(10**18)).toFixed(3),verifier: NFTInfo.verifier});
                    ResultList.push({tokenID: event.returnValues.tokenId,carbonAmount: (NFTInfo.carbonAmount/(10**18)).toFixed(3),errorRate: (NFTInfo.errorRate/(10**18)).toFixed(3),reputation: (NFTInfo.reputation/(10**18)).toFixed(3),verifier: "0x82aDbeE1CF30480d1dfE3CF192075937a540273c"});
                }
                processedCount++;
                if(processedCount==response.length){
                    res.status(200).send(ResultList);
                }
            });
          })
          .catch(error => {
            console.error('Error during fetching:', error);
            res.status(400).send(error);
          });
    //const BindingCompany = await iMRCNFTContract.methods.EnrollmentList(aimAddress).call();
});
/*-------------------------------------------------------------------*/
/*----------------------------Carbon NFT-----------------------------*/
/*-------------------------------------------------------------------*/
router.get('/CarbonNFT/balanceOf', async function (req, res) {
    const Address = req.query.Address.toString();
    const balanceOf = await CarbonNFTContract.methods.balanceOf(Address).call();
    res.send(balanceOf);
});
router.get('/CarbonNFT/totalSupply', async function (req, res) {
    const NFTInfo = await CarbonNFTContract.methods.SellerNFTtotalSupply().call();
    res.send(NFTInfo);
});
router.get('/CarbonNFT/name', async function (req, res) {
    const NFTInfo = await CarbonNFTContract.methods.name().call();
    res.send(NFTInfo);
});
router.get('/CarbonNFT/symbol', async function (req, res) {
    const NFTInfo = await CarbonNFTContract.methods.symbol().call();
    res.send(NFTInfo);
});
router.get('/CarbonNFT/NFTURI', async function (req, res) {
    const NFTInfo = await CarbonNFTContract.methods.SellerURI().call();
    res.send(NFTInfo);
});
router.get('/CarbonNFT/NFTInfo', async function (req, res) {
    const NFTID = req.query.TokenID;
    const NFTInfo = await CarbonNFTContract.methods.SellerNFTList(NFTID).call();
    res.send(NFTInfo);
});
/*-------------------------------------------------------------------*/
/*----------------------------Market---------------------------------*/
/*-------------------------------------------------------------------*/
router.get('/Market/DemandCount', async function (req, res) {
    const count = await MarketContract.methods.getDemandCount().call();
    res.send(count);
});
router.get('/Market/SupplyCount', async function (req, res) {
    const count = await MarketContract.methods.getSupplyCount().call();
    res.send(count);
});
router.get('/Market/DemandList', async function (req, res) {
    //get Nnumbers of demand
    const count = await MarketContract.methods.getDemandCount().call();
    //get each demand info
    var List =[];
    for(i=0;i<count;i++){
        const DemandInfo = await MarketContract.methods.DemandList(i).call();
        List.push({"NFTID": DemandInfo.NFTID,"Price(MATIC)": (DemandInfo.price/(10**18)).toFixed(5),"Rank": (DemandInfo.rank/(10**18)).toFixed(5),"Demander": DemandInfo.demander,"CarbonAmount(tCO2e)": (DemandInfo.carbonAmount/(10**18)).toFixed(3),"Reputation": (DemandInfo.reputation/(10**18)).toFixed(3)});
    }
    res.send(List);
});
router.get('/Market/SupplyList', async function (req, res) {
    //get Nnumbers of Supply
    const count = await MarketContract.methods.getSupplyCount().call();
    //get each Supply info
    var List =[];
    for(i=0;i<count;i++){
        const SupplyInfo = await MarketContract.methods.SupplyList(i).call();
        List.push({"NFTID": SupplyInfo.NFTID,"Price(MATIC)": (SupplyInfo.price/(10**18)).toFixed(5),"Rank": (SupplyInfo.rank/(10**18)).toFixed(5),"Supplier": SupplyInfo.supplier,"CarbonAmount(tCO2e)": (SupplyInfo.carbonAmount/(10**18)).toFixed(3)});
    }
    res.send(List);
});
router.get('/Market/UnFinishMatchingList', async function (req, res) {
    let List =[];
    const remain = await MarketContract.methods.getRemainMatching().call();
    for(let i=0;i<remain.length;i++){
        List.push({Amount:(remain[0][0][0][4]/(10**18)).toFixed(3),Price:(remain[0][0][0][5]/(10**18)),BuyerNFTID:remain[0][0][0][2],SellerNFTID:remain[0][0][0][3],Buyer: remain[0][0][0][0],Seller: remain[0][0][0][1],"Receive Payment": remain[0][1]});
    }
    res.send(List);
});
/*-------------------------------------------------------------------*/
/*----------------------------Event----------------------------------*/
/*-------------------------------------------------------------------*/
//Total Event
//  BuyerNFTMint,BuyerNFTUpdated,BuyerNFTStatus
//  SellerNFTMint,SellerNFTUpdated,SellerNFTStatus
//  NewDemand,NewSupply,NewMatching,PaymentReceived
// Default Method
/*router.post('/Event/StartListening', (req, res) => {
    const eventName = req.body.EventName;  // 從請求中獲取事件名稱
    let contract = req.body.Contract;
    switch(contract){
        case "iMRCNFT":
            contract=iMRCNFTContract;
        case "CarbonNFT":
            contract = CarbonNFTContract;
        case "Market":
            contract = MarketContract;
        default:
            res.status(400).send('Not Find Contract!');
    }
    if (eventSubscriptions[eventName]) {
        return res.status(400).send(`Already listening to ${eventName}`);
    }
    eventSubscriptions[eventName] = contract.events[eventName]()
        .on('data', (event) => {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          })
        .on('error', console.error);

    res.send(`Started listening to ${eventName}`);
});

// 停止事件監聽
router.post('/Event/StopListening', (req, res) => {
    const eventName = req.body.eventName;  // 從請求中獲取事件名稱

    if (eventSubscriptions[eventName]) {
        eventSubscriptions[eventName].unsubscribe((error, success) => {
            if (success) {
                console.log(`Stopped listening to ${eventName}`);
                delete eventSubscriptions[eventName];
                res.send(`Stopped listening to ${eventName}`);
            } else {
                console.error(`Error unsubscribing from ${eventName}:`, error);
                res.status(500).send(`Error unsubscribing from ${eventName}`);
            }
        });
    } else {
        res.status(400).send(`Not currently listening to ${eventName}`);
    }
});*/
module.exports = router;
