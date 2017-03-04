/**
 * retriee XML content from a supplied url with a callback
 * @param {*} myUrl the url to request the xml data from
 * @param {*} callback the function to execute on success
 */
function getXML(myUrl, callback) {
  $.ajax({
    url: myUrl,
    dataType: 'xml',
    success: function(data){
      callback(data);
    },
    error: function(xhr, status, error){
      console.log('ajax call failed');
      console.log( "Error: " + error );
      console.log( "Status: " + status );
    }
  });  
}

/**
 * start up function after the dom has finished loading
 * grabs the xml and style documents in turn and then passes
 * them for processing
 */
$(document).ready(function() {
  getXML('remakes.xml', function(xml) {
    getXML('table-style.xsl', function(style){
      processXsl(style, xml)
      console.log("xsl file read")
    });
    console.log("xml file read")
  });
  
});

/**
 * Logic function to handle case where browser support is missing for XSLT Processing
 * @param {*} style the url to the xsl stylesheet
 * @param {*} xml the url to the xml document
 */
function populateXSL(style, xml){
  if (typeof (XSLTProcessor) != "undefined") {
    processXsl(style, xml);
  } 
  else{
    $("#content").html("Your browser does not support the XSLTProcessor object");
  }
}

/**
 * function to process the xml with the stylesheet
 * @param {*} style the url to the xsl stylesheet
 * @param {*} xml the url to the xml document
 */
function processXsl(style, xml){
  var processor = new XSLTProcessor();
  processor.importStylesheet(style);
  var processedXml = processor.transformToFragment(xml, document);
  $("#content").html(processedXml);
}


