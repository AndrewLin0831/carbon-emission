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
    //CreateUser&Copmany
    async CreateCompany(ctx, CompanyName, CompanyId, Tel, Email) {
        const MsgSender = await this.GetMsgSender(ctx);
        const existsAddress = await this.DataExists(ctx,MsgSender);//check account
        const existsCompany = await this.DataExists(ctx,CompanyId);//check company
        if (existsAddress) {
            throw new Error(`This account already registered`);
        }
        if (existsCompany) {
            throw new Error(`${CompanyId} already exists`);
        }
        const account = {
            Address: MsgSender,
            CompanyId: CompanyId,
            Authority: 'Admin',
        };
        await ctx.stub.putState(MsgSender, Buffer.from(stringify(sortKeysRecursive(account))));
        const data = {
            CompanyName: CompanyName,
            CompanyId: CompanyId,
            Tel: Tel,
            Email: Email,
        };
        await ctx.stub.putState(CompanyId, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    //CreateUser&Copmany
    async CreateMember(ctx, CompanyId) {
        const MsgSender = await this.GetMsgSender(ctx);
        const existsAddress = await this.DataExists(ctx,MsgSender);//check account
        const existsCompany = await this.DataExists(ctx,CompanyId);
        if (existsAddress) {
            throw new Error(`${MsgSender} already registered`);
        }
        if (!existsCompany) {
            throw new Error(`${CompanyId} not exists`);
        }
        const account = {
            Address: MsgSender,
            CompanyId: CompanyId,
            Authority: 'Member',
        };
        await ctx.stub.putState(MsgSender, Buffer.from(stringify(sortKeysRecursive(account))));
        return true;
    }
    //ReviseData
    async UpdateRegistry(ctx,CompanyId, Tel, Email) {
        const MsgSender = await this.GetMsgSender(ctx);
        const exists = await this.CheckAuthority(ctx, CompanyId, MsgSender);
        if (exists===false) {
            throw new Error(`No Authority`);
        }
        const Origin = await this.ReadCompany(ctx,CompanyId);
        let Origin_json = JSON.parse(Origin.toString());
        // overwriting original
        const updatedData = {
            CompanyName: Origin_json.CompanyName.toString(),
            CompanyId: Origin_json.CompanyId.toString(),
            Tel: Tel,
            Email: Email,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(CompanyId, Buffer.from(stringify(sortKeysRecursive(updatedData))));
    }
    // ReadData
    async ReadCompany(ctx, key) {
        const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
        if (!DataJSON || DataJSON.length === 0) {
            throw new Error(`${key} does not exist`);
        }
        return DataJSON.toString();
    }
    // ReadData
    async ReadAddress(ctx, key) {
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
        const result = MsgSender.idBytes;
        let res_array=[];
        for(let i in result) { 
            res_array.push(result[i]); 
        }; 
        const Certificate = String.fromCharCode(...res_array);
        return Certificate;
    }
    // GetCompanyId
    async GetCompanyId(ctx,MsgSender) {
        const AccountData = await ctx.stub.getState(MsgSender);
        let result = JSON.parse(AccountData.toString());
        
        return result.CompanyId.toString();
    }
    // CheckAuthority
    async CheckAuthority(ctx, CompanyId,MsgSender) {
        let result = await this.ReadAddress(ctx,MsgSender);
        result = JSON.parse(result.toString());
        if(result.CompanyId.toString()===CompanyId) {
            if(result.Authority.toString()==='Admin') {
                return true;
            }
        }
        return false;
    }
    // CheckRegistry
    async CheckRegistry(ctx, CompanyId, MsgSender) {
        let result = await this.ReadAddress(ctx,MsgSender);
        result = JSON.parse(result.toString());
        if(result.CompanyId.toString()===CompanyId) {
            return true;
        }
        return false;
    }
}

module.exports = DataTransfer;