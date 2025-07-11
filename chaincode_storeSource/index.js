/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const dataTransfer = require('./lib/emission_storeSource');

module.exports.DataTransfer = dataTransfer;
module.exports.contracts = [dataTransfer];
