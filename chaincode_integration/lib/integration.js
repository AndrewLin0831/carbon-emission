/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class DataTransfer extends Contract {
    //Reputation Integration
    async InputEmission(ctx, SourceID, EmissionType, ActivityData, TimeTag) {
        //Get Quailty Index Array
        let IndexArray= await ctx.stub.invokeChaincode('reputation41',['Reputation',SourceID, EmissionType, TimeTag],'carbontest');
        IndexArray = JSON.parse(IndexArray.payload.toString());
        const monitorIndex = Number(IndexArray[0]);
        const correctionIndex = Number(IndexArray[1]);
        const parameterIndex = Number(IndexArray[2]);
        const SingleReputation = ((monitorIndex*correctionIndex)/parameterIndex).toFixed(3);
        //Get Now Total Emission
        let SourceInfo = await ctx.stub.invokeChaincode('storage40',['ReadSource',SourceID, EmissionType],'carbontest');
        SourceInfo = JSON.parse(SourceInfo.payload.toString());
        const SourceEmission = Number(SourceInfo.TotalEmission);
        const SourceReputation = Number(SourceInfo.CurrentReputation);
        ActivityData = Number(ActivityData);
        const UpdateRatio = (ActivityData/(SourceEmission+ActivityData)).toFixed(3);
        const UpdateReputation = UpdateRatio*SingleReputation+(1-UpdateRatio)*SourceReputation;
        const UpdateEmission = SourceEmission+ActivityData;
        await ctx.stub.invokeChaincode('storage40',['CreateEmission',SourceID, EmissionType, ActivityData.toString(), TimeTag],'carbontest');
        await ctx.stub.invokeChaincode('storage40',['UpdateSource',SourceInfo.SourceID, SourceInfo.EmissionType, UpdateEmission.toString(), UpdateReputation.toString()],'carbontest');
        return [UpdateRatio,monitorIndex,correctionIndex,parameterIndex,SingleReputation,UpdateReputation,UpdateEmission];
    }
}

module.exports = DataTransfer;