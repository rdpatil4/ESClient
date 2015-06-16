
var esCluster = new ESCluster();
var esClusterOriginal = null;
var oTable;
var mapTable;
var viewEditJSON;

function ESNode(node)
{
	this.name = node.name;
	this.address = node.transport_address;
	setNodeAttributes(node.attributes);
	function setNodeAttributes(attributes)
	{
		this.client = attributes.client;
		this.data = attributes.data;
	}
}
function ESIndexType(name, mapping)
{
	this.indexType = name;
	this.properties = new Array();
	this.addProperties = addProperties(mapping.properties);
	function addProperties(props)
	{
		var propArr = new Array();
		$.each( props, function( key, value ) {
			propArr.push(key);
		});
		this.properties = propArr;
	}
}
function ESIndex(name, index)
{
  this.indexName = name;
  this.indexMappings = index.mappings;
  this.aliases = index.aliases;
  this.routingTag = index.settings["index.routing.allocation.include.tag"];
  this.replicas = index.settings["index.number_of_replicas"];
  this.shards = index.settings["index.number_of_shards"];
}
function ESCluster()
{
	this.nodes = new Array();
	this.indices = new Array();
	this.indiceNames = new Array();
	this.addNodes = addNodes;
	this.addIndices = addIndices;
	function addIndices(newIndice)
	{
		this.indices.push(newIndice);
		this.indiceNames.push(newIndice.indexName);
	}
	function addNodes(newNode)
	{
		this.nodes.push(newNode);
	}
}

function getBaseUrl(RecordIndexName)
{
	var typeName = $("#indexTypes").val();
	var indexName = RecordIndexName;
	if (!RecordIndexName)
	{
		indexName = $("#index").val();
	}
	var loc = $("#location").val();
	$.ajaxSetup({
		beforeSend: setAuthHeader
	});
	var url = loc + "/" + indexName + "/" + typeName + "/";
	return url;
}

function getRoutingKeyUrl()
{
	var routing = $("#routingKey").val();
	if (routing)
	{
		var routingUrl = "?routing=" + encodeURIComponent(routing);
		return routingUrl;
	}
	return "";
}

function refreshConnection()
{
	// clear index, index types and fields and clear the datatable
	$('#index').find('option').remove().end();
	$('#indexTypes').find('option').remove().end();
	$('#indexFields').find('option').remove().end();
	$('#MappingIndex').find('option').remove().end();
	$('#MappingIndexTypes').find('option').remove().end();
	$('#MappingIndex').multiselect("refresh");
	$('#MappingIndexTypes').multiselect("refresh");	
	$('#index').multiselect("refresh");
	$('#indexTypes').multiselect("refresh");
	$('#indexFields').multiselect("refresh");	
	connectToES();
}


function connectToES()
{
	// re-initialize the cluster variable
	esCluster = new ESCluster();
	var loc = $("#location").val();
	$.ajaxSetup({
		beforeSend: setAuthHeader
	});
	// check the cluster health 
	var cluster_state = "red";
	var jqxhr = $.getJSON( loc + "/_cluster/health", function() {
	}).done(function( healthData ) {
		cluster_state = healthData.status;
		$("#cluster").attr('title', JSON.stringify(healthData,null,4));
	});	
	
    $('#index').find('option').remove().end();
	var jqxhr = $.getJSON( loc + "/_cluster/state", function() {
		})
		 .done(function( data ) {
			// store the return value in global variable
			esClusterOriginal = data;
			 	var masterNode;
				// indices
				$.each( data.metadata.indices, function( name, index) {
					esCluster.addIndices(new ESIndex(name, index));
				});
			 	// nodes
				$.each( data.nodes, function( name, node  ) {
					if (name===data.master_node)
					{
						masterNode = node;
					}
					esCluster.addNodes(new ESNode(node));
				});
			 	$.each(esCluster.indices, function (key, value)
			 	{
					$('#index').append("<option  value='"+value.indexName+"'>"+value.indexName+"</option>");
					$('#MappingIndex').append("<option  value='"+value.indexName+"'>"+value.indexName+"</option>");
					
			 	});
				// set the cluster name
				$('#cluster').html('<span style="font-weight:900">Cluster: </span><span style="background-color:' + cluster_state +'; color:white; font-weight:900">' + data.cluster_name + '</span>'
						+ '<span style="font-weight:900">  &nbsp;&nbsp;&nbsp;[Master: '+ masterNode.name + ']</span>');				
				$('#index').multiselect("refresh");
				$('#MappingIndex').multiselect("refresh");
				$('#connect').addClass("ui-state-disabled").attr("disabled", true);
				$("#tabs" ).tabs({ active: 1 });
				$('#refreshConn').show();
		  })
		.fail(function() { $('#cluster').html('<strong>Error connecting to: ' + loc + '</strong>'); });
}

function setAuthHeader(xhr) {
	var user = $('#username').val();
	var pass = $('#password').val();
	if(!!user && !!pass) {
		xhr.setRequestHeader("Authorization", "Basic " + btoa(user + ":" + pass));
	}
}

function escapeLuceneChars()
{
	var queryText =  $("#query").val();
	var luceneSpecialChrs = ['\\\\', '\\+', '\\-', '&&', '\\|\\|', '\\!', '\\(', '\\)', '\\{', '\\}', '\\[', '\\]', '\\^', '\\"', '\\~', '\\*', '\\?', '\\:'];
	$.each(luceneSpecialChrs, function (key, value)
	{
		var regEx = new RegExp(value, 'g');
		queryText = queryText.replace(regEx, value);
	});
	// show the escaped query in popup
	$("#dialog").dialog('option', 'title', 'Escaped Lucene query');
	$("#dialog").text( queryText ).removeClass("ui-state-disabled");
	$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
	$('#dialog').dialog('option','width',400);
	$('#dialog').dialog('option','height',200);				
	$('#dialog').dialog("open");	
}


function showDropIndex()
{
  if ($('#indexDrop').is(':checked')){
		$('#dropIndexDiv').show();
   }
   else{
		$('#dropIndexDiv').hide();
	}
}
function setQueryLabel()
{
  if ($('#useLucene').is(':checked')){
		$('#querySyntax').html("<strong>Lucene Query:</strong>");
		$('#query').text("*:*");
		$("#luceneEscape").show();
   }
   else{
		$('#querySyntax').html("<strong>DSL Query:</strong>");
		$('#query').text("{ \"query\": { \"match_all\" : { } } }");
		$("#luceneEscape").hide();
	}
}

function loadTypesForIndex(indxNameArr)
{
	$('#indexTypes').find('option').remove().end();
	var uniqueTypes = [];
	var types = [];
	$.each(indxNameArr, function( index, indxName ) 
	{
		$.each(esCluster.indices, function (key, value)
		{
			if (value.indexName == indxName || (value.aliases.indexOf(indxName) > -1))
			{
				$.each(value.indexMappings, function (key, mapping)
				{
					//$('#indexTypes').append("<option  value='"+key+"'>"+key+"</option>");
					// collect the types here.
					types.push(key);
				});
			}
		});
	});
	$.each(types, function(i, el){
		if($.inArray(el, uniqueTypes) === -1) uniqueTypes.push(el);
	});
	$.each(uniqueTypes, function(i, typeKey){
		$('#indexTypes').append("<option  value='"+typeKey+"'>"+typeKey+"</option>");
	});
	$('#indexTypes').multiselect("refresh");
}

function loadMappingTypesForIndex(indxNameArr)
{
	$('#MappingIndexTypes').find('option').remove().end();
	var uniqueTypes = [];
	var types = [];
	$.each(indxNameArr, function( index, indxName ) 
	{
		$.each(esCluster.indices, function (key, value)
		{
			if (value.indexName == indxName || (value.aliases.indexOf(indxName) > -1))
			{
				$.each(value.indexMappings, function (key, mapping)
				{
					// collect the types here.
					types.push(key);
				});
			}
		});
	});
	$.each(types, function(i, el){
		if($.inArray(el, uniqueTypes) === -1) uniqueTypes.push(el);
	});
	$.each(uniqueTypes, function(i, typeKey){
		$('#MappingIndexTypes').append("<option  value='"+typeKey+"'>"+typeKey+"</option>");
	});
   	
	$('#MappingIndexTypes').multiselect("refresh");
}

function mappingColumnsForTable()
{
	var columns = [];
	columns.push({ mData: 'fieldName' , sTitle : 'Field Name'});
	columns.push({ mData: 'index' , sTitle : 'Index (Analyze)', sDefaultContent : 'analyzed'});
	columns.push({ mData: 'type' , sTitle : 'Type'});
	columns.push({ mData: 'include_in_all' , sTitle : "Include in _all", sDefaultContent : 'true'});
	columns.push({ mData: 'analyzer' , sTitle : 'Analyzer', sDefaultContent : 'Global Default'});
	columns.push({ mData: 'store' , sTitle : 'Store', sDefaultContent : 'false'});
	columns.push({ mData: 'boost' , sTitle : 'Boost', sDefaultContent : '1.0'});
	return columns;
}


function flattenJSON(jsonData, parentPropName) {
    var result = [];
	
	$.each(jsonData, function(propName, jsonObj){
		var subObj = jsonObj.properties;
        if (subObj)
		{
			var subObjProps = flattenJSON(subObj, parentPropName ? parentPropName+"."+propName : propName);
			result = result.concat(subObjProps);
		}
		else
		{
			result.push(parentPropName ? parentPropName+"."+propName : propName);
		}
	});
    return result;
}

function flattenJSONForMappingTable(jsonData, parentPropName) {
    var result = [];
	
	$.each(jsonData, function(propName, jsonObj){
		var subObj = jsonObj.properties;
        if (subObj)
		{
			var subObjProps = flattenJSONForMappingTable(subObj, parentPropName ? parentPropName+"."+propName : propName);
			result = result.concat(subObjProps);
		}
		else
		{
			// Add field name to the JSON
			jsonObj['fieldName'] = parentPropName ? parentPropName+"."+propName : propName;
			result.push(jsonObj);
		}
	});
    return result;
}

function showMapping()
{
	var esType = $("#MappingIndexTypes").val();
	var esIndex = $("#MappingIndex").val();
	var mappingJSON = getMappingJSON(esIndex, esType);

	if ($("#mappingFormatJSON").is(':checked'))
	{
		$("#mappingTableDiv").hide();
		$('#mappingJson').show();
		$('#mappingJson').html(prettifyJson(mappingJSON, $('#mappingJson'), true));
	}
	else
	{
		$("#mappingTableDiv").show();
		if (mapTable)
		{
			mapTable.fnDestroy();
			mapTable.empty();
		}
		$('#mappingJson').hide();
		// Shallow copy
		var localMappingJSON = jQuery.extend(true, {}, mappingJSON);
		var flattedTableJSON = flattenJSONForMappingTable(localMappingJSON);
		var mappingCols = mappingColumnsForTable();
		mapTable = $('#mappingTable').dataTable( {
					"iDisplayLength": 20,
					"bRetrieve": true,
					"bDestroy": true,
					"bProcessing": false,
					"aoColumns": mappingCols,
					"bJQueryUI": true,
					 // Disable initial sort
					"aaSorting": [],
					"aaData": flattedTableJSON,
					"sScrollY": 300,
					"sScrollX": "100%"
					} );
		
	}
}

function getMappingJSON(indxNameArr, esType)
{
	var types = [];
	var stillFindingMapping = true;
	var mappingInfo;
	$.each(esClusterOriginal.metadata, function (metaInfoType, metaInfoVal)
	{
		if (metaInfoType == "indices" && stillFindingMapping)
		{
			$.each(metaInfoVal, function (indexName, indexDetails)
			{
				// collect the types here.
				if($.inArray(indexName, indxNameArr) > -1 && stillFindingMapping)
				{
					$.each(indexDetails, function (propName, mappingDetails)
					{
						if (propName == "mappings" && stillFindingMapping)
						{
							$.each(mappingDetails, function (mappingName, details)
							{
								//if (mappingName == esType[0])
								if($.inArray(mappingName, esType) > -1)
								{
									stillFindingMapping = false;
									mappingInfo = details.properties;
									return false;
								}
							});
						}
					});
				}
			});
		}
	});
	return mappingInfo;
}

function populateSearchFields(colData)
{
	$('#indexFields').find('option').remove().end();
	$.each(colData.cols, function (key, mapping)
	{
		if (mapping.sTitle)
		{
			$('#indexFields').append("<option  value='"+mapping.sTitle+"'>"+mapping.sTitle+"</option>");
		}
	});
	$('#indexFields').multiselect("refresh");
	$("#indexFields").multiselect("checkAll");
}

function populateSortFields(colData)
{
	$('#sortFields').find('option').remove().end();
	$.each(colData.cols, function (key, mapping)
	{
		if (mapping.sTitle)
		{
			$('#sortFields').append("<option  value='"+mapping.sTitle+"'>"+mapping.sTitle+"</option>");
		}
	});
	$('#sortFields').multiselect("refresh");
}

function adjustSearchFieldsForTable(colData)
{
	var searchFields;
	var fieldsForTable = [];
	
	$.each($("#indexFields").val(), function (key, row)
	{
		if (searchFields)
		{
			searchFields = searchFields + "," + row;
		}
		else
		{
			searchFields = row;
		}
		$.each(colData.cols, function (key, mapping)
		{
			if (row === mapping.sTitle)
			{
				fieldsForTable.push(mapping);
			}
			
		});
	});

	var retObj = new Object();
	retObj.searchFields = searchFields;
	retObj.fieldsForTable = fieldsForTable;
	return retObj;
}

function getQueryResultsColumns()
{
	var indxType = $("#indexTypes").val();
	var indxNameArr = $("#index").val();
	// reset the header 
	var columns = [];
	var isTypeFound = false;
	// add invisible column for the _id
	columns.push({ "bVisible": true, "mData" : "_id", sTitle : "_id" });
	$.each(esCluster.indices, function (key, value)
	{
		if($.inArray(value.indexName, indxNameArr) > -1)
		//if (value.indexName == indxName)
		{
			$.each(value.indexMappings, function (key, mapping)
			{
				if (key == indxType)
				{
					$.each(mapping.properties, function (propName, map)
					{
						columns.push({ mData: '_source.' + propName , sTitle : propName});
					});
				isTypeFound = true;
				return false;
				}	
			});
		}
		if (Boolean(isTypeFound))
		{
			return false;
		}
	});
	
	var retData = new Object();
	retData.cols = columns;
	return retData;
}

function formatResultsData(results)
{
	// reset the results body
	var data = [];
	$.each(results.hits.hits, function (key, value)
	{
		data.push(value);
	});
	return data;
}

function fnGetSelected( )
{
    return oTable.$('tr.row_selected');
}

function confirmDeleteByQuery()
{
	var queryText =  $("#query").val();
	if (!oTable)
	{
		$("#deleteByQuery").text("Please search on index first" );
		$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
		$('#deleteByQuery').dialog("open");		
		return;
	}
		$("#deleteByQuery").dialog('option', 'title', 'Please confirm if you want to DELETE!');
		$("#deleteByQuery").dialog( "option", "height", 300 );
		$("#deleteByQuery").dialog( "option", "width", 500 );
		$("#deleteByQuery").text("Are you sure you want to delete all rows returned by query [" + queryText + "]"  ).removeClass("ui-state-disabled");
		$( "#button-ok" ).removeClass("ui-state-disabled").attr("disabled", false);
		$('#deleteByQuery').dialog("open");
}

function dropIndexOrType()
{
		var indexMapping = getBaseUrl();
		var indexNames = $("#index").val();
		var typeName = $("#indexTypes").val();
		var loc = $("#location").val();
		$.ajaxSetup({
			beforeSend: setAuthHeader
		});
		var dropUrl = loc + "/" + indexNames;
		var msg = "Successfully dropped whole Index: [" + indexNames + "] and all its mappings";
		if (typeName)
		{
			msg = "Successfully dropped Type: [" + typeName + "] from Indices: [" + indexNames + "]";
			dropUrl = dropUrl + "/" + typeName
		}
		$.ajax({
		   url: dropUrl,
		   type: "DELETE"
		}).done(function ( data ) {
				$("#dialog").dialog('option', 'title', 'Index/Type dropped!');
				$("#dialog").text( msg ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog("open");
		}).error(function ( jqXHR, textStatus, errorThrown ) {
				$("#dialog").dialog('option', 'title', 'Error Deleting!');
				$("#dialog").text("Error dropping the Index/Type: [" + errorThrown + "]" ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog("open");
		});
}


function confirmIndexDelete()
{
	var indexNames = $("#index").val();
	var typeName = $("#indexTypes").val();
	if (!indexNames)
	{
		$("#deleteIndex").text("Please select index(s) you want to drop" );
		$( "#button-delete" ).addClass("ui-state-disabled").attr("disabled", true);
		$('#deleteIndex').dialog("open");		
		return;
	}
	
	$("#deleteIndex").dialog('option', 'title', 'Please confirm if you want to Drop Index/mapping!');
	$("#deleteIndex").dialog( "option", "height", 300 );
	$("#deleteIndex").dialog( "option", "width", 500 );
		
	if (!typeName)
	{
		$("#deleteIndex").text("Are you sure you want to drop the whole index [" + indexNames + "] and its mappings?" ).removeClass("ui-state-disabled");
	}
	else
	{
		$("#deleteIndex").text("Are you sure you want to drop the index mapping for type [" + typeName + "] in Indices [" + indexNames + "]"  ).removeClass("ui-state-disabled");
	}
	$( "#button-delete" ).removeClass("ui-state-disabled").attr("disabled", false);
	$('#deleteIndex').dialog("open");
}


function confirmDelete()
{
	if (!oTable)
	{
		$("#dialog").text("Please search on index first" );
		$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
		$('#dialog').dialog("open");		
		return;
	}
	var rowsToDelete = fnGetSelected();
	var idToDelete;
	$.each(rowsToDelete, function (key, row)
	{
		if (idToDelete)
		{
			idToDelete = idToDelete + "  " + row.id
		}
		else
		{
			idToDelete = row.id
		}
	});
	if (idToDelete)
	{
		$("#dialog").dialog('option', 'title', 'Please confirm!');
		$("#dialog").text("Are you sure you want to delete document(s) with id: [" + idToDelete + "]" ).removeClass("ui-state-disabled");
		$( "#button-ok" ).removeClass("ui-state-disabled").attr("disabled", false);
		$('#dialog').dialog("open");
	}
	else
	{
		$("#dialog").dialog('option', 'title', 'Please confirm!');
		$("#dialog").text("Please select atleast one row to delete" ).removeClass("ui-state-disabled");
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");	
	}	
}


function deleteRows()
{
	var rowsToDelete = fnGetSelected();
	$.each(rowsToDelete, function (key, row)
	{
		var rowID = encodeURIComponent(row.id);
		$.ajax({
		   url: getBaseUrl() + rowID + getRoutingKeyUrl(),
		   type: "DELETE",
		   data: {"refresh": true},
		   beforeSend: function ( xhr ) {
		  }
		}).done(function ( data ) {
			 //console.log("Sample of data:", data);
			 oTable.fnDeleteRow( row );
		}).error(function ( jqXHR, textStatus, errorThrown ) {
				$("#dialog").dialog('option', 'title', 'Error Deleting!');
				$("#dialog").text("Error deleting the row: [" + errorThrown + "]" ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog("open");
		});
	});
}

function validateQueryAndDeleteRowsByQuery()
{
	if($('#useLucene').is(':checked'))
		deleteRowsByLuceneQuery();
	else
		deleteRowsByDSLQuery();
}


function deleteRowsByLuceneQuery()
{
	var queryTextEncoded =  encodeURIComponent($("#query").val());
		$.ajax({
		   url: getBaseUrl() + "_query?q=" + queryTextEncoded,
		   type: "DELETE"
		}).done(function ( data ) {
			$('#example').empty();
		}).error(function ( jqXHR, textStatus, errorThrown ) {
				$("#dialog").dialog('option', 'title', errorThrown);
				$("#dialog").text("Error deleting the row: [" + jqXHR.responseText + "]" ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog('option','width',700);
				$('#dialog').dialog('option','height',400);
				$('#dialog').dialog("open");
		});
}
function deleteRowsByDSLQuery()
{
	var queryText =  $("#query").val();
	var jsonObj;
	try
	{ 
		jsonObj = JSON.parse(queryText); 
	}
	catch(e)
	{ 
		$("#dialog").dialog('option', 'title', "Invalid DSL");
		$("#dialog").text("Invalid JSON format for DSL query" ).removeClass("ui-state-disabled");
		$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
		$('#dialog').dialog('option','width',700);
		$('#dialog').dialog('option','height',400);
		$('#dialog').dialog("open");
		return;
	}

		$.ajax({
		   url: getBaseUrl() + "_query",
		   data: JSON.stringify(jsonObj),
		   type: "DELETE"
		}).done(function ( data ) {
			$('#example').empty();
		}).error(function ( jqXHR, textStatus, errorThrown ) {
				$("#dialog").dialog('option', 'title', errorThrown);
				$("#dialog").text("Error deleting the row: [" + jqXHR.responseText + "]" ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog('option','width',700);
				$('#dialog').dialog('option','height',400);
				$('#dialog').dialog("open");
		});
}
function validateQueryAndSearch()
{
	var typeName = $("#indexTypes").val();
	var indexName = $("#index").val();
	var loc = $("#location").val();
	$.ajaxSetup({
		beforeSend: setAuthHeader
	});
	var queryText = $("#query").val();
	var fields = $("#indexFields").val();

	if (!indexName)
	{
		$("#dialog").text("Please select 'Index and Type' to search on" );
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
		return;
	}	
	if (!typeName)
	{
		$("#dialog").text("Please select 'Index Type' to search" );
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
		return;
	}
	if (!fields)
	{
		$("#dialog").text("Please select atleast one index field to return from the search" );
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
		return;
	}
	if (!$('#useLucene').is(':checked')){
		queryText = JSON.stringify(queryText);	
	}
		// perform the search now
		searchIndex();
}

function split( val ) {
  return val.split( /,\s*/ );
}
    // Defines for the example the match to take which is any word (with Umlauts!!).
    function _leftMatch(string, area) {
        return string.substring(0, area.selectionStart).match(/[\wäöüÄÖÜß]+$/)
    }

    function _setCursorPosition(area, pos) {
        if (area.setSelectionRange) {
            area.setSelectionRange(pos, pos);
        } else if (area.createTextRange) {
            var range = area.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }
function setAutoCompleteForQuery()
{
	var colData = getQueryResultsColumns();
	var esType = $("#indexTypes").val();
	var esIndexArr = $("#index").val();
	var mappingJSON = getMappingJSON(esIndexArr, esType);
	var flatJSON = flattenJSON(mappingJSON);
	var autoCompleteSrc  = [];
	$.each(flatJSON, function(index,val){
		autoCompleteSrc.push(val + ":");
	});
	var autoCompleteMasterList = ["AND ", "OR ", "_exists_:", "_missing_:"];
	autoCompleteSrc = autoCompleteSrc.concat(autoCompleteMasterList);
	var formattedData;
    $("#query").autocomplete({
        position: { my : "right top", at: "right bottom" },
        source: function(request, response) {
            var str = _leftMatch(request.term, $("#query")[0]);
            str = (str != null) ? str[0] : "";
            response($.ui.autocomplete.filter(autoCompleteSrc, str));
        },
        //minLength: 2,  // does have no effect, regexpression is used instead
        focus: function() {
            // prevent value inserted on focus
            return false;
        },
        // Insert the match inside the ui element at the current position by replacing the matching substring
        select: function(event, ui) {
            var m = _leftMatch(this.value, this)[0];
            var beg = this.value.substring(0, this.selectionStart - m.length);
            this.value = beg + ui.item.value + this.value.substring(this.selectionStart, this.value.length);
            var pos = beg.length + ui.item.value.length;
            _setCursorPosition(this, pos);
            return false;
        },
        search:function(event, ui) {
            var m = _leftMatch(this.value, this);
            return (m != null )
        }
    });
	return colData;
}

function searchIndex()
{
	var fields = $("#indexFields").val();
	var sortField = $("#sortFields").val();
		
	if (sortField)
	{
		if($('#sortOrder').is(':checked')) {
			sortField = sortField + ":asc"
		} else {
			sortField = sortField + ":desc"
		}
	}
	else
	{
		sortField = "_score:desc";
	}
	var formattedData;
	if (oTable)
	{
		oTable.fnDestroy();
		$('#example').empty();
	}
	var queryText =  $("#query").val();
	var searchColObj = adjustSearchFieldsForTable(getQueryResultsColumns()); 
	
	$.ajax({
	   url: getBaseUrl() + "_search",
	   type: "GET",
	   data: $('#useLucene').is(':checked') ?
	   { "q": queryText , "sort": sortField, "from": $('#from').val(), "size": $('#size').val() , "lowercase_expanded_terms" : $('#lowerCaseExpandedTerms').is(':checked'), "analyze_wildcard" : $('#analyzeWildcard').is(':checked') , "search_type" : $('#searchType').val()[0] , "default_operator" : $('#defOperator').val()[0] }	
	   :{ "source": queryText , "sort": sortField, "from": $('#from').val(), "size": $('#size').val() , "lowercase_expanded_terms" : $('#lowerCaseExpandedTerms').is(':checked'), "analyze_wildcard" : $('#analyzeWildcard').is(':checked') , "search_type" : $('#searchType').val()[0] , "default_operator" : $('#defOperator').val()[0] }	
	}).done(function ( results ) {
		if ($('#showJsonResults').is(':checked')){
			var updatedJson = updateJSONFields(results.hits.hits);
			$('#jsonResults').html(prettifyJson(updatedJson, $('#jsonResults'), true));
		}
			formattedData = formatResultsData(results);
			$("#totalResults").html('<strong> Total results found: [' + results.hits.total + '] in '+ results.took +' ms</strong>');
			oTable = $('#example').dataTable( {
				"iDisplayLength": 20,
			    "bRetrieve": true,
				"bDestroy": true,
				"bProcessing": false,
				"aaData": formattedData,
				"sScrollY": 300,
				"sScrollX": "100%",
				"aoColumns": searchColObj.fieldsForTable,
				"bJQueryUI": true,
				  /* Disable initial sort */
				"aaSorting": [],
				"fnInitComplete": function(oSettings, json) {
				},
				"fnDrawCallback": function( oSettings ) {
						/* Add/remove class to a row when clicked on */
						$('#example tr').click( function() {
							$(this).toggleClass('row_selected');
						});
						/* bind double click function */
						$('#example tr').dblclick(function() {
							showJson(this);
						});
					},
				"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull) {
					$(nRow).attr("id",aData["_id"]);
					$(nRow).attr("recordIndexName",aData["_index"]);
					var count = 0;
					$.each( aData._source, function( key, value ) {
						var $cell=$('td:eq(' + count + ')', nRow);
						$cell.html(ellipsis($cell.text(),150));
						count = count + 1;
					});
					return nRow;	
					},
				"fnCreatedRow": function( nRow, aData, iDataIndex ) {
						//$(nRow).attr("class", "ui-state-highlight ui-corner-all");
					}					
			} );
		  }).error(function ( jqXHR, textStatus, errorThrown ) {
		  // create Default oTable
		  oTable = $('#example').dataTable( {
				"iDisplayLength": 20,
			    "bRetrieve": true,
				"bDestroy": true,
				"bProcessing": false,
				"aoColumns": searchColObj.fieldsForTable,
				"bJQueryUI": true,
				  /* Disable initial sort */
				"aaSorting": []
				} );
				$("#dialog").dialog('option', 'title', 'Error while searching!');
				$("#dialog").text("Error searching: [" + errorThrown + "] \nCaused by:\n" + jqXHR.responseText ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog('option','width',700);
				$('#dialog').dialog('option','height',400);				
				$('#dialog').dialog("open");
		});
}

function ellipsis(text, n) {
	// check for Date.
	if(text.length ==13 && (!isNaN(parseFloat(text)) && isFinite(text)) )
	{	
		var d =  new Date(parseInt(text));
		return d.toLocaleString();
	}

	var retText = text;
	if(text.length > n)
	{
		retText = text.substring(0,n)+"...";
	}
    return retText;
}

function showJson(row)
{
	var rowID = encodeURIComponent(row.id);
	var RecordIndexName = $(row).attr("recordIndexName");
	
	$.ajax({
	   //url: getBaseUrl() + "_search/?q=_id:\"" + rowID + "\"",
	   url: getBaseUrl(RecordIndexName) + rowID + getRoutingKeyUrl(),
	   type: "GET"	
	}).done(function ( data ) {
		//set the rowID attribute
		$('#rowView').attr("rowID", row.id);
		$('#rowView').attr("recordIndexName", RecordIndexName);
		//viewEditJSON = data.hits.hits[0]._source;
		viewEditJSON = data._source;
		$('#rowView').html(prettifyJson(viewEditJSON, $('#rowView'), false));
		$('#rowView').dialog('option','width',700);
		$('#rowView').dialog('option','height',400);
		$('#rowView').dialog("open");
	}).error(function ( jqXHR, textStatus, errorThrown ) {
				$("#dialog").dialog('option', 'title', 'Error fetching the data!' );
				$("#dialog").html('Error searching the row with ID:[' + row.id + '] <br/> Error thrown: [' + errorThrown + '] <br/>May be routing key is required and is missing or wrong!' ).removeClass("ui-state-disabled");
				$( "#button-ok" ).addClass("ui-state-disabled").attr("disabled", true);
				$('#dialog').dialog('option','width',700);
				$('#dialog').dialog('option','height',300);				
				$('#dialog').dialog("open");
		});
}

function getTypeCssClass(value)
{
	var valueType = value;
	var retCssClsType = 'string' // default
		if (_.isString(valueType))
		{
			retCssClsType = 'string';
		}
		else if (_.isArray(valueType))
		{
			retCssClsType = 'array';
		}
		else if (_.isNumber(valueType))
		{
			retCssClsType = 'number';
		}
		else if (_.isBoolean(valueType))
		{
			retCssClsType = 'boolean';
		}
		else if (_.isDate(valueType))
		{
			retCssClsType = 'date';
		}
		else if (_.isNull(valueType))
		{
			retCssClsType = 'null';
		}
		else if (_.isObject(valueType))
		{
			retCssClsType = 'object';
		}		
		return retCssClsType;
}

function updateJSONFields(json)
{
		var selectFields = $("#indexFields").val();
		if (typeof json != 'string')
		{
			 json = JSON.stringify(json, undefined, 4);
		}
		var jsonObj;
		try
		{ 
			jsonObj = JSON.parse(json); 
		}
		catch(e)
		{ 
			alert('not valid JSON');
			return;
		}
	
	$.each(jsonObj, function(index,jsonRow){
		$.each(jsonRow._source, function(jsonFieldName,jsonFieldVal){
			if (selectFields.indexOf(jsonFieldName) < 0)
			{
				delete jsonObj[index]._source[jsonFieldName];
			}
		});
	});
	return jsonObj;
}

function prettifyJson(json, divId, isExpandAll)
{
		if (typeof json != 'string')
		{
			 json = JSON.stringify(json, undefined, 4);
		}
		var jsonObj;
		try
		{ 
			jsonObj = JSON.parse(json); 
		}
		catch(e)
		{ 
			alert('not valid JSON');
			return;
		}
		var node = new PrettyJSON.view.Node({ 
			el:divId,
			data: jsonObj,
			dateFormat:"DD/MM/YYYY - HH24:MI:SS"
		});
		if (isExpandAll)
		{
			node.expandAll();
		}
}

// Index with over write
function updateRow(dialog)
{
	var rowID = encodeURIComponent($('#rowView').attr("rowID"));
	var recordIndexName = $('#rowView').attr("recordIndexName");
	// now index the document back
	var updatedText = $("#editRow").val();
	
	$.ajax({
	   url: getBaseUrl(recordIndexName) + rowID + getRoutingKeyUrl(),
	   type: "PUT",
	   data: updatedText,
	   success: function (response) {
		$(dialog).dialog("close");
		$("#dialog").text("Successfully updated the row with id: " + decodeURIComponent(rowID));
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog('option','width',700);
		$('#dialog').dialog('option','height',300);			
		$('#dialog').dialog("open");
      },
      error: function (xhr, ajaxOptions, thrownError) {
		$(dialog).dialog("close");
		$("#dialog").text(xhr.responseText);
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
      }
	});
}

function showEditableJSON(rowDialog)
{
	$("#editRow").val(JSON.stringify(viewEditJSON, undefined, 3));
	$('#rowUpdate').dialog({ autoOpen: false, show: 'slide',
	    buttons: [
        {
            id: "button-cancel",
            text: "Cancel",
            click: function() {
				$(this).dialog("close");
            }
        },
       {
            id: "button-update",
            text: "Update",
            click: function() {
				updateRow(this);
            }
        }		
    ]
	});
	$("#rowUpdate").dialog('option','width',700);
	$('#rowUpdate').dialog('option','height',400);
	$('#rowUpdate').dialog("open");
}


