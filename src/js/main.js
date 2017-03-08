
/** Global vars */
var xmlContent = null;
var xslContent = null;


/**
 * retrieve XML content from a supplied url with a callback
 * @param {*} resourceUrl the url to request the xml data from
 * @param {*} callback the function to execute on success
 */
function getXML(resourceUrl, callback) {
  $.ajax({
    url: resourceUrl,
    dataType: 'xml',
    success: function(data){
      callback(data);
    },
    error: function(){
      var errorNotice = "<h2>Ajax call failed<br>Unable to load " + resourceUrl + "</h2>";
      $("#content").prepend(errorNotice);
    }
  });
}

/**
 * start up function after the dom has finished loading
 * grabs the xml and style documents in turn and then passes
 * them for processing
 */
$(document).ready(function() {
  addEventHandlers();
  retrieveXMLData();    
});

/**
 * make XML calls to retrieve both the xml document and the stylesheet
 */
function retrieveXMLData(){
  getXML('remakes.xml', function(xml) {
    getXML('table-style.xsl', function(style){
      processXsl(style, xml)
      xslContent = style;
    });
    xmlContent = xml;
  });
}

/**
 * apply event listeners to the input fields
 */
function addEventHandlers(){
  $("#titleSelect").change(filterRecords);
  $("#yearSelect").change(filterRecords);
  $("#fractionSelect").change(filterRecords);
  
  $("#titleInput").on("change", filterRecords);
  $("#yearInput").on("change", filterRecords);
  $("#fractionInput").on("change", filterRecords);

  $("#sortSelect").on("change", filterRecords);
}

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

function filterRecords(){
  var titleFilter = filterByTitle();  
  var yearFilter = filterByYear();
  var fractionFilter = filterByFraction();
  var restrict = buildRestriction(titleFilter, yearFilter, fractionFilter);
  var sort = getSort();
  activateFilter(restrict, sort);
}

function getSort(){
  return $("#sortSelect").val();
}

function buildRestriction(titleFilter, yearFilter, fractionFilter){
  var restrict = titleFilter;
  if(restrict != "" && yearFilter != ""){ restrict += " and " }
  if(yearFilter != ""){ restrict += yearFilter; }
  if(restrict != "" && fractionFilter != ""){ restrict += " and " }
  if(fractionFilter != ""){ restrict += fractionFilter; }
  return restrict;
}

function activateFilter(restrict, sort){
  if(restrict != ""){
    restrict = "[" + restrict + "]";
  }  
  applyFilter(xslContent,restrict);
  applySort(sort);
  processXsl(xslContent, xmlContent); 
}



/**
 * Apply filtering by title
 */
function filterByTitle(){
  var restrict = $("#titleSelect").val();
  var value = $("#titleInput").val();

  handleRestrictDisplay(restrict);

  if(!value && restrict != "unchanged"){
    return "";
  }
  return getRestriction("rtitle", restrict, value)
}

function handleRestrictDisplay(restrict){
  if(restrict == "unchanged"){
    $("#titleInput").val("");
    $("#titleInput").prop('disabled', true);
    $("#titleInput").prop('placeholder', "Input disabled");
  }
  else{
    $("#titleInput").prop('disabled', false);
    $("#titleInput").prop('placeholder', "Press enter to set input");
  }
}

/**
 * Apply filtering by year
 */
function filterByYear(){
  var restrict = $("#yearSelect").val();
  var value = $("#yearInput").val();
  if(!value){
    return "";
  }
  return getRestriction("ryear", restrict, value)
}

/**
 * Apply filtering by fraction
 */
function filterByFraction(){
  var restrict = $("#fractionSelect").val();
  var value = $("#fractionInput").val();
  if(!value){
    return "";
  }
  return getRestriction("fraction", restrict, value)
}

function getRestriction(field, restrict, value){
  switch(restrict) {
    case "contains":
      return "contains(" + field + ", '" + value + "')";
    case "unchanged":
      return "rtitle=stitle";
    default:
      return field+restrict+value
  }
}

function applyFilter(xslContent, restrict){
  $(xslContent).find("xsl\\:for-each, for-each")
               .first()
               .attr("select","//remake" + restrict);
}

function applySort(sort){
  $(xslContent).find("xsl\\:sort, sort")
               .first()
               .attr("select", sort);
}

