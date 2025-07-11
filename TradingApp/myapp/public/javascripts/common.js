// common.js
$(document).ready(function(){
  // 先檢查元素是否存在
  if ($('#DataInquiryCategory').length > 0) {
    let Inquiry;
    $('#DataInquiryCategory').change(function() {
      Inquiry = $(this).val();
      switch(Inquiry){
        case "/Read/Parameter":
          changePage("MaterialType-Inquiry,EmissionType-Inquiry","CompanyID-Inquiry,SourceID-Inquiry,ParameterID-Inquiry,TimeTag-Inquiry,StartDate-Inquiry,EndDate-Inquiry");
          break;
        case "/Read/Source":
          changePage("CompanyID-Inquiry","MaterialType-Inquiry,EmissionType-Inquiry,SourceID-Inquiry,ParameterID-Inquiry,TimeTag-Inquiry,StartDate-Inquiry,EndDate-Inquiry");
          break;  
        case "/Read/ReadEmissionByCompanyID":
          changePage("CompanyID-Inquiry","MaterialType-Inquiry,EmissionType-Inquiry,SourceID-Inquiry,ParameterID-Inquiry,TimeTag-Inquiry,StartDate-Inquiry,EndDate-Inquiry");
          break;
        case "/Read/ReadEmissionBySource":
          changePage("CompanyID-Inquiry,SourceID-Inquiry","MaterialType-Inquiry,EmissionType-Inquiry,ParameterID-Inquiry,TimeTag-Inquiry,StartDate-Inquiry,EndDate-Inquiry");
          break;
        case "/Read/ReadSourceByDate":
          changePage("CompanyID-Inquiry,SourceID-Inquiry,ParameterID-Inquiry,StartDate-Inquiry,EndDate-Inquiry","MaterialType-Inquiry,EmissionType-Inquiry,TimeTag-Inquiry");
          break;
        case "/Read/ReadSingleEmission":
          changePage("CompanyID-Inquiry,SourceID-Inquiry,MaterialType-Inquiry,EmissionType-Inquiry,TimeTag-Inquiry","ParameterID-Inquiry,StartDate-Inquiry,EndDate-Inquiry");
          break;
        case "/getSpotList":
          changePage("CompanyID-Inquiry,StartDate-Inquiry,EndDate-Inquiry","ParameterID-Inquiry,SourceID-Inquiry,MaterialType-Inquiry,EmissionType-Inquiry,TimeTag-Inquiry");
          break;
        default:
          break;
      }
    });
  }
});
function changePage(open,close){
  console.log(open);
  const openAim = open.split(",");
  const closeAim = close.split(",");
  for(i=0;i<openAim.length;i++){
      $("#"+openAim[i]).show();
  }
  for(i=0;i<closeAim.length;i++){
      $("#"+closeAim[i]).hide();
  }
}