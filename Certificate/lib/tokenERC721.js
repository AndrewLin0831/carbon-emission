/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

// Define objectType names for prefix
const balancePrefix = 'balance';
const nftPrefix = 'nft';
const approvalPrefix = 'approval';
const CompanyOnSiteRecord = 'TimeRecord';//[company][TimeTag]
const CompanyPrefix = 'Company';//[company,account]
const AccountPrefix = 'Account';//[account,company]
// Define key names for options
const nameKey = 'name';
const symbolKey = 'symbol';

class TokenERC721Contract extends Contract {
    /**
     * BalanceOf counts all non-fungible tokens assigned to an account
     *
     * @param {Context} ctx the transaction context
     * @param {String} account An account for whom to query the balance
     * @returns {Number} The number of non-fungible tokens owned by the account, possibly zero
     */
    async getCompanyAccount(ctx,Company) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);
        const CompanyExist = await ctx.stub.getStateByPartialCompositeKey(CompanyPrefix, [Company]);
        let result = await CompanyExist.next();
        while (!result.done) {
            result=result.value.key;
            const parts = result.split('\u0000');
            const account = parts.filter(part => part !== '').pop();
            return account;
        }
        return `This Company: ${Company} not registered.`;
    }
    async getCompany(ctx) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);
        const account = ctx.clientIdentity.getID();
        const AccountExist = await ctx.stub.getStateByPartialCompositeKey(AccountPrefix, [account]);
        let result = await AccountExist.next();
        while (!result.done) {
            result=result.value.key;
            const parts = result.split('\u0000');
            const company = parts.filter(part => part !== '').pop();
            return company;
        }
        return `This Account: ${account} not registered.`;
    }
    async CompanyBinding(ctx, Company) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);
        const account = ctx.clientIdentity.getID();
        const CompanyExist = await ctx.stub.getStateByPartialCompositeKey(CompanyPrefix, [Company]);
        const AccountExist = await ctx.stub.getStateByPartialCompositeKey(AccountPrefix, [account]);
        let result = await CompanyExist.next();
        while (!result.done) {
            throw new Error('this Company already registered.');
        }
        result = await AccountExist.next();
        while (!result.done) {
            throw new Error('this Account already registered.');
        }  
        const CompanyKey = await ctx.stub.createCompositeKey(CompanyPrefix, [Company,account]);
        await ctx.stub.putState(CompanyKey, Buffer.from('\u0000'));
        const AccountKey = await ctx.stub.createCompositeKey(AccountPrefix, [account,Company]); 
        await ctx.stub.putState(AccountKey, Buffer.from('\u0000'));          
        return true;
    }
    async BalanceOf(ctx, Company) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        // There is a key record for every non-fungible token in the format of balancePrefix.account.tokenId.
        // BalanceOf() queries for and counts all records matching balancePrefix.account.*
        const iterator = await ctx.stub.getStateByPartialCompositeKey(balancePrefix, [Company]);

        // Count the number of returned composite keys
        let balance = 0;
        let result = await iterator.next();
        while (!result.done) {
            balance++;
            result = await iterator.next();
        }
        return balance;
    }
    async NFTStartTimeTag(ctx,Company) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);
        /*const clientAccountID = ctx.clientIdentity.getID();*/
        // There is a key record for every non-fungible token in the format of balancePrefix.account.tokenId.
        // BalanceOf() queries for and counts all records matching balancePrefix.account.*
        let CompanyLastRecord = "";
        const iterator = await ctx.stub.getStateByPartialCompositeKey(CompanyOnSiteRecord, [Company]);
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
            CompanyLastRecord=record.TimeTag;
            result = await iterator.next();
        }
        if(CompanyLastRecord!=""){
            return CompanyLastRecord; 
        }
        else{
            return false;
        }
    }
    /**
     * OwnerOf finds the account of a non-fungible token
     *
     * @param {Context} ctx the transaction context
     * @param {String} tokenId The identifier for a non-fungible token
     * @returns {String} Return the account of the non-fungible token
     */
    async OwnerOf(ctx, tokenId) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const nft = await this._readNFT(ctx, tokenId);
        const owner = nft.owner;
        if (!owner) {
            throw new Error('No owner is assigned to this token');
        }

        return owner;
    }

    /**
     * TransferFrom transfers the ownership of a non-fungible token
     * from one owner to another owner
     *
     * @param {Context} ctx the transaction context
     * @param {String} from The current owner of the non-fungible token
     * @param {String} to The new owner
     * @param {String} tokenId the non-fungible token to transfer
     * @returns {Boolean} Return whether the transfer was successful or not
     */
/*    async TransferFrom(ctx, from, to, tokenId) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const sender = ctx.clientIdentity.getID();

        const nft = await this._readNFT(ctx, tokenId);

        // Check if the sender is the current owner, an authorized operator,
        // or the approved client for this non-fungible token.
        const owner = nft.owner;
        const tokenApproval = nft.approved;
        const operatorApproval = await this.IsApprovedForAll(ctx, owner, sender);
        if (owner !== sender && tokenApproval !== sender && !operatorApproval) {
            throw new Error('The sender is not allowed to transfer the non-fungible token');
        }

        // Check if `from` is the current owner
        if (owner !== from) {
            throw new Error('The from is not the current owner.');
        }

        // Clear the approved client for this non-fungible token
        nft.approved = '';

        // Overwrite a non-fungible token to assign a new owner.
        nft.owner = to;
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenId]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));

        // Remove a composite key from the balance of the current owner
        const balanceKeyFrom = ctx.stub.createCompositeKey(balancePrefix, [from, tokenId]);
        await ctx.stub.deleteState(balanceKeyFrom);

        // Save a composite key to count the balance of a new owner
        const balanceKeyTo = ctx.stub.createCompositeKey(balancePrefix, [to, tokenId]);
        await ctx.stub.putState(balanceKeyTo, Buffer.from('\u0000'));

        // Emit the Transfer event
        const tokenIdInt = parseInt(tokenId);
        const transferEvent = { from: from, to: to, tokenId: tokenIdInt };
        ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify(transferEvent)));

        return true;
    }*/

    /**
     * Approve changes or reaffirms the approved client for a non-fungible token
     *
     * @param {Context} ctx the transaction context
     * @param {String} approved The new approved client
     * @param {String} tokenId the non-fungible token to approve
     * @returns {Boolean} Return whether the approval was successful or not
     */
    async Approve(ctx, approved, tokenId) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const sender = ctx.clientIdentity.getID();

        const nft = await this._readNFT(ctx, tokenId);

        // Check if the sender is the current owner of the non-fungible token
        // or an authorized operator of the current owner
        const owner = nft.owner;
        const operatorApproval = await this.IsApprovedForAll(ctx, owner, sender);
        if (owner !== sender && !operatorApproval) {
            throw new Error('The sender is not the current owner nor an authorized operator');
        }

        // Update the approved client of the non-fungible token
        nft.approved = approved;
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenId]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));

        // Emit the Approval event
        const tokenIdInt = parseInt(tokenId);
        const approvalEvent = { owner: owner, approved: approved, tokenId: tokenIdInt };
        ctx.stub.setEvent('Approval', Buffer.from(JSON.stringify(approvalEvent)));

        return true;
    }

    /**
     * SetApprovalForAll enables or disables approval for a third party ("operator")
     * to manage all of message sender's assets
     *
     * @param {Context} ctx the transaction context
     * @param {String} operator A client to add to the set of authorized operators
     * @param {Boolean} approved True if the operator is approved, false to revoke approval
     * @returns {Boolean} Return whether the approval was successful or not
     */
    async SetApprovalForAll(ctx, operator, approved) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const sender = ctx.clientIdentity.getID();

        const approval = { owner: sender, operator: operator, approved: approved };
        const approvalKey = ctx.stub.createCompositeKey(approvalPrefix, [sender, operator]);
        await ctx.stub.putState(approvalKey, Buffer.from(JSON.stringify(approval)));

        // Emit the ApprovalForAll event
        const approvalForAllEvent = { owner: sender, operator: operator, approved: approved };
        ctx.stub.setEvent('ApprovalForAll', Buffer.from(JSON.stringify(approvalForAllEvent)));

        return true;
    }

    /**
     * GetApproved returns the approved client for a single non-fungible token
     *
     * @param {Context} ctx the transaction context
     * @param {String} tokenId the non-fungible token to find the approved client for
     * @returns {Object} Return the approved client for this non-fungible token, or null if there is none
     */
    async GetApproved(ctx, tokenId) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const nft = await this._readNFT(ctx, tokenId);
        return nft.approved;
    }

    /**
     * IsApprovedForAll returns if a client is an authorized operator for another client
     *
     * @param {Context} ctx the transaction context
     * @param {String} owner The client that owns the non-fungible tokens
     * @param {String} operator The client that acts on behalf of the owner
     * @returns {Boolean} Return true if the operator is an approved operator for the owner, false otherwise
     */
    async IsApprovedForAll(ctx, owner, operator) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const approvalKey = ctx.stub.createCompositeKey(approvalPrefix, [owner, operator]);
        const approvalBytes = await ctx.stub.getState(approvalKey);
        let approved;
        if (approvalBytes && approvalBytes.length > 0) {
            const approval = JSON.parse(approvalBytes.toString());
            approved = approval.approved;
        } else {
            approved = false;
        }

        return approved;
    }

    // ============== ERC721 metadata extension ===============

    /**
     * Name returns a descriptive name for a collection of non-fungible tokens in this contract
     *
     * @param {Context} ctx the transaction context
     * @returns {String} Returns the name of the token
     */
    async Name(ctx) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const nameAsBytes = await ctx.stub.getState(nameKey);
        return nameAsBytes.toString();
    }

    /**
     * Symbol returns an abbreviated name for non-fungible tokens in this contract.
     *
     * @param {Context} ctx the transaction context
     * @returns {String} Returns the symbol of the token
    */
    async Symbol(ctx) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const symbolAsBytes = await ctx.stub.getState(symbolKey);
        return symbolAsBytes.toString();
    }

    /**
     * TokenURI returns a distinct Uniform Resource Identifier (URI) for a given token.
     *
     * @param {Context} ctx the transaction context
     * @param {string} tokenId The identifier for a non-fungible token
     * @returns {String} Returns the URI of the token
    */
    async TokenURI(ctx, tokenId) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const nft = await this._readNFT(ctx, tokenId);
        return nft.tokenURI;
    }

    // ============== ERC721 enumeration extension ===============

    /**
     * TotalSupply counts non-fungible tokens tracked by this contract.
     *
     * @param {Context} ctx the transaction context
     * @returns {Number} Returns a count of valid non-fungible tokens tracked by this contract,
     * where each one of them has an assigned and queryable owner.
     */
    async TotalSupply(ctx) {
        // Check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        // There is a key record for every non-fungible token in the format of nftPrefix.tokenId.
        // TotalSupply() queries for and counts all records matching nftPrefix.*
        const iterator = await ctx.stub.getStateByPartialCompositeKey(nftPrefix, []);

        // Count the number of returned composite keys
        let totalSupply = 0;
        let result = await iterator.next();
        while (!result.done) {
            totalSupply++;
            result = await iterator.next();
        }
        return totalSupply;
    }

    // ============== Extended Functions for this sample ===============

    /**
     * Set optional information for a token.
     *
     * @param {Context} ctx the transaction context
     * @param {String} name The name of the token
     * @param {String} symbol The symbol of the token
     */
    async Initialize(ctx, name, symbol) {

        // Check minter authorization - this sample assumes Org1 is the issuer with privilege to initialize contract (set the name and symbol)
        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (clientMSPID !== 'Org1MSP') {
            throw new Error('client is not authorized to set the name and symbol of the token');
        }

        // Check contract options are not already set, client is not authorized to change them once intitialized
        const nameBytes = await ctx.stub.getState(nameKey);
        if (nameBytes && nameBytes.length > 0) {
            throw new Error('contract options are already set, client is not authorized to change them');
        }

        await ctx.stub.putState(nameKey, Buffer.from(name));
        await ctx.stub.putState(symbolKey, Buffer.from(symbol));
        return true;
    }

    /**
     * Mint a new non-fungible token.
     *
     * @param {Context} ctx the transaction context
     * @param {String} Company The company that will own the minted NFT.
     * @param {String} emissionValue Emission value for the NFT.
     * @param {String} timeTag The time tag for NFT's emission end time.
     * @param {String} errorRate The error rate associated with the NFT.
     * @returns {Object} Return the newly minted NFT object.
     */
    async Mint(ctx, Company, emissionValue, timeTag, errorRate) { 
        // 確認合約已初始化
        await this.CheckInitialized(ctx);
        
        // 取得該公司的最後一次鑄造開始時間
        const startTime = await this.NFTStartTimeTag(ctx, Company);
        
        // 計算初始 tokenID 為現有總供應量加 1
        let tokenIdInt = parseInt(await this.TotalSupply(ctx)) + 1;
        let tokenIdStr = tokenIdInt.toString();

        // 檢查 tokenID 是否已被 mint 過，若已存在則遞增直到找到尚未被 mint 的 tokenID
        while (await this._nftExists(ctx, tokenIdStr)) {
            tokenIdInt++;
            tokenIdStr = tokenIdInt.toString();
        }
        
        // 檢查 tokenId 是否為有效整數
        if (isNaN(tokenIdInt)) {
            throw new Error(`The tokenId ${tokenIdStr} is invalid. tokenId must be an integer.`);
        }
        
        // 建立 NFT 物件
        const nft = {
            tokenId: tokenIdInt,
            owner: Company,
            emissionValue: emissionValue,
            emissionStartTime: startTime,
            emissionEndTime: timeTag,
            errorRate: errorRate
        };
        
        // 建立 NFT 的 composite key 並存入帳本
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenIdStr]);
        await ctx.stub.putState(nftKey, Buffer.from(JSON.stringify(nft)));
        
        // 建立 balance 的 composite key，使用 null 字元代表該持有記錄
        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [Company, tokenIdStr]);
        await ctx.stub.putState(balanceKey, Buffer.from('\u0000'));
        
        // 更新公司發行記錄，記錄最新的 timeTag
        const recordKey = ctx.stub.createCompositeKey(CompanyOnSiteRecord, [Company]);
        const timeRecord = {
            TimeTag: timeTag
        };
        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(timeRecord)));
        
        // 發布 Mint 事件，表示 NFT 已鑄造完成
        const transferEvent = { from: '0x0', to: Company, tokenId: tokenIdInt };
        ctx.stub.setEvent('Mint', Buffer.from(JSON.stringify(transferEvent)));
        
        return nft;
    }

    /**
     * Burn a non-fungible token
     *
     * @param {Context} ctx the transaction context
     * @param {String} tokenId Unique ID of a non-fungible token
     * @returns {Boolean} Return whether the burn was successful or not
     */
    async Burn(ctx,tokenId) {
        // check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        const account = ctx.clientIdentity.getID();
        //getCompany
        const Company = await this.getCompany(ctx);
        // Check if a caller is the owner of the non-fungible token
        const nft = await this._readNFT(ctx, tokenId);

        if (nft.owner !== Company) {
            throw new Error(`Non-fungible token ${tokenId} is not owned by ${Company}`);
        }
        // Delete the token
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenId]);
        await ctx.stub.deleteState(nftKey);

        // Remove a composite key from the balance of the owner
        const balanceKey = ctx.stub.createCompositeKey(balancePrefix, [Company, tokenId]);
        await ctx.stub.deleteState(balanceKey);

        // Emit the Transfer event
        const tokenIdInt = parseInt(tokenId);
        const transferEvent = { from: account, to: '0x0', tokenId: tokenIdInt };
        ctx.stub.setEvent('Burn', Buffer.from(JSON.stringify(transferEvent)));

        return true;
    }

    async _readNFT(ctx, tokenId) {
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenId]);
        const nftBytes = await ctx.stub.getState(nftKey);
        if (!nftBytes || nftBytes.length === 0) {
            throw new Error(`The tokenId ${tokenId} is invalid. It does not exist`);
        }
        const nft = JSON.parse(nftBytes.toString());
        return nft;
    }

    async _nftExists(ctx, tokenId) {
        const nftKey = ctx.stub.createCompositeKey(nftPrefix, [tokenId]);
        const nftBytes = await ctx.stub.getState(nftKey);
        return nftBytes && nftBytes.length > 0;
    }

    /**
     * ClientAccountBalance returns the balance of the requesting client's account.
     *
     * @param {Context} ctx the transaction context
     * @returns {Number} Returns the account balance
     */
    async ClientAccountBalance(ctx) {
        // check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        // Get ID of submitting client identity
        const clientAccountID = ctx.clientIdentity.getID();
        return this.BalanceOf(ctx, clientAccountID);
    }

    // ClientAccountID returns the id of the requesting client's account.
    // In this implementation, the client account ID is the clientId itself.
    // Users can use this function to get their own account id, which they can then give to others as the payment address
    async ClientAccountID(ctx) {
        // check contract options are already set first to execute the function
        await this.CheckInitialized(ctx);

        // Get ID of submitting client identity
        const clientAccountID = ctx.clientIdentity.getID();
        return clientAccountID;
    }

    // Checks that contract options have been already initialized
    async CheckInitialized(ctx){
        const nameBytes = await ctx.stub.getState(nameKey);
        if (!nameBytes || nameBytes.length === 0) {
            throw new Error('contract options need to be set before calling any function, call Initialize() to initialize contract');
        }
    }
}

module.exports = TokenERC721Contract;
