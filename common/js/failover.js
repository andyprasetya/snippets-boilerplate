"use strict";
function createFailoverMap (divtarget,divmap) {
	divtarget = typeof divtarget !== 'undefined' ? divtarget : 'app';
	divmap = typeof divmap !== 'undefined' ? divmap : 'map';
	
	document.getElementById(divtarget).innerHTML = "<div id='"+divmap+"'></div>";
	
	var map, mapHash, opentopomap, OpenStreetMap_HOT, baseMaps, mapControl, isCollapsed, zoomControl, gridXY, scaleControl;
	
	if (document.body.clientWidth <= 767) {
		isCollapsed = true;
	} else {
		isCollapsed = false;
	}
	
	opentopomap = new L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});
	
	OpenStreetMap_HOT = new L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
	});
	
	/* I love Indonesia */
	map = L.map('map', {
		zoom: parseInt(5), 
		center: [parseFloat(-8), parseFloat(117)], 
		layers: [opentopomap],
		zoomControl: false, 
		minZoom: 3, 
		maxZoom: 17, 
		zoomControl: false});

	map.setMaxBounds([[parseFloat(-10.574222), parseFloat(94.482421)], [parseFloat(6.839169), parseFloat(141.064453)]]);
	
	baseMaps = {
		"OpenTopoMap": opentopomap,
		"OpenStreetMap.HOT": OpenStreetMap_HOT
	};
	
	mapControl = new L.control.layers(baseMaps, null, {collapsed: isCollapsed}).addTo(map);
	
	zoomControl = new L.control.zoom({
		position: "topleft"
	}).addTo(map);
	
	gridXY = new L.Grid().addTo(map);
	scaleControl = L.control.scale({ position: "bottomleft", maxWidth: 200, metric: true, imperial: true, updateWhenIdle: false }).addTo(map);
	mapHash = new L.Hash(map);
}

function getColour(d) {
    return d > 200 ? '#800026' :
           d > 150  ? '#BD0026' :
           d > 100  ? '#E31A1C' :
           d > 75  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 25   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}
