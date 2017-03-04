function getXML(myUrl, callback) {
  $.ajax({
    url: myUrl,
    dataType: 'xml',
    success: function(data){
      callback(data);
    },
    error: function(xhr, status, errorThrown){
      console.log('ajax call failed');
      console.log( "Error: " + errorThrown );
      console.log( "Status: " + status );
    }
  });  
}

$(document).ready(function() {
  getXML('remakes.xml', function(xml) {
    getXML('table-style.xsl', function(style){
      processXsl(style, xml)
      console.log("xsl file read")
    });
    console.log("xml file read")
  });
  
});

function getStylesheet(){

}

function populateXSL(style, xml){
  if (typeof (XSLTProcessor) != "undefined") {
    processXsl(style, xml);
  } 
  else{
    $("#content").html("Your browser does not support the XSLTProcessor object");
  }
}

function processXsl(style, xml){
  var processor = new XSLTProcessor();
  processor.importStylesheet(style);
  var processedXml = processor.transformToFragment(xml, document);
  $("#content").html(processedXml);
}


