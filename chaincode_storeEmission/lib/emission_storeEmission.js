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
//carbon json schema
const schema_CreateEmission = {
    type: "object",
    properties: {
        Equipment: {
            description: "Equipment for carbon emission",
            type: "string",
            errorMessage: 'EquipmentError',
        },
        ActivityData: {
            description: "ActivityData for carbon emission",
            type: "number",
            errorMessage: 'ActivityDataError',
        },
        TimeTag: {
            description: "TimeStamp for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time",
            errorMessage: 'TimeTagError',
        }
    },
    required: [ "Equipment","ActivityData","TimeTag"]
};
class DataTransfer extends Contract {
//CreateSource
    async CreateEmission(ctx, Equipment, ActivityData, TimeTag) {
        const MsgSender = await this.GetMsgSender(ctx);
        const CompanyId = await this.GetCompanyId(ctx,MsgSender);
        const CheckSource = await this.PublicCheckSource(ctx,CompanyId,Equipment);
        if(CheckSource==='false') {
            const DataCheck = "AuthorityError";
            const key = await this.CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag);
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeTag: TimeTag,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            return (`${Equipment} not exists at ${CompanyId}`);
        }
        const SameData = await this.CheckSameData(ctx,CompanyId,Equipment,TimeTag);
        if (SameData) {
            const DataCheck = "SameKeyError";
            const key = await this.CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag);
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeTag: TimeTag,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            return (`This Key(${CompanyId}~${Equipment}~${TimeTag}) already exist`);
        }
        const DataFormat = await this.CheckDataFormat(ctx,Equipment, ActivityData, TimeTag);
        if (DataFormat!=true) {
            const DataCheck = DataFormat;
            const key = await this.CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag);
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeTag: TimeTag,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            return (`${DataFormat}`);
        }
        const DataCheck = "OK";
        const key = await this.CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag);
        const data = {
            Equipment: Equipment,
            ActivityData: ActivityData,
            TimeTag: TimeTag,
            Check: DataCheck,
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    // ReadData
    async CompanyIdReadTotalData(ctx, CompanyId) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionId', [CompanyId]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async CompanyIdReadSuccessData(ctx, CompanyId) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionId', [CompanyId,'OK']);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async SourceIdReadSuccessData(ctx, CompanyId, Equipment) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionId', [CompanyId,'OK',Equipment]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadSingleData(ctx,CompanyId,DataCheck,Equipment,TimeTag) {
        const key = await this.CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag);
        const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
        if (!DataJSON || DataJSON.length === 0) {
            throw new Error(`${key} does not exist`);
        }
        return DataJSON.toString();
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
    // DataExists
    async DataExists(ctx, key) {
        const assetJSON = await ctx.stub.getState(key);
        return assetJSON && assetJSON.length > 0;
    }
    // GetMsgSender
    async GetMsgSender(ctx) {
        const MsgSender = await ctx.stub.getCreator();
        const result = MsgSender.idBytes;
        let res_array=[];
        for(let i in result) { 
            res_array.push(result[i]); 
        }; 
        const Certificate = String.fromCharCode(...res_array);
        return Certificate;
    }
    //GetCompanyId
    async GetCompanyId(ctx,Address) {
        let CompanyId= await ctx.stub.invokeChaincode('emission_registry',['GetCompanyId',Address],'carbontest');
        CompanyId = CompanyId.payload.toString();
        return CompanyId;
    }
    //CreateCompositeKey
    async CreateKey(ctx,CompanyId,DataCheck,Equipment,TimeTag) {
        const result = await ctx.stub.createCompositeKey('EmissionId',[CompanyId,DataCheck,Equipment,TimeTag]);
        return result;
    }
    //CheckAuthority
    async PublicCheckSource(ctx,CompanyId,Equipment) {
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        let result= await ctx.stub.invokeChaincode('emission_storeSource',['DataExists',key],'carbontest');
        result = result.payload.toString();
        return result;
    }
    async SelfCompanyCheckSource(ctx,Equipment) {
        const Address= await this.GetMsgSender(ctx);
        let CompanyId= await this.GetCompanyId(ctx,Address);
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        let result= await ctx.stub.invokeChaincode('emission_storeSource',['DataExists',key],'carbontest');
        result = result.payload.toString();
        return result;
    }
    //CheckSameData
    async CheckSameData(ctx,CompanyId,Equipment,TimeTag) {
        const key = await this.CreateKey(ctx,CompanyId,'OK',Equipment, TimeTag);
        const exists = await this.DataExists(ctx,key);
        return exists;
    }
    //CheckDataFormat
    async CheckDataFormat(ctx,Equipment, ActivityData, TimeTag) {
        const ajv = new Ajv({allErrors: true});
        require("ajv-errors")(ajv /*, {singleError: true} */);
        addFormats(ajv);
        const validate = ajv.compile(schema_CreateEmission);
        const data = {
            Equipment: Equipment,
            ActivityData: Number(ActivityData),
            TimeTag: TimeTag,
        }
        const isValid = validate(data);
        if (!isValid) {
            const errorType= validate.errors[0].message.toString();
            return errorType;
        }
        return true;
    }
}

module.exports = DataTransfer;