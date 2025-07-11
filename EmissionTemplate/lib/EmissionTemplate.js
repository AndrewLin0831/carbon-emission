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
const EmissionSchema = {
    type: "object",
    properties: {
        Source: {
            description: "Source for carbon emission",
            type: "string",
            errorMessage: 'SourceError',
        },
        MaterialType: {
            description: "Material Type for carbon emission",
            type: "string",
            errorMessage: 'MaterialTypeError',
        },
        EmissionType: {
            description: "Emission Type for carbon emission",
            type: "string",
            errorMessage: 'EmissionTypeError',
        },
        ActivityData: {
            description: "Activity Data for carbon emission",
            type: "number",
            errorMessage: 'ActivityDataError',
        },
        EmissionFactor: {
            description: "Emission Factor for carbon emission",
            type: "number",
            errorMessage: 'EmissionFactorError',
        },
        EmissionValue: {
            description: "Emission Value for carbon emission",
            type: "number",
            errorMessage: 'EmissionValueError',
        },
        TimeTag: {
            description: "TimeStamp for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time",
            errorMessage: 'TimeTagError',
        }
    },
    required: [ "Source", "MaterialType", "EmissionType", "ActivityData", "EmissionFactor", "EmissionValue","TimeTag"]
};
class EmissionTemplate extends Contract {
//CreateSource
    async EmissionCheck(ctx, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        const DataFormat = await this.CheckDataFormat(ctx, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag);
        return DataFormat;
    }
//CheckDataFormat
    async CheckDataFormat(ctx, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag) {
        const ajv = new Ajv({allErrors: true});
        require("ajv-errors")(ajv);
        addFormats(ajv);
        const validate = ajv.compile(EmissionSchema);
        const data = {
            Source: Source,
            MaterialType: MaterialType,
            EmissionType: EmissionType,
            ActivityData: Number(ActivityData),
            EmissionFactor: Number(EmissionFactor),
            EmissionValue: Number(EmissionValue),
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

module.exports = EmissionTemplate;