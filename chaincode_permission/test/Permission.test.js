/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const StoreSource = require('../lib/emission_storeSource.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Tests', () => {
    let transactionContext, chaincodeStub, data, CompanyId;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });
        data = {
            Process: 'P01',
            Equipment: 'machine01',
            Materials: 'Energy',
            Category: '3',
            EmissionType: 'Eletronic',
            BiomassEnergy: 'Yes',
            Cogeneration: 'No',
            GasType: 'CO2',
        };
        CompanyId = 'IMRC';
    });

    describe('Test CreateSource', () => {
        it('should return error on CreateSource', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            console.log('-------------create source IMRC~machine01(without encrypto key)--------------');
            let storeSource = new StoreSource();
            try {
                await storeSource.CreateSource(transactionContext, CompanyId, data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);
                assert.fail('CreateSource should have failed');
            } catch(err) {
                expect(err.name).to.equal('failed inserting key');
                console.log(err.name);
            }
        });

        it('should return success on CreateSource', async () => {
            let storeSource = new StoreSource();
            console.log('-------------create source IMRC~machine01(with encrypto key)--------------');
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);
            let key = CompanyId+'~'+data.Equipment;
            let ret = JSON.parse((await chaincodeStub.getState(key)).toString());
            expect(ret).to.eql(data);
            console.log(ret);
        });
    });

    describe('Test Read', () => {
        it('should return error on Read', async () => {
            let storeSource = new StoreSource();
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);

            try {
                console.log('-------------input IMRC~machine02 to search source--------------');
                await storeSource.ReadSource(transactionContext, 'machine02');
                assert.fail('Read should have failed');
            } catch (err) {
                expect(err.message).to.equal('machine02 does not exist');
                console.log(err.message);
            }
        });
        it('should return success on Read', async () => {
            console.log('-------------input IMRC~machine01 to search source--------------');
            let storeSource = new StoreSource();
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);
            let key = CompanyId+'~'+data.Equipment;
            let ret = JSON.parse(await chaincodeStub.getState(key));
            expect(ret).to.eql(data);
            console.log(ret);
        });
    });

    describe('Test Update', () => {
        it('should return error on Update', async () => {
            let storeSource = new StoreSource();
            console.log('-------------update source IMRC~machine02--------------');
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);

            try {
                await storeSource.UpdateSource(transactionContext, 'IMRC', 'P01', 'machine02', 'Energy', '3', 'Eletronic','No','No','CO2');
                assert.fail('Update should have failed');
            } catch (err) {
                expect(err.message).to.equal('machine02 does not exist at IMRC');
                console.log(err.message);
            }
        });

        it('should return success on Update', async () => {
            let storeSource = new StoreSource();
            console.log('-------------update source IMRC~machine01--------------');
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);
            let key = CompanyId+'~'+data.Equipment;
            await storeSource.UpdateSource(transactionContext, 'IMRC', 'P01', 'machine01', 'Energy', '3', 'Eletronic','No','No','CO2');
            let ret = JSON.parse(await chaincodeStub.getState(key));
            let expected = {
                Process: 'P01',
                Equipment: 'machine01',
                Materials: 'Energy',
                Category: '3',
                EmissionType: 'Eletronic',
                BiomassEnergy: 'No',
                Cogeneration: 'No',
                GasType: 'CO2',
            };
            expect(ret).to.eql(expected);
            console.log(ret);
        });
    });

    describe('Test Delete', () => {
        it('should return error on Delete', async () => {
            let storeSource = new StoreSource();
            console.log('-------------delete source IMRC~machine02--------------');
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);

            try {
                await storeSource.DeleteSource(transactionContext, 'IMRC','machine02');
                assert.fail('Delete should have failed');
            } catch (err) {
                expect(err.message).to.equal('machine02 does not exist at IMRC');
                console.log(err.message);
            }
        });

        it('should return success on Delete', async () => {
            let storeSource = new StoreSource();
            console.log('-------------delete source IMRC~machine01--------------');
            await storeSource.CreateSource(transactionContext, CompanyId,data.Process, data.Equipment, data.Materials, data.Category, data.EmissionType,data.BiomassEnergy,data.Cogeneration,data.GasType);
            let key = CompanyId+'~'+data.Equipment;
            await storeSource.DeleteSource(transactionContext, 'IMRC','machine01');
            let ret = await chaincodeStub.getState(key);
            expect(ret).to.equal(undefined);
            console.log(ret);
        });
    });
});

