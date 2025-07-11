var web3 ='';
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable(); // get permission to access accounts
  } 
const RegistryApp={
    RegistryEnroll: async function(){
        const id= document.getElementById("RegistryEnroll_id").value;
        const name=document.getElementById("RegistryEnroll_name").value;
        document.getElementById('button_RegistryEnroll').disabled=true;
        await $.ajax({
            type: "POST",
            url: "/userInfo/addEnrollmentData",
            data: {
                //address: address,
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
            if(result==false){
                RegistryApp.setAlarm("RegistryEnroll_status",'you have already submitted,please wait checker!!','danger');
                document.getElementById('button_RegistryEnroll').disabled=false;
            }
            else{
              const RetireContract = new web3.eth.Contract(result[0].abi,result[2]);
              await RetireContract.methods.setEnrollment(id,name).send({ from: result[1] });
              var NFTFactoryEnrollment_text = '<div><strong>Membership of "Mint NFT"</strong>: Wait for verifier to check</div>';
              var RetirementFactoryEnrollment_text = '<div><strong>Membership of "Retired Carbon"</strong>:'+'Company ID:'+id+', Company Name:'+name+'</div>';
              var text = NFTFactoryEnrollment_text+RetirementFactoryEnrollment_text;
              RegistryApp.setAlarm("RegistryEnroll_status",text,'success');
              WalletApp.Connect();
              document.getElementById('button_RegistryEnroll').disabled=false;
            }
            }
            catch(err){
                RegistryApp.setAlarm("RegistryEnroll_status",err,'danger');
                document.getElementById('button_RegistryEnroll').disabled=false;
            }
        }
    },

    Mint: async function(){
        document.getElementById('button_Mint').disabled=true;
        await $.ajax({
            type: "GET",
            url: "/CarbonNFTFactory/mintNFT",
            data: {
            },               
            success: function (data) {
                catch_result(data);
            },
            error: function (err) {
            }            
        });
        async function catch_result(result){
        try{
          const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
          //await NFTContract.methods.mintEmptyNft(account).send({ from: account });
          await NFTContract.methods.mintEmptyNft(result[1]).send({ from: result[1] }).on('receipt', function(receipt){
              var eleLink = document.createElement('a');
              eleLink.download = receipt.transactionHash+'.json';
              eleLink.style.display = 'none';
              var tx = JSON.stringify(receipt);
              var blob = new Blob([tx],{ type:"text/json"});
              eleLink.href = URL.createObjectURL(blob);
              document.body.appendChild(eleLink);
              eleLink.click();
              document.body.removeChild(eleLink);
              //alert(tx);
          });
          RegistryApp.setAlarm("Mint_status",'success','success');
          document.getElementById('button_Mint').disabled=false;
          RegistryApp.NFTInfoList();
          WalletApp.Connect();
          }
          catch(revertReason){
            RegistryApp.setAlarm("Mint_status",'fail to create','danger');
                    document.getElementById('button_Mint').disabled=false;
          }
        }
    },

    Update:async function(){
        document.getElementById('button_Update').disabled=true;
        const tokenId= document.getElementById("Update_tokenId").innerHTML;
        const amount=document.getElementById("Update_amount").value;
        const status= document.getElementById("click_Update");
        status.innerHTML = 'Loading...';
        await $.ajax({
            type: "POST",
            url: "/CarbonNFTFactory/updateNFT",
            data: {
                tokenId: tokenId,
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
              const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
              await NFTContract.methods.updateCarbonNftWithData(tokenId,'',amount).send({ from: result[1] }).on('receipt', function(receipt){
              var eleLink = document.createElement('a');
              eleLink.download = receipt.transactionHash+'.json';
              eleLink.style.display = 'none';
              //find block timestamp
              web3.eth.getBlock(receipt.blockNumber).then((value) => {
                receipt["timestamp"] = value.timestamp;
                //find nonce,gas,input
                web3.eth.getTransaction(receipt.transactionHash).then((value) => {
                  receipt["nonce"] = value.nonce;
                  receipt["gas"] = value.gas;
                  receipt["gasPrice"] = value.gasPrice;
                  receipt["input"] = value.input;
                  receipt["value"] = value.value;
                  var tx = JSON.stringify(receipt);
                  var blob = new Blob([tx],{ type:"text/json"});
                  eleLink.href = URL.createObjectURL(blob);
                  document.body.appendChild(eleLink);
                  eleLink.click();
                  document.body.removeChild(eleLink);
                });
              });
              
          })
          .on('error', function(error, receipt) {
              var eleLink = document.createElement('a');
              eleLink.download = receipt.transactionHash+'.json';
              eleLink.style.display = 'none';
               //find block timestamp
              web3.eth.getBlock(receipt.blockNumber).then((value) => {
                receipt["timestamp"] = value.timestamp;
                //find nonce,gas,input
                web3.eth.getTransaction(receipt.transactionHash).then((value) => {
                  receipt["nonce"] = value.nonce;
                  receipt["gas"] = value.gas;
                  receipt["gasPrice"] = value.gasPrice;
                  receipt["input"] = value.input;
                  receipt["value"] = value.value;
                  var tx = JSON.stringify(receipt);
                  var blob = new Blob([tx],{ type:"text/json"});
                  eleLink.href = URL.createObjectURL(blob);
                  document.body.appendChild(eleLink);
                  eleLink.click();
                  document.body.removeChild(eleLink);
                });
              });
          });
              var date = new Date();
              var text = 'update time:'+String(date);
              status.innerHTML = text;
              document.getElementById('button_Update').disabled=false;
              RegistryApp.NFTInfoList();
              
            }
            catch(err){
                status.innerHTML = 'fail to update';
                document.getElementById('button_Update').disabled=false;
            }
        }
    },

    UpdatePage:async function(tokenid){
        var button = 'button_Update_'+tokenid;
        document.getElementById(button).disabled=true;
        const block= document.getElementById("Update_block");
        const overlay = document.getElementById('overlay');
        overlay.style.display='block';
        block.style.display='block';
        const tokenId= document.getElementById("Update_tokenId");
        tokenId.innerHTML =tokenid;
    },

    AddVerify:async function(tokenId){
        var button = 'button_Verify_'+tokenId;
        document.getElementById(button).disabled=true;
        var loadingSpinner_text = 'loadingSpinner_'+tokenId;
        var loadingSpinner = document.getElementById(loadingSpinner_text);
        loadingSpinner.style.display = 'block';
        await $.ajax({
            type: "POST",
            url: "/CarbonNFTFactory/addVerifyNFT",
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
              let canvas = document.getElementById("light"+String(tokenId));
              let ctx = canvas.getContext("2d"); 
              switch(result){
                case false:
                  RegistryApp.setAlarm("Verify_status",'you had already submit this NFT to verify','danger');
                  break;
                case "verified":
                  RegistryApp.setAlarm("Verify_status",'This NFT can not verify again','danger');
                  break;
                case true:
                  RegistryApp.setAlarm("Verify_status",'NFT ID:'+tokenId+' submitted to verify success','success');
                  ctx.lineWidth = 3;
                  ctx.strokeStyle = "#000000";
                  ctx.fillStyle = "#e4fe8f";
                  ctx.fill();
                  ctx.stroke();
                  break;
                default:
                  RegistryApp.setAlarm("Verify_status",result,'danger');
                  break;
              }
              document.getElementById(button).disabled=false;
              loadingSpinner.style.display = 'none';
            }
            catch(err){
                RegistryApp.setAlarm("Verify_status",err,'danger');
                document.getElementById(button).disabled=false;
                loadingSpinner.style.display = 'none';
            }
        }
    },
    
    NFTInfoList:async function(){
        const Placeholder = document.getElementById('PageSpinner');
        Placeholder.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML+='<span>Loading Your NFT Data...</span>';
        wrapper.innerHTML+='<div id="loadingSpinner" class="Page_spinner"></div>';
        Placeholder.append(wrapper);
        try{
            await $.ajax({
                type: "GET",
                url: "/userInfo/getNFTList",
                data: {
                },               
                success: function (data) {
                    catch_numbers(data);
                },
                error: function (err) {
                }            
            });
          }
        catch(err){
          RegistryApp.setAlarm("NFTInfo_status",err,'danger');
          Placeholder.innerHTML = '';
        }
        //number
        async function catch_numbers(result) {
          var totaldata=[];
          var text='';
          try{
            const NFTContract = new web3.eth.Contract(result[0].abi,result[2]);
            var numbers = await NFTContract.methods.getAddressNFTList().call({ from: result[1] });
            if(numbers.length==0){
                RegistryApp.setAlarm("NFTInfo_status",'You do not have Carbon NFT','danger');
                document.querySelector('.table').innerHTML='';
                Placeholder.innerHTML = '';
                }
            else{
                for(var i=0;i<numbers.length;i++){text=text+numbers[i]+',';}
                //var num = numbers.length;
                   await $.ajax({
                    type: "POST",
                    url: "/userInfo/getNFTInfo",
                    data: {
                          tokenId: text
                    },               
                    success: function (data) {
                      catch_result(data);
                    },
                    error: function (err) {
                   }            
                  });
              //each number info
                async function catch_result(result) {
                  if (typeof(result)!=Object){
                      for(var i =0;i<result.length;i++){
                      var nftdata=[];
                      nftdata.push(numbers[i]);              
                      nftdata.push(String(result[i].CompanyId));
                      nftdata.push(String(result[i].CompanyName));
                      nftdata.push(String(result[i].carbonAmount));
                      nftdata.push(String(result[i].status));
                      nftdata.push(String(result[i].uri));
                      var takeIPFSHash = result[i].uri.split('://');
                      var pic_uri = 'http://ipfs.io/ipfs/'+takeIPFSHash[1];
                      await $.ajax({
                          type: "GET",
                          url: pic_uri,
                          data: {
                          },               
                          success: function (data) {
                              nftdata.push(data.image);
                              pushdata();
                          },
                          error: function (err) {
                          }
                      });
                    
                    function pushdata(){
                        totaldata.push(nftdata);
                        if(totaldata.length==result.length){
                          RegistryApp.showTable(totaldata);
                          Placeholder.innerHTML = '';
                          document.getElementById("NFTInfo_status").innerHTML='';
                        }
                      }
                    }
                }
                else{
                    RegistryApp.setAlarm("NFTInfo_status",result,'danger');
                }
              }
            }
          }
          catch(err){RegistryApp.setAlarm("NFTInfo_status",'fail to connect ploygon network','danger'); Placeholder.innerHTML = '';}
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
        `<div class="alert alert-${type} alert-dismissible" role="alert" style="font-size: 16px;" >`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
        ].join('')
          alertPlaceholder.append(wrapper)
        }
        alert(m, t);
    },
    
//--------------------------------------------------------------------------------------------------------------------------------    
     showTable: async function(data){
        var ul = document.querySelector('.table');
        var total_data="";
        var count = 0;
        var tableHead=initialTable();
        total_data+=tableHead;
        total_data+='<tbody class="table-group-divider" style="font-size:12px;">';
        total_data+=await addTable(data);
        total_data+='</tbody>';
        ul.innerHTML = total_data;
        RegistryApp.showVerifyStatus(data);
        function addTable(data){
          var table='';
          for(var i =0;i<data.length;i++){
          var verify_status = 0;
          table+='<tr style="font-size:18px;">';
          table+='<td>'+data[i][1]+"</td>";
          table+='<td>'+data[i][2]+"</td>";
          table+='<td>'+data[i][3]+"</td>";
          var newcase=String(data[i][4]);
          switch(newcase){
          case '0':
            table+='<td>'+'Not Verified'+"</td>";
            verify_status=0;
            break;
          case '1':
            table+='<td>'+'Verified'+"</td>";
            verify_status=2;
            break;
          case '2':
            table+='<td>'+'Fractionalized'+"</td>";
            verify_status=2;
            break;
          case '3':
            table+='<td>'+'Retired'+"</td>";
            verify_status=2;
            break;
          default:
            table+='<td>'+'NULL'+"</td>";
            break;
          }
          var pic = data[i][6];
          table+='<td>'+`<img src=${pic} style="height: 50px;">`+"</td>";
          table+='<td>'+'<button id="button_Update_'+data[i][0]+'" onclick="RegistryApp.UpdatePage('+data[i][0]+')" >update</button>'+"</td>";
          table+='<td>'+'<div class="verify_container">'+'<button id="button_Verify_'+data[i][0]+'"'+'class="verify_element1"'+'onclick="RegistryApp.AddVerify('+data[i][0]+');">verify</button>';
          table+='<div class="verify_element2" style="width: 5px;"></div>';
          table+='<div id="loadingSpinner_'+data[i][0]+'" class="spinner verify_element3"></div>'+'</div>'+"</td>";
           table+='<td>'+'<canvas id="light'+data[i][0]+'" style="height: 25px;width: 50px;text-align: center;" height="50px" width="100px"></canvas>'+"</td>";
          table+="</tr>";
          }
          return table;
          }
        function initialTable(){
          var head='';
          head+='<thead style="height: 5%;">';
          head+='<tr>';
          head+='<th scope="col">Company ID</th>';
          head+='<th scope="col">Company Name </th>';
          head+='<th scope="col">Carbon Amount</th>';
          head+='<th scope="col">NFT Status</th>';
          //head+='<th scope="col">URI</th>';
          head+='<th scope="col">Picture</th>';
          head+='<th scope="col">Update NFT</th>';
          head+='<th scope="col">Verify NFT</th>';
          head+='<th scope="col">Verify Status</th>';
          head+='</tr>';
          head+='</thead>';
          return head;
          }
        
    },
    showVerifyStatus:async function(totaldata){
        for(var i =0;i<totaldata.length;i++){
                              var verify_status = 0;
                              var newcase=String(totaldata[i][4]);
                              switch(newcase){
                                case '0':
                                  verify_status=0;
                                  break;
                                case '1':
                                  verify_status=1;
                                  break;
                                case '2':
                                  verify_status=1;
                                  break;
                                case '3':
                                  verify_status=1;
                                  break;
                                default:
                                  verify_status=0;
                                  break;
                              }
                              let canvas = document.getElementById("light"+String(totaldata[i][0]));
                              let ctx = canvas.getContext("2d");
                              ctx.beginPath();
                              ctx.lineWidth = 3;
                              ctx.strokeStyle = "#000000";
                              if(verify_status==0){
                              await $.ajax({
                              type: "GET",
                              url: "/CarbonNFTFactory/searchSingleVerifyNFT",
                              data: {
                                id: totaldata[i][0]
                              },               
                              success: function (result) {
                                catch_result(result);
                              },
                              error: function (err) {
                              }            
                              });
                              function catch_result(result){
                                if(result==true){ctx.fillStyle = "#FAFE00";}
                                else{ctx.fillStyle = "#FF0000";}
                              }
                              }
                              else{
                                ctx.fillStyle = "#21f25c";
                              }
                              ctx.arc(50,25,20,0,Math.PI*2);
                              ctx.fill();
                              ctx.stroke();
                            }
    },
};