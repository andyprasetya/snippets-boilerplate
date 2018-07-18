$(document).ready(function(){
	$('#app').html("<div id='progressindicator' class='modal fade' data-backdrop='static' data-keyboard='false' tabindex='-1'><section class='h-100'><header class='container h-100'><div class='d-flex align-items-center justify-content-center h-100'><div class='d-flex flex-column'><div class='modal-dialog' role='document'><div class='modal-content'><div class='modal-body modal-body-padding-bottom-0'><div class='progress-wrapper'><div class='progress'><div class='progress-bar progress-bar-striped progress-bar-animated' role='progressbar' style='width: 100%' aria-valuenow='100' aria-valuemin='0' aria-valuemax='100'></div></div><span id='progress-indicator-text' class='text-center'></span></div></div></div></div></div></div></header></section></div>");
	$('#progress-indicator-text').html("<p class='progress-text-indicator'>Loading GeoJSON data...</p>");
	$('#progressindicator').modal('show');
	
	fetch('../common/data/area.json')
	.then(function(areadata){
		return areadata.json();
	})
	.then(function(geojsonarea){
		
		$('#progress-indicator-text').html("<p class='progress-text-indicator'>Processing GeoJSON data...<br/><i>..Long enough. Need a speed-optimisation.</i></p>");
		
		fetch('../common/data/data.json')
		.then(function(pointsdata){
			
			return pointsdata.json();
			
		})
		.then(function(geojsonpoints){
			
			var intermediaryPointsArray = geojsonpoints.features.map(function(feature, index, array){
				var intermediarypoint = feature.geometry.coordinates;
				
				return turf.point(intermediarypoint);
			});
			
			geojsonpoints = geojsonpoints.features.map(function(feature, index, array){
				var intermediarypoint = feature.geometry.coordinates;
				
				return turf.point(intermediarypoint, {
					id: feature.properties.id,
					context: feature.properties.context,
					date: feature.properties.date
				});
			});
			
			geojsonarea = geojsonarea.features.map(function(feature, index, array){
				var intermediarypolygon = feature.geometry.coordinates;
				var count = 0;
				var countInside = intermediaryPointsArray.map(function(feature, index, array){
					var pointObj = turf.point(feature.geometry.coordinates);
					var polygonObj = turf.polygon(intermediarypolygon);
					if (turf.booleanPointInPolygon(pointObj,polygonObj,{ignoreBoundary:false}) === true) {
						count++;
					}
				});
				
				return turf.polygon(intermediarypolygon, {
					id: feature.properties.id,
					areacode: feature.properties.areacode,
					admtype: feature.properties.admtype,
					name: feature.properties.name,
					occurences: count,
					colour: getColour(count)
				});
			});
			
			geojsonarea = turf.featureCollection(geojsonarea);
			
			return turf.featureCollection(geojsonpoints);
		})
		.then(function(datapoints){
			$('.modal').modal('hide');
			
			document.getElementById('app').innerHTML = '';
			
			createDefaultHeatmap('app','map',datapoints,geojsonarea);
		})
		.catch(function(error){
			createFailoverMap('app','map');
			console.log(error);
		});
	})
	.catch(function(error){
		createFailoverMap('app','map');
		console.log(error);
	});
});
function createDefaultHeatmap (divtarget,divmap,overlaydata,overlayarea) {
	"use strict";
	
	divtarget = typeof divtarget !== 'undefined' ? divtarget : 'app';
	divmap = typeof divmap !== 'undefined' ? divmap : 'map';
	overlaydata = typeof overlaydata !== 'undefined' ? overlaydata : '../common/data/data.json';
	overlayarea = typeof overlayarea !== 'undefined' ? overlayarea : '../common/data/area.json';

	var map, mapHash, opentopomap, OpenStreetMap_HOT, baseMaps, overlaysContainer = new L.geoJson(null), overlays, mapControl, isCollapsed, zoomControl, scaleControl, gridXY, geojsonobjects, heatobjects = [], heatLayer, regionLayer, choroplethLayer, circlepoint;
	
	document.getElementById(divtarget).innerHTML = "<div id='"+divmap+"'></div>";
	
	circlepoint = new L.divIcon({className: 'pointmarker'});
	
	opentopomap = new L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});
	
	OpenStreetMap_HOT = new L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
	});
	
	map = L.map('map', {
		zoom: parseInt(5), 
		layers: [OpenStreetMap_HOT, overlaysContainer],
		zoomControl: false, 
		minZoom: 3, 
		maxZoom: 17, 
		zoomControl: false});
	
	zoomControl = new L.control.zoom({
		position: "topleft"
	}).addTo(map);
	
	geojsonobjects = new L.geoJson(overlaydata, {
		pointToLayer: function (feature, latlng) {
			
			return L.marker(latlng, {icon: circlepoint});
			
		},
		onEachFeature: function(feature, layer){
			if (feature.properties) {
				var content = "" +
					"<table class='table table-dark table-bordered table-condensed'>" +
						"<tr><td>ID</td><td>"+feature.properties.id+"</td></tr>" +
						"<tr><td>Context</td><td>"+feature.properties.context+"</td></tr>" +
						"<tr><td>Date</td><td>"+feature.properties.date+"</td></tr>" +
					"</table>" +
					"";
				layer.on({
					click: function (e) {
						$('#feature-title').html(feature.properties.id);
						$('#feature-info').html(content);
						$('#featureModal').modal('show');
					}
				});
			}
		}
	});
	
	L.geoJson(overlaydata, {
		onEachFeature: function(feature, layer) {
			heatobjects.push(feature.geometry.coordinates);
		}
	});
	
	regionLayer = new L.geoJson(overlayarea, {
		style: function (feature) {
			return {
				color: "#000000",
				weight: 2,
				fill: true,
				fillColor: "#FFEDA0",
				opacity: 0.5,
				clickable: true
			};
		},
		onEachFeature: function(feature, layer){
			if (feature.properties) {
				var content = "" +
					"<table class='table table-dark table-bordered table-condensed'>" +
						"<tr><td>Area Code</td><td>"+feature.properties.areacode+"</td></tr>" +
						"<tr><td>Adm. Type</td><td>"+feature.properties.admtype+"</td></tr>" +
						"<tr><td>Region Name</td><td>"+feature.properties.name+"</td></tr>" +
					"</table>" +
					"";
				layer.on({
					click: function (e) {
						$('#feature-title').html(feature.properties.name);
						$('#feature-info').html(content);
						$('#featureModal').modal('show');
					}
				});
			}
		}
	});
	
	var mapBounds = geojsonobjects.getBounds();
	map.fitBounds(mapBounds);
	
	overlaysContainer.addLayer(geojsonobjects);
	
	heatobjects = heatobjects.map(function(p){return [p[1], p[0]];});
	heatLayer = new L.heatLayer(heatobjects, {minOpacity:0.25,radius:35});
	
	choroplethLayer = new L.geoJson(overlayarea, {
		style: function (feature) {
			return {
				color: "#171717",
				weight: 1,
				fill: true,
				fillColor: feature.properties.colour,
				fillOpacity: 0.95,
				clickable: false
			};
		}
	});
	
	baseMaps = {
		"OpenStreetMap.HOT": OpenStreetMap_HOT,
		"OpenTopoMap": opentopomap
	};
	
	overlays = {
		"Region": regionLayer,
		"Objects": geojsonobjects,
		"Heat": heatLayer,
		"Choropleth": choroplethLayer
	}
	
	mapControl = new L.control.layers(baseMaps, overlays, {collapsed: false}).addTo(map);
	
	$('div.leaflet-top.leaflet-right > div.leaflet-control-layers.leaflet-control').append("<div id='custom-extended-control'></div>");
	
	map.on("overlayadd", function(e) {
		if (e.layer === heatLayer) {
			overlaysContainer.addLayer(heatLayer);
			heatLayer.setOptions({minOpacity:0.25});
			var extHeatmapControl = "" +
				"<hr class='control-toolbox-separator'/>" +
				"<div class=''>" +
					"<p class='progress-text-indicator'>Heatmap Setting</p>" +
					"<label for='opacity'>Opacity:<span id='opacityrange' class='float-right'>0.25</span></label>" +
					"<input type='range' class='custom-range' min='0' max='1' id='opacity' step='0.01' value='0.25' disabled='true'>" +
				"</div>" +
				"";
			$('#custom-extended-control').append(extHeatmapControl);
			$('#opacity').prop('disabled', false);
			$('#opacity').on('change', function(){
				var ints = $(this).val();
				$('#opacityrange').text(ints);
				heatLayer.setOptions({minOpacity:ints});
			});
		} else if (e.layer === choroplethLayer) {
			overlaysContainer.clearLayers();
			$('#opacityrange').text('0.25');
			$('#opacity').val('0.25').prop('disabled', true);
			
			/* create choropleth legend */
			var legend = L.control({position: 'topright'});
			legend.onAdd = function (map) {
				var div = L.DomUtil.create('div', 'info legend'),
					grades = [0, 10, 25, 50, 75, 100, 150, 250],
					labels = [];
				for (var i = 0; i < grades.length; i++) {
					div.innerHTML +=
						'<i style="background:' + getColour(grades[i] + 1) + '"></i> ' +
						grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
				}
				return div;
			};
			legend.addTo(map);

			overlaysContainer.addLayer(choroplethLayer);
		} else {
			/* do nothing */
		}
	});
	
	map.on("overlayremove", function(e) {
		if (e.layer === heatLayer) {
			overlaysContainer.removeLayer(heatLayer);
			$('#opacityrange').text('0.25');
			$('#opacity').val('0.25').prop('disabled', true);
			$('#custom-extended-control').empty();
		} else if (e.layer === choroplethLayer) {
			overlaysContainer.removeLayer(choroplethLayer);
			$('div.leaflet-top.leaflet-right > div.info.legend.leaflet-control').remove();
		} else {
			/* do nothing */
		}
	});
	
	gridXY = new L.Grid().addTo(map);
	scaleControl = L.control.scale({ position: "bottomleft", maxWidth: 200, metric: true, imperial: true, updateWhenIdle: false }).addTo(map);
	mapHash = new L.Hash(map);
}
