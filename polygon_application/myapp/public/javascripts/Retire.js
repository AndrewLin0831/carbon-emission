var web3 ='';
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
  }
const RetireApp={
    RetireEnroll: async function(){
      const id= document.getElementById("RetireEnroll_id").value;
      const name=document.getElementById("RetireEnroll_name").value;
      document.getElementById('button_RetireEnroll').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/Company/enrollRetirementFactory",
            data: {
              id: id,
              name: name
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
        async function catch_result(result) {
          try{
            const RetireContract = new web3.eth.Contract(result[0].abi,result[2]);
            await RetireContract.methods.setEnrollment(id,name).send({ from: result[1] });
            RetireApp.setAlarm("RetireEnroll_status",'Registry Complete!','success');
            document.getElementById('button_RetireEnroll').disabled=false;
            }
            catch(err){
                RetireApp.setAlarm("RetireEnroll_status",'fail','danger');
                document.getElementById('button_RetireEnroll').disabled=false;
            }
        }
    },

    NFTRetired:async function(){
      const id= document.getElementById("NFTRetired_tokenId").value;
      document.getElementById('button_NFTRetired').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/RetirementFactory/retirementNFT",
            data: {
              id: id
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
            await NFTContract.methods.Retired(id).send({ from: result[1] });
            RetireApp.setAlarm("NFTRetired_status",'Retire Complete!','success');
            reloading_retireInfo();
            document.getElementById('button_NFTRetired').disabled=false;
            }
            catch(err){
                RetireApp.setAlarm("NFTRetired_status",'fail','danger');
                document.getElementById('button_NFTRetired').disabled=false;
            }
        }
    },

    TokenRetired:async function(){
      const amount= document.getElementById("TokenRetired_Amount").value;
      document.getElementById('button_TokenRetired').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/RetirementFactory/retirementToken",
            data: {
              amount: amount
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
        async function catch_result(result) {
          try{
            const TokenContract = new web3.eth.Contract(result[0].abi,result[3]);
            await TokenContract.methods.Retire(result[2]).send({ from: result[1] });
            RetireApp.setAlarm("TokenRetired_status",'Retire Complete!','success');
            WalletApp.BalanceOf();
            reloading_retireInfo();
            document.getElementById('button_TokenRetired').disabled=false;
            }
            catch(err){
                RetireApp.setAlarm("TokenRetired_status",err,'danger');
                document.getElementById('button_TokenRetired').disabled=false;
            }
        }
    },
    
    SearchCompanyRetire:async function(){
     const id= document.getElementById("SearchRetired_Id").value;
     document.getElementById('button_SearchRetired').disabled=true;
        await $.ajax({
            type: "GET",
            url: "/Company/getRetirementInfo",
            data: {
              id: id,
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
      function catch_result(result) {
            RetireApp.setAlarm("SearchRetired_status",result,'success');
            document.getElementById('button_SearchRetired').disabled=false;
        }
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