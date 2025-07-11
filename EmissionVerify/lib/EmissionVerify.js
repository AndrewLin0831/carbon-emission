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

class EmissionVerify extends Contract {
//CreateEmissionID
    async CreateKey(ctx,Company,Source,MaterialType,EmissionType,TimeTag) {
        //const result = await ctx.stub.createCompositeKey('EmissionID',[Company,Source,MaterialType,EmissionType,TimeTag]);
        const result = Company+"~"+Source+"~"+MaterialType+"~"+EmissionType+"~"+TimeTag;
        return result;
    }
//CreateSource
    async CreateEmission(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        //SameDataCheck
        const CheckResult = await this.CheckSameEmission(ctx,Company,Source,MaterialType,EmissionType,TimeTag);
        if(CheckResult){
            throw new Error (`This Emission (${Company}~${Source}~${MaterialType}~${EmissionType}~${TimeTag}) already exist`);
        }
        //Go EmissionVerify
        const FakeRate = await this.Verify(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag);        
        //Store Emission
        const key = await this.CreateKey(ctx,Company,Source,MaterialType,EmissionType,TimeTag);
        //Emission Information-------------
        const data = {
            Company: Company,
            Source: Source,
            MaterialType: MaterialType,
            EmissionType: EmissionType,
            ActivityData: Number(ActivityData),
            EmissionFactor: Number(EmissionFactor),
            EmissionValue: Number(EmissionValue),
            TimeTag: TimeTag,
            FakeRate: Number(FakeRate),
        };
        //-------------Emission Information
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        //Update Source Verified Emission Info
        let ParameterData= await ctx.stub.invokeChaincode('ParameterStorage',['EmissionTypeReadParameter', MaterialType, EmissionType],'carbon');
        ParameterData =  JSON.parse(ParameterData.payload.toString());
        let AimedParameterData = Object.values(ParameterData).find(subObj => Number(subObj.EmissionFactor) === Number(EmissionFactor));
        const ParameterID = MaterialType+"~"+EmissionType+"~"+AimedParameterData.Resource;
        let result= await ctx.stub.invokeChaincode('SourceStorage',['UpdateVerifiedEmission', Company, Source, ParameterID, EmissionValue.toString(), FakeRate.toString()],'carbon');
        result = result.payload.toString();        
        return result;
    }
//Output SpotList
    async getSpotList(ctx, Company, StartDate, EndDate) {
        //Get All Source belongs Company
        let TotalSource= await ctx.stub.invokeChaincode('SourceStorage',['CompanyIDReadSource', Company],'carbon');
        TotalSource = JSON.parse(TotalSource.payload.toString());
        let SourceList=[];
        let TotalTimeIntervalEmission = 0;
        for(let i=0;i<TotalSource.length;i++){
            //Get  Source Info By Start and End
            const CurrentSourceInfo =await this.SourceInfoByDate(ctx, Company, TotalSource[i].Source, TotalSource[i].ParameterID, StartDate, EndDate);
            //Store in Each Source Array
            SourceList.push({Source: TotalSource[i].Source,ParameterID: TotalSource[i].ParameterID,EmissionValue: Number(CurrentSourceInfo.EmissionValue),FakeRate: Number(CurrentSourceInfo.FakeRate)});
            TotalTimeIntervalEmission = TotalTimeIntervalEmission + Number(CurrentSourceInfo.EmissionValue);
        }
        let CheckThreshold = Number((TotalTimeIntervalEmission*0.05).toFixed(3));
        //Sort Source Array By rank
        SourceList.sort((a, b) => {
            // 從結構中提取 FakeRate 和 currentSourceEmission
            const rankA = Number(a.EmissionValue) * Number(a.FakeRate); 
            const rankB = Number(b.EmissionValue) * Number(b.FakeRate); 
        
            // 首先按 rank 排序
            if (rankA < rankB) {
                return 1;  // 如果 rankA < rankB，則 b 應該排在 a 之前
            } else if (rankA > rankB) {
                return -1; // 如果 rankA > rankB，則 a 應該排在 b 之前
            }
            return b.EmissionValue - a.EmissionValue;
        });
        //Select CheckedSpot(Source Array)
        let CheckedSpotList=[];
        for(let i=0;i<SourceList.length;i++){
            const SelectSpot = {
                Source: SourceList[i].Source,
                ParameterID: SourceList[i].ParameterID,
                EmissionValue: SourceList[i].EmissionValue,
                FakeRate: SourceList[i].FakeRate,
            };
            CheckedSpotList.push(SelectSpot);
            TotalTimeIntervalEmission = TotalTimeIntervalEmission - SourceList[i].EmissionValue;
            if(TotalTimeIntervalEmission<=CheckThreshold){
               i=SourceList.length;
            }
        }        
        return CheckedSpotList;
    }
//Verify
    async Verify(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        const relevance = await this.Relevance(ctx, MaterialType, EmissionType, EmissionFactor);
        const completeness = await this.Completeness(ctx, Company, Source);
        const consistency = await this.Consistency(ctx, Company,Source,MaterialType,EmissionType,EmissionFactor)
        const transparency = await this.Transparency(ctx, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag);
        const accuracy = await this.Accuracy(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag)
        const FakeRate = (relevance+completeness+consistency+transparency+accuracy)/5;
        return FakeRate;
    }
//Relevance: Emission Parameter compared to Parameter Storage
    async Relevance(ctx, MaterialType, EmissionType, EmissionFactor) {
        const Relevance= 0;
        let result= await ctx.stub.invokeChaincode('ParameterStorage',['EmissionTypeReadParameter', MaterialType, EmissionType],'carbon');
        result = JSON.parse(result.payload.toString());
        result = Object.values(result).some(subObj => subObj.EmissionFactor === Number(Number(EmissionFactor).toFixed(3)));
        if(result!=true){
            return 1; //Fake
        }
        else{
            return 0;
        }
    }
//Completeness: Emission Source compared to Source Storage
    async Completeness(ctx, Company, Source) {
        const Completeness= 0;
        let result= await ctx.stub.invokeChaincode('SourceStorage',['ReadSingleSource', Company, Source],'carbon');
        result = JSON.parse(result.payload.toString());
        if(result.length==0){
            return 1; //Fake
        }
        else{
            return 0;
        }
    }
//Consistency: Emission Parameter compared to History Emission Parameter
    async Consistency(ctx, Company,Source,MaterialType,EmissionType,EmissionFactor) {
        let result= await this.EmissionTypeReadEmission(ctx,Company,Source,MaterialType,EmissionType);
        result = JSON.parse(result);
        if(result.length==0){
            return 0;
        }
        else{
            //History Emission Parameter Compared Amount
            let ComparedAmount = Math.min(10, result.length);
            //How Much Emission Parameter as same as Compared Amount
            let MatchAmount = 0;
            for(let i=1;i<=ComparedAmount;i++){
                if(result[(result.length)-i].EmissionFactor == Number(Number(EmissionFactor).toFixed(3))){
                    MatchAmount=MatchAmount+1;
                }
            }
            //Match Rate >= 50%
            if(MatchAmount>=(ComparedAmount/2)){
                return 0;
            }
            else{
                return 1;//Fake
            }
        }
    }
//Transparencyy: Emission Data Compared to Template
    async Transparency(ctx, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        const Transparency= 0;
        let result= await ctx.stub.invokeChaincode('EmissionTemplate',['EmissionCheck',Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag],'carbon');
        if(result.payload.toString()=="true"){
            return 0;
        }
        else{
            return 1;
        }
    }
//Accuracy: Emission Data compared to History Emission Data
    async Accuracy(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        //Emission Calculation Check
        let emissionValue =  Number(ActivityData)*Number(EmissionFactor);
        emissionValue = Number(Number(emissionValue).toFixed(3));
        if(emissionValue != Number(Number(EmissionValue).toFixed(3))){
            return 1;
        }
        else{
            let result= await this.EmissionTypeReadEmission(ctx,Company,Source,MaterialType,EmissionType);
            result = JSON.parse(result);
            if(result.length<2){
                return 0;
            }
            else{
                /*Get TimeInterval*/
                const dateTime = new Date(TimeTag);
                const NowTimeInterval = dateTime-result[(result.length)-1].TimeTag;
                const CheckList = [false,false];
                for(let i=1;i<Math.min(10, result.length);i++){
                    const TimeInterval = result[(result.length)-i].TimeTag - result[(result.length)-(i+1)].TimeTag;
                    /*Get ValueDifference*/
                    let ValueDifference = Number(EmissionValue) / result[(result.length)-i].EmissionValue;
                    ValueDifference = Number(Number(ValueDifference).toFixed(3));
                    //Emission Monitor Check
                    if(NowTimeInterval-TimeInterval<= 1000){
                        CheckList[0]=true
                    }
                    //Emission Value Check
                    if( ValueDifference < 1.05 && ValueDifference > (1/1.05) ){
                        CheckList[1]=true
                    }
                    if(CheckList[0]==true && CheckList[1]==true){
                        return 0;
                    }
                }
                return 1;
            }
        }
    }
// ReadData
    async CompanyReadEmission(ctx, Company) {
        const key = Company;
        const ResultData = await ctx.stub.getStateByRange(key+"~",key+"~~");
        //const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionID', [Company]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return `${OutputData}`;
    }
    async SourceReadEmission(ctx, Company, Source) {
        const key = Company+"~"+Source;
        const ResultData = await ctx.stub.getStateByRange(key+"~",key+"~~");
        //const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionID', [Company,Source]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async EmissionTypeReadEmission(ctx,Company,Source,MaterialType,EmissionType) {
        const key = Company+"~"+Source+"~"+MaterialType+"~"+EmissionType;
        const ResultData = await ctx.stub.getStateByRange(key+"~0000-01-01 00:00:00.000",key+"~9999-12-31 23:59:59.999");
        //const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionID', [Company,Source,MaterialType,EmissionType]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadSingleEmission(ctx,Company,Source,MaterialType,EmissionType,TimeTag) {
        const key = await this.CreateKey(ctx,Company,Source,MaterialType,EmissionType,TimeTag);
        const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
        if (!DataJSON || DataJSON.length === 0) {
            throw new Error(`${key} does not exist`);
        }
        return DataJSON.toString();
    }
//Source Result
    async SourceInfoByDate(ctx, Company, Source, ParameterID, StartDate, EndDate) {
        let currentSourceEmission = 0;
        let currentSourceFakeRate = 0;
        const ParameterInfo= ParameterID.split('~');
        let MaterialType = ParameterInfo[0];
        let EmissionType = ParameterInfo[1];
        //Get Total Emission Data for Source
        const Start =await this.CreateKey(ctx,Company,Source,MaterialType,EmissionType,StartDate);
        const End =await this.CreateKey(ctx,Company,Source,MaterialType,EmissionType,EndDate);
        /*const Start = await ctx.stub.createCompositeKey('EmissionID',[Company,Source,MaterialType,EmissionType,StartDate]);
        const End = await ctx.stub.createCompositeKey('EmissionID',[Company,Source,MaterialType,EmissionType,EndDate]);*/
        const iterator = await ctx.stub.getStateByRange(Start, End+"0.001");
        let result = await iterator.next();
        //Calculate Emission and Fake Rate
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
                currentSourceEmission = currentSourceEmission+Number(record.EmissionValue);
                currentSourceFakeRate = (Number(record.EmissionValue)/currentSourceEmission)*Number(record.FakeRate)-(1-(Number(record.EmissionValue)/currentSourceEmission))*currentSourceFakeRate;
                } catch (err) {
                    console.log(err);
                    record = strValue;
                }
                result = await iterator.next();
            }
        //Store in Source Set
        const Result={
            Source: Source,
            ParameterID: ParameterID,
            EmissionValue: Number(currentSourceEmission),
            FakeRate: Number(currentSourceFakeRate)
        };
        return Result;
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
//CheckSameData
    async CheckSameEmission(ctx,Company,Source,MaterialType,EmissionType,TimeTag) {
        const key = await this.CreateKey(ctx,Company,Source,MaterialType,EmissionType,TimeTag);
        const exists = await this.DataExists(ctx,key);
        return exists;
    }
// DataExists
    async DataExists(ctx, key) {
        const assetJSON = await ctx.stub.getState(key);
        return assetJSON && assetJSON.length > 0;
    }
}

module.exports = EmissionVerify;