/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const Ajv = require("ajv").default;
const addFormats = require('ajv-formats');

class Accounting extends Contract {
//Input On Site Data and Mint certificate
    async AddOnsiteResult(ctx,Company,StartDate,EndDate,OnSiteData){
        //Calculate OnsiteTotalEmission
        let storageTotalEmission = await this.StorageTotalEmission(ctx,Company,StartDate,EndDate);
        let onSiteTotalEmission = await this.OnsiteTotalEmission(ctx,Company,StartDate,EndDate,OnSiteData);
        let companyErrorRate = await this.CompanyErrorRate(ctx,Company,StartDate,EndDate,OnSiteData);
        let totalActualEmission = await this.TotalActualEmission(ctx,Company,StartDate,EndDate,companyErrorRate.toString());
        let NFT = await ctx.stub.invokeChaincode('Certificate',['Mint', Company,onSiteTotalEmission.toString(),EndDate,companyErrorRate.toString()],'carbon');
        const result = {
            Company: Company,
            CompanyStorageEmission: Number(storageTotalEmission),
            CompanyOnSiteEmission: Number(onSiteTotalEmission),
            CompanyErrorRate: Number(companyErrorRate),
            CompanyActualEmission: Number(totalActualEmission),
            StartDate: StartDate,
            EndDate: EndDate,
            NFT: JSON.parse(NFT.payload.toString()).tokenId
        };
        ctx.stub.setEvent('VerifyComplete', Buffer.from(JSON.stringify(result)));
        const key = await ctx.stub.createCompositeKey('AccountingHistory',[Company, StartDate]);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(result))));
        return result;
    }

//Calculate Emission Store in blockchain
    async StorageTotalEmission(ctx,Company,StartDate,EndDate){
        //Get Company Total Source ID
        let SourceList = await ctx.stub.invokeChaincode('SourceStorage',['CompanyIDReadSource', Company],'carbon');
        SourceList = JSON.parse(SourceList.payload.toString());
        let CompanyEmission = 0;
        for (let item of SourceList) {
            //Get Each Source Fake Rate
            let sourceInfoByDate=await ctx.stub.invokeChaincode('EmissionVerify',['SourceInfoByDate', Company,item.Source,item.ParameterID,StartDate,EndDate],'carbon');
            sourceInfoByDate = JSON.parse(sourceInfoByDate.payload.toString());
            //Sum of Total Emission
            CompanyEmission=CompanyEmission+Number(sourceInfoByDate.EmissionValue);              
        }
        CompanyEmission = Number(CompanyEmission.toFixed(3));
        return CompanyEmission;
    }

//Use Spot to Estimate Total Emission
//OnSiteData is json type{{Source,ParameterID,EmissionValue},...}
    async OnsiteTotalEmission(ctx,Company,StartDate,EndDate,OnSiteData){
        const searchResult = await this.SourceSearch(ctx,Company,StartDate,EndDate,OnSiteData);
        if (searchResult[0]==true) {
            //Calculate FakeRateWeight
            const fakeRateWeight = await this.FakeRateWeight(ctx,Company,StartDate,EndDate,OnSiteData);
            //Get Company Total Source ID
            let SourceList = await ctx.stub.invokeChaincode('SourceStorage',['CompanyIDReadSource', Company],'carbon');
            SourceList = JSON.parse(SourceList.payload.toString());
            //Calculate On-site Total Emission
            let onSiteTotalEmission = 0;
            for (let item of SourceList) {
              let SourceInfoByDate=await ctx.stub.invokeChaincode('EmissionVerify',['SourceInfoByDate', Company,item.Source,item.ParameterID,StartDate,EndDate],'carbon');
              SourceInfoByDate = JSON.parse(SourceInfoByDate.payload.toString());
              let SourceOnsiteEmission = (1+(fakeRateWeight+Number(SourceInfoByDate.FakeRate)))*Number(SourceInfoByDate.EmissionValue);
              onSiteTotalEmission=onSiteTotalEmission+SourceOnsiteEmission;
            }
            return onSiteTotalEmission;
        }
        else{ return `Missing Source: ${searchResult[1]}`;}
    }

//Calculate Error Rate
    async CompanyErrorRate(ctx,Company,StartDate,EndDate,OnSiteData){
        try {
            const searchResult = await this.SourceSearch(ctx,Company,StartDate,EndDate,OnSiteData);             
            if (searchResult[0]==true) {
                //Calculate FakeRateWeight
                const fakeRateWeight = await this.FakeRateWeight(ctx,Company,StartDate,EndDate,OnSiteData);
                //Get ALL Source (JSON Type) 
                const SourceList = await this.GetAllSource(ctx,Company);
                //Get Each Source Fake Rate and Uncertainty
                let CompanyEmission = 0;
                let CompanyFakeRate =Number(0);
                let CompanyUncertainty = Number(0);
                 for (let item of SourceList) {
                    const sourceInfoByDate = await this.SourceInfoByDate(ctx,Company,item.Source,item.ParameterID,StartDate,EndDate);
                    //Get Each Source Fake Rate
                    let SourceFakeRate = Number(fakeRateWeight)+Number(Number(sourceInfoByDate.FakeRate).toFixed(3));
                    //Get Each Source Uncertainty
                    let parameterID = item.ParameterID.split("~");
                    const ParameterInfo = await this.GetParameterInfo(ctx,parameterID[0],parameterID[1],parameterID[2]);
                    let SourceUncertainty = Number(Math.sqrt(Math.pow(Number(item.ActivityUncertainty),2)+Math.pow(Number(ParameterInfo.ParameterUncertainty),2)).toFixed(3));
                    //Sum of Total Emission
                    let CurrentSourceEmission =  Number(Number(sourceInfoByDate.EmissionValue).toFixed(3));
                    CompanyEmission = Number(Number(CompanyEmission + CurrentSourceEmission).toFixed(3));
                    let emissionRatio = 0;
                    if(CompanyEmission==0 &&CurrentSourceEmission==0){
                      emissionRatio = 0;
                    }
                    else{
                      emissionRatio = Number(Number(CurrentSourceEmission/CompanyEmission).toFixed(3));
                    }

                    //Calculate Company Fake Error
                    CompanyFakeRate = Number(((emissionRatio*SourceFakeRate) + (CompanyFakeRate) - (emissionRatio*CompanyFakeRate)).toFixed(3));

                    //Calculate Company Uncertainty
                    CompanyUncertainty = Number(((emissionRatio*SourceUncertainty) + (CompanyUncertainty) - (emissionRatio*CompanyUncertainty)).toFixed(3));           
                }
                //Company Error Rate
                let CompanyErrorRate =  Number(((1+CompanyFakeRate)*(1+CompanyUncertainty)-1).toFixed(3));

                return CompanyErrorRate;
            }
            else{return `Missing Source: ${searchResult[1]}`;}
            
        } catch (error) {
                console.error("Error searching sources:", error);
                throw error; // Rethrow or handle as needed
            }
    }
//Step.1
async GetAllSource(ctx,Company){
    let SourceList;
    try {
    SourceList = await ctx.stub.invokeChaincode('SourceStorage',['CompanyIDReadSource', Company],'carbon');
    SourceList = JSON.parse(SourceList.payload.toString());
    return SourceList;    
    }catch (error) {
    throw new Error('Error catch CompanyIDReadSource');
    }
}
//Step.2
async SourceInfoByDate(ctx,Company,Source,ParameterID,StartDate,EndDate){
    let sourceInfoByDate;
    try {
        sourceInfoByDate = await ctx.stub.invokeChaincode('EmissionVerify',['SourceInfoByDate', Company,Source,ParameterID,StartDate,EndDate],'carbon');
        sourceInfoByDate = JSON.parse(sourceInfoByDate.payload.toString());
        return sourceInfoByDate; 
    }catch (error) {
        throw new Error('Error catch SourceInfoByDate:'+ error);
    }   
}
//Step.3
async GetParameterInfo(ctx,a,b,c){
    let ParameterInfo;
    try {
        ParameterInfo = await ctx.stub.invokeChaincode('ParameterStorage',['ReadSingleParameter',a,b,c],'carbon');
        ParameterInfo = JSON.parse(ParameterInfo.payload.toString());
        return ParameterInfo;
    }catch (error) {
        throw new Error('Error catch ReadSingleParameter');
    }   
}
//Calculate Total Actual Emission
    async TotalActualEmission(ctx,Company,StartDate,EndDate,CompanyErrorRate){
        //Get Company Total Source
         try {
          let SourceList = await ctx.stub.invokeChaincode('SourceStorage', ['CompanyIDReadSource', Company], 'carbon');
          SourceList = JSON.parse(SourceList.payload.toString());
          let CompanyEmission = 0;
          for (let item of SourceList) {
              try {
                  let SourceInfoByDate = await ctx.stub.invokeChaincode('EmissionVerify', ['SourceInfoByDate', Company, item.Source, item.ParameterID, StartDate, EndDate], 'carbon');
                  SourceInfoByDate = JSON.parse(SourceInfoByDate.payload.toString());
                  CompanyEmission += Number(SourceInfoByDate.EmissionValue);
              } catch (err) {
                  console.error(`Error retrieving emission data for source: ${item.Source}`, err);
                  // Handle specific source failure, e.g., skip or default to 0
              }
          }
          let ActualEmission = CompanyEmission * (1 + Number(CompanyErrorRate));
          ActualEmission = Number(ActualEmission.toFixed(3));
          return ActualEmission;
      } catch (error) {
          console.error('Failed to calculate total actual emission:', error);
          throw new Error('Error calculating total emissions');
      }
    }

//Sum of Emssion Value. Data={{xxx,EmissionValue},...}
    async CalculateEmission(ctx,Data){
        let EmissionResult = 0;
        try {
                Data = JSON.parse(Data.toString());
                for (let item of Data) {
                    if (typeof Number(item.EmissionValue) === 'number') {
                        EmissionResult += item.EmissionValue;
                    } else {
                        console.warn('Invalid EmissionValue encountered', item);
                    }
                }
            } catch (error) {
                console.error('Failed to parse Data:', error);
                // Handle error appropriately, possibly re-throw or return an error response
                throw new Error('Invalid input data');
            }
        return EmissionResult;
    }

//Calculate Fake Rate Weight (OnsiteFake/EstimateFake)
    async FakeRateWeight(ctx,Company,StartDate,EndDate,OnSiteData){
        try {
            OnSiteData = JSON.parse(OnSiteData.toString());
        } catch (error) {
            console.error("Error parsing OnSiteData:", error);
            throw new Error("Invalid OnSiteData format");
        }
        
        try {
            let fakeRateWeight=0;
            let sourceParameterMap = new Map();
            let SpotList = await ctx.stub.invokeChaincode('EmissionVerify', ['getSpotList', Company, StartDate, EndDate], 'carbon');
            SpotList = SpotList.payload.toString();
            const VerifyEmission = await this.CalculateEmission(ctx, SpotList);
            for (let item of OnSiteData) {
                let key = item.Source + "_" + item.ParameterID;
                sourceParameterMap.set(key, item.EmissionValue);
            }
            SpotList=JSON.parse(SpotList);
            for (let item of SpotList) {
            let key = item.Source + "_" + item.ParameterID;
            if (sourceParameterMap.has(key)) {
                const SourceOnsiteEmission = Number(sourceParameterMap.get(key));
                const SourceVerifyEmission = Number(item.EmissionValue);
                const OnsiteFakeRate = (SourceOnsiteEmission-SourceVerifyEmission)/SourceVerifyEmission;
                const EstimateFakeRate = Number(item.FakeRate);
                fakeRateWeight +=((OnsiteFakeRate-EstimateFakeRate)*(SourceVerifyEmission/VerifyEmission));
            }
        }
        fakeRateWeight = Number(fakeRateWeight.toFixed(3));
        return fakeRateWeight;
        } catch (error) {
            console.error("Error fetching or processing spot list:", error);
            throw error; // Rethrow or handle as needed
        }
    }

//Check On-site Source is Correct

    async SourceSearch(ctx,Company,StartDate,EndDate,OnSiteData){
        try {
                OnSiteData = JSON.parse(OnSiteData.toString());
                let SpotList = await ctx.stub.invokeChaincode('EmissionVerify', ['getSpotList', Company,StartDate,EndDate], 'carbon');
                SpotList = JSON.parse(SpotList.payload.toString());
        
                let sourceParameterMap = new Map();
                for (let item of OnSiteData) {
                    let key = item.Source + "_" + item.ParameterID;
                    sourceParameterMap.set(key, item.EmissionValue);
                }
        
                let allFound = true;
                let LostSource = "";
                for (let item of SpotList) {
                    let key = item.Source + "_" + item.ParameterID;
                    if (!sourceParameterMap.has(key)) {
                        allFound = false;
                        LostSource += `{Source: ${item.Source}, ParameterID: ${item.ParameterID}}, `;
                    }
                }
                return [allFound,LostSource,OnSiteData,SpotList];
            } catch (error) {
                console.error("Error searching sources:", error);
                throw error; // Rethrow or handle as needed
            }
    }
// ReadData
     async ReadCompanyAccountingHistory(ctx,Company) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('AccountingHistory', [Company]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }  
     async ReadCompanyAccountingHistoryByDate(ctx,Company, StartDate, EndDate) {
        const Start = await ctx.stub.createCompositeKey('AccountingHistory',[Comapany, StartDate]);
        const End =await ctx.stub.createCompositeKey('AccountingHistory',[Comapany, EndDate]);
        const ResultData = await ctx.stub.getStateByRange(Start, End+"0.001");
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }  
//DataProcessing
    async DataProcessing(ctx, Data) {
        const allResults = [];
        let result = await Data.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await Data.next();
        }
        return JSON.stringify(allResults);
    }    
}

module.exports = Accounting;