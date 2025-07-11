./network.sh down
./network.sh up -ca
./network.sh createChannel -c carbon
./network.sh deployCC -c carbon -ccn EmissionTemplate -ccp ../carbon-emission/EmissionTemplate -ccl javascript
./network.sh deployCC -c carbon -ccn ParameterStorage -ccp ../carbon-emission/ParameterStorage -ccl javascript
./network.sh deployCC -c carbon -ccn SourceStorage -ccp ../carbon-emission/SourceStorage -ccl javascript
./network.sh deployCC -c carbon -ccn EmissionVerify -ccp ../carbon-emission/EmissionVerify -ccl javascript
./network.sh deployCC -c carbon -ccn Certificate -ccp ../carbon-emission/Certificate -ccl javascript
./network.sh deployCC -c carbon -ccn Accounting -ccp ../carbon-emission/Accounting -ccl javascript

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

pm2 start app.js --name emissionTrading --max-memory-restart 1GB --watch --port 4000

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n SourceStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CreateSource","Args":[ "iMRC", "M01","Continuous","0.07""Energy~CO2~IPCC"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n ParameterStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"EmissionTypeReadParameter","Args":["Energy","CO2"]}'

"Regular","0.07"
"M01","Energy~CO2~IPCC"

Success

EmissionTemplate
  (o)EmissionCheck

ParameterStorage
  (o)CreateKey
  (o)EmissionTypeReadParameter
  (o)ReadSingleParameter
  (o)CheckSameParameter
  (o)CheckDataFormat
  (o)CreateParameter
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n ParameterStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CreateParameter","Args":[ "Energy","CO2","0.502","0.07","IPCC"]}'
  
SourceStorage
  (o)CreateKey
  (o)CompanyIDReadSource
  (o)ReadSingleSource
  (o)ReadSingleSourceEmission
  (o)CheckSameSource
  (o)CheckDataFormat
  (o)CreateSource
  (o)UpdateVerifiedEmission
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n SourceStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CreateSource","Args":[ "iMRC", "M03", "Continuous","0.07","Energy~CO2~IPCC"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n SourceStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CompanyIDReadSource","Args":[ "iMRC"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n SourceStorage --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CheckSameSource","Args":["iMRC","M02","Energy~CO2~IPCC"]}'

EmissionVerify
  (o)CreateKey(ctx,Company,Source,MaterialType,EmissionType,TimeTag) 
  (o)Relevance(ctx, MaterialType, EmissionType, EmissionFactor)
  (o)Completeness(ctx, Company, Source)
  Consistency ("iMRC","M01","Energy","CO2","0.502")
  Transparency ("M01","Energy","CO2","4","0.502","2.008","2024-04-10 11:11:11.000")
  Accuracy ("iMRC","M01","Energy","CO2","4","0.502","2.008","2024-04-10 11:11:11.000")
  Verify ("iMRC","M01","Energy","CO2","4","0.502","2.008","2024-04-10 11:11:11.000")
  (o)CompanyReadEmission
  (o)SourceReadEmission
  (o)EmissionTypeReadEmission ("iMRC","M01","Energy","CO2")
  (o)ReadSingleEmission
  (o)CheckSameEmission
  (o)CreateEmission(ctx, Company, Source, MaterialType, EmissionType, ActivityData, EmissionFactor, EmissionValue, TimeTag)
  (o)getSpotList
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n EmissionVerify19 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"ReadSingleEmission","Args":["iMRC","M01","Energy","CO2","2024-04-10 11:11:11.000"]}'  

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n EmissionVerify --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CreateEmission","Args":["iMRC","M01","Energy","CO2","4","0.502","2.008","2024-04-10 11:11:11.000"]}'  

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n EmissionVerify29 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"getSpotList","Args":["iMRC","2024-04-10","2024-04-11"]}' 

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n EmissionVerify19 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"SourceInfoByDate","Args":["iMRC","M01","Energy~CO2~IPCC","2024-04-10","2024-04-11"]}' 

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n EmissionVerify21 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CompanyReadEmission","Args":["iMRC"]}' 

  
(o)Certificate
  Initialize
  CompanyBinding
  getCompany
  NFTStartTimeTag
  Mint
  Burn
  
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Certificate --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"Initialize","Args":["carbon","C"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Certificate --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CompanyBinding","Args":["iMRC"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Certificate6 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"Mint","Args":["iMRC","10","2023-05-16 11:11:11.000","0.5"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Certificate6 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"Burn","Args":["1"]}'


Accounting
  (o)StorageTotalEmission
  OnsiteTotalEmission
  CompanyErrorRate
  (o)TotalActualEmission
  AddOnsiteResult
  (o)CalculateEmission
  (o)SourceSearch
  (o)FakeRateWeight
  
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting13 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"StorageTotalEmission","Args":["iMRC","2024-04-10","2024-04-11"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting20 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CalculateEmission","Args":["[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6}, {\"Source\": \"M02\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 60.3}, {\"Source\": \"M03\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 50.2}]"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting32 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"SourceSearch","Args":["iMRC","2024-04-10","2024-04-11","[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6}, {\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~Government\", \"EmissionValue\": 15.6},{\"Source\": \"M02\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 60.3}, {\"Source\": \"M03\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 50.2}]"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting24 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"TotalActualEmission","Args":["iMRC","2024-04-10","2024-04-11","1.2"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"FakeRateWeight","Args":["iMRC","2024-04-10","2024-04-11","[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6},{\"Source\": \"M02\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 60.3}, {\"Source\": \"M03\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 50.2}]"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting3 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"CompanyErrorRate","Args":["iMRC","2024-02-01","2024-02-01","[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6}]"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting1 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"OnsiteTotalEmission","Args":["iMRC","2024-04-10","2024-04-11","[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6},{\"Source\": \"M02\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 60.3}, {\"Source\": \"M03\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 50.2}]"]}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C carbon -n Accounting1 --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"AddOnsiteResult","Args":["iMRC","2024-04-10","2024-04-11","[{\"Source\": \"M01\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 15.6},{\"Source\": \"M02\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 60.3}, {\"Source\": \"M03\", \"ParameterID\": \"Energy~CO2~IPCC\", \"EmissionValue\": 50.2}]"]}'