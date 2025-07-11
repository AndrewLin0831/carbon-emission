/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
//carbon json schema
const schema_CreateEmission = {
    type: "object",
    properties: {
        Equipment: {
            description: "Equipment for carbon emission",
            type: "string",
            invalidMessage: 'EquipmentError'
        },
        ActivityData: {
            description: "ActivityData for carbon emission",
            type: "number",
            invalidMessage: 'ActivityDataError'
        },
        TimeStamp: {
            description: "TimeStamp for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time",
            invalidMessage: 'TimeStampError'
        }
    },
    required: [ "Equipment","ActivityData","TimeStamp"]
};
class DataTransfer extends Contract {
//CreateSource
    async CreateEmission(ctx, Equipment, ActivityData, TimeStamp) {
        const Authority = await this.CheckAuthority(ctx,Equipment);
        if(!Authority) {
            const DataCheck = "AuthorityError";
            const key = Equipment+'~'+DataCheck+'~'+TimeStamp;
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeStamp: TimeStamp,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            throw new Error(`${Equipment} not exists at ${CompanyId}`);
        }
        const SameData = await this.CheckSameData(ctx,Equipment,TimeStamp);
        if (SameData) {
            const DataCheck = "SameDataError";
            const key = Equipment+'~'+DataCheck+'~'+TimeStamp;
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeStamp: TimeStamp,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            throw new Error(`timestamp need be `);
        }
        const DataFormat = await this.CheckDataFormat(ctx,Equipment, ActivityData, Timestamp);
        if (DataFormat!=true) {
            const DataCheck = DataFormat;
            const key = Equipment+'~'+DataCheck+'~'+TimeStamp;
            const data = {
                Equipment: Equipment,
                ActivityData: ActivityData,
                TimeStamp: TimeStamp,
                Check: DataCheck,
            };
            await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
            throw new Error(`already exists same timestamp data at ${Equipment}`);
        }
        const DataCheck = "OK";
        const key = Equipment+'~'+DataCheck+'~'+TimeStamp;
        const data = {
            Equipment: Equipment,
            ActivityData: ActivityData,
            TimeStamp: TimeStamp,
            Check: DataCheck,
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    // ReadData
    async ReadSource(ctx, key) {
        const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
        if (!DataJSON || DataJSON.length === 0) {
            throw new Error(`${key} does not exist`);
        }
        return DataJSON.toString();
    }
    // DataExists
    async DataExists(ctx, key) {
        const assetJSON = await ctx.stub.getState(key);
        return assetJSON && assetJSON.length > 0;
    }
    // GetMsgSender
    async GetMsgSender(ctx) {
        const MsgSender = await ctx.stub.getCreator();
        result = JSON.parse(MsgSender.toString());
        let array=[];
        for(let i in result.idBytes) { 
              array.push(result.idBytes[i]); 
           }; 
        return String.fromCharCode(...res_array);
    }
    //CheckAuthority
    async CheckAuthority(ctx,Equipment) {
        const Address= await this.GetMsgSender(ctx);
        let CompanyId= await ctx.stub.invokeChaincode('emission_registry',['GetCompanyId',Address],'carbontest');
        CompanyId = CompanyId.payload.toString();
        const key = CompanyId+'~'+Equipment;
        let result= await ctx.stub.invokeChaincode('emission_storeSource',['DataExists',key],'carbontest');
        result = result.payload.toString();
        return result;
    }
    //CheckSameData
    async CheckSameData(ctx,Equipment,TimeStamp) {
        const key = Equipment+'~'+'OK'+'~'+TimeStamp;
        const exists = await this.DataExists(ctx,key);
        return exists;
    }
    //CheckDataFormat
    async CheckDataFormat(ctx,Equipment, ActivityData, TimeStamp) {
        const ajv = new Ajv();
        addFormats(ajv);
        const validate = ajv.compile(schema_CreateEmission);
        const data = {
            Equipment: Equipment,
            ActivityData: Number(ActivityData),
            TimeStamp: TimeStamp,
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