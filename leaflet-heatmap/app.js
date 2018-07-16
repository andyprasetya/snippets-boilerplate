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
	 * Kalau nggak ada datanya, langsung ke failover.
	 */
	fetch(overlaydata)
	.then(function(data){
		/* harus di-return dulu sebagai JSON/GeoJSON, baru di-pass ke then() selanjutnya. */
		return data.json();
	})
	.then(function(geojson){
		document.getElementById(divtarget).innerHTML = "<div id='"+divmap+"'></div>";
		/* variablen */
		var map, mapHash, opentopomap, OpenStreetMap_HOT, baseMaps, mapControl, isCollapsed, zoomControl, scaleControl, gridXY, geojsonobjects, heatobjects = [], heatLayer, circlepoint;
		/* get the CSS for markers */
		circlepoint = new L.divIcon({className: 'pointmarker'});
		/* OpenTopoMap */
		opentopomap = new L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
			maxZoom: 17,
			attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		});
		/* OSM.HOT */
		OpenStreetMap_HOT = new L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
			maxZoom: 17,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
		});
		
		/* I love Indonesia */
		map = L.map('map', {
			zoom: parseInt(5), 
			layers: [OpenStreetMap_HOT],
			zoomControl: false, 
			minZoom: 3, 
			maxZoom: 17, 
			zoomControl: false});
		/* add zoom control */
		zoomControl = new L.control.zoom({
			position: "topleft"
		}).addTo(map);
		/* cast GeoJSON objects ke layer kosong GeoJSON, untuk memodifikasi markernya. Default marker nya bikin berat kalau point nya sudah ribuan. */
		geojsonobjects = new L.geoJson(geojson, {
			pointToLayer: function (feature, latlng) {
				return L.marker(latlng, {icon: circlepoint});
			}
		});
		/* kalau yang ini, cast GeoJSON objects ke layer kosong, tapi hanya diambil koordinatnya saja, terus di-push satu-satu ke heatobjects. */
		L.geoJson(geojson, {
			onEachFeature: function(feature, layer) {
				heatobjects.push(feature.geometry.coordinates);
			}
		});
		/* dari layer GeoJSON, diambil bounds nya. */
		var mapBounds = geojsonobjects.getBounds();
		/* map nya di fit-bounds supaya nggak ngabyak kemana-mana.. */
		map.fitBounds(mapBounds);
		/* add layer GeoJSON nya */
		map.addLayer(geojsonobjects);
		/* variablen heatobjects di-transliterasi ke array dalam array, dan hanya ngambil koordinatnya saja. */
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
		/* DOM untuk control opacity di heatmap nya nanti. */
		var extHeatmapControl = "" +
			"<hr/>" +
			"<div class=''>" +
				"<label for='opacity'>Opacity:<span id='opacityrange' class='float-right'>0.25</span></label>" +
				"<input type='range' class='custom-range' min='0' max='1' id='opacity' step='0.01' value='0.25' disabled='true'>" +
			"</div>" +
			"";
		$('div.leaflet-top.leaflet-right > div.leaflet-control-layers.leaflet-control').append(extHeatmapControl);
		/* kalau layer heatmap di-overlay, maka range slider nya aktip. */
		map.on("overlayadd", function(e) {
		  if (e.layer === heatLayer) {
				map.addLayer(heatLayer);
				$('#opacity').prop('disabled', false);
		  } else {
		  	/* do nothing */
		  }
		});
		/* kalau heatmap di-remove, maka range-slider di-deaktif, value nya di-reset juga ke 0.25. */
		map.on("overlayremove", function(e) {
		  if (e.layer === heatLayer) {
				map.removeLayer(heatLayer);
				$('#opacityrange').text('0.25');
				$('#opacity').val('0.25').prop('disabled', true);
		  } else {
		  	/* do nothing */
		  }
		});
		/* waktu valuenya range-slider diubah, heatmap nya di-setOptions, dan akhirnya map nya di-redraw(). */
		$('#opacity').on('change', function(){
			var ints = $(this).val();
			$('#opacityrange').text(ints);
			heatLayer.setOptions({minOpacity:ints});
		});
		
		/* map nya ditambahi grid */
		gridXY = new L.Grid().addTo(map);
		/* map nya ditambahi (lagi) scale control. Pakai native nya Leaflet saja, nggak usah plugin-plugin-an segala. */
		scaleControl = L.control.scale({ position: "bottomleft", maxWidth: 200, metric: true, imperial: true, updateWhenIdle: false }).addTo(map);
		/* URL mapnya ditambahi hash, biar tahu sekarang di zoom berapa dan centroid nya di mana. */
		mapHash = new L.Hash(map);
	})
	.catch(function(error){
		/* create failover map. */
		createFailoverMap('app','map');
		console.log(error);
	});
}
