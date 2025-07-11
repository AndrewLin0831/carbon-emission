"use strict";
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = { enumerable: true, get: function () { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
  o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*-------------------------------------------------------------------*/
/*-------------------------Constant----------------------------------*/
/*-------------------------------------------------------------------*/
const grpc = __importStar(require("@grpc/grpc-js"));
const fabric_gateway_1 = require("@hyperledger/fabric-gateway");
const fabric_protos = require('@hyperledger/fabric-protos');
const crypto = __importStar(require("crypto"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const util_1 = require("util");
const channelName = envOrDefault('CHANNEL_NAME', 'carbon');
var asn = require('asn1.js');
//five chaincode
const EmissionTemplate = envOrDefault('CHAINCODE_NAME', 'EmissionTemplate');
const ParameterStorage = envOrDefault('CHAINCODE_NAME', 'ParameterStorage');
const SourceStorage = envOrDefault('CHAINCODE_NAME', 'SourceStorage');
const EmissionVerify = envOrDefault('CHAINCODE_NAME', 'EmissionVerify');
const Certificate = envOrDefault('CHAINCODE_NAME', 'Certificate');
const Accounting = envOrDefault('CHAINCODE_NAME', 'Accounting');

const mspId = envOrDefault('MSP_ID', 'Org1MSP');
// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));
// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));
// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'));
// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));
// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');
// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');
const utf8Decoder = new util_1.TextDecoder();

/*-------------------------------------------------------------------*/
/*------------------------EmissioN Data------------------------------*/
/*-------------------------------------------------------------------*/
//CreateData 1.Parameter 2.Source 3.Emission
async function CreateParameter(network, MaterialType, EmissionType, EmissionFactor, ParameterUncertainty, Resource) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(ParameterStorage);
    //Acting
    console.log('\n--> Create Parameter');
    result = await contract.submitTransaction("CreateParameter", MaterialType, EmissionType, EmissionFactor, ParameterUncertainty, Resource);
    console.log(Buffer.from(result).toString('utf-8'));
    console.log("-----------------------------------------------------");
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function CreateSource(network, Company, Source, MonitorType, ActivityUncertainty, ParameterID) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(SourceStorage);
    //Acting
    console.log('\n--> Create Source');
    result = await contract.submitTransaction("CreateSource", Company, Source, MonitorType, ActivityUncertainty, ParameterID);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function CreateEmission(network, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(EmissionVerify);
    //Acting
    console.log('\n--> Create Emission');
    result = await contract.submitTransaction("CreateEmission", Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

//ReadData 1.Parameter 2.Source 3.Emission
async function ReadParameter(network, MaterialType, EmissionType) { //By EmissionType
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      ParameterStorage);
    //Acting
    console.log('\n--> Read Parameter');
    result = await contract.evaluateTransaction("EmissionTypeReadParameter", MaterialType, EmissionType);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function ReadSource(network, Company) { //By CompanyID
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      SourceStorage);
    //Acting
    console.log('\n--> Read Source');
    result = await contract.evaluateTransaction("CompanyIDReadSource", Company);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function ReadEmissionByCompanyID(network, Company) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      EmissionVerify);
    //Acting
    console.log('\n--> ReadEmission by CompanyID');
    result = await contract.evaluateTransaction("CompanyReadEmission", Company);
    console.log(Buffer.from(result).toString('utf-8'));
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function ReadEmissionBySource(network, Company, Source) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      EmissionVerify);
    //Acting
    console.log('\n--> Read Emission by Source');
    result = await contract.evaluateTransaction("SourceReadEmission", Company, Source);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*  
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}
async function ReadSourceByDate(network, Company, Source, ParameterID, StartDate, EndDate) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      EmissionVerify);
    //Acting
    console.log('\n--> Read Emission by Source and Date');
    result = await contract.evaluateTransaction("SourceInfoByDate", Company, Source, ParameterID, StartDate, EndDate);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function ReadSingleEmission(network, Company, Source, MaterialType, EmissionType, TimeTag) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      EmissionVerify);
    //Acting
    console.log('\n--> Read Single Emission');
    result = await contract.evaluateTransaction("ReadSingleEmission", Company, Source, MaterialType, EmissionType, TimeTag);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

//Get On-site Check Spot List
async function GetSpotList(network, Company, StartDate, EndDate) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      EmissionVerify);
    //Acting
    console.log('\n--> Get On-site Check Spot List');
    result = await contract.evaluateTransaction("getSpotList", Company, StartDate, EndDate);
    console.log(result);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

/*-------------------------------------------------------------------*/
/*----------------------------Token----------------------------------*/
/*-------------------------------------------------------------------*/
//Market Administrator
async function InitializeController(network, name, symbol) {
  var err = null;
  var result = null;
  try {
    //connect network
    const contract = await network.getContract(Certificate);
    //Acting
    console.log('\n--> Initialize Certificate Controller');
    result = await contract.submitTransaction("Initialize", name, symbol);
    return Buffer.from(result).toString('utf-8');

    return result.toString();
  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  
  //return result
  if(result != null)
    return result.toString();
  if(err.details!='')
    return err.details;
  else if(err.cause.details!='')
    return err.cause.details;
  else if(err.response!='')
    return err.response;
  else
    return err.toString();*/
}

//Account Function 1.BindingComapny 2.GetAccountInfo (Account -> Comapny) (Company -> Account)
async function BindCompany(network, Company) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      Certificate);
    //Acting
    console.log('\n--> Account Bind Company ID');
    result = await contract.submitTransaction("CompanyBinding", Company);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function getBindingCompanyID(network) {
  try {
    //const mygateway = gateway;
    //const network = mygateway.getNetwork('carbon');
    const contract = await network.getContract(Certificate);
    //connect network
    //const contract = await network.getContract(Certificate);
    //Acting
    console.log('\n--> Get Binding Company');
    let result = await contract.evaluateTransaction('getCompany');
    return Buffer.from(result).toString('utf-8');

    return result.toString();
  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result
}

async function getBindingAccount(network, Company) {
  var err = null;
  var result = null;
  try {
    const contract = await network.getContract(
      Certificate);
    //Acting
    console.log('\n--> Get Binding Account');
    result = await contract.evaluateTransaction("getCompanyAccount", Company);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*  
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}
async function BalanceOf(network, Company) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      Certificate);
    //Acting
    console.log('\n--> Get BalanceOf');
    result = await contract.evaluateTransaction("BalanceOf", Company);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }

}
async function TotalSupply(network) {
  var err = null;
  var result = null;
  try {
    //connect network
    const contract = await network.getContract(
      Certificate);
    //Acting
    console.log('\n--> TotalSupply');
    result = await contract.evaluateTransaction("TotalSupply");
    console.log(Buffer.from(result).toString('utf-8'))
    return result;
    //return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }

}
//Transfer to Public Blockchain(Burn NFT)
async function TransferToMarket(network, tokenId) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      Certificate);
    //Acting
    console.log('\n--> Get Burn');
    result = await contract.submitTransaction("Burn", tokenId);
    console.log('\n--> Burn Success');
    return Buffer.from(result).toString('utf-8');
  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}


/*-------------------------------------------------------------------*/
/*----------------------------Accounting-----------------------------*/
/*-------------------------------------------------------------------*/
//Verifier Only 1.Add On-site Check Result
//StartDate: YYYY-MM-DD
//EndDate: YYYY-MM-DD
//OnSiteData: {Source: string,
//             ParameterID: string,
//             EmissionValue: number}
async function AddOnsiteData(network, Company, StartDate, EndDate, OnSiteData) {
  try {
      // 顯示輸入參數
      await displayInputParameters();

      // 連接到合約
      const contract = await network.getContract(Accounting);
      console.log('\n--> Verifier Add On-site Check Emission Data');
      console.log(Company);
      console.log(StartDate);
      console.log(EndDate);
      console.log(OnSiteData);
      // 提交交易
      const result = await contract.submitTransaction("AddOnsiteResult", Company, StartDate, EndDate, OnSiteData);
      console.log(result);
      // 將結果轉為 UTF-8 格式返回
      const decodedResult = Buffer.from(result).toString('utf-8');
      console.log('Transaction successful, result:', decodedResult);
      return decodedResult;

  } catch (error) {
      // 錯誤處理
      console.error('Error in AddOnsiteData:', {
          message: error.message,
          stack: error.stack,
      });
      return 'Failed to process AddOnsiteData. Please try again.';
  }

  /*
  // 如果需要清理網路連線，可以在這裡執行
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
}
//User 1.Calculate Company Total Emission 2. Get Accounting History
async function CompanyEmissionValue(network, Company, StartDate, EndDate) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(Accounting);
    //Acting
    console.log('\n--> Calculate Company Total Emission Store in Blockchain');
    result = await contract.evaluateTransaction("StorageTotalEmission", Company, StartDate, EndDate);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function CompanyAccountingHistory(network, Company) {
  var err = null;
  var result = null;
  try {
    await displayInputParameters();
    //connect network
    const contract = await network.getContract(
      Accounting);
    //Acting
    console.log('\n--> Get Company Accounting History');
    result = await contract.submitTransaction("ReadCompanyAccountingHistory", Company);
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*  
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result

}

async function CompanyAccountingHistoryByDate(network, Company, StartDate, EndDate) {
  let err = null;
  var result = null;
  try {
    //connect network
    const contract = await network.getContract(Accounting);
    //Acting
    console.log('\n--> Get Company Accounting History by Date');
    result = await contract.submitTransaction("ReadCompanyAccountingHistoryByDate", Company, StartDate, EndDate);
    //return Buffer.from(result).toString('utf-8');
    return Buffer.from(result).toString('utf-8');

  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  /*
  //Disconnect network
  await stopConnect(gateway, client);
  console.log('*** stopConnect successfully');
  */
  //return result
}
/*-------------------------------------------------------------------*/
/*----------------------------Event----------------------------------*/
/*-------------------------------------------------------------------*/
async function AddEvent(network) {
  let contract1;
  let contract2;
  try {
    contract1 = await network.getContract(Certificate);
    contract2 = await network.getContract(Accounting);
    //console.log(chaincodeName+"~"+eventName);
  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  const listener1 = await contract1.addContractListener(async (event) => {
    //if (event.eventName === eventName) {
      console.log(`Received event from ${'Certificate'}: ${event.eventName} with payload: ${event.payload.toString()}`);
      //callback(event);
      logEventToFile(event);
    //}
  });
  const listener2 = await contract2.addContractListener(async (event) => {
    //if (event.eventName === eventName) {
      console.log(`Received event from ${'Accounting'}: ${event.eventName} with payload: ${event.payload.toString()}`);
      //callback(event);
      logEventToFile(event);
    //}
  });
  console.log(listener1);
  console.log(listener2);
  return listener1;
}
async function AddBlockEvent(network) {
  const listener = await network.addBlockListener(async (block) => {
      console.log(`Received event from Block : ${JSON.stringify(block)}`);
      //callback(event);
      const fileName = `block.log`;
      const filePath = path.join(__dirname+'/../', 'logs', fileName);

      /*let headerAsn = asn.define('headerAsn', function() {
      this.seq().obj(
      this.key('Number').int(),
      this.key('PreviousHash').octstr(),
      this.key('DataHash').octstr()
      );
      });
      let output = headerAsn.encode({Number: parseInt(block.blockNumber),PreviousHash: block.blockData.header.previous_hash.toString('hex'),
      DataHash: block.blockData.header.data_hash.toString('hex')
      }, 'der');
      const hash = crypto.createHash('sha256');
      hash.update(output);
      const digest = hash.digest('hex');*/
      const logEntry = `${new Date().toISOString()} - blockNumber: ${block.blockNumber},previousHash: ${block.blockData.header.previous_hash.toString('hex')},currentHash: ${block.blockData.header.data_hash.toString('hex')}\n`;

        // 確保目錄存在
        fs_1.mkdir(path.join(__dirname+'/../', 'logs'), { recursive: true }, (err) => {
          if (err) {
              console.error("Failed to create log directory:", err);
              return;
          }

          // 將日誌寫入對應的檔案
          fs_1.appendFile(filePath, logEntry, (err) => {
              if (err) {
                  console.error("Failed to log event to file:", err);
              } else {
                  console.log(`Event logged to file ${fileName}:`, logEntry);
              }
          });
      });
      });
  return listener;
}
function logEventToFile(event) {
  const fileName = `${event.eventName.toLowerCase().replace(/\s+/g, '_')}.log`;
  const filePath = path.join(__dirname+'/../', 'logs', fileName);
  const logEntry = `${new Date().toISOString()} - Event: ${event.eventName}, Payload: ${event.payload.toString()}\n`;

    // 確保目錄存在
    fs_1.mkdir(path.join(__dirname+'/../', 'logs'), { recursive: true }, (err) => {
      if (err) {
          console.error("Failed to create log directory:", err);
          return;
      }

      // 將日誌寫入對應的檔案
      fs_1.appendFile(filePath, logEntry, (err) => {
          if (err) {
              console.error("Failed to log event to file:", err);
          } else {
              console.log(`Event logged to file ${fileName}:`, logEntry);
          }
      });
  });
}

async function DeleteEvent(network, chaincodeName, listener) {
  let contract;
  try {
    contract = await network.getContract(chaincodeName);
  }
  catch (error) {
    //err catch
    console.log(error);
    return error.toString();
  }
  await contract.removeContractListener(listener);
}

/*-------------------------------------------------------------------*/
/*----------------------------Network--------------------------------*/
/*-------------------------------------------------------------------*/
//Default Function
async function Connect(chaincodeName) {
  const client = await newGrpcConnection();
  const gateway = (0, fabric_gateway_1.connect)({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    // Default timeouts for different gRPC calls
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });
  // Get a network instance representing the channel where the smart contract is deployed.
  const contract = await network.getContract(chaincodeName);
  return contract;
}
async function ConnectGateway() {
  const client = await newGrpcConnection();
  const gateway = (0, fabric_gateway_1.connect)({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    // Default timeouts for different gRPC calls
    evaluateOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    endorseOptions: () => {
      return { deadline: Date.now() + 15000 }; // 15 seconds
    },
    submitOptions: () => {
      return { deadline: Date.now() + 5000 }; // 5 seconds
    },
    commitStatusOptions: () => {
      return { deadline: Date.now() + 60000 }; // 1 minute
    },
  });
  return gateway;
}

async function stopConnect(gateway, client) {
  gateway.close();
  client.close();
}
async function newGrpcConnection() {
  const tlsRootCert = await fs_1.promises.readFile(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
  return new grpc.Client(peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': peerHostAlias,
  });
}
async function newIdentity() {
  const credentials = await fs_1.promises.readFile(certPath);
  return { mspId, credentials };
}
async function newSigner() {
  const files = await fs_1.promises.readdir(keyDirectoryPath);
  const keyPath = path.resolve(keyDirectoryPath, files[0]);
  const privateKeyPem = await fs_1.promises.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return fabric_gateway_1.signers.newPrivateKeySigner(privateKey);
}
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
  return process.env[key] || defaultValue;
}
/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
  console.log(`channelName:       ${channelName}`);
}
//export
module.exports = {
  CreateParameter,
  CreateSource,
  CreateEmission,
  ReadParameter,
  ReadSource,
  ReadEmissionByCompanyID,
  ReadEmissionBySource,
  ReadSourceByDate,
  ReadSingleEmission,
  GetSpotList,
  InitializeController,
  BindCompany,
  getBindingCompanyID,
  getBindingAccount,
  TransferToMarket,
  AddOnsiteData,
  CompanyEmissionValue,
  CompanyAccountingHistory,
  CompanyAccountingHistoryByDate,
  AddEvent,
  DeleteEvent,
  ConnectGateway,
  Connect,
  BalanceOf,
  AddBlockEvent,
  TotalSupply
};
//# sourceMappingURL=app.js.map