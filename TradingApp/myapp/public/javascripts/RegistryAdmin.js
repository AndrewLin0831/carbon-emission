var web3 ='';
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
  } 
const RegistryAdminApp={
    Enrollment_DataBase: async function(){
        await $.ajax({
            type: "GET",
            url: "/userInfo/searchEnrollmentData",
            data: {
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });

        async function catch_result(result) {
        RegistryAdminApp.showEnrollmentTable(result,'show_enrollment_table');
        $("#enroll_details").removeClass("invisible_block");
        }
    },
    RegistryEnroll: async function(){
        //const address = document.getElementById("RegistryEnroll_address").value;
        const address= document.getElementById("RegistryEnroll_address").value;
        const id= document.getElementById("RegistryEnroll_id").value;
        const name=document.getElementById("RegistryEnroll_name").value;
        document.getElementById('button_RegistryEnroll').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/Company/enrollCarbonNFTFactory",
            data: {
                address: address,
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
            const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
            await NFTContract.methods.setCompanyEnrollment(address,id,name).send({ from: result[1] });
            RegistryAdminApp.setAlarm("RegistryEnroll_status",'Registry Complete!','success');
            RegistryAdminApp.Enrollment_DataBase();
            document.getElementById('button_RegistryEnroll').disabled=false;
            }
            catch(err){
                RegistryAdminApp.setAlarm("RegistryEnroll_status",'fail','danger');
                document.getElementById('button_RegistryEnroll').disabled=false;
            }
        }
    },
    
    Verify_DataBase: async function(){
        await $.ajax({
            type: "GET",
            url: "/CarbonNFTFactory/searchVerifyNFT",
            data: {
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });

        async function catch_result(result) {
        RegistryAdminApp.showVerifyTable(result,'show_verify_table');
        $("#verify_details").removeClass("invisible_block");
        }
    },
    
    Verify:async function(){
        const tokenId= document.getElementById("Verify_id").value;
        document.getElementById("button_verify").disabled=true;
        await $.ajax({
            type: "POST",
            url: "/CarbonNFTFactory/verifyNFT",
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
              await NFTContract.methods.verifyCarbonNft(tokenId).send({ from: result[1] });
              var text = 'NFT ID '+tokenId+' VERIFY!!'
              RegistryAdminApp.setAlarm("Verify_status",text,'success');
              RegistryAdminApp.Verify_DataBase();
              document.getElementById("button_verify").disabled=false;
              WalletApp.Connect();
            }
            catch(err){
                RegistryAdminApp.setAlarm("Verify_status",'fail to verify','danger');
                document.getElementById("button_verify").disabled=false;
            }
        }
    },

    CarbonNFTFactoryEnrollment:async function(){
        document.getElementById('button_CarbonNFTFactoryEnrollment').disabled=true;
        await $.ajax({
            type: "GET",
            url: "/userInfo/CarbonNFTFactoryEnrollment",
            data: {
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
        document.getElementById('button_CarbonNFTFactoryEnrollment').disabled=false;

        function catch_result(result) {
            if (typeof(result)==Object){
                var companyId = 'Company ID : '+result.CompanyIdEnrollment;
                var companyName = 'Company Name : '+result.CompanyNameEnrollment; 
                var text = companyId+companyName;
                RegistryApp.setAlarm("CarbonNFTFactoryEnrollment_status",text,'success');
            }
            else{
                RegistryApp.setAlarm("CarbonNFTFactoryEnrollment_status",result,'danger');
            }
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
        `<div class="alert alert-${type} alert-dismissible" role="alert" style="height: 40px;font-size: 16px;" >`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
        ].join('')
          alertPlaceholder.append(wrapper)
        }
        alert(m, t);
    },
    
//--------------------------------------------------------------------------------------------------------------------------------    
     showEnrollmentTable: async function(data,tableName){
     if(data==false){
          $("#enroll_noData").removeClass("invisible_block");
          $("#"+tableName).addClass("invisible_block");
        }
    else{
         $("#enroll_noData").addClass("invisible_block");
         $("#"+tableName).removeClass("invisible_block");
        var ul = document.getElementById(tableName);
        var total_data="";
        var count = 0;
        var tableHead=initialTable();
        total_data+=tableHead;
        total_data+='<tbody class="table-group-divider" style="font-size:12px;">';
        total_data+=await addTable(data);
        total_data+='</tbody>';
        ul.innerHTML = total_data;
        function addTable(data){
          var table='';
          for(var i =0;i<data.length;i++){
          table+='<tr style="font-size:18px;">';
          table+='<td>'+data[i].Address+"</td>";
          table+='<td>'+data[i].CompanyId+"</td>";
          table+='<td>'+data[i].CompanyName+"</td>";
          table+="</tr>";
          }
          return table;
          }
        function initialTable(){
          var head='';
          head+='<thead style="height: 5%;">';
          head+='<tr>';
          head+='<th scope="col">Address</th>';
          head+='<th scope="col">Company ID</th>';
          head+='<th scope="col">Company Name </th>';
          head+='</tr>';
          head+='</thead>';
          return head;
          }
        }        
    },
    showVerifyTable: async function(data,tableName){
    if(data==false){
          $("#verify_noData").removeClass("invisible_block");
          $("#"+tableName).addClass("invisible_block");
        }
    else{
         $("#verify_noData").addClass("invisible_block");
         $("#"+tableName).removeClass("invisible_block");
        var ul = document.getElementById(tableName);
        var total_data="";
        var count = 0;
        var tableHead=initialTable();
        total_data+=tableHead;
        total_data+='<tbody class="table-group-divider" style="font-size:12px;">';
        total_data+=await addTable(data);
        total_data+='</tbody>';
        ul.innerHTML = total_data;
        function addTable(data){
          var table='';
          for(var i =0;i<data.length;i++){
          table+='<tr style="font-size:18px;">';
          table+='<td>'+data[i].Address+"</td>";
          table+='<td>'+data[i].TokenId+"</td>";
          table+="</tr>";
          }
          return table;
          }
        function initialTable(){
          var head='';
          head+='<thead style="height: 5%;">';
          head+='<tr>';
          head+='<th scope="col">Address</th>';
          head+='<th scope="col">NFT ID</th>';
          head+='</tr>';
          head+='</thead>';
          return head;
          }
         }        
    },
};