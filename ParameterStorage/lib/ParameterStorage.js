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
const ParameterSchema = {
    type: "object",
    properties: {
        MaterialType: {
            description: "MaterialType for carbon emission",
            type: "string",
            errorMessage: 'MaterialTypeError',
        },
        EmissionType: {
            description: "EmissionType for carbon emission",
            type: "string",
            errorMessage: 'EmissionTypeError',
        },
        EmissionFactor: {
            description: "EmissionFactor for carbon emission",
            type: "number",
            errorMessage: 'EmissionFactorError',
        },
        ParameterUncertainty: {
            description: "ParameterUncertainty for carbon emission",
            type: "number",
            errorMessage: 'ParameterUncertaintyError',
        },
        Resource: {
            description: "Resource for parameters",
            type: "string",
            errorMessage: 'ResourceError',
        },
    },
    required: [ "MaterialType","EmissionType","EmissionFactor","ParameterUncertainty","Resource"]
};
class ParameterStorage extends Contract {
//CreateParameterID
    async CreateKey(ctx,MaterialType,EmissionType,Resource) {
        const result = await ctx.stub.createCompositeKey('ParameterID',[MaterialType,EmissionType,Resource]);
        return result;
    }
//CreateSource
    async CreateParameter(ctx, MaterialType,EmissionType,EmissionFactor,ParameterUncertainty,Resource) {
        const Exist = await this.CheckSameParameter(ctx, MaterialType, EmissionType, Resource);
        if(Exist){
            throw new Error (`This Parameter (${MaterialType}~${EmissionType}~${Resource}) already exist`);
        }
        const Format = await this.CheckDataFormat(ctx,MaterialType,EmissionType,EmissionFactor,ParameterUncertainty,Resource);
        if(Format!= true){
            throw new Error(Format);
        }        
        const key = await this.CreateKey(ctx,MaterialType, EmissionType, Resource);
        //Parameter Information-------------
        const data = {
            MaterialType: MaterialType,
            EmissionType: EmissionType,
            EmissionFactor: Number(EmissionFactor),
            ParameterUncertainty: Number(ParameterUncertainty),
            Resource: Resource,
        };
        //-------------Parameter Information
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    // ReadData
     async EmissionTypeReadParameter(ctx,MaterialType,EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('ParameterID', [MaterialType,EmissionType]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadSingleParameter(ctx,MaterialType,EmissionType,Resource) {
        const key = await this.CreateKey(ctx,MaterialType,EmissionType,Resource);
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
//CheckSameData
    async CheckSameParameter(ctx,MaterialType,EmissionType,Resource) {
        const key = await this.CreateKey(ctx,MaterialType,EmissionType,Resource);
        const exists = await this.DataExists(ctx,key);
        return exists;
    }
//CheckDataFormat
    async CheckDataFormat(ctx,MaterialType,EmissionType,EmissionFactor,ParameterUncertainty,Resource) {
        const ajv = new Ajv({allErrors: true});
        require("ajv-errors")(ajv);
        addFormats(ajv);
        const validate = ajv.compile(ParameterSchema);
        const data = {
            MaterialType: MaterialType,
            EmissionType: EmissionType,
            EmissionFactor: Number(EmissionFactor),
            ParameterUncertainty: Number(ParameterUncertainty),
            Resource: Resource,
        }
        const isValid = validate(data);
        if (!isValid) {
            const errorType= validate.errors[0].message.toString();
            return errorType;
        }
        return true;
    }
}

module.exports = ParameterStorage;