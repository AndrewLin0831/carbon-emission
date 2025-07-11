/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
//carbon json schema
class DataTransfer extends Contract {
//CreateSource
    async CreateSource(ctx, CompanyId, Process, Equipment, Materials, Category, EmissionType,BiomassEnergy,Cogeneration,GasType) {
        const authority = await this.CheckRegistry(ctx,CompanyId);
        if (authority==='false') {
            throw new Error(`You are not${CompanyId} Member`);
        }
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        const exists = await this.DataExists(ctx,key);
        if (exists) {
            throw new Error(`${Equipment} already exists at ${CompanyId}`);
        }
        const data = {
            Process: Process,
            Equipment: Equipment,
            Materials: Materials,
            Category: Category,
            EmissionType: EmissionType,
            BiomassEnergy: BiomassEnergy,
            Cogeneration: Cogeneration,
            GasType: GasType,
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    // ReviseData
    async UpdateSource(ctx, CompanyId, Process, Equipment, Materials, Category, EmissionType,BiomassEnergy,Cogeneration,GasType) {
        const authority = await this.CheckRegistry(ctx,CompanyId);
        if (authority==='false') {
            throw new Error(`You are not${CompanyId} Member`);
        }
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        const exists = await this.DataExists(ctx, key);
        if (!exists) {
            throw new Error(`${Equipment} does not exist at ${CompanyId}`);
        }

        // overwriting original
        const updatedData = {
            Process: Process,
            Equipment: Equipment,
            Materials: Materials,
            Category: Category,
            EmissionType: EmissionType,
            BiomassEnergy: BiomassEnergy,
            Cogeneration: Cogeneration,
            GasType: GasType,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(updatedData))));
    }
    // DeleteSource
    async DeleteSource(ctx, CompanyId, Equipment) {
        const authority = await this.CheckRegistry(ctx,CompanyId);
        if (authority==='false') {
            throw new Error(`You are not${CompanyId} Member`);
        }
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        const exists = await this.DataExists(ctx, key);
        if (!exists) {
            throw new Error(`${Equipment} does not exist at ${CompanyId}`);
        }
        return ctx.stub.deleteState(key);
    }
    // ReadSingleData
    async ReadSource(ctx, CompanyId, Equipment) {
        const key = await ctx.stub.createCompositeKey('SourceId',[CompanyId, Equipment]);
        const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
        if (!DataJSON || DataJSON.length === 0) {
            throw new Error(`${key} does not exist`);
        }
        return DataJSON.toString();
    }
    // ReadCompanyTotalData
    async ReadCompanySource(ctx,key) {
       const allResults = [];
       const iterator = await ctx.stub.getStateByPartialCompositeKey('SourceId', [key]);
       let result = await iterator.next();
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
           result = await iterator.next();
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
    //CheckRegistry
    async CheckRegistry(ctx,CompanyId) {
        const Address= await this.GetMsgSender(ctx);
        const origin_result= await ctx.stub.invokeChaincode('emission_registry',['CheckRegistry',CompanyId,Address],'carbontest');
        const result = origin_result.payload.toString();
        return result;
    }
    //CheckAuthority
    async CheckAuthority(ctx,CompanyId) {
        const Address= await this.GetMsgSender(ctx);
        const origin_result= await ctx.stub.invokeChaincode('emission_registry',['CheckAuthority',CompanyId,Address],'carbontest');
        const result = origin_result.payload.toString();
        return result;
    }
}

module.exports = DataTransfer;