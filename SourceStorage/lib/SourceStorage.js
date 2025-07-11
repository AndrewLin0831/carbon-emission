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
const SourceSchema = {
    type: "object",
    properties: {
        Company: {
            description: "Company ID for Source",
            type: "string",
            errorMessage: 'CompanyError',
        },
        Source: {
            description: "Source ID for Source",
            type: "string",
            errorMessage: 'SourceError',
        },
        MonitorType: {
            description: "Monitor Type for Source",
            enum: ["Continuous", "Regular", "Estimation"],
            errorMessage: 'MonitorTypeError',
        },
        ActivityUncertainty: {
            description: "ActivityUncertainty for carbon emission",
            type: "number",
            errorMessage: 'ActivityUncertaintyError',
        },
        ParameterID: {
            description: "Parameter ID for Source",
            type: "string",
            errorMessage: 'ParameterIDError',
        },
    },
    required: [ "Company","Source","MonitorType","ActivityUncertainty","ParameterID"]
};
class SourceStorage extends Contract {
//CreateSourceID
    async CreateKey(ctx,Company,Source,ParameterID) {
        const result = await ctx.stub.createCompositeKey('SourceID',[Company,Source,ParameterID]);
        return result;
    }
//CreateSource
    async CreateSource(ctx, Company, Source, MonitorType,ActivityUncertainty,ParameterID) {
        const Exist = await this.CheckSameSource(ctx, Company, Source, ParameterID);
        if(Exist){
            throw new Error (`This Source (${Company}~${Source}~${ParameterID}) already exist`);
        }
        const Format = await this.CheckDataFormat(ctx,Company, Source, MonitorType,ActivityUncertainty,ParameterID);
        if(Format!= true){
            throw new Error(Format);
        }        
        const key = await this.CreateKey(ctx,Company, Source, ParameterID);
        //Source Information-------------
        const data = {
            Company: Company,
            Source: Source,
            MonitorType: MonitorType,
            ActivityUncertainty: Number(ActivityUncertainty),
            ParameterID: ParameterID,
            EmissionValue: 0,
            FakeRate: 0,
        };
        //-------------Source Information
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }

//UpdateVerifiedEmission
    async UpdateVerifiedEmission(ctx, Company, Source, ParameterID, EmissionValue, FakeRate) {
        let check = await this.CheckSameSource(ctx,Company,Source,ParameterID);
        if(!check){
            throw new Error (`This Source (${Company}~${Source}~${ParameterID}) not exist`);
        }
        let result = await this.ReadSingleSourceEmission(ctx,Company,Source,ParameterID);
        result = JSON.parse(result);
        let UpdateEmissionValue = Number(EmissionValue)+result.EmissionValue;
        UpdateEmissionValue = Number(UpdateEmissionValue.toFixed(3));
        let UpdateFakeRate = result.FakeRate*(result.EmissionValue/UpdateEmissionValue) + Number(FakeRate)*(Number(EmissionValue)/UpdateEmissionValue);
        UpdateFakeRate = Number(UpdateFakeRate.toFixed(3));
        const data = {
            Company: result.Company,
            Source: result.Source,
            MonitorType: result.MonitorType,
            ActivityUncertainty: Number(result.ActivityUncertainty),
            ParameterID: result.ParameterID,
            EmissionValue: UpdateEmissionValue,
            FakeRate: UpdateFakeRate,
        };
        const key = await this.CreateKey(ctx,Company, Source, ParameterID);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
// ReadData
    async CompanyIDReadSource(ctx, Company) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('SourceID', [Company]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadSingleSource(ctx,Company,Source) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('SourceID', [Company,Source]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadSingleSourceEmission(ctx,Company,Source,ParameterID) {
        const key = await this.CreateKey(ctx,Company,Source,ParameterID);
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
//CheckSameSource
    async CheckSameSource(ctx,Company, Source,ParameterID) {
        const key = await this.CreateKey(ctx,Company, Source,ParameterID);
        const exists = await this.DataExists(ctx,key);
        return exists;
    }
//CheckDataFormat
    async CheckDataFormat(ctx, Company, Source, MonitorType,ActivityUncertainty,ParameterID) {
        const ajv = new Ajv({allErrors: true});
        require("ajv-errors")(ajv);
        addFormats(ajv);
        const validate = ajv.compile(SourceSchema);
        const data = {
            Company: Company,
            Source: Source,
            MonitorType: MonitorType,
            ActivityUncertainty: Number(ActivityUncertainty),
            ParameterID: ParameterID,
        }
        const isValid = validate(data);
        if (!isValid) {
            const errorType= validate.errors[0].message.toString();
            return errorType;
        }
        return true;
    }
}
module.exports = SourceStorage;