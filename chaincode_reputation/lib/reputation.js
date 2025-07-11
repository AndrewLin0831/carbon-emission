/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class DataTransfer extends Contract {
    //calculate reputation
    async Reputation(ctx, SourceID, EmissionType, TimeTag) {
        const monitorIndex=await this.MonitorIndex(ctx, SourceID, EmissionType, TimeTag);
        const correctionIndex=await this.CorrectionIndex(ctx, SourceID, EmissionType, TimeTag);
        const parameterIndex=await this.ParameterIndex(ctx, SourceID, EmissionType);
        let ReputationArray=[monitorIndex,correctionIndex,parameterIndex];
        return ReputationArray;
    }
    async MonitorIndex(ctx, SourceID, EmissionType, TimeTag) {
        let result = "1";
        let nowTime = TimeTag;
        let lastData = await ctx.stub.invokeChaincode('storage40',['ReadLastEmission', SourceID, EmissionType],'carbontest');
        lastData = lastData.payload.toString();
        if(lastData.length==2) {
            //無數據
            return result;
        }
        let lastTime = JSON.parse(lastData).TimeTag;
        const Different =  Date.parse(nowTime)-Date.parse(lastTime);
        result = (1/Different).toFixed(3);
        return result;
    }
    async CorrectionIndex(ctx, SourceID, EmissionType, TimeTag) {
        let result = "1";
        let nowTime = TimeTag;
        let lastData = await ctx.stub.invokeChaincode('storage40',['ReadLastCorrection',SourceID, EmissionType],'carbontest');
        lastData = lastData.payload.toString();
        if(lastData.length==2) {
            //是否有碳排放數據
            lastData = await ctx.stub.invokeChaincode('storage40',['ReadLastEmission',SourceID, EmissionType],'carbontest');
            lastData = lastData.payload.toString();
            if(lastData.length==2) {
                //無數據
                return result;
            }
            //用最早的碳排放數據
            lastData = await ctx.stub.invokeChaincode('storage40',['ReadEarlyEmission',SourceID, EmissionType],'carbontest');
            lastData = lastData.payload.toString();
        }
        let lastTime = JSON.parse(lastData).TimeTag;
        const Different =  Date.parse(nowTime)-Date.parse(lastTime);
        result = (1/Different).toFixed(3);
        return result;
    }
    async ParameterIndex(ctx, SourceID, EmissionType) {
        let SourceData = await ctx.stub.invokeChaincode('storage40',['ReadSource', SourceID, EmissionType],'carbontest');
        let Parameter = JSON.parse(SourceData.payload.toString());
        let result="3";
        switch(Parameter.ParameterType) {
            case 'IPCC':
                result="3";
                break;
            case 'Government':
                result="2";
                break;
            case 'Mass Balance':
                result="1";
                break;
            default:
                result="3";
                break;                 
        }
        
        return result;
    }
}

module.exports = DataTransfer;