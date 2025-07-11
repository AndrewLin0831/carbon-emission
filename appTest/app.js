/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'carbontest';
const chaincodeName1 = 'emission_registry';
const chaincodeName2 = 'emission_storeSource';
const chaincodeName3 = 'emission_storeEmission';
const chaincodeName4 = 'integration41';
const chaincodeName5 = 'reputation41';
const chaincodeName6 = 'storage40';
const walletPath = path.join(__dirname, 'wallet');

const orgUserId = 'TSMC02';
const caHostName = 'ca.org1.example.com';
//¥u¯à¥Îorg.department
const affiliation = 'org1.department2';
const mspOrg = 'Org1MSP';
const adminUserId = 'admin';

const adminUserAccount = 'admin';
const adminUserPasswd = 'adminpw';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		const ccp = buildCCPOrg1();
    //const ccp = buildCCPOrg2();
    
    const caClient = buildCAClient(FabricCAServices, ccp, caHostName);
    
		const wallet = await buildWallet(Wallets, walletPath);

		await enrollAdmin(caClient, wallet, mspOrg, adminUserId, adminUserAccount, adminUserPasswd);

    await registerAndEnrollUser(caClient, wallet, mspOrg, orgUserId, affiliation, adminUserId);
    
		const gateway = new Gateway();

		try {
			await gateway.connect(ccp, {
				wallet,
				identity: orgUserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract1 = network.getContract(chaincodeName1);
      const contract2 = network.getContract(chaincodeName2);
      const contract3 = network.getContract(chaincodeName3);
      const contract4 = network.getContract(chaincodeName4);
      const contract5 = network.getContract(chaincodeName5);
      const contract6 = network.getContract(chaincodeName6);
      let sender,result; 
/*      console.log('\n--> Create Source');
			await contract6.submitTransaction('CreateSource','P03','CO2','0.502','Government','None');
			console.log('*** Result: success');
			result = await contract6.evaluateTransaction('UpdateSource1','P03','CO2','5.02','0.5');
			console.log('*** Result: success');
      console.log(result.toString());
			result = await contract6.evaluateTransaction('UpdateSource2','P03','CO2','5.02','0.5');
			console.log('*** Result: success');
      console.log(result.toString());*/
/*		  console.log('\n--> Create Source');
      await contract6.submitTransaction('CreateSource','P01','CO2','0.502','Government','None');
			console.log('*** Result: success');
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P01','CO2');
      console.log(result.toString());
      result = await contract6.submitTransaction('UpdateSource','P01','CO2','5.02','0.5');
			console.log('*** Result: success');
      console.log(result.toString());
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P01','CO2');
      console.log(result.toString());*/
/*      console.log('\n--> Create Source');
			await contract6.submitTransaction('CreateSource','P101','CO2','0.502','IPCC','None');
			console.log('*** Result: success');
      result=await contract5.submitTransaction('Reputation','P101','CO2','2024-01-11 17:28:49.000');
			console.log('*** Result: success');
      console.log(result.toString());*/   

      //SourceID, EmissionType, ParameterValue, ParameterType, Notes
      console.log('\n--> Create Source');
			await contract6.submitTransaction('CreateSource','P305','CO2','0.502','Government','None');
			console.log('*** Result: success');

      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());
 
      //SourceID, EmissionType, ActivityData, TimeTag
      console.log('\n--> Input Emission');
			await contract4.submitTransaction('InputEmission','P305','CO2','10.04','2024-01-11 17:28:50.000');
			console.log('*** Result: success');
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());
      console.log('\n--> Input Emission');
			await contract4.submitTransaction('InputEmission','P305','CO2','10.04','2024-01-11 17:28:50.001');
			console.log('*** Result: success');
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());
      console.log('\n--> Input Emission');
			await contract4.submitTransaction('InputEmission','P305','CO2','10.04','2024-01-11 17:28:50.002');
			console.log('*** Result: success'); 
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());
      console.log('\n--> Input Emission');
			await contract4.submitTransaction('InputEmission','P305','CO2','10.04','2024-01-11 17:28:50.003');
			console.log('*** Result: success'); 
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());   
      //SourceID, EmissionType, TimeTag
      console.log('\n--> Input Correction');
			await contract6.submitTransaction('CreateCorrection','P305','CO2','2024-01-11 17:28:50.003');
			console.log('*** Result: success');
      //SourceID, EmissionType, ActivityData, TimeTag
      console.log('\n--> Input Emission');
			await contract4.submitTransaction('InputEmission','P305','CO2','10.04','2024-01-11 17:28:50.004');
			console.log('*** Result: success');
      console.log('\n--> Get Source Info');
			result = await contract6.evaluateTransaction('ReadSource','P305','CO2');
      console.log(result.toString());


/*
      console.log('\n--> Create Source');
			await contract6.submitTransaction('CreateSource','P02','CO2','0.502','Government','None');
			console.log('*** Result: success');
			result=await contract5.submitTransaction('Reputation','P02','CO2','2024-01-11 17:28:48.005');
			console.log('*** Result: success');
      console.log(result.toString());
      result=await contract6.submitTransaction('CreateEmission','P02','CO2',5.02,'2024-01-11 17:28:48.000');
			console.log('*** Result: success');
      console.log(result.toString());
			result=await contract5.submitTransaction('Reputation','P02','CO2','2024-01-11 17:28:48.005');
			console.log('*** Result: success');
      console.log(result.toString());
*/
/*
      //test registry
			console.log('\n--> Account Registry');
			await contract1.submitTransaction('CreateCompany', 'TSMC','22099131','03-5636688','invest@imrc.com');
			console.log('*** Result: success');
      console.log('\n--> Get Sender');
			result = await contract1.evaluateTransaction('GetMsgSender');
      console.log(result.toString());
      
			console.log('\n--> Read Account Info');
			sender = await contract1.evaluateTransaction('GetMsgSender');
      result = await contract1.evaluateTransaction('ReadAddress',sender);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      
			console.log('\n--> Read Company Info');
      result = await contract1.evaluateTransaction('ReadCompany','22099131');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      
      console.log('\n--> Update CompanyInfo');
			await contract1.submitTransaction('UpdateRegistry', '22099131','03-5636688','iMRC@gmail.com');
			result = await contract1.evaluateTransaction('ReadCompany','22099131');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      
      
      //test storeSource
      console.log('\n--> Create Source Success');
			await contract2.submitTransaction('CreateSource', '22099131','P01','M01','eletric','3','eletric','No','No','CO2');
			console.log('*** Result: success');
      console.log('\n--> Check Authority');
      result = await contract2.submitTransaction('CheckRegistry', '22099133');
      console.log(result.toString());
      try {
          console.log('\n--> Create Source Fail');
			    await contract2.submitTransaction('CreateSource', '22099133','P01','M01','eletric','3','eletric','No','No','CO2');
      }
      catch(error) {
          console.log(error);
      }
      console.log('\n--> Update Source Success');
			await contract2.submitTransaction('UpdateSource', '22099131','P01','M01','eletric','3','eletric','Yes','No','CO2');
      result = await contract2.submitTransaction('ReadSource', '22099131','M01');
			console.log(result.toString());
			console.log('*** Result: success');
      try {
          console.log('\n--> Update Source Fail');
			    await contract2.submitTransaction('UpdateSource', '22099131','P01','M99','eletric','3','eletric','No','No','CO2');
      }
      catch(error) {
          console.log(error);
      }
      console.log('\n--> Read Single Source');
			result = await contract2.evaluateTransaction('ReadSource', '22099131','M01');
      console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      console.log('\n--> Read Company Total Source');
      await contract2.submitTransaction('CreateSource', '22099131','P01','M02','eletric','3','eletric','No','No','CO2');
      result = await contract2.evaluateTransaction('ReadCompanySource', '22099131');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      
      
      //test storeEmission
      result = await contract3.evaluateTransaction('GetMsgSender');
      console.log(result.toString());
      console.log('\n--> GetCompanyId');
      result = await contract3.evaluateTransaction('GetCompanyId',result.toString());
      console.log(result.toString());
      
      try {
          console.log('\n--> Create  Emission(OK)');
    			result =await contract3.submitTransaction('CreateEmission','M01', '10', '2023-10-25 18:29:10.000');
    			console.log(result.toString());
      }
      catch(error) {
          console.log(error);
      }
      
      try {
          console.log('\n--> Create  Emission(AuthorityError)');
    			result =await contract3.submitTransaction('CreateEmission','M100', '5', '2023-10-25 17:29:10.000');
    			console.log(result.toString());
      }
      catch(error) {
          console.log(error);
      }
      try {
          console.log('\n--> Create  Emission(SameKeyError)');
    			result =await contract3.submitTransaction('CreateEmission','M01', '5', '2023-10-25 17:29:10.000');
    			console.log(result.toString());
      }
      catch(error) {
          console.log(error);
      }
      try {
          console.log('\n--> Create  Emission(ActivityDataError)');
    			result =await contract3.submitTransaction('CreateEmission','M01', 'aaaa', '2023-10-25 17:29:11.000');
    			console.log(result.toString());
      }
      catch(error) {
          console.log(error);
      }
      try {
          console.log('\n--> Create  Emission(TimeStampError)');
    			result =await contract3.submitTransaction('CreateEmission','M01', '5', '2023-10-25');
    			console.log(result.toString());
      }
      catch(error) {
          console.log(error);
      }
      console.log('\n--> Get Emission Data(CompanyIdReadTotalData)');
			result = await contract3.evaluateTransaction('CompanyIdReadTotalData','22099131');
      console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      console.log('\n--> Get Emission Data(CompanyIdReadSuccessData)');
			result = await contract3.evaluateTransaction('CompanyIdReadSuccessData','22099131');
      console.log(`*** Result: ${prettyJSONString(result.toString())}`);
      console.log('\n--> Get Emission Data(SourceIdReadSuccessData)');
			result = await contract3.evaluateTransaction('SourceIdReadSuccessData','22099131','M01');
      console.log(`*** Result: ${prettyJSONString(result.toString())}`);
*/      
		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();
