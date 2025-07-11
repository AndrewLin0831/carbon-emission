/* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
//carbon json schema
const schema_createData = {
    type: "object",
    properties: {
          DeviceId: {
            description: "deviceId for carbon emission",
            type: "string"
          },
          TimeTag: {
            description: "timeTag for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time"
          },
          OrderId: {
            description: "orderId for carbon emission",
            type: "string"
          },
          Consumption: {
            description: "consumption for carbon emission",
            type: "number",
            minimum: 0
          },
          EmissionFactor: {
            description: "emissionFactor for carbon emission",
            type: "number",
            minimum: 0
          },
          Value: {
            description: "value for carbon emission",
            type: "number",
            minimum: 0
          }
      },
      required: [ "DeviceId","TimeTag","OrderId","Consumption","EmissionFactor","Value"]
};
//new
const schema_createData1 = {
    type: "object",
    properties: {
          FactoryCode: {
            description: "factoryId for carbon emission",
            type: "string"
          },
          WorkshopCode: {
            description: "workshopId for carbon emission",
            type: "string"
          },
          SystemCode: {
            description: "systemId for carbon emission",
            type: "string"
          },
          EquipmentCode: {
            description: "equipmentId for carbon emission",
            type: "string"
          },
          TimeTag: {
            description: "timeTag for data entry",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time"
          },
          TimeRangeStart: {
            description: "timeTag for the start of carbon emission records",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time"
          },
          TimeRangeEnd: {
            description: "timeTag for the end of carbon emission records",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}$",
            format: "date-time"
          },
          Consumption: {
            description: "consumption for carbon emission",
            type: "number",
            minimum: 0
          },
          EmissionFactor: {
            description: "emissionFactor for carbon emission",
            type: "number",
            minimum: 0
          },
          Value: {
            description: "value for carbon emission",
            type: "number",
            minimum: 0
          }
      },
      required: [ "FactoryCode","WorkshopCode","SystemCode","EquipmentCode","TimeTag","TimeRangeStart","TimeRangeEnd","Consumption","EmissionFactor","Value"]
};
const schema_searchData = {
    type: "object",
    properties: {
          DeviceId: {
            description: "deviceId for carbon emission",
            type: "string"
          },
          StartDateTime: {
            description: "timeTag for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
            format: "date"
          },
          EndDateTime: {
            description: "timeTag for carbon emission",
            type: "string",
            pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
            format: "date"
          },
      },
      required: [ "DeviceId","StartDateTime","EndDateTime"]
};
//new
const schema_searchData1 = {
  type: "object",
  properties: {
        EquipmentCode: {
          description: "EquipmentCode for carbon emission",
          type: "string"
        },
        StartDateTime: {
          description: "timeTag for carbon emission",
          type: "string",
          pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
          format: "date"
        },
        EndDateTime: {
          description: "timeTag for carbon emission",
          type: "string",
          pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
          format: "date"
        },
    },
    required: [ "EquipmentCode","StartDateTime","EndDateTime"]
};
class DataTransfer extends Contract {
  //CreateData
   async CreateData(ctx, deviceid, timetag, orderid, consumption, emissionfactor, value) {
       const date_time=timetag.split(" ");
       const key=deviceid+"~"+timetag;
       const exists = await this.DataExists(ctx,key);
       if (exists) {
           throw new Error(`The data already exists`);
       }
       const data = {
           Key: key,
           DeviceId: deviceid,
           TimeTag: timetag,
           OrderId: orderid,
           Consumption: consumption,
           EmissionFactor: emissionfactor,
           Value: value,
       };
       const create_inspection={
           DeviceId: deviceid,
           TimeTag: timetag,
           OrderId: orderid,
           Consumption: Number(consumption),
           EmissionFactor: Number(emissionfactor),
           Value: Number(value),
       };
       await this.CreateDataFormat(create_inspection);
       await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
       return true;
   }
   //new
   async CreateData1(ctx, dateTime, timeRangeStart, timeRangeEnd, factoryCode, workshopCode, systemCode, equipmentCode, consumption, emissionFactor, value) {
        // 使用傳入的 dateTime 當作 TimeTag
        const timetag = dateTime;
        // 以 EquipmentCode 與 timetag 組成唯一 key
        const key = equipmentCode + "~" + timetag;
        const exists = await this.DataExists(ctx, key);
        if (exists) {
            throw new Error(`The data already exists`);
        }
        // 組合完整資料物件，包含所有相關欄位
        const data = {
            Key: key,
            FactoryCode: factoryCode,
            WorkshopCode: workshopCode,
            SystemCode: systemCode,
            EquipmentCode: equipmentCode,
            TimeTag: timetag,
            TimeRangeStart: timeRangeStart,
            TimeRangeEnd: timeRangeEnd,
            Consumption: consumption,
            EmissionFactor: emissionFactor,
            Value: value,
        };
        // 準備資料檢查物件，將數值欄位轉為 Number
        const create_inspection1 = {
            FactoryCode: factoryCode,
            WorkshopCode: workshopCode,
            SystemCode: systemCode,
            EquipmentCode: equipmentCode,
            TimeTag: timetag,
            TimeRangeStart: timeRangeStart,
            TimeRangeEnd: timeRangeEnd,
            Consumption: Number(consumption),
            EmissionFactor: Number(emissionFactor),
            Value: Number(value),
        };
        await this.CreateDataFormat1(create_inspection1);
        await ctx.stub.putState(key, Buffer.from(stringify(sortKeysRecursive(data))));
        return true;
    }


   // ReadData
   async ReadData(ctx, key) {
       const DataJSON = await ctx.stub.getState(key); // get the asset from chaincode state
       if (!DataJSON || DataJSON.length === 0) {
           throw new Error(`The data ${timetag} does not exist`);
       }
       return DataJSON.toString();
   }
   
   // DataExists
   async DataExists(ctx, key) {
       const assetJSON = await ctx.stub.getState(key);
       return assetJSON && assetJSON.length > 0;
   }
   //CreateDataFormat
   async CreateDataFormat(data){
      const ajv = new Ajv();
      addFormats(ajv);
      const validate = ajv.compile(schema_createData);
      const isValid = validate(data);
      if (!isValid) {
         throw new Error(validate.errors[0].instancePath+" "+validate.errors[0].message);
      }
      let roundDown = function( num, decimal ) { return Math.floor( num * Math.pow( 10, decimal ) ) / Math.pow( 10, decimal ); }
      if(roundDown(data.Value,3)!=roundDown(data.Consumption*data.EmissionFactor,3)){
        throw new Error("Value doesn't match");
      }
   }
   //new
   async CreateDataFormat1(data){
        const ajv = new Ajv();
        addFormats(ajv);
        const validate = ajv.compile(schema_createData1);
        const isValid = validate(data);
        if (!isValid) {
            throw new Error(validate.errors[0].instancePath+" "+validate.errors[0].message);
        }
        let roundDown = function( num, decimal ) { return Math.floor( num * Math.pow( 10, decimal ) ) / Math.pow( 10, decimal ); }
        if(roundDown(data.Value,3)!=roundDown(data.Consumption*data.EmissionFactor,3)){
            throw new Error("Value doesn't match");
        }
    }
   // GetAllData
   async GetAllData(ctx) {
       const allResults = [];
       const iterator = await ctx.stub.getStateByRange('', '');
       let result = await iterator.next();
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
           result = await iterator.next();
       }
       return JSON.stringify(allResults);
   }
   //GetAllDataAmount
  //  async GetAllDataAmount(ctx) {
  //      var allResultsAmount = 0;
  //      const iterator = await ctx.stub.getStateByRange('', '');
  //      let result = await iterator.next();
  //      while (!result.done) {
  //          allResultsAmount=allResultsAmount+1;
  //          result = await iterator.next();
  //      }
  //      return allResultsAmount.toString();
  //  }
   async GetAllDataAmount(ctx) {
    var allResultsAmount = 0;
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();

    while (!result.done) {
        const recordKey = result.value.key;

        let objectType = '';
        try {
            const splitKey = ctx.stub.splitCompositeKey(recordKey);
            objectType = splitKey.objectType;
        } catch (e) {

        }

        // 只有當物件類型不是 'NFT' 時，才增加計數
        if (objectType !== 'NFT') {
            allResultsAmount = allResultsAmount + 1;
        }
        
        result = await iterator.next();
    }
    return allResultsAmount.toString();
}
   //(GetEquipmentCarbonDisclosureInfo)
   async GetData(ctx,deviceid,startDateTime, endDateTime) {
       const allResults = [];
       const search_inspection={
           DeviceId: deviceid,
           StartDateTime: startDateTime,
           EndDateTime: endDateTime,
       };
       await this.SearchDataFormat(search_inspection);
       startDateTime = deviceid+"~"+startDateTime;
       endDateTime=deviceid+"~"+endDateTime;
       const iterator = await ctx.stub.getStateByRange(startDateTime, endDateTime+".0001");
       let result = await iterator.next();
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
           result = await iterator.next();
       }
       return JSON.stringify(allResults);
   }
   async GetData1(ctx,equipmentCode,startDateTime, endDateTime) {
        const allResults = [];
        const search_inspection={
            EquipmentCode: equipmentCode,
            StartDateTime: startDateTime,
            EndDateTime: endDateTime,
        };
        await this.SearchDataFormat1(search_inspection);
        startDateTime = equipmentCode+"~"+startDateTime;
        endDateTime=equipmentCode+"~"+endDateTime;
        const iterator = await ctx.stub.getStateByRange(startDateTime, endDateTime+".0001");
        let result = await iterator.next();
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
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
   //GetDataAmount
   async GetDataAmount(ctx,deviceid,startDateTime, endDateTime) {
       const allResults = [];
       const search_inspection={
           DeviceId: deviceid,
           StartDateTime: startDateTime,
           EndDateTime: endDateTime,
       };
       await this.SearchDataFormat(search_inspection);
       const split_ref_start_date= startDateTime.split('-');
       const split_ref_end_date= endDateTime.split('-');
       const pick_ref_start_date = new Date(split_ref_start_date[1]+"/"+split_ref_start_date[2]+"/"+split_ref_start_date[0]);
       const pick_ref_end_date = new Date(split_ref_end_date[1]+"/"+split_ref_end_date[2]+"/"+split_ref_end_date[0]);
       const from_start_to_end_days = (Math.abs (pick_ref_end_date.getTime()-pick_ref_start_date.getTime()))/(1000 * 3600 * 24);
       const deviceid_startDateTime = deviceid+"~"+startDateTime;
       const deviceid_endDateTime=deviceid+"~"+endDateTime;
       const iterator = await ctx.stub.getStateByRange(deviceid_startDateTime, deviceid_endDateTime+".0001");
       for (var i =0;i<=from_start_to_end_days;i++){
         allResults.push(0);
       }
       let result = await iterator.next();
       while (!result.done) {
           const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
           let record;
           try {
               record = JSON.parse(strValue);
               const new_date = record.TimeTag.split(' ');
               const split_new_date = new_date[0].split('-');
               const pick_new_date=new Date(split_new_date[1]+"/"+split_new_date[2]+"/"+split_new_date[0]);
               const from_start_to_new_days = (Math.abs (pick_new_date.getTime()-pick_ref_start_date.getTime()))/(1000 * 3600 * 24);
               allResults[from_start_to_new_days]=allResults[from_start_to_new_days]+1;
           } catch (err) {
               console.log(err);
               record = strValue;
           }
           result = await iterator.next();
       }
       return allResults;
   }
   async GetDataAmount1(ctx,equipmentCode,startDateTime, endDateTime) {
      const allResults = [];
      const search_inspection={
          EquipmentCode: equipmentCode,
          StartDateTime: startDateTime,
          EndDateTime: endDateTime,
      };
      await this.SearchDataFormat1(search_inspection);
      const split_ref_start_date= startDateTime.split('-');
      const split_ref_end_date= endDateTime.split('-');
      const pick_ref_start_date = new Date(split_ref_start_date[1]+"/"+split_ref_start_date[2]+"/"+split_ref_start_date[0]);
      const pick_ref_end_date = new Date(split_ref_end_date[1]+"/"+split_ref_end_date[2]+"/"+split_ref_end_date[0]);
      const from_start_to_end_days = (Math.abs (pick_ref_end_date.getTime()-pick_ref_start_date.getTime()))/(1000 * 3600 * 24);
      const equipmentCode_startDateTime = equipmentCode+"~"+startDateTime;
      const equipmentCode_endDateTime=equipmentCode+"~"+endDateTime;
      const iterator = await ctx.stub.getStateByRange(equipmentCode_startDateTime, equipmentCode_endDateTime+".0001");
      for (var i =0;i<=from_start_to_end_days;i++){
        allResults.push(0);
      }
      let result = await iterator.next();
      while (!result.done) {
          const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
          let record;
          try {
              record = JSON.parse(strValue);
              const new_date = record.TimeTag.split(' ');
              const split_new_date = new_date[0].split('-');
              const pick_new_date=new Date(split_new_date[1]+"/"+split_new_date[2]+"/"+split_new_date[0]);
              const from_start_to_new_days = (Math.abs (pick_new_date.getTime()-pick_ref_start_date.getTime()))/(1000 * 3600 * 24);
              allResults[from_start_to_new_days]=allResults[from_start_to_new_days]+1;
          } catch (err) {
              console.log(err);
              record = strValue;
          }
          result = await iterator.next();
      }
      return allResults;
  }
// 取得所有紀錄中 Value 欄位的加總值（沒有任何 input）
  async GetTotalValueSum(ctx) {
    let totalValue = 0;
    // 取得全域範圍內的所有資料
    const iterator = await ctx.stub.getStateByRange('', '');
    let result = await iterator.next();
    
    // 遍歷所有紀錄
    while (!result.done) {
        try {
            const recordStr = result.value.value.toString('utf8');
            const record = JSON.parse(recordStr);
            // 若該筆資料具有 Value 欄位，則累計其值
            if (record.hasOwnProperty("Value")) {
                totalValue += Number(record.Value);
            }
        } catch (error) {
            console.log("解析紀錄錯誤：", error);
        }
        result = await iterator.next();
    }
    
    return totalValue.toString();
  }


    //SearchDataFormat
    async SearchDataFormat(data){
        const ajv = new Ajv();
        addFormats(ajv);
        const validate = ajv.compile(schema_searchData);
        const isValid = validate(data);
        if (!isValid) {
          throw new Error(validate.errors[0].instancePath+" "+validate.errors[0].message);
        }
    }
    //new
    async SearchDataFormat1(data){
      const ajv = new Ajv();
      addFormats(ajv);
      const validate = ajv.compile(schema_searchData1);
      const isValid = validate(data);
      if (!isValid) {
        throw new Error(validate.errors[0].instancePath+" "+validate.errors[0].message);
      }
  }
  async GetTimeRangeData(ctx,startDateTime,endDateTime) {
    const allResults = [];
    
    // 由於資料 key 是 equipmentCode ~ timetag，因此如果不限定設備代碼，
    // 可利用 getStateByRange 查詢全部資料（"" 至 "\uffff"）
    const iterator = await ctx.stub.getStateByRange("", "\uffff");
    let result = await iterator.next();
    
    while (!result.done) {
        // 取得目前 key
        const key = result.value.key;
        // 假設 key 格式為 "equipmentCode~timetag"
        const parts = key.split("~");
        
        // 確保 key 格式正確（包含 equipmentCode 與 timetag）
        if (parts.length >= 2) {
            const timetag = parts[1];
            // 判斷 timetag 是否在指定時間範圍內（這裡預期時間格式可以直接字串比較）
            if (timetag >= startDateTime && timetag <= endDateTime) {
                const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
                let record;
                try {
                    record = JSON.parse(strValue);
                } catch (err) {
                    console.log("解析資料錯誤:", err);
                    record = strValue;
                }
                allResults.push(record);
            }
        }
        result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
  async GetSpotList(ctx,startDateTime, endDateTime) {
    try {
      const dataStr = await this.GetTimeRangeData(ctx,startDateTime, endDateTime);
      const records = JSON.parse(dataStr);
  
      // 建立一個物件來統計每個 EquipmentCode 的 Value 累計值
      const equipmentSum = {};
  
      // 遍歷所有記錄，對每個設備的 Value 進行累加
      records.forEach(record => {
        const equipmentCode = record.EquipmentCode;  // 例如 "do1" 或 "do2"
        // 轉換 Value 為數字，若轉換失敗則預設為 0
        const value = parseFloat(record.Value) || 0;
  
        if (equipmentSum.hasOwnProperty(equipmentCode)) {
          equipmentSum[equipmentCode] += value;
        } else {
          equipmentSum[equipmentCode] = value;
        }
      });
  
      // 將統計結果轉換為陣列，每一筆包含設備代碼與累計總和
      const resultArray = Object.keys(equipmentSum).map(code => ({
        EquipmentCode: code,
        TotalValue: equipmentSum[code]
      }));
  
      // 依照你的需求，以 JSON 格式字串回傳結果
      return JSON.stringify(resultArray);
    } catch (error) {
      console.error("GetSpotList 發生錯誤：", error);
      throw error;
    }
  }
  // 私有：讀取並更新 NFT 序號計數器
  async _getNextID(ctx) {
    const counterKey = 'nftCounter';
    const buf = await ctx.stub.getState(counterKey);
    const counter = buf && buf.length
      ? parseInt(buf.toString(), 10)
      : 0;
    await ctx.stub.putState(counterKey, Buffer.from((counter + 1).toString()));
    return counter;
  }

  // 1. 計算並鑄造 NFT
  async FunitCal(ctx, spotListJSON) {
    // 解析參數
    let spotList;
    try {
      spotList = JSON.parse(spotListJSON);
      if (!Array.isArray(spotList)) {
        throw new Error('spotList 不是陣列');
      }
    } catch (err) {
      throw new Error(`傳入的 spotList 不是合法的 JSON 陣列: ${err.message}`);
    }

    // 計算 sumTotal、sumCombined
    let sumTotal = 0, sumCombined = 0;
    for (const item of spotList) {
      sumTotal    += parseFloat(item.TotalValue)  || 0;
      sumCombined += parseFloat(item.OnSiteValue) || 0;
    }

    // 計算 fUnit
    const fUnit = sumCombined !== 0
      ? (sumCombined - sumTotal) / sumCombined
      : 0;

    // 取自增 ID，並產生 composite key
    const seq   = await this._getNextID(ctx);
    const nftID = seq.toString();
    const nftKey = ctx.stub.createCompositeKey('NFT', [ nftID ]);

    // 組 metadata
    const txTimeSec = ctx.stub.getTxTimestamp().seconds.low;
    const timestamp = new Date(txTimeSec * 1000).toISOString();
    const nftAsset = {
      id:          nftID,
      fUnit:       fUnit.toString(),
      sumCombined: sumCombined.toString(),
      createdAt:   timestamp
    };

    // 寫入世界狀態
    await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nftAsset)));

    // 回傳計算結果與 NFT 資訊
    return JSON.stringify({
      fUnit:       fUnit.toString(),
      sumCombined: sumCombined.toString(),
      nft:         nftAsset
    });
  }

  // 2. 查單一 NFT
  async ReadNFT(ctx, nftID) {
    const nftKey = ctx.stub.createCompositeKey('NFT', [ nftID ]);
    const data = await ctx.stub.getState(nftKey);
    if (!data || data.length === 0) {
      throw new Error(`NFT ${nftID} 不存在`);
    }
    return data.toString();
  }

  // 3. 列出所有 NFT
  async QueryAllNFTs(ctx) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey('NFT', []);
    const results = [];
    let res = await iterator.next();
    while (!res.done) {
      const key   = res.value.key;
      const attrs = ctx.stub.splitCompositeKey(key).attributes;
      const nftID = attrs[0];
      const asset = JSON.parse(res.value.value.toString('utf8'));
      results.push({ id: nftID, asset });
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(results);
  }

  // 4. 燒毀（Burn）指定 NFT
  async BurnNFT(ctx, nftID) {
    const nftKey = ctx.stub.createCompositeKey('NFT', [ nftID ]);
    const data = await ctx.stub.getState(nftKey);
    if (!data || data.length === 0) {
      throw new Error(`NFT ${nftID} 不存在，無法燒毀`);
    }
    await ctx.stub.deleteState(nftKey);
    return JSON.stringify({
      message: `NFT ${nftID} 已燒毀`,
      id:      nftID
    });
  }

  
  
}

module.exports = DataTransfer;