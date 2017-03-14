'use strict'
/**
 * @author Alexander Worton
 * I confirm that this coursework submission is entirely my own work, except where explicitly stated otherwise.
 */

/**
 * Encapsulate the script to hide the scope of the contents and
 * avoid polluting the global scope. Pass in JQuery to avoid script
 * collision for run.
 */
var main = function run ($) {
  var debug = false

  /**
   * Paths to files
   */
  var xmlDataUri = 'xml/remakes.xml'
  var xslTransformUri = 'style/table-style.xsl'

  /**
   * variables to hold the loaded xml content
   */
  var xmlContent = null
  var xslContent = null

  /**
   * start up function after the dom has finished loading
   * grabs the xml and style documents in turn and then passes
   * them for processing
   */
  $(document).ready(function handleReady () {
    if (debug) {
      console.log('ready!')
    }
    addEventHandlers()
    retrieveXMLData()
  })

  /**
   * retrieve XML content from a supplied url with a callback
   * @param {string} resourceUrl the url to request the xml data from
   * @param {function} callback the function to execute on success
   */
  function getXML (resourceUrl, callback) {
    $.ajax({
      url: resourceUrl,
      dataType: 'xml',
      success: function handleSuccess (data) {
        callback(data)
      },
      error: function handleError () {
        var errorNotice = '<h2>Ajax call failed<br>Unable to load ' + resourceUrl + '</h2>'
        if (window.location.protocol === 'file:') {
          errorNotice += 'This is likely due either to security settings in your browser disallowing local files loading via ajax, ' +
          'or a missing xml file.'
        }
        $('#content').prepend(errorNotice)
      }
    })
  }

  /**
   * make XML calls to retrieve both the xml document and the stylesheet
   */
  function retrieveXMLData () {
    getXML(xmlDataUri, function (xml) {
      getXML(xslTransformUri, function (style) {
        populateXSL(style, xml)
        xslContent = style
      })
      xmlContent = xml
    })
  }

  /**
   * apply event listeners to the input fields
   */
  function addEventHandlers () {
    $('#titleSelect').change(filterRecords)
    $('#yearSelect').change(filterRecords)
    $('#fractionSelect').change(filterRecords)
    $('#titleInput').change(filterRecords)
    $('#yearInput').change(filterRecords)
    $('#fractionInput').change(filterRecords)
    $('#sortSelect').change(filterRecords)
  }

  /**
   * Logic function to handle case where browser support is missing for XSLT Processing
   * @param {xml} style the xsl stylesheet
   * @param {xml} xml the xml document
   */
  function populateXSL (style, xml) {
    if (typeof (XSLTProcessor) !== 'undefined') {
      processXsl(style, xml)
    } else {
      $('#content').html('Your browser does not support the XSLTProcessor object')
    }
  }

  /**
   * function to process the xml with the stylesheet
   * @param {xml} style the url to the xsl stylesheet
   * @param {xml} xml the url to the xml document
   */
  function processXsl (style, xml) {
    var processor = new XSLTProcessor()
    processor.importStylesheet(style)
    var processedXml = processor.transformToFragment(xml, document)
    $('#content').html(processedXml)
  }


  /**
   * run task sequence to filter records.
   */
  function filterRecords () {
    var titleFilter = filterByTitle()
    var yearFilter = filterByYear()
    var fractionFilter = filterByFraction()
    var restrict = buildRestriction(titleFilter, yearFilter, fractionFilter)
    var sort = getSort()
    activateFilter(restrict, sort)
  }

  /**
   * Get value of the sort selector
   */
  function getSort () {
    return $('#sortSelect').val()
  }

  /**
   * build the restrict text.
   * @param {string} titleFilter component of the restriction relating to the title
   * @param {string} yearFilter component of the restriction relating to the year
   * @param {string} fractionFilter component of the restriction relating to the fraction
   * @returns the complete restriction string.
   */
  function buildRestriction (titleFilter, yearFilter, fractionFilter) {
    var restrict = titleFilter
    if (restrict !== '' && yearFilter !== '') { restrict += ' and ' }
    if (yearFilter !== '') { restrict += yearFilter }
    if (restrict !== '' && fractionFilter !== '') { restrict += ' and ' }
    if (fractionFilter !== '') { restrict += fractionFilter }
    return restrict
  }

  /**
   * Run filter activation tasks.
   * @param {string} restrict
   * @param {string} sort
   */
  function activateFilter (restrict, sort) {
    if (restrict !== '') {
      restrict = '[' + restrict + ']'
    }
    applyFilter(xslContent, restrict)
    applySort(xslContent, sort)
    populateXSL(xslContent, xmlContent)
  }

  /**
   * Apply filtering by title
   */
  function filterByTitle () {
    var restrict = $('#titleSelect').val()
    var value = $('#titleInput').val()

    handleRestrictDisplay(restrict)

    if (!value && restrict !== 'unchanged') {
      return ''
    }
    return getRestriction('rtitle', restrict, value)
  }

  /**
   * Enable / disable the title input when restrict is set to or from 'unchanged'
   */
  function handleRestrictDisplay (restrict) {
    if (restrict === 'unchanged') {
      $('#titleInput').val('')
      $('#titleInput').prop('disabled', true)
      $('#titleInput').prop('placeholder', 'Input disabled')
    } else {
      $('#titleInput').prop('disabled', false)
      $('#titleInput').prop('placeholder', 'Press enter to set input')
    }
  }

  /**
   * Apply filtering by year
   */
  function filterByYear () {
    var restrict = $('#yearSelect').val()
    var value = $('#yearInput').val()
    if (!value) {
      return ''
    }
    return getRestriction('ryear', restrict, value)
  }

  /**
   * Apply filtering by fraction
   */
  function filterByFraction () {
    var restrict = $('#fractionSelect').val()
    var value = $('#fractionInput').val()
    if (!value) {
      return ''
    }
    return getRestriction('fraction', restrict, value)
  }

  /**
   * Get the restriction from the UI settings
   * @param  {string} field the selected field
   * @param  {string} restrict the restriction type
   * @param  {string} value the value of the restriction
   */
  function getRestriction (field, restrict, value) {
    switch (restrict) {
      case 'contains':
        return 'contains(' + field + ', "' + value + '")'
      case 'unchanged':
        return 'rtitle=stitle'
      default:
        return field + restrict + '"' + value + '"'
    }
  }

  /**
   * Apply the filter to the xsl
   * @param  {xml} xslContent the xsl style template
   * @param  {string} restrict the built restriction string
   */
  function applyFilter (xslContent, restrict) {
    if (debug) {
      console.log('restrict: //remake ' + restrict)
    }
    $(xslContent).find('xsl\\:for-each, for-each')
                .first()
                .attr('select', '//remake' + restrict)
  }

  /**
   * Apply the sort to the xsl
   * @param  {xml} xslContent the xsl style template
   * @param  {string} sort the built sort string
   */
  function applySort (xslContent, sort) {
    if (debug) {
      console.log('sort: ' + sort)
    }
    $(xslContent).find('xsl\\:sort, sort')
                .first()
                .attr('select', sort)
  }
}

/**
 * handle jQuery not being loaded prior to script
 */
function handleNoJQuery () {
  var content = document.getElementById('content')
  content.innerHTML = 'jQuery not found. This library requires JQuery, ' +
          'please install to continue and ensure that the jQuery script is ' +
          'placed before this one.'
}

/**
 * check if jQuery is loaded and handle user notice if not.
 */
if (typeof jQuery !== 'undefined') {
  main(jQuery)
} else {
  // inspired by http://stackoverflow.com/questions/24647839/referenceerror-document-is-not-defined-in-plain-javascript
  window.addEventListener('load', handleNoJQuery, false)
}
