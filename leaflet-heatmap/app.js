$(document).ready(function(){
	createDefaultHeatmap('app','map','../common/data/data.json');
});
function createDefaultHeatmap (divtarget,divmap,overlaydata) {
	divtarget = typeof divtarget !== 'undefined' ? divtarget : 'app';
	divmap = typeof divmap !== 'undefined' ? divmap : 'map';
	overlaydata = typeof overlaydata !== 'undefined' ? overlaydata : '../common/data/data.json';
	
	/* 
	 * Start with loading the GeoJSON data
	 * Default to load ../common/data/data.json
	 */
	fetch(overlaydata)
	.then(function(data){
		return data.json();
	})
	.then(function(geojson){
		document.getElementById(divtarget).innerHTML = "<div id='"+divmap+"'></div>";
		
		var map, mapHash, opentopomap, OpenStreetMap_HOT, baseMaps, mapControl, isCollapsed, zoomControl, geojsonobjects, heatobjects = [], heatLayer, circlepoint;
		
		circlepoint = new L.divIcon({className: 'pointmarker'});
		
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
			/* center: [parseFloat(-8), parseFloat(117)], */
			layers: [OpenStreetMap_HOT],
			zoomControl: false, 
			minZoom: 3, 
			maxZoom: 17, 
			zoomControl: false});
		
		zoomControl = new L.control.zoom({
			position: "topleft"
		}).addTo(map);
		
		geojsonobjects = new L.geoJson(geojson, {
			pointToLayer: function (feature, latlng) {
				return L.marker(latlng, {icon: circlepoint});
			}
		});
		
		L.geoJson(geojson, {
			onEachFeature: function(feature, layer) {
				heatobjects.push(feature.geometry.coordinates);
			}
		});
		
		var mapBounds = geojsonobjects.getBounds();
		map.fitBounds(mapBounds);
		map.addLayer(geojsonobjects);
		
		heatobjects = heatobjects.map(function (p) { return [p[1], p[0]]; });
		heatLayer = new L.heatLayer(heatobjects, {minOpacity:0.25,radius:35}, draw=false);
		
		baseMaps = {
			"OpenStreetMap.HOT": OpenStreetMap_HOT,
			"OpenTopoMap": opentopomap
		};
		
		overlays = {
			"Objects": geojsonobjects,
			"Heat": heatLayer
		}
		
		mapControl = new L.control.layers(baseMaps, overlays, {collapsed: false}).addTo(map);
		
		var extHeatmapControl = "" +
			"<hr/>" +
			"<div class=''>" +
				"<label for='opacity'>Opacity:<span id='opacityrange' class='float-right'>0.25</span></label>" +
				"<input type='range' class='custom-range' min='0' max='1' id='opacity' step='0.01' value='0.25' disabled='true'>" +
			"</div>" +
			"";
		$('div.leaflet-top.leaflet-right > div.leaflet-control-layers.leaflet-control').append(extHeatmapControl);
		
		map.on("overlayadd", function(e) {
		  if (e.layer === heatLayer) {
				map.addLayer(heatLayer);
				$('#opacity').prop('disabled', false);
		  } else {
		  	/* do nothing */
		  }
		});
		
		map.on("overlayremove", function(e) {
		  if (e.layer === heatLayer) {
				map.removeLayer(heatLayer);
				$('#opacityrange').text('0.25');
				$('#opacity').val('0.25').prop('disabled', true);
		  } else {
		  	/* do nothing */
		  }
		});
		
		$('#opacity').on('change', function(){
			var ints = $(this).val();
			$('#opacityrange').text(ints);
			heatLayer.setOptions({minOpacity:ints});
		});
		
		mapHash = new L.Hash(map);
	})
	.catch(function(error){
		createFailoverMap('app','map');
		console.log(error);
	});
}
/* Default Failover create map */
function createFailoverMap (divtarget,divmap) {
	divtarget = typeof divtarget !== 'undefined' ? divtarget : 'app';
	divmap = typeof divmap !== 'undefined' ? divmap : 'map';
	
	document.getElementById(divtarget).innerHTML = "<div id='"+divmap+"'></div>";
	
	var map, mapHash, opentopomap, OpenStreetMap_HOT, baseMaps, mapControl, isCollapsed, zoomControl;
	
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
	
	mapHash = new L.Hash(map);
}
