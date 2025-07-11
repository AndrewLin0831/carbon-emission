/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const dataTransfer = require('./lib/reputation');

module.exports.DataTransfer = dataTransfer;
module.exports.contracts = [dataTransfer];
