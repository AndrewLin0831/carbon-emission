
const WalletApp={
    Connect:async function(){
        document.getElementById('wallet-button').disabled=true;
        try{
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });;
                var account = accounts[0]; 
                await $.ajax({
                    type: "POST",
                    url: "/connectWallet",
                    data: {
                        account: account
                    },               
                    success: function (data) {
                        catch_result(data);
                    },
                    error: function (err) {
                        alert(err);
                    }            
                });
                document.getElementById('wallet-button').disabled=false;
                function catch_result(result) {
                        const walletname = document.getElementById('wallet-name');
                        walletname.innerHTML = result[0]+result[1]+result[2]+result[3]+result[4]+result[5]+'...';
                        WalletApp.BalanceOf();
                        reloading_retireInfo();
                        reloading_membership();
                }
              }
            else {
                alert('you need install metamask');
                document.getElementById('wallet-button').disabled=false;
            }
          }
        catch(err){
          alert(err)
          document.getElementById('wallet-button').disabled=false;
        }
    },
    BalanceOf:async function(){
        await $.ajax({
            type: "GET",
            url: "/userInfo/getCarbonTokenBalance",
            data: {
            },               
            success: function (data) {
                catch_token_result(data);
            },
            error: function (err) {
                alert(err);
            }            
        });

        function catch_token_result(result) {
            const CarbonTokenBalanceOf = document.getElementById('CarbonTokenBalanceOf');
            CarbonTokenBalanceOf.innerHTML = result;
        }
        await $.ajax({
            type: "GET",
            url: "/userInfo/getCarbonNFTBalance",
            data: {
            },               
            success: function (data) {
                catch_nft_result(data);
            },
            error: function (err) {
                alert(err);
            }            
        });

        function catch_nft_result(result) {
            const CarbonNFTBalanceOf = document.getElementById('CarbonNFTBalanceOf');
            CarbonNFTBalanceOf.innerHTML = result;
        }
    },
    MaxSupply:async function(){

    },
    Disconnect:async function(){

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