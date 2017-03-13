'use strict'

/**
 * Encapsulate the script to hide the scope of the contents and
 * avoid polluting the global scope. Pass in JQuery to avoid script
 * collision for run.
 */
var main = function run ($) {
  var debug = true

  var xmlContent = null
  var xslContent = null

  /**
   * start up function after the dom has finished loading
   * grabs the xml and style documents in turn and then passes
   * them for processing
   */
  $(document).ready(function () {
    if (debug) {
      console.log('ready!')
    }
    addEventHandlers()
    retrieveXMLData()
  })

  /**
   * retrieve XML content from a supplied url with a callback
   * @param {*} resourceUrl the url to request the xml data from
   * @param {*} callback the function to execute on success
   */
  function getXML (resourceUrl, callback) {
    $.ajax({
      url: resourceUrl,
      dataType: 'xml',
      success: function (data) {
        callback(data)
      },
      error: function () {
        var errorNotice = '<h2>Ajax call failed<br>Unable to load ' + resourceUrl + '</h2>'
        if (window.location.protocol === 'file:') {
          errorNotice += 'This is likely due to security settings in your browser disallowing local files loading via ajax.'
        }
        $('#content').prepend(errorNotice)
      }
    })
  }

  /**
   * make XML calls to retrieve both the xml document and the stylesheet
   */
  function retrieveXMLData () {
    getXML('remakes.xml', function (xml) {
      getXML('table-style.xsl', function (style) {
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
    $('#titleInput').on('change', filterRecords)
    $('#yearInput').on('change', filterRecords)
    $('#fractionInput').on('change', filterRecords)
    $('#sortSelect').on('change', filterRecords)
  }

  /**
   * Logic function to handle case where browser support is missing for XSLT Processing
   * @param {*} style the url to the xsl stylesheet
   * @param {*} xml the url to the xml document
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
   * @param {*} style the url to the xsl stylesheet
   * @param {*} xml the url to the xml document
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
   * @param {any} titleFilter component of the restriction relating to the title
   * @param {any} yearFilter component of the restriction relating to the year
   * @param {any} fractionFilter component of the restriction relating to the fraction
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
   * @param {any} restrict
   * @param {any} sort
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
   * Handle the UI for the case when restrict is set to or from 'unchanged'
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
   * @param  {*} field the selected field
   * @param  {*} restrict the restriction type
   * @param  {*} value the value of the restriction
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
   * @param  {*} xslContent the xsl style template
   * @param  {*} restrict the built restriction string
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
   * Apply te sort to the xsl
   * @param  {*} xslContent the xsl style template
   * @param  {*} sort the built sort string
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
          'please install to continue and ensure it loads first.'
}

/**
 * check if jQuery is loaded
 */
if (typeof jQuery !== 'undefined') {
  main(jQuery)
} else {
  // inspired by http://stackoverflow.com/questions/24647839/referenceerror-document-is-not-defined-in-plain-javascript
  window.addEventListener('load', handleNoJQuery, false)
}
