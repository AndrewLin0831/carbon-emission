/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class DataTransfer extends Contract {
    async UpdateSource1(ctx,SourceID,EmissionType, UpdateEmission, UpdateReputation) {
        const key = await ctx.stub.createCompositeKey('SourceKey',[SourceID,EmissionType]);
        const SourceInfo = await this.ReadSource(ctx, SourceID, EmissionType);
        return SourceInfo.length;
    }
    async UpdateSource2(ctx,SourceID,EmissionType, UpdateEmission, UpdateReputation) {
        const key = await ctx.stub.createCompositeKey('SourceKey',[SourceID,EmissionType]);
        const SourceInfo = await this.ReadSource(ctx, SourceID, EmissionType);
        return JSON.parse(SourceInfo.toString()).SourceID;
    }
    //Update Source
    async UpdateSource(ctx,SourceID,EmissionType, UpdateEmission, UpdateReputation) {
        const key = await ctx.stub.createCompositeKey('SourceKey',[SourceID,EmissionType]);
        let SourceInfo = await this.ReadSource(ctx, SourceID, EmissionType);
        SourceInfo = JSON.parse(SourceInfo.toString());
        const UpdateData = {
            SourceID: SourceInfo.SourceID,
            EmissionType: SourceInfo.EmissionType,
            ParameterValue: SourceInfo.ParameterValue,
            ParameterType: SourceInfo.ParameterType,
            TotalEmission: UpdateEmission,
            CurrentReputation: UpdateReputation,
            Notes: SourceInfo.Notes
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(UpdateData))));
        return true;
    }
    //CreateSource
    async CreateSource(ctx, SourceID, EmissionType, ParameterValue, ParameterType, Notes) {
        const key = await ctx.stub.createCompositeKey('SourceKey',[SourceID,EmissionType]);
        const data = {
            SourceID: SourceID,
            EmissionType: EmissionType,
            ParameterValue: ParameterValue,
            ParameterType: ParameterType,
            TotalEmission: "0",
            CurrentReputation: "0",
            Notes: Notes
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    //CreateEmission
    async CreateEmission(ctx, SourceID, EmissionType, ActivityData, TimeTag) {
        const key = await ctx.stub.createCompositeKey('EmissionKey',[SourceID,EmissionType,TimeTag]);
        const data = {
            SourceID: SourceID,
            EmissionType: EmissionType,
            ActivityData: ActivityData,
            TimeTag: TimeTag
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    //CreateCorrection
    async CreateCorrection(ctx, SourceID, EmissionType, TimeTag) {
        const key = await ctx.stub.createCompositeKey('CorrectionKey',[SourceID,EmissionType,TimeTag]);
        const data = {
            SourceID: SourceID,
            EmissionType: EmissionType,
            TimeTag: TimeTag
        };
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }
    // ReadData
    async ReadSource(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('SourceKey', [SourceID, EmissionType]);
        const OutputData = await this.LastDataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadEmission(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionKey', [SourceID, EmissionType]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadEarlyEmission(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionKey', [SourceID, EmissionType]);
        const OutputData = await this.EarlyDataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadLastEmission(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('EmissionKey', [SourceID, EmissionType]);
        const OutputData = await this.LastDataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadCorrection(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('CorrectionKey', [SourceID, EmissionType]);
        const OutputData = await this.DataProcessing(ctx, ResultData);
        return OutputData;
    }
    async ReadLastCorrection(ctx, SourceID, EmissionType) {
        const ResultData = await ctx.stub.getStateByPartialCompositeKey('CorrectionKey', [SourceID, EmissionType]);
        const OutputData = await this.LastDataProcessing(ctx, ResultData);
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
    //LastDataProcessing
    async LastDataProcessing(ctx, Data) {
        let allResults ="";
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
            allResults=record;
            result = await Data.next();
        }
        return JSON.stringify(allResults);
    }
    async EarlyDataProcessing(ctx, Data) {
        let allResults ="";
        let result = await Data.next();
        const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
        let record;
        try {
            record = JSON.parse(strValue);
        } catch (err) {
            console.log(err);
            record = strValue;
        }
        allResults=record;
        return JSON.stringify(allResults);
    }
}

module.exports = DataTransfer;