
var plumbInstance;
var CLUSTER_PIVOT = 75; // Default cluster pivot
var H_SPACE = 6.5; // Horizontal spacing for nodes
var V_SPACE = 15; // Vertical spacing for nodes
var V_FIRST = 12; // First level (nodes/Indices) vertical positioning
var V_SECOND = +V_FIRST + +V_SPACE; // Second level
var V_THIRD = +V_SECOND + +V_SPACE; // Third level for shards
var V_START = 0;

var lastNodeIndexConnections = new Array();
var lastIndexNodeConnections = new Array();
var lastShardConnections = new Array();
var lastNode;
var lastIndex;
var clusterHealthData;
var esClusterInfo;
var indexAliasInfo;

/**
 * Convert number of bytes into human readable format
 *
 * @param integer bytes     Number of bytes to convert
 * @param integer precision Number of digits after the decimal separator
 * @return string
 */
function bytesToSize(bytes, precision)
{	
	var kilobyte = 1024;
	var megabyte = kilobyte * 1024;
	var gigabyte = megabyte * 1024;
	var terabyte = gigabyte * 1024;
	
	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + ' B';

	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		return (bytes / kilobyte).toFixed(precision) + ' KB';

	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		return (bytes / megabyte).toFixed(precision) + ' MB';

	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		return (bytes / gigabyte).toFixed(precision) + ' GB';

	} else if (bytes >= terabyte) {
		return (bytes / terabyte).toFixed(precision) + ' TB';

	} else {
		return bytes + ' B';
	}
}


function storeLocalClusterURL(clusterURL)
{
	if(typeof(Storage) !== "undefined" && clusterURL) {
		var prevClusterUrls = getPreviousClusterURL();
		prevClusterUrls.push(clusterURL);
		var uniqueURL = [];
		// Dedupe the urls.
		$.each(prevClusterUrls, function(i, el){
			if($.inArray(el, uniqueURL) === -1) uniqueURL.push(el);
		});
		// now store this in localstore;
		localStorage.urls = JSON.stringify(uniqueURL);
	}
}

function getPreviousClusterURL()
{
	var prevClusterUrls = [];
	if (localStorage.urls)
	{
		prevClusterUrls =  JSON.parse(localStorage.urls);
	}
	return prevClusterUrls;
}


function showAllShardInfo()
{
	var esIndex = $("#MappingIndex").val();
	showIndexShardInfo(esIndex);
}

function getIndexShardInfo(clusterShardData, esIndex)
{
	var shardJSONArr = [];
	var jsonCols = ["indexName", "shard", "type", "state", "docs", "size", "nodeIp", "nodeName" ];
	var shardInfo  = clusterShardData.split("\n");
		$.each( shardInfo, function( index, shard  ){
			var shardDetails = shard.toString().split(" ");
			var count = 0;
			var jsonObj = {};
			$.each( shardDetails, function( index, value  ){
				if (value.length > 0)
				{
					var jsonValue = value;
					if (count == 2)
					{
						jsonValue = value=='p' ? 'Primary' : 'Replica';
					}
					jsonObj[jsonCols[count]] = jsonValue;
					count = count + 1;
				}
			});
			if (!esIndex || (esIndex && jsonObj.indexName == esIndex))
			{
				if (jsonObj.indexName){
					shardJSONArr.push(jsonObj);
				}
			}
		});
	return shardJSONArr;
}


function showIndexShardInfo(esIndex)
{
		var shardJSONArr = getIndexShardInfo(globalClusterShardData, esIndex);

		var columns = [];
		columns.push({ mData: 'indexName' , sTitle : 'Index Name'});
		columns.push({ mData: 'nodeName' , sTitle : 'Node'});
		columns.push({ mData: 'shard' , sTitle : 'Shard'});
		columns.push({ mData: 'type' , sTitle : 'Type'});
		columns.push({ mData: 'state' , sTitle : "State"});
		columns.push({ mData: 'docs' , sTitle : 'Docs'});
		columns.push({ mData: 'size' , sTitle : 'Size'});
		columns.push({ mData: 'nodeIp' , sTitle : 'IP'});
		// clear the old datatable from memory
	if ($("#mappingFormatJSON").is(':checked'))
	{
		$("#mappingTableDiv").hide();
		$('#mappingJson').show();
		$('#mappingJson').html(prettifyJson(shardJSONArr, $('#mappingJson'), true));
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
		mapTable = $('#mappingTable').dataTable( {
					"iDisplayLength": 20,
					"bRetrieve": true,
					"bDestroy": true,
					"bProcessing": false,
					"aoColumns": columns,
					"bJQueryUI": true,
					 // Disable initial sort
					"aaSorting": [],
					"aaData": shardJSONArr,
					"sScrollY": 300,
					"sScrollX": "100%",
					"fnDrawCallback": function( oSettings ) {
						/* bind double click function */
						$('#mappingTable tr').dblclick(function() {
							showShardInfo(this);
						});
					},
					"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull) {
						$(nRow).attr("jsonData",aData.valueOf());
						return nRow;	
					}					
				});
	}			
}

function showShardInfo(shard)
{
	var jsonRow =  $(shard).attr("jsonData");
	var jsonRowObj = JSON.parse(jsonRow);
	alert(jsonRowObj.indexName);
}

function getJSPlumbInstance()
{
	plumbInstance = jsPlumb.getInstance();	
	/*plumbInstance.importDefaults({
		  PaintStyle : {
			lineWidth:1,
			strokeStyle: 'rgba(200,0,0,0.5)'
		  },
		  DragOptions : { cursor: "crosshair" },
		  EndpointStyles : [{ fillStyle:"#225588" }, { fillStyle:"#558822" }],
		  hoverPaintStyle:{ strokeStyle:"rgb(0, 0, 135)" },
		  anchors:["BottomRight","TopLeft"],
		  connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ]
		});*/
	return plumbInstance; 
}

function detachNodeIndexConnections()
{
	$.each($(lastNodeIndexConnections), function( index, conn  ){
		plumbInstance.detach(conn);
	});
	// remove all the index Div's
	$(".indexNode").remove();
	lastNodeIndexConnections = [];	
}

function detachIndexNodeConnections()
{
	$.each($(lastIndexNodeConnections), function( index, conn  ){
		plumbInstance.detach(conn);
	});
	// remove all the index Div's
	$(".clusterNode").remove();
	lastIndexNodeConnections = [];	
}


function detachShardConnections()
{
	$.each($(lastShardConnections), function( index, conn  ){
		plumbInstance.detach(conn);
	});
	// remove all the shard Div's
	$(".shardNode").remove();
	lastShardConnections = [];	
}

function connect(src, dest, connectorLabel)
{
	var conn = plumbInstance.connect({source: src, target: dest,
							  anchors:["BottomCenter","TopCenter"],
							  paintStyle:{lineWidth:1,strokeStyle:'rgba(0,0,255,0.5)'},
							  hoverPaintStyle:{ strokeStyle:"rgb(255, 100, 0)" },
							  endpoint:[ "Rectangle", {
										  cssClass:"endPoint",
										  width:10, 
										  height:7 
									  }],
							  DragOptions : { cursor: "crosshair" },
							  connector: [ "Flowchart", { stub: [40, 60], gap: 5, cornerRadius: 5, alwaysRespectStubs: true } ],
							  overlays:[ [ "Label", { label:connectorLabel, location:30, id:"myLabel", cssClass: "aLabel" } ]]
	});
	return conn;
}

/**
  Gets the array of cluster node object
**/
function getClusterNodes(isMatchSearch)
{
	var nodes = new Array();
	var positionVal = 0;
	var nodeCount = 0;
	
	$.each( esClusterOriginal.nodes, function( nodeId, nodeData  ){
		var isClientNode = isFalse(nodeData.attributes.data); // client node
		if (isMatchSearch && (!$("#ClientNodes").is(':checked') && isClientNode)){
			return true;
		}
		if (isMatchSearch && (!$("#DataNodes").is(':checked') && !isClientNode)){
			return true;
		}
		if (isMatchSearch && (!isSearchStrMatched(nodeData.name))){ // match on node name
			// before skipping this, check on node ip as well
			if (!isSearchStrMatched(nodeData.transport_address)){ // match on ip address
				return true;
			}
		}
			var nodeInfo = {Id : nodeId, data: nodeData, pos: positionVal};
			positionVal = +positionVal + +H_SPACE;
			nodes.push(nodeInfo);
			nodeCount++;
	});
	// override cluster pivot only for below condition.
	//if ( 0 > (CLUSTER_PIVOT - (( H_SPACE * nodeCount ) / 2)))
	{
		CLUSTER_PIVOT = ( H_SPACE * nodeCount ) / 2;
	}	
	return nodes;
}

function getClusterIndexInfo(indexName)
{
	var indexInfo;
	$.each( esClusterInfo.indices, function( name, indexData ){
		if (name === indexName){
			indexInfo = {name : indexName, data: indexData};
			return false;
		}
	});
	return indexInfo;
}

function isNotEmpty(str) {
    return (str || 0 < str.length);
}

function isSearchStrMatched(indexOrNodeName)
{
	var searchStr = $('#nameFilter').val();
	// if search string is not filled in, return true
	if (!isNotEmpty(searchStr)){
		return true;
	}else if(isNotEmpty(searchStr) && (indexOrNodeName.search(searchStr) > -1)){
		return true;
	}
	return false;
}

function getClusterIndices(nodeShardDataArray)
{
	var positionVal = 0;
	var indexCount = 0;
	var indices = new Array();
	
	$.each( esClusterInfo.indices, function( indexName, indexData ){
		var shardStateInfo =  getShardStateInfoForIndex(nodeShardDataArray, indexName);
		var hasUnassigned = (shardStateInfo && (shardStateInfo.unassignedShards.length > 0)) ? true : false;
		if ($("#UnassignedOnly").is(':checked')){
			if (!hasUnassigned){
				return true;
			}
		}
		if (isSearchStrMatched(indexName)){
			var indexInfo = {Id : indexName, data: indexData, pos: positionVal};
			positionVal = +positionVal + +H_SPACE;
			indices.push(indexInfo);
			indexCount++;
		}			
	});
	// override cluster pivot only for below condition.
	//if ( 0 > (CLUSTER_PIVOT - (( H_SPACE * indexCount ) / 2)))
	{
		CLUSTER_PIVOT = ( H_SPACE * indexCount ) / 2;
	}
	return indices;
}

function isFalse(val)
{
	if (val==="false")
	{
		return true;
	}
	return false;
}

function isTrue(val)
{
	if (val==="true")
	{
		return true;
	}
	return false;
}

function plotNodeDiv(nodeIPaddr, nodeInfo, parentId, leftPos, topPos)
{
	var css_class = "clusterNode";
	var nodeName = nodeInfo.data.name
	var isClientNode = isFalse(nodeInfo.data.attributes.data);
	var isMasterNode = isTrue(nodeInfo.data.attributes.master);
	var isActiveMasterNode = esClusterOriginal.master_node == nodeInfo.Id;
	var colorName = "#66FFFF";
	var nodeIP = parseIpAddress(nodeInfo.data.transport_address);
	//var nodeText = nodeIP + '&nbsp;&nbsp;<img src=".\\media\\images\\down.png" height="13" width="13">';
	var nodeText = "[D] " + nodeIP;
	var titleVal = "[Data Node] " + nodeName;
	if (isClientNode){
		colorName = "#CCFFFF";
		nodeText = "[C] " + nodeIP;
		titleVal = "[Client Node] " + nodeName;
	}
	if (isMasterNode){
		colorName = "#CCFF00";
		nodeText = "[M] " + nodeIP;
		titleVal = "[Secondary Master] " + nodeName;
	}
	if (isActiveMasterNode){
		colorName = "#FF9900";
		nodeText = "[M] " + nodeIP;
		titleVal = "[Active Master] " + nodeName;
	}
	$("#ClusterContainer").append('<div idd='+ nodeIP +' data-tooltip="'+titleVal+'" parentID='+ parentId + ' class='+css_class+' id='+ nodeIPaddr + ' hPos='+ leftPos + ' vPos='+ topPos + ' nodeName='+nodeName+' style="position:absolute; border-color:'+ colorName + '; left: ' + leftPos +'em; top: '+ topPos + 'em;"><span>'+ nodeText + '</span></div>');	
}

function appendPlotShardDiv(IndexOrNodeName, shardInfo, leftPos, topPos)
{
	var css_class = "shardNode";
	var isReplica = shardInfo.type == 'Replica' ? true : false;
	var colorName = "#66FFFF";
	var nodeText = shardInfo.shard + ' docs: ' + shardInfo.docs; // 
	var titleText = shardInfo.shard + ", Docs: "+ shardInfo.docs + ", Size: " + shardInfo.size;
	if (isReplica){
		nodeText = "[R] " + nodeText; 
		colorName = "#FF0000";	
		titleText = "[Replica] " + titleText;	
	}
	else{
		nodeText = "[P] " + nodeText;
		titleText = "[Primary] " + titleText;		
	}
	
	$("#ClusterContainer").append('<div class='+css_class+' data-tooltip="'+titleText+'" id="'+ IndexOrNodeName + shardInfo.shard + leftPos + '" hPos='+ leftPos + '" style="position:absolute;  border-color:'+ colorName + '; left: ' + leftPos +'em; top: '+ topPos + 'em;">'+ nodeText +'</div>');	
}

function getAliasesForIndex(indexName)
{
	var aliases = [];
	$.each( indexAliasInfo, function( index, aliasInfo ){
		if (index === indexName){
			$.each( aliasInfo.aliases, function( alias, aliasVal ){
				aliases.push(alias);
			});
		}
	});
	return aliases;
}

function appendPlotIndexDiv(indexName, parentId, leftPos, topPos, nodeShardDataArray, indexInfo)
{
	var nodeText = indexName;
	var css_class = "indexNode";
	var shardStateInfo =  getShardStateInfoForIndex(nodeShardDataArray, indexName);
	var unassignedSharArray = shardStateInfo.unassignedShards;
	var aliases = getAliasesForIndex(indexName);
	var aliasInfoText = (aliases.length > 0) ? "Aliases:["+ aliases +"] ": "";
	var indexDocInfo = "Total Docs: ";
	if (indexInfo){
		indexDocInfo = indexDocInfo + indexInfo.data.primaries.docs.count + " Size: " + bytesToSize(indexInfo.data.primaries.store.size_in_bytes,2);
	}
	var shardInfoText = "All ["+shardStateInfo.primary+"] primary " + ((shardStateInfo.replica > 0) ? "and ["+shardStateInfo.replica+"] replica shards are active. " : "shards are active. ");
	var titleVal = shardInfoText + ' &#013; ' + indexDocInfo  + ' &#013; '+ aliasInfoText;
	var hasUnassigned = (!unassignedSharArray || unassignedSharArray.length > 0) ? true : false;
	var colorName = "#66FFFF";	
	if (hasUnassigned){
		nodeText = nodeText; 
		colorName = "#FF0000";
        titleVal = '[ ' + unassignedSharArray.length + ' ] In-active shards!!!';
        $.each( unassignedSharArray, function( index, shardInfo ){
			titleVal = titleVal + ' &#13; ' + shardInfo.type + ' ' +  shardInfo.shard + ' ' + shardInfo.state ;
		});
		titleVal = titleVal + ' &#13; ' + indexDocInfo + ' &#013; '+ aliasInfoText;
	}
	else{
		nodeText = nodeText; 
	}
	$("#ClusterContainer").append('<div idd='+indexName+' data-tooltip="'+titleVal+'" class='+css_class+' parentID='+ parentId + ' hPos='+ leftPos +' id="'+ indexName + leftPos + '" style="position:absolute; left: ' + leftPos +'em; top: '+ topPos + 'em; border-color:'+ colorName + '">'+ nodeText + '</div>');	
}

function plotHeadDiv(elemId, leftPos, topPos)
{
	var colorName = clusterHealthData.status;
	$("#ClusterContainer").append('<div class="clusterName tooltip-bottom" id='+ elemId +' style="position:absolute; border-color:'+ colorName +'; left: ' + leftPos +'em; top: '+ topPos + 'em;">'+ elemId + '</div>');	
	$("#"+elemId).attr('data-tooltip', JSON.stringify(clusterHealthData,null,4));
}

function parseIpAddress(transport_address)
{
	var nodeIPaddr = transport_address.substring(6,transport_address.indexOf(":"));	
	return nodeIPaddr;
}

function togglePosition(verticalPosition, lowVal, highVal)
{
	var vPos = (verticalPosition === lowVal) ? highVal : lowVal;
	return vPos;	
}


function plotCluster()
{
	CLUSTER_PIVOT = 75;
	if (!esClusterOriginal){
		$("#dialog").text("Cluster is not connected. Please connect to cluster" );
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
		return;		
	}
	
	var loc = $("#location").val();
	var jqxhr = $.get( loc + "/_cluster/health").done(function( healthData ) {
		clusterHealthData  = healthData;
		$("#plotHealth").html("");
		// fetch index alias info
		$.get( loc + "/_alias").done(function( aliasInfo ) {
				indexAliasInfo = aliasInfo;
		$.getJSON( loc + "/_stats").done(function( data ) {
				 // store the return value in global variable
				esClusterInfo = data;
			plumbInstance = getJSPlumbInstance();
			// plot the info about the shards(unassigned, initializing and started)
			var stateHtml = '<ul style="color:'+"blue"+';">';
			stateHtml+= "<li>Active: "+clusterHealthData.active_shards+"</li>";
			stateHtml+= "<li>Unassigned: "+clusterHealthData.unassigned_shards+"</li>";
			stateHtml+= "<li>Initializing: "+clusterHealthData.initializing_shards+"</li>";
			stateHtml+= "<li>Relocating: "+clusterHealthData.relocating_shards+"</li>";
			stateHtml+= '</ul>';
			$("#plotHealth").html(stateHtml);
			if ($("#plotByIndex").is(':checked')){
				$("#clientNodeRow").css("display", "none");
				$("#dataNodeRow").css("display", "none");
				$("#indexRow").attr( "style", "" );				
				$("#ClusterContainer").html('');
				$("#ClusterContainer").show();			
				plotClusterByIndex();
			}else{
				$("#clientNodeRow").attr( "style", "" );
				$("#dataNodeRow").attr( "style", "" );
				$("#indexRow").css("display", "none");				
				$("#ClusterContainer").html('');
				$("#ClusterContainer").show();			
				plotClusterByNode();
			}
			$( ".clusterName" ).dblclick(function() {
				showClusterInfo(this);
			});
		}); // end _stats
		}); // end _alias
	});	// end _health
}

function refreshPlot()
{
	if (!esClusterOriginal){
		$("#dialog").text("Cluster is not connected. Please connect to cluster" );
		$( "#button-ok" ).attr("disabled", true).addClass("ui-state-disabled");
		$('#dialog').dialog("open");
		return;		
	}
	// get the fresh cluster layout data
	var loc = $("#location").val();
	var jqxhr = $.get( loc + "/_cat/shards").done(function( shardData ) {
		globalClusterShardData  = shardData;
		// fetch index alias info
		$.get( loc + "/_alias").done(function( aliasInfo ) {
				indexAliasInfo = aliasInfo;		
	
		$.get( loc + "/_cluster/health").done(function( healthData ) {
		clusterHealthData  = healthData;
		$("#plotHealth").html("");
		$("#ClusterContainer").html("");
		$.getJSON( loc + "/_stats").done(function( data ) {
			 // store the return value in global variable
			esClusterInfo = data;
			// plot the info about the shards(unassigned, initializing and started)
			var stateHtml = '<ul style="color:'+"blue"+';">';
			stateHtml+= "<li>Active: "+clusterHealthData.active_shards+"</li>";
			stateHtml+= "<li>Unassigned: "+clusterHealthData.unassigned_shards+"</li>";
			stateHtml+= "<li>Initializing: "+clusterHealthData.initializing_shards+"</li>";
			stateHtml+= "<li>Relocating: "+clusterHealthData.relocating_shards+"</li>";
			stateHtml+= '</ul>';
			$("#plotHealth").html(stateHtml);		
			var localNodeShardDataArray = getIndexShardInfo(globalClusterShardData, null);
			var localLastNode = lastNode;
			var localLastIndex = lastIndex;
			$("#clusterName").css("border-color", clusterHealthData.state);
			
			if ($("#plotByIndex").is(':checked')){
				plotClusterByIndex();
				if (localLastIndex){
					plotNodesForIndex(localLastIndex, localNodeShardDataArray);
				}
				if (localLastNode){
					plotShardsForNode(localLastNode, localNodeShardDataArray);
				}			
			} else {
				plotClusterByNode();
				if (localLastNode){
					plotIndicesForNode(localLastNode, localNodeShardDataArray);
				}
				if (localLastIndex){
					plotShardsForIndex(localLastIndex, localNodeShardDataArray);	
				}		
			}
		}); // end _stats
		});	// end _alias
		});	// end _health
	}); // end _shards
}

function plotClusterByIndex()
{
	/**
		Show the top level div with cluster name in it.
		Loop on all the nodes and create div for them with proper position, Style: increment the position and keep top same
		Connect all the new div's with parent cluster node.
		After exiting the nodes loop, loop on the index array, for given node 
	**/
	var nodeShardDataArray = getIndexShardInfo(globalClusterShardData, null);
	var indexInfoArray = getClusterIndices(nodeShardDataArray);
	plotHeadDiv(esClusterOriginal.cluster_name, CLUSTER_PIVOT, V_START);
	var vPos = V_FIRST;
	// plot the nodes
	$.each( indexInfoArray, function( index, indexInfo ){
		appendPlotIndexDiv( indexInfo.Id, indexInfo,indexInfo.pos, vPos, nodeShardDataArray, indexInfo);
		connect(esClusterOriginal.cluster_name, indexInfo.Id + indexInfo.pos, "Indices");
		vPos = togglePosition(vPos, V_FIRST, +V_FIRST + 4);
	});
	// register click event
	 $( ".indexNode" ).click(function() {
		 plotNodesForIndex(this, nodeShardDataArray);
	});
	 $( ".indexNode" ).dblclick(function() {
		showIndexInfo(this);
	});		
}

function getNodeInfoForNode(nodeInfoArray, nodeIp)
{
	var retNodeInfo;
	$.each( nodeInfoArray, function( index, nodeInfo ){
		var nodeIPaddr = parseIpAddress(nodeInfo.data.transport_address);
		if (nodeIPaddr === nodeIp)
		{
			retNodeInfo = nodeInfo;
			return false;
		}
	});
	return retNodeInfo;
}

function plotNodesForIndex(index, nodeShardDataArray)
{
	// Store last index for refreshPlot
	lastIndex = index;
	lastNode = null;
	// detach all the node indices for this node, to remove the clutter
	var indexName = $(index).attr('idd');
	detachIndexNodeConnections();
	detachShardConnections();
	var indexNodeNames = getNodeNamesForIndex(nodeShardDataArray, indexName);
	var nodePos = $(index).attr('hPos');
	var nodeVPos = $(index).attr('vPos');
	var posIncrement = H_SPACE + +1;
	var vPosition = V_SECOND;
	var noOfNodes = indexNodeNames.length;
	var nodeInfoArray = getClusterNodes(false);
	var indexPosInfo = getInitialIndexOrShardsPos(noOfNodes, nodePos, posIncrement);
	var indexPos = indexPosInfo.initIndexPos;
	$.each(indexNodeNames, function (pos, nodeName){
		var nodeInfo = getNodeInfoForNode(nodeInfoArray, nodeName);
		plotNodeDiv( nodeName + indexPos, nodeInfo, indexName, indexPos, vPosition);
		vPosition = togglePosition(vPosition, V_SECOND, +V_SECOND + 4);
		lastIndexNodeConnections.push(connect($(index).attr('id'), nodeName + indexPos, "Nodes"));
		indexPos = indexPos + indexPosInfo.posIncrement;
	});
	// register click event
	 $( ".clusterNode" ).click(function() {
		 plotShardsForNode(this, nodeShardDataArray);
		
	});	
	$( ".clusterNode" ).dblclick(function() {
		showNodeInfo(this);
	});	
}

function getNodeNamesForIndex(nodeShardDataArray, indexName)
{
	var nodes = [];
	$.each( nodeShardDataArray, function( index, shardData ){
		if (shardData.indexName === indexName){
			if (shardData.nodeIp){
				nodes.push(shardData.nodeIp);
			}
		}
	});
	return 	_.uniq(nodes, false);	
}

function plotClusterByNode()
{
	/**
		Show the top level div with cluster name in it.
		Loop on all the nodes and create div for them with proper position, Style: increment the position and keep top same
		Connect all the new div's with parent cluster node.
		After exiting the nodes loop, loop on the index array, for given node 
	**/

	var nodeInfoArray = getClusterNodes(true);
	plotHeadDiv(esClusterOriginal.cluster_name, CLUSTER_PIVOT, V_START);
	var nodeShardDataArray = getIndexShardInfo(globalClusterShardData, null);
	//console.log(nodeShardDataArray);
	var vPos = V_FIRST;
	// plot the nodes
	$.each( nodeInfoArray, function( index, nodeInfo ){
		var nodeIPaddr = parseIpAddress(nodeInfo.data.transport_address);
		plotNodeDiv( nodeIPaddr, nodeInfo, esClusterOriginal.cluster_name, nodeInfo.pos, vPos);
		connect(esClusterOriginal.cluster_name, nodeIPaddr, "Nodes");
		vPos = togglePosition(vPos, V_FIRST, +V_FIRST + 4);
	});
	// register click event
	 $( ".clusterNode" ).click(function() {
		 plotIndicesForNode(this, nodeShardDataArray);
	});
	 $( ".clusterNode" ).dblclick(function() {
		showNodeInfo(this);
	});	
}

function showNodeInfo(node)
{
    var nodeId =  encodeURIComponent($(node).attr("idd"));
	var loc = $("#location").val();
	$.ajax({
	   url: loc + "/_nodes/" + nodeId,
	   type: "GET"	
	}).done(function ( data ) {
	   var infoJson = data;
	   $('#infoTip').dialog('option', 'title', '['+ $(node).attr("nodename") +'] detailed information');
		$('#infoTip').html(prettifyJson(infoJson, $('#infoTip'), false));
		$('#infoTip').dialog('option','width',500);
		$('#infoTip').dialog('option','height',200);
		$('#infoTip').dialog("open");
	});
}

function showIndexInfo(index)
{
	var indexName =  encodeURIComponent($(index).attr("idd"));
	var loc = $("#location").val();
	$.ajax({
	   url: loc + "/" + indexName + "/_status",
	   type: "GET"	
	}).done(function ( data ) {
	   var infoJson = data;
	   $('#infoTip').dialog('option', 'title', '['+ indexName +'] detailed information');
		$('#infoTip').html(prettifyJson(infoJson, $('#infoTip'), false));
		$('#infoTip').dialog('option','width',500);
		$('#infoTip').dialog('option','height',200);
		$('#infoTip').dialog("open");
	});
}

function showClusterInfo(cluster)
{
	var loc = $("#location").val();
	$.ajax({
	   url: loc + "/_cluster/stats",
	   type: "GET"	
	}).done(function ( data ) {
	   var infoJson = data;
	   $('#infoTip').dialog('option', 'title', '['+ $(cluster).attr("id") +'] STATE');
		$('#infoTip').html(prettifyJson(infoJson, $('#infoTip'), false));
		$('#infoTip').dialog('option','width',500);
		$('#infoTip').dialog('option','height',200);
		$('#infoTip').dialog("open");
	});
}

function getInitialIndexOrShardsPos(noOfIndicesOrShards, nodeOrIndexPos, posIncrement)
{
	var initialIndexPos = CLUSTER_PIVOT;
	var posIncr = posIncrement;
	// Calculated node cannot be more than CLUSTER_PIVOT * 2 or less than 0
	// total span for index
	var halfIndexSpan =  ( noOfIndicesOrShards * posIncrement ) / 4; // because of Index staggering plot
	// 25% of indices should be on other side
	if (nodeOrIndexPos >= CLUSTER_PIVOT) // if node on right of center
	{
		initialIndexPos = +nodeOrIndexPos + +halfIndexSpan;
		if (initialIndexPos >= (CLUSTER_PIVOT * 2))
		{
			initialIndexPos = CLUSTER_PIVOT * 2;
		}
		posIncr = -Math.abs(posIncrement);
		// check if last node will go in negative position, if yes then we need to move more right for first node (initialIndexPos)
		if (0 > initialIndexPos - (noOfIndicesOrShards * posIncrement))
		{
			initialIndexPos = initialIndexPos + +((noOfIndicesOrShards * posIncrement) - initialIndexPos);	
		}
	}
	else{
		initialIndexPos = +nodeOrIndexPos - +halfIndexSpan;
		if (initialIndexPos <= 0)
		{
			initialIndexPos = 0;
		}		
		posIncr = Math.abs(posIncrement);	
	}
	var retObj = new Object();
	retObj.initIndexPos = initialIndexPos;
	retObj.posIncrement = posIncr;
	return retObj;	
	
}

/***
** Plot the Indices for given node
*/
function plotIndicesForNode(node, nodeShardDataArray)
{
	// Store the last node and wipe the lastIndex for refreshPlot
	lastNode = node;
	lastIndex = null;
	// detach all the node indices for this node, to remove the clutter
	var nodeIP = $(node).attr('id');
	detachNodeIndexConnections();
	detachShardConnections();
	var nodeIndexNames = getIndexNamesForNode(nodeShardDataArray, $( node ).attr('nodename'));
	var nodePos = $(node).attr('hPos');
	
	var posIncrement = H_SPACE + +1;
	var vPosition = V_SECOND;
	var noOfIndices = nodeIndexNames.indices.length;
	var indexPosInfo = getInitialIndexOrShardsPos(noOfIndices, nodePos, posIncrement);
	var indexPos = indexPosInfo.initIndexPos;
	$.each(nodeIndexNames.indices, function (pos, indexName){
		var indexInfo = getClusterIndexInfo(indexName);
		appendPlotIndexDiv(indexName, nodeIP, indexPos, vPosition, nodeShardDataArray, indexInfo);
		vPosition = togglePosition(vPosition, V_SECOND, +V_SECOND + 4);
		lastNodeIndexConnections.push(connect(nodeIP, indexName + indexPos, "Indices"));
		indexPos = indexPos + indexPosInfo.posIncrement;
	});
	// register click event
	 $( ".indexNode" ).click(function() {
		 plotShardsForIndex(this, nodeShardDataArray);
		
	});	
	$( ".indexNode" ).dblclick(function() {
		showIndexInfo(this);
	});	
}

function plotShardsForIndex(index, nodeShardDataArray)
{
	// Store the last index for refreshPlot
	lastIndex = index; 
	var indexName = $(index).attr("idd");
	var nodeId = $(index).attr("parentID");
	var indexPos = $(index).attr("hPos");
	plotShards(indexName, nodeId, indexPos, nodeShardDataArray, true);
}

function plotShardsForNode(node, nodeShardDataArray)
{
	// Store the last node for refreshPlot
	lastNode = node;
	var nodeId = $(node).attr("idd");
	var indexName = $(node).attr("parentID");
	var indexPos = $(node).attr("hPos");
	plotShards(indexName, nodeId, indexPos, nodeShardDataArray, false);
}

function plotShards(indexName, nodeId, indexPos, nodeShardDataArray, isIndex)
{
	detachShardConnections();
	var shardsForNodeIndex = getShardsForIndexOnNode(nodeShardDataArray, nodeId, indexName);
		//Plot the shard under the index node
		var posIncrement = H_SPACE+ +1;
		var vPosition = V_THIRD;
		var noOfShards = shardsForNodeIndex.length;
		var shardPosInfo = getInitialIndexOrShardsPos(noOfShards, indexPos, posIncrement);
		var shardPos = shardPosInfo.initIndexPos;
		$.each(shardsForNodeIndex, function (loc, shardInfo){
			if (isIndex){
				appendPlotShardDiv(indexName, shardInfo, shardPos, vPosition);
				lastShardConnections.push(connect(indexName + indexPos, indexName + shardInfo.shard + shardPos, "Shards"));
			}else{
				appendPlotShardDiv(nodeId, shardInfo, shardPos, vPosition);
				lastShardConnections.push(connect(nodeId + indexPos, nodeId + shardInfo.shard + shardPos, "Shards"));
			}
			vPosition = togglePosition(vPosition, V_THIRD, +V_THIRD + 4);
			shardPos = shardPos + shardPosInfo.posIncrement;
		});
}

/***
  Anything with state != "STARTED" is unassigned or initializing, in other words not ready
*/
function getShardStateInfoForIndex(shardDataArray, indexName)
{
	var unassignedShards = [];
	var shardPrimaryCount = 0;
	var shardReplicaCount = 0;
	$.each( shardDataArray, function( index, shardData ){
		if (shardData.indexName === indexName){
			if (shardData.type === "Replica"){
				shardReplicaCount++;
			}
			else if (shardData.type === "Primary"){
				shardPrimaryCount++;
			}
			if (shardData.state != "STARTED" && shardData.state != "RELOCATING"){
				unassignedShards.push({"shard": shardData.shard, "type": shardData.type, "size": shardData.size, "docs": shardData.docs, "state": shardData.state, "index": shardData.indexName });
			}
		}
	});
	var retObj = new Object();
	retObj.unassignedShards = _.uniq(unassignedShards, false);
	retObj.primary = shardPrimaryCount;
	retObj.replica = shardReplicaCount;
	return retObj;
}

function getIndexNamesForNode(shardDataArray, nodeName)
{
	var indices = [];
	var unassignedIndices = [];
	$.each( shardDataArray, function( index, shardData ){
		if (shardData.nodeName === nodeName){
			indices.push(shardData.indexName);
		}else if (!(shardData.nodeName))
		{
		    unassignedIndices.push(shardData.indexName);
		}
	});
	var retObj = new Object();
	retObj.indices = _.uniq(indices, false);
	retObj.unassignedIndices = _.uniq(unassignedIndices, false);
	return 	retObj;
}

function getShardsForIndexOnNode(shardDataArray, nodeIp, indexName)
{
	var nodeIndexShards = [];
	$.each( shardDataArray, function( index, shardData ){
		if (shardData.nodeIp === nodeIp && shardData.indexName === indexName){
			nodeIndexShards.push({"shard": shardData.shard, "type": shardData.type, "size": shardData.size, "docs": shardData.docs, "state": shardData.state  });
		}
	});
	return 	_.uniq(nodeIndexShards, false);
}


function getNodeInformation(nodeInfoArray, nodeName)
{
	var retNode;
	$.each(nodeInfoArray , function (arIdx, nodeInfo){
		if (nodeInfo.Id === nodeName)
		{
			retNode = nodeInfo;
			return false;
		}
	});
	return retNode;			
}

