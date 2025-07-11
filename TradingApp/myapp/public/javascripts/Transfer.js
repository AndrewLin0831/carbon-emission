var web3 ='';
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
  }
const TansferApp={
    fraction:async function(){
        const tokenId= document.getElementById("fraction_id").value;
        document.getElementById('button_fraction').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/CarbonTokenFactory/fractionNFT",
            data: {
                tokenId: tokenId
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });

        async function catch_result(result) {
          try{
            const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
            await NFTContract.methods.fraction(tokenId).send({ from: result[1] });
            WalletApp.BalanceOf();
            TansferApp.setAlarm("fraction_status",'Fraction Complete!','success');
            document.getElementById('button_fraction').disabled=false;
            }
            catch(err){
                TansferApp.setAlarm("fraction_status",'fail','danger');
                document.getElementById('button_fraction').disabled=false;
            }
        }
    },
    TokenTransfer:async function(){
      const tokenAmount= document.getElementById("TokenTransfer_tokenAmount").value;
      const address= document.getElementById("TokenTransfer_address").value;
      document.getElementById('button_TokenTransfer').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/Transfer/transferToken",
            data: {
              tokenAmount: tokenAmount,
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
      async function catch_result(result) {
          try{
              if(result==false||result=='noWallet'){
                TansferApp.setAlarm("TokenTransfer_status",'fail','danger'); 
                document.getElementById('button_TokenTransfer').disabled=false;
              }
              else{
                const TokenContract = new web3.eth.Contract(result[0].abi,result[3]);
                await TokenContract.methods.transfer(String(address),result[2]).send({ from: result[1] });
                WalletApp.BalanceOf();
                TansferApp.setAlarm("TokenTransfer_status",'Transfer Complete!','success');
                document.getElementById('button_TokenTransfer').disabled=false;
              }
            }
            catch(err){
                TansferApp.setAlarm("TokenTransfer_status",'fail','danger');
                document.getElementById('button_TokenTransfer').disabled=false;
            }
        }
    },
    NFTTransfer:async function(){
      const tokenId= document.getElementById("NFTTransfer_tokenId").value;
      const address= document.getElementById("NFTTransfer_address").value;
      document.getElementById('button_NFTTransfer').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/Transfer/transferNFT",
            data: {
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
      async function catch_result(result) {
          try{
            const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
            await NFTContract.methods.transferFrom(result[1],address,tokenId).send({ from: result[1] });
            WalletApp.BalanceOf();
            TansferApp.setAlarm("NFTTransfer_status",'Transfer Complete!','success');
            document.getElementById('button_NFTTransfer').disabled=false;
            }
            catch(err){
                TansferApp.setAlarm("NFTTransfer_status",'fail','danger');
                document.getElementById('button_NFTTransfer').disabled=false;
            }
        }
    },
    NFTBalanceOf:async function(){

    },
    TokenBalanceOf:async function(){

    },

//--------------------------------------------------------------------------------------------------------------------------------
    //w: 哪一個id ,m: 訊息,t: 何種型別的信號
    setAlarm: function(w,m,t) {
        const alertPlaceholder = document.getElementById(w);
        alertPlaceholder.innerHTML = '';
        const alert = (message, type) => {
        const wrapper = document.createElement('div')
        wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert" style="height: 50px;font-size: 16px;" >`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
        ].join('')
          alertPlaceholder.append(wrapper)
        }
        alert(m, t);
    },
};