var j = jQuery.noConflict();
function CustomMarker( options ) {
    this.latlng = new google.maps.LatLng({lat: options.position.lat, lng: options.position.lng});
    this.setMap(options.map);
    this.templateData = options.templateData;
    this.markerData = {
        pin : options.markerPin
    };
}


CustomMarker.prototype = new google.maps.OverlayView();

CustomMarker.prototype.draw = function() {

    var self = this;

    var div = this.div;

    if (!div) {

        div = this.div = document.createElement('div');
        var title = this.templateData.title,
            title = title.toLowerCase(),
            title = title.replace(/ /g,'-');
        div.className = 'qode-map-marker-holder';
        div.setAttribute("id", title);

        var markerInfoTemplate = _.template( j('.qode-info-window-template').html() );
        markerInfoTemplate = markerInfoTemplate( self.templateData );

        var markerTemplate = _.template( j('.qode-marker-template').html() );
        markerTemplate = markerTemplate( self.markerData );

        j(div).append(markerInfoTemplate);
        j(div).append(markerTemplate);

        div.style.position = 'absolute';
        div.style.cursor = 'pointer';

        var panes = this.getPanes();
        panes.overlayImage.appendChild(div);
    }

    var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

    if (point) {
        div.style.left = (point.x) + 'px';
        div.style.top = (point.y) + 'px';
    }
};

CustomMarker.prototype.remove = function() {
    if (this.div) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
    }
};

CustomMarker.prototype.getPosition = function() {
    return this.latlng;
};
(function($) {
    "use strict";

    var maps = {};
    qode.modules.maps = maps;
    qode.modules.maps.qodeInitMultipleListingMap = qodeInitMultipleListingMap;
    qode.modules.maps.qodeInitSingleListingMap = qodeInitSingleListingMap;
    qode.modules.maps.qodeInitMobileMap = qodeInitMobileMap;
    qode.modules.maps.qodeGoogleMaps = {};

    $(document).ready(qodeOnDocumentReady);
    $(window).load(qodeOnWindowLoad);
    $(window).resize(qodeOnWindowResize);
    $(window).scroll(qodeOnWindowScroll);

    function qodeOnDocumentReady() {}

    function qodeOnWindowLoad() {
        qodeInitSingleListingMap();
        qodeInitMultipleListingMap();
        qodeInitMobileMap();
    }

    function qodeOnWindowResize() {}

    function qodeOnWindowScroll() {}

    function qodeInitSingleListingMap() {
        var mapHolder = $('#qode-ls-single-map-holder');
        if ( mapHolder.length ) {
            qode.modules.maps.qodeGoogleMaps.getDirectoryItemAddress({
                mapHolder: 'qode-ls-single-map-holder'
            });
        }
    }

    function qodeInitMultipleListingMap() {
        var mapHolder = $('#qode-ls-multiple-map-holder');
        if ( mapHolder.length ) {
            qode.modules.maps.qodeGoogleMaps.getDirectoryItemsAddresses({
                mapHolder: 'qode-ls-multiple-map-holder',
                hasFilter: true
            });
        }
    }

    qode.modules.maps.qodeGoogleMaps = {

        //Object varibles
        mapHolder : {},
        map : {},
        markers : {},
        radius : {},

        /**
         * Returns map with single address
         *
         * @param options
         */
        getDirectoryItemAddress : function( options ) {
            /**
             * use qodeMapsVars to get variables for address, latitude, longitude by default
             */
            var defaults = {
                location : qodeSingleMapVars.single['currentListing'].location,
                type : qodeSingleMapVars.single['currentListing'].listingType,
                zoom : 16,
                mapHolder : '',
                draggable : qodeMapsVars.global.draggable,
                mapTypeControl : qodeMapsVars.global.mapTypeControl,
                scrollwheel : qodeMapsVars.global.scrollable,
                streetViewControl : qodeMapsVars.global.streetViewControl,
                zoomControl : qodeMapsVars.global.zoomControl,
                title : qodeSingleMapVars.single['currentListing'].title,
                content : '',
                styles: qodeMapsVars.global.mapStyle,
                markerPin : qodeSingleMapVars.single['currentListing'].markerPin,
                featuredImage : qodeSingleMapVars.single['currentListing'].featuredImage,
                itemUrl : qodeSingleMapVars.single['currentListing'].itemUrl
            };
            var settings = $.extend( {}, defaults, options );

            //Save variables for later usage
            this.mapHolder = settings.mapHolder;

            //Get map holder
            var mapHolder = document.getElementById( settings.mapHolder );

            //Initialize map
            var map = new google.maps.Map( mapHolder, {
                zoom : settings.zoom,
                draggable : settings.draggable,
                mapTypeControl : settings.mapTypeControl,
                scrollwheel : settings.scrollwheel,
                streetViewControl : settings.streetViewControl,
                zoomControl : settings.zoomControl
            });

            //Set map style
            map.setOptions({
                styles: settings.styles
            });

            //Try to locate by latitude and longitude
            if ( typeof settings.location !== 'undefined' && settings.location !== null) {
                var latLong = {
                    lat : parseFloat(settings.location.latitude),
                    lng : parseFloat(settings.location.longitude)
                };
                //Set map center to location
                map.setCenter(latLong);
                //Add marker to map

                var templateData = {
                    title : settings.title,
                    address : settings.location.address,
                    featuredImage : settings.featuredImage,
                    itemUrl : settings.itemUrl
                };

                var customMarker = new CustomMarker({
                    map : map,
                    position : latLong,
                    templateData : templateData,
                    markerPin : settings.markerPin
                });

                this.initMarkerInfo();

            }

        },

        /**
         * Returns map with multiple addresses
         *
         * @param options
         */
        getDirectoryItemsAddresses : function( options ) {
            var defaults = {
                geolocation : false,
                mapHolder : 'qode-ls-multiple-map-holder',
                addresses : qodeMultipleMapVars.multiple.addresses,
                draggable : qodeMapsVars.global.draggable,
                mapTypeControl : qodeMapsVars.global.mapTypeControl,
                scrollwheel : qodeMapsVars.global.scrollable,
                streetViewControl : qodeMapsVars.global.streetViewControl,
                zoomControl : qodeMapsVars.global.zoomControl,
                zoom : 16,
                styles: qodeMapsVars.global.mapStyle,
                radius : 50, //radius for marker visibility, in km
                hasFilter : false
            };
            var settings = $.extend({}, defaults, options );

            //Get map holder
            var mapHolder = document.getElementById( settings.mapHolder );

            //Initialize map
            var map = new google.maps.Map( mapHolder, {
                zoom : settings.zoom,
                draggable : settings.draggable,
                mapTypeControl : settings.mapTypeControl,
                scrollwheel : settings.scrollwheel,
                streetViewControl : settings.streetViewControl,
                zoomControl : settings.zoomControl
            });

            //Save variables for later usage
            this.mapHolder = settings.mapHolder;
            this.map = map;
            this.radius = settings.radius;

            //Set map style
            map.setOptions({
                styles: settings.styles
            });

            //If geolocation enabled set map center to user location
            if ( navigator.geolocation && settings.geolocation ) {
                this.centerOnCurrentLocation();
            }

            //Filter addresses, remove items without latitude and longitude
            var addresses = [],
                addressesLength = settings.addresses.length;
            if(settings.addresses.length !== null){
                for ( var i = 0; i < addressesLength; i++ ) {
                    var location = settings.addresses[i].location;
                    if ( typeof location !== 'undefined' && location !== null ) {

                        if ( location.latitude !== '' && location.longitude !== '' ) {
                            addresses.push(settings.addresses[i]);
                        }
                    }
                }
            }


            //Center map and set borders of map
            this.setMapBounds( addresses );

            //Add markers to the map
            this.addMultipleMarkers( addresses );

        },

        /**
         * Add multiple markers to map
         */
        addMultipleMarkers : function( markersData ) {

            var map = this.map;

            var markers = [];
            //Loop through markers
            var len = markersData.length;
            for ( var i = 0; i < len; i++ ) {

                var latLng = {
                    lat: parseFloat(markersData[i].location.latitude),
                    lng: parseFloat(markersData[i].location.longitude)
                };

                //Custom html markers
                //Insert marker data into info window template
                var templateData = {
                    title : markersData[i].title,
                    address : markersData[i].location.address,
                    featuredImage : markersData[i].featuredImage,
                    itemUrl : markersData[i].itemUrl
                };

                var customMarker = new CustomMarker({
                    position : latLng,
                    map : map,
                    templateData : templateData,
                    markerPin : markersData[i].markerPin
                });

                markers.push(customMarker);

            }

            this.markers = markers;

            //Init map clusters ( Grouping map markers at small zoom values )
            this.initMapClusters();

            //Init marker info
            this.initMarkerInfo();

            //Init visible circle area around center of map
            var that = this;
            google.maps.event.addListener(map, 'idle', function(){
                var visibleRadius = new google.maps.Circle({
                    strokeColor: '#FF0000',
                    strokeOpacity: 0,
                    strokeWeight: 0,
                    fillColor: '#FF0000',
                    fillOpacity: 0,
                    map: map,
                    center: map.getCenter(),
                    radius: that.radius * 1000 //in meters
                });
                //Display only markers in circle
                //that.refreshCircleAreaMarkers( visibleRadius.getBounds() );
            });

        },

        /**
         * Set map bounds for Map with multiple markers
         *
         * @param addressesArray
         */
        setMapBounds : function( addressesArray ) {

            var bounds = new google.maps.LatLngBounds();
            for ( var i = 0; i < addressesArray.length; i++ ) {
                bounds.extend( new google.maps.LatLng( parseFloat(addressesArray[i].location.latitude), parseFloat(addressesArray[i].location.longitude) ) );
            }

            this.map.fitBounds( bounds );

        },

        /**
         * Init map clusters for grouping markers on small zoom values
         */
        initMapClusters : function() {

            //Activate clustering on multiple markers
            var markerClusteringOptions = {
                minimumClusterSize: 2,
                maxZoom: 12,
                styles : [{
                    width: 50,
                    height: 60,
                    url: '',
                    textSize: 12
                }]
            };
            var markerClusterer = new MarkerClusterer(this.map, this.markers, markerClusteringOptions);

        },

        initMarkerInfo : function() {

            $(document).on('click', '.qode-map-marker', function() {
                var self = $(this),
                    markerHolders = $('.qode-map-marker-holder'),
                    infoWindows = $('.qode-info-window'),
                    markerHolder = self.parent('.qode-map-marker-holder'),
                    infoWindow = self.siblings('.qode-info-window');

                if ( markerHolder.hasClass('active') ) {
                    markerHolder.removeClass( 'active' );
                    infoWindow.fadeOut(0);
                } else {
                    markerHolders.removeClass('active');
                    infoWindows.fadeOut(0);
                    markerHolder.addClass('active');
                    infoWindow.fadeIn(300);
                }

            });

        },
        /**
         * Info Window for displaying data on map markers
         *
         * @returns {google.maps.InfoWindow}
         */
        addInfoWindow : function() {

            var contentString = '';
            var infoWindow = new google.maps.InfoWindow({
                content: contentString
            });
            return infoWindow;

        },

        /**
         * If geolocation enabled center map on users current position
         */
        centerOnCurrentLocation : function() {
            var map = this.map;
            navigator.geolocation.getCurrentPosition(
                function(position){
                    var center = {
                        lat : position.coords.latitude,
                        lng : position.coords.longitude
                    };
                    map.setCenter(center);
                }
            );
        },

        /**
         * Refresh area for visible markers
         *
         * @param circleArea
         */
        refreshCircleAreaMarkers : function( circleArea ) {

            var length = this.markers.length;
            for ( var i = 0; i < length; i++ ) {
                if ( circleArea.contains( this.markers[i].getPosition() ) ) {
                    this.markers[i].setVisible(true);
                } else {
                    this.markers[i].setVisible(false);
                }
            }

        },

    };

    function qodeInitMobileMap() {

        var mapOpener = $('.qode-listing-view-larger-map a'),
            mapOpenerIcon = mapOpener.children('i'),
            mapHolder = $('.qode-map-holder');
        if (mapOpener.length) {
            mapOpener.click(function(e){
                e.preventDefault();
                if (mapHolder.hasClass('qode-fullscreen-map')) {
                    mapHolder.removeClass('qode-fullscreen-map');
                    mapOpenerIcon.removeClass('icon-basic-magnifier-minus');
                    mapOpenerIcon.addClass('icon-basic-magnifier-plus');
                } else {
                    mapHolder.addClass('qode-fullscreen-map');
                    mapOpenerIcon.removeClass('icon-basic-magnifier-plus');
                    mapOpenerIcon.addClass('icon-basic-magnifier-minus');
                }
                qode.modules.maps.qodeGoogleMaps.getDirectoryItemsAddresses();
            });
        }
    }

})(jQuery);
(function($) {

	var listingsSelect = {};
	qode.modules.listingsSelect = listingsSelect;
	listingsSelect.qodeOnDocumentReady = qodeOnDocumentReady;
	listingsSelect.qodeOnWindowLoad = qodeOnWindowLoad;
	listingsSelect.qodeOnWindowResize = qodeOnWindowResize;
	listingsSelect.qodeOnWindowScroll = qodeOnWindowScroll;

	$(document).ready(qodeOnDocumentReady);
	$(window).load(qodeOnWindowLoad);
	$(window).resize(qodeOnWindowResize);
	$(window).scroll(qodeOnWindowScroll);

	listingsSelect.qodeSelect2Fields = qodeSelect2Fields;
	listingsSelect.qodeInitSelect2Field = qodeInitSelect2Field;


	function qodeOnDocumentReady() {
        qodeSelect2Fields();
	}
	function qodeOnWindowLoad() {}
	function qodeOnWindowResize() {}
	function qodeOnWindowScroll() {}

	function qodeSelect2Fields(){

		var defaultSelectFields = $(
			'.qode-ls-adv-search-holder select, ' +
			'.qode-ls-main-search-holder-part select, ' +
			'.qode-ls-archive-holder select, ' +
			'.qode-ls-single-comments .qode-ls-single-sort, ' +
			'.qode-membership-dashboard-page select'

		);
		if(defaultSelectFields.length){
			defaultSelectFields.each(function(){
                qodeInitSelect2Field($(this));
			});
		}

	}

	function qodeInitSelect2Field(field){
		if(qode.modules.listings.qodeIsValidObject(field)){
            field.select2({

			});
        }
	}

})(jQuery);
(function($) {

	var listings = {};
	qode.modules.listings = listings;
	listings.qodeOnDocumentReady = qodeOnDocumentReady;
	listings.qodeOnWindowLoad = qodeOnWindowLoad;
	listings.qodeOnWindowResize = qodeOnWindowResize;
	listings.qodeOnWindowScroll = qodeOnWindowScroll;

	$(document).ready(qodeOnDocumentReady);
	$(window).load(qodeOnWindowLoad);
	$(window).resize(qodeOnWindowResize);
	$(window).scroll(qodeOnWindowScroll);

	listings.qodeInitListingTypeCustomFields = qodeInitListingTypeCustomFields;
	listings.qodeGetListingTypeCustomFieldsOnChange = qodeGetListingTypeCustomFieldsOnChange;
	listings.qodeInitListingMainSearch = qodeInitListingMainSearch;
	listings.qodeBindTitles = qodeBindTitles;
	listings.qodeShowHideButton = qodeShowHideButton;
	listings.qodeReinitMultipleGoogleMaps = qodeReinitMultipleGoogleMaps;
	listings.qodeBindTitles = qodeBindTitles;
	listings.qodeIsValidObject = qodeIsValidObject;

	function qodeOnDocumentReady() {
		qodeInitListingTypeCustomFields();
		qodeGetListingTypeCustomFieldsOnChange();
		qodeInitListingMainSearch();
		qodeBindTitles();
	}
	function qodeOnWindowLoad() {}
	function qodeOnWindowResize() {}
	function qodeOnWindowScroll() {}

	function qodeInitListingMainSearch(){
		var container = $('.qode-ls-main-search-holder');
		if(container.length){
			container.each(function(){
				var thisContainer = $(this),
					keywordSearch = thisContainer.find('.qode-ls-main-search-keyword'),
					availableListings = qodeListingTitles.titles;

					keywordSearch.autocomplete({
						source: availableListings
					});

			});
		}
	}

	function qodeInitListingTypeCustomFields(){

		var typeField = $('.job-manager-form .fieldset-job_type #job_type');
		var typeFieldVal = typeField.val();
		qodeAddListingTypeItems(typeFieldVal);
		qodeDeleteListingTypeItems(typeFieldVal);

	}
	
	function qodeGetListingTypeCustomFieldsOnChange(){

		var typeField = $('.job-manager-form .fieldset-job_type #job_type');
		typeField.on('change', function(){
			var thisField = $(this);
			var thisFieldVal = thisField.val();
			qodeAddListingTypeItems(thisFieldVal);
			qodeDeleteListingTypeItems(thisFieldVal);
		});

	}

	function qodeAddListingTypeItems(types){

		if(typeof types !== 'undefined' && types !== null && types.length){
			//there is minimum one selected type
			if(types instanceof Array) {
				var i;
				for (i = 0; i < types.length; i++) {
					if ($.inArray(types[i], qodeListingGlobalVars.vars.selectedTypes) > -1) {
					}
					else {
						//element is in not in array, add it
						qodeGetListingTypeField(types[i]);
					}
				}
			} else {
				if ($.inArray(types, qodeListingGlobalVars.vars.selectedTypes) > -1) {

				}
				else {
					//element is in not in array, add it
					qodeGetListingTypeField(types);
				}
			}
		}else{
			//there is no selected types
			qodeDeleteAllListingTypeFields();
		}

	}

	function qodeDeleteListingTypeItems(types){
		if(typeof types !== 'undefined' && types !== null && types.length){

			//there is minimum one selected type
			var i;
			for(i = 0; i < qodeListingGlobalVars.vars.selectedTypes.length; i++){
				if($.inArray(qodeListingGlobalVars.vars.selectedTypes[i],types) > -1){
				}
				else{
					//element is in not in array, add it
					qodeDeleteListingTypeField(qodeListingGlobalVars.vars.selectedTypes[i]);
				}
			}

		}else{
			//there is no selected types
			qodeDeleteAllListingTypeFields();
		}
	}

	function qodeGetListingTypeField(itemId){
		var form = $('.job-manager-form');
		var formAction = form.attr('action');

		//get current post id if is set
		// this id is set on edit job pages and we need it to get custom field values
		var actionArray = formAction.split('=');
		var currentPostId = actionArray[actionArray.length - 1];

		var container = $('.job-manager-form .fieldset-job_type');
		var data = {
			selectedType: itemId,
			action: 'qode_listing_type_get_custom_fields'
		};
		if(typeof currentPostId !== 'undefined' && currentPostId !== 'false'){
			data['currentPostId'] = currentPostId;
		}
		$.ajax({
			type: "POST",
			url: QodeListingAjaxUrl,
			data: data,
			success: function (data) {
				if (data === 'error') {
					//error handler
				}else{
					//set new item in global var
					qodeListingGlobalVars.vars.selectedTypes.push(itemId);
					response = $.parseJSON(data);
					responseHtml = response.html;
					setTimeout(function(){
						container.after(responseHtml);
                        qodeReinitAdditionalSelectFields();
					},300);
 				}
			}
		});

	}
	
	function qodeReinitAdditionalSelectFields() {
        var selectFields = $('.job-manager-form .qode-ls-type-field-wrapper select');
        if(selectFields.length){
        	selectFields.each(function () {
				$(this).select2();
            });
		}
    }

	function qodeDeleteListingTypeField(itemId){

		var typeFieldWrappers = $('.qode-ls-type-field-wrapper ');

		if(typeFieldWrappers.length){
			typeFieldWrappers.each(function(){
				var thisFieldWrapper = $(this);
				var id = thisFieldWrapper.attr('id');

				if(id === itemId){
					setTimeout(function(){
						thisFieldWrapper.remove();
						//remove current element from global array
						var index = qodeListingGlobalVars.vars.selectedTypes.indexOf(itemId);
						qodeListingGlobalVars.vars.selectedTypes.splice(index, 1);
					},300);
				};

			});
		}
	}

	function qodeDeleteAllListingTypeFields(){
		var typeFieldWrappers = $('.qode-ls-type-field-wrapper ');

		if(typeFieldWrappers.length){
			typeFieldWrappers.each(function() {
				var thisFieldWrapper = $(this);
				thisFieldWrapper.remove();
			});
		}
	}
	
	function qodeReinitMultipleGoogleMaps(addresses, action){

		if(action === 'append'){

			var mapObjs = qodeMultipleMapVars.multiple.addresses;
			mapObjs = qodeMultipleMapVars.multiple.addresses.concat(addresses);
			qodeMultipleMapVars.multiple.addresses = mapObjs;

			qode.modules.maps.qodeGoogleMaps.getDirectoryItemsAddresses({
				addresses: mapObjs
			});
		}
		else if(action === 'replace'){

			qodeMultipleMapVars.multiple.addresses = addresses;
			qode.modules.maps.qodeGoogleMaps.getDirectoryItemsAddresses({
				addresses: addresses
			});

		}
	}

	function qodeShowHideButton(button, nextPage, maxNumPages){

		if(typeof button !== 'undefined' && button !== false && button !== null ){
			if(nextPage <= maxNumPages){
				button.show();
			}else{
				button.hide();
			}
		}

	}
	
	function qodeListingArchiveInitBack() {

		window.addEventListener("popstate", function(e) { // if a back or forward button is clicked
			location.reload();
		});

	}

	function qodeBindTitles() {
		
		var maps = $('.qode-ls-archive-map-holder'),
			lists = $('.qode-ls-archive-items');
		if (maps.length && lists.length){
			maps.each(function(){
				var  listItems = lists.find('.qode-listing-archive-item');

				listItems.each(function(){
					var listItem = $(this);
					listItem.mouseenter(function(){
						var itemId = listItem.attr('id');
						if ($('.qode-map-marker-holder').length) {
							$('.qode-map-marker-holder').each(function(){
								var markerHolder = $(this),
									markerId = markerHolder.attr('id');
								if (itemId == markerId) {
									markerHolder.addClass('active');
									setTimeout(function(){
									},300);
								} else {
									markerHolder.removeClass('active');
								}
							});
						}
					});
				});

				lists.mouseleave(function(){
					$('.qode-map-marker-holder').removeClass('active');
				});
			});
		}
	}	

	function qodeIsValidObject(object){
		if(typeof(object !== 'undefined') && object !== 'false' && object !== '' && object !== undefined){
			return true;
		}
		return false;
	}

})(jQuery);
/**
 * @name MarkerClusterer for Google Maps v3
 * @version version 1.0
 * @author Luke Mahe
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * <br/>
 * This is a v3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >v2 MarkerClusterer</a>.
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Wether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 *       'iconAnchor': (Array) The anchor position of the icon x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */
function MarkerClusterer(map, opt_markers, opt_options) {
    // MarkerClusterer implements google.maps.OverlayView interface. We use the
    // extend function to extend MarkerClusterer with google.maps.OverlayView
    // because it might not always be available when the code is defined so we
    // look for it at the last possible moment. If it doesn't exist now then
    // there is no point going ahead :)
    this.extend(MarkerClusterer, google.maps.OverlayView);
    this.map_ = map;

    /**
     * @type {Array.<google.maps.Marker>}
     * @private
     */
    this.markers_ = [];

    /**
     *  @type {Array.<Cluster>}
     */
    this.clusters_ = [];

    this.sizes = [53, 56, 66, 78, 90];

    /**
     * @private
     */
    this.styles_ = [];

    /**
     * @type {boolean}
     * @private
     */
    this.ready_ = false;

    var options = opt_options || {};

    /**
     * @type {number}
     * @private
     */
    this.gridSize_ = options['gridSize'] || 60;

    /**
     * @private
     */
    this.minClusterSize_ = options['minimumClusterSize'] || 2;


    /**
     * @type {?number}
     * @private
     */
    this.maxZoom_ = options['maxZoom'] || null;

    this.styles_ = options['styles'] || [];

    /**
     * @type {string}
     * @private
     */
    this.imagePath_ = options['imagePath'] ||
        this.MARKER_CLUSTER_IMAGE_PATH_;

    /**
     * @type {string}
     * @private
     */
    this.imageExtension_ = options['imageExtension'] ||
        this.MARKER_CLUSTER_IMAGE_EXTENSION_;

    /**
     * @type {boolean}
     * @private
     */
    this.zoomOnClick_ = true;

    if (options['zoomOnClick'] != undefined) {
        this.zoomOnClick_ = options['zoomOnClick'];
    }

    /**
     * @type {boolean}
     * @private
     */
    this.averageCenter_ = false;

    if (options['averageCenter'] != undefined) {
        this.averageCenter_ = options['averageCenter'];
    }

    this.setupStyles_();

    this.setMap(map);

    /**
     * @type {number}
     * @private
     */
    this.prevZoom_ = this.map_.getZoom();

    // Add the map event listeners
    var that = this;
    google.maps.event.addListener(this.map_, 'zoom_changed', function() {
        var zoom = that.map_.getZoom();

        if (that.prevZoom_ != zoom) {
            that.prevZoom_ = zoom;
            that.resetViewport();
        }
    });

    google.maps.event.addListener(this.map_, 'idle', function() {
        that.redraw();
    });

    // Finally, add the markers
    if (opt_markers && opt_markers.length) {
        this.addMarkers(opt_markers, false);
    }
}


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ =
    'https://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/' +
    'images/m';


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function(obj1, obj2) {
    return (function(object) {
        for (var property in object.prototype) {
            this.prototype[property] = object.prototype[property];
        }
        return this;
    }).apply(obj1, [obj2]);
};


/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function() {
    this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function() {};

/**
 * Sets up the styles object.
 *
 * @private
 */
MarkerClusterer.prototype.setupStyles_ = function() {
    if (this.styles_.length) {
        return;
    }

    for (var i = 0, size; size = this.sizes[i]; i++) {
        this.styles_.push({
            url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
            height: size,
            width: size
        });
    }
};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function() {
    var markers = this.getMarkers();
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0, marker; marker = markers[i]; i++) {
        bounds.extend(marker.getPosition());
    }

    this.map_.fitBounds(bounds);
};


/**
 *  Sets the styles.
 *
 *  @param {Object} styles The style to set.
 */
MarkerClusterer.prototype.setStyles = function(styles) {
    this.styles_ = styles;
};


/**
 *  Gets the styles.
 *
 *  @return {Object} The styles object.
 */
MarkerClusterer.prototype.getStyles = function() {
    return this.styles_;
};


/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
MarkerClusterer.prototype.isZoomOnClick = function() {
    return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
MarkerClusterer.prototype.isAverageCenter = function() {
    return this.averageCenter_;
};


/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
MarkerClusterer.prototype.getMarkers = function() {
    return this.markers_;
};


/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function() {
    return this.markers_.length;
};


/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
    this.maxZoom_ = maxZoom;
};


/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function() {
    return this.maxZoom_;
};


/**
 *  The function for calculating the cluster icon image.
 *
 *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
 *  @param {number} numStyles The number of styles available.
 *  @return {Object} A object properties: 'text' (string) and 'index' (number).
 *  @private
 */
MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
    var index = 0;
    var count = markers.length;
    var dv = count;
    while (dv !== 0) {
        dv = parseInt(dv / 10, 10);
        index++;
    }

    index = Math.min(index, numStyles);
    return {
        text: count,
        index: index
    };
};


/**
 * Set the calculator function.
 *
 * @param {function(Array, number)} calculator The function to set as the
 *     calculator. The function should return a object properties:
 *     'text' (string) and 'index' (number).
 *
 */
MarkerClusterer.prototype.setCalculator = function(calculator) {
    this.calculator_ = calculator;
};


/**
 * Get the calculator function.
 *
 * @return {function(Array, number)} the calculator function.
 */
MarkerClusterer.prototype.getCalculator = function() {
    return this.calculator_;
};


/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
    for (var i = 0, marker; marker = markers[i]; i++) {
        this.pushMarkerTo_(marker);
    }
    if (!opt_nodraw) {
        this.redraw();
    }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
    marker.isAdded = false;
    if (marker['draggable']) {
        // If the marker is draggable add a listener so we update the clusters on
        // the drag end.
        var that = this;
        google.maps.event.addListener(marker, 'dragend', function() {
            marker.isAdded = false;
            that.repaint();
        });
    }
    this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
    this.pushMarkerTo_(marker);
    if (!opt_nodraw) {
        this.redraw();
    }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerClusterer.prototype.removeMarker_ = function(marker) {
    var index = -1;
    if (this.markers_.indexOf) {
        index = this.markers_.indexOf(marker);
    } else {
        for (var i = 0, m; m = this.markers_[i]; i++) {
            if (m == marker) {
                index = i;
                break;
            }
        }
    }

    if (index == -1) {
        // Marker is not in our list of markers.
        return false;
    }

    marker.setMap(null);

    this.markers_.splice(index, 1);

    return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
    var removed = this.removeMarker_(marker);

    if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
    } else {
        return false;
    }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
    var removed = false;

    for (var i = 0, marker; marker = markers[i]; i++) {
        var r = this.removeMarker_(marker);
        removed = removed || r;
    }

    if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
    }
};


/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
MarkerClusterer.prototype.setReady_ = function(ready) {
    if (!this.ready_) {
        this.ready_ = ready;
        this.createClusters_();
    }
};


/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
MarkerClusterer.prototype.getTotalClusters = function() {
    return this.clusters_.length;
};


/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
MarkerClusterer.prototype.getMap = function() {
    return this.map_;
};


/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
MarkerClusterer.prototype.setMap = function(map) {
    this.map_ = map;
};


/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function() {
    return this.gridSize_;
};


/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setGridSize = function(size) {
    this.gridSize_ = size;
};


/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getMinClusterSize = function() {
    return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setMinClusterSize = function(size) {
    this.minClusterSize_ = size;
};


/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
    var projection = this.getProjection();

    // Turn the bounds into latlng.
    var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
        bounds.getNorthEast().lng());
    var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
        bounds.getSouthWest().lng());

    // Convert the points to pixels and the extend out by the grid size.
    var trPix = projection.fromLatLngToDivPixel(tr);
    trPix.x += this.gridSize_;
    trPix.y -= this.gridSize_;

    var blPix = projection.fromLatLngToDivPixel(bl);
    blPix.x -= this.gridSize_;
    blPix.y += this.gridSize_;

    // Convert the pixel points back to LatLng
    var ne = projection.fromDivPixelToLatLng(trPix);
    var sw = projection.fromDivPixelToLatLng(blPix);

    // Extend the bounds to contain the new bounds.
    bounds.extend(ne);
    bounds.extend(sw);

    return bounds;
};


/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
    return bounds.contains(marker.getPosition());
};


/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function() {
    this.resetViewport(true);

    // Set the markers a empty array.
    this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerClusterer.prototype.resetViewport = function(opt_hide) {
    // Remove all the clusters
    for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
        cluster.remove();
    }

    // Reset the markers to not be added and to be invisible.
    for (var i = 0, marker; marker = this.markers_[i]; i++) {
        marker.isAdded = false;
        if (opt_hide) {
            marker.setMap(null);
        }
    }

    this.clusters_ = [];
};

/**
 *
 */
MarkerClusterer.prototype.repaint = function() {
    var oldClusters = this.clusters_.slice();
    this.clusters_.length = 0;
    this.resetViewport();
    this.redraw();

    // Remove the old clusters.
    // Do it in a timeout so the other clusters have been drawn first.
    window.setTimeout(function() {
        for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
            cluster.remove();
        }
    }, 0);
};


/**
 * Redraws the clusters.
 */
MarkerClusterer.prototype.redraw = function() {
    this.createClusters_();
};


/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
 */
MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
    if (!p1 || !p2) {
        return 0;
    }

    var R = 6371; // Radius of the Earth in km
    var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
};


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
    var distance = 40000; // Some large number
    var clusterToAddTo = null;
    var pos = marker.getPosition();
    for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
        var center = cluster.getCenter();
        if (center) {
            var d = this.distanceBetweenPoints_(center, marker.getPosition());
            if (d < distance) {
                distance = d;
                clusterToAddTo = cluster;
            }
        }
    }

    if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
        clusterToAddTo.addMarker(marker);
    } else {
        var cluster = new Cluster(this);
        cluster.addMarker(marker);
        this.clusters_.push(cluster);
    }
};


/**
 * Creates the clusters.
 *
 * @private
 */
MarkerClusterer.prototype.createClusters_ = function() {
    if (!this.ready_) {
        return;
    }

    // Get our current map view bounds.
    // Create a new bounds object so we don't affect the map.
    var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
        this.map_.getBounds().getNorthEast());
    var bounds = this.getExtendedBounds(mapBounds);

    for (var i = 0, marker; marker = this.markers_[i]; i++) {
        if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
            this.addToClosestCluster_(marker);
        }
    }
};


/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(markerClusterer) {
    this.markerClusterer_ = markerClusterer;
    this.map_ = markerClusterer.getMap();
    this.gridSize_ = markerClusterer.getGridSize();
    this.minClusterSize_ = markerClusterer.getMinClusterSize();
    this.averageCenter_ = markerClusterer.isAverageCenter();
    this.center_ = null;
    this.markers_ = [];
    this.bounds_ = null;
    this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
        markerClusterer.getGridSize());
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
    if (this.markers_.indexOf) {
        return this.markers_.indexOf(marker) != -1;
    } else {
        for (var i = 0, m; m = this.markers_[i]; i++) {
            if (m == marker) {
                return true;
            }
        }
    }
    return false;
};


/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function(marker) {
    if (this.isMarkerAlreadyAdded(marker)) {
        return false;
    }

    if (!this.center_) {
        this.center_ = marker.getPosition();
        this.calculateBounds_();
    } else {
        if (this.averageCenter_) {
            var l = this.markers_.length + 1;
            var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
            var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
            this.center_ = new google.maps.LatLng(lat, lng);
            this.calculateBounds_();
        }
    }

    marker.isAdded = true;
    this.markers_.push(marker);

    var len = this.markers_.length;
    if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
        // Min cluster size not reached so show the marker.
        marker.setMap(this.map_);
    }

    if (len == this.minClusterSize_) {
        // Hide the markers that were showing.
        for (var i = 0; i < len; i++) {
            this.markers_[i].setMap(null);
        }
    }

    if (len >= this.minClusterSize_) {
        marker.setMap(null);
    }

    this.updateIcon();
    return true;
};


/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 */
Cluster.prototype.getMarkerClusterer = function() {
    return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function() {
    var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    var markers = this.getMarkers();
    for (var i = 0, marker; marker = markers[i]; i++) {
        bounds.extend(marker.getPosition());
    }
    return bounds;
};


/**
 * Removes the cluster
 */
Cluster.prototype.remove = function() {
    this.clusterIcon_.remove();
    this.markers_.length = 0;
    delete this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function() {
    return this.markers_.length;
};


/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Cluster.prototype.getMarkers = function() {
    return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function() {
    return this.center_;
};


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function() {
    var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
    this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isMarkerInClusterBounds = function(marker) {
    return this.bounds_.contains(marker.getPosition());
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function() {
    return this.map_;
};


/**
 * Updates the cluster icon
 */
Cluster.prototype.updateIcon = function() {
    var zoom = this.map_.getZoom();
    var mz = this.markerClusterer_.getMaxZoom();

    if (mz && zoom > mz) {
        // The zoom is greater than our max zoom so show all the markers in cluster.
        for (var i = 0, marker; marker = this.markers_[i]; i++) {
            marker.setMap(this.map_);
        }
        return;
    }

    if (this.markers_.length < this.minClusterSize_) {
        // Min cluster size not yet reached.
        this.clusterIcon_.hide();
        return;
    }

    var numStyles = this.markerClusterer_.getStyles().length;
    var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
    this.clusterIcon_.setCenter(this.center_);
    this.clusterIcon_.setSums(sums);
    this.clusterIcon_.show();
};


/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
function ClusterIcon(cluster, styles, opt_padding) {
    cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

    this.styles_ = styles;
    this.padding_ = opt_padding || 0;
    this.cluster_ = cluster;
    this.center_ = null;
    this.map_ = cluster.getMap();
    this.div_ = null;
    this.sums_ = null;
    this.visible_ = false;

    this.setMap(this.map_);
}


/**
 * Triggers the clusterclick event and zoom's if the option is set.
 *
 * @param {google.maps.MouseEvent} event The event to propagate
 */
ClusterIcon.prototype.triggerClusterClick = function(event) {
    var markerClusterer = this.cluster_.getMarkerClusterer();

    // Trigger the clusterclick event.
    google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_, event);

    if (markerClusterer.isZoomOnClick()) {
        // Zoom into the cluster.
        this.map_.fitBounds(this.cluster_.getBounds());
    }
};


/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
ClusterIcon.prototype.onAdd = function() {
    this.div_ = document.createElement('DIV');
    this.div_.className = 'qode-cluster-marker';
    if (this.visible_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        this.div_.innerHTML = '<div class="qode-cluster-marker-inner">' +
            '<span class="qode-cluster-marker-number">' + this.sums_.text + '</span>' +
            '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
                'width="56px" height="67.316px" viewBox="0 0 56 67.316" enable-background="new 0 0 56 67.316" xml:space="preserve">' +
                '<path fill="#1CB5C1" d="M55.939,27.722c-0.054-7.367-2.957-14.287-8.176-19.494c-5.27-5.26-12.28-8.161-19.736-8.157' +
                'c-7.456-0.004-14.47,2.895-19.743,8.157c-5.267,5.255-8.172,12.255-8.171,19.697C0.113,35.363,3.018,42.359,8.29,47.62' +
                'l19.738,19.696l19.513-19.472l0.08-0.078c0.05-0.051,0.098-0.099,0.143-0.143c0.052-0.053,0.099-0.099,0.146-0.147l0.074-0.071' +
                'L49,46.305C53.535,41.163,55.997,34.617,55.939,27.722z"/>' +
            '</svg></div>';
    }

    var panes = this.getPanes();
    panes.overlayMouseTarget.appendChild(this.div_);

    var that = this;
    google.maps.event.addDomListener(this.div_, 'click', function(event) {
        that.triggerClusterClick(event);
    });
};


/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
    var pos = this.getProjection().fromLatLngToDivPixel(latlng);

    if (typeof this.iconAnchor_ === 'object' && this.iconAnchor_.length === 2) {
        pos.x -= this.iconAnchor_[0];
        pos.y -= this.iconAnchor_[1];
    } else {
        pos.x -= parseInt(this.width_ / 2, 10);
        pos.y -= parseInt(this.height_ / 2, 10);
    }
    return pos;
};


/**
 * Draw the icon.
 * @ignore
 */
ClusterIcon.prototype.draw = function() {
    if (this.visible_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.top = pos.y + 'px';
        this.div_.style.left = pos.x + 'px';
    }
};


/**
 * Hide the icon.
 */
ClusterIcon.prototype.hide = function() {
    if (this.div_) {
        this.div_.style.display = 'none';
    }
    this.visible_ = false;
};


/**
 * Position and show the icon.
 */
ClusterIcon.prototype.show = function() {
    if (this.div_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        this.div_.style.display = '';
    }
    this.visible_ = true;
};


/**
 * Remove the icon from the map
 */
ClusterIcon.prototype.remove = function() {
    this.setMap(null);
};


/**
 * Implementation of the onRemove interface.
 * @ignore
 */
ClusterIcon.prototype.onRemove = function() {
    if (this.div_ && this.div_.parentNode) {
        this.hide();
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    }
};


/**
 * Set the sums of the icon.
 *
 * @param {Object} sums The sums containing:
 *   'text': (string) The text to display in the icon.
 *   'index': (number) The style index of the icon.
 */
ClusterIcon.prototype.setSums = function(sums) {
    this.sums_ = sums;
    this.text_ = sums.text;
    this.index_ = sums.index;
    if (this.div_) {
        this.div_.innerHTML = sums.text;
    }

    this.useStyle();
};


/**
 * Sets the icon to the the styles.
 */
ClusterIcon.prototype.useStyle = function() {
    var index = Math.max(0, this.sums_.index - 1);
    index = Math.min(this.styles_.length - 1, index);
    var style = this.styles_[index];
    this.url_ = style['url'];
    this.height_ = style['height'];
    this.width_ = style['width'];
    this.textColor_ = style['textColor'];
    this.anchor_ = style['anchor'];
    this.textSize_ = style['textSize'];
    this.backgroundPosition_ = style['backgroundPosition'];
    this.iconAnchor_ = style['iconAnchor'];
};


/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function(center) {
    this.center_ = center;
};


/**
 * Create the css text based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position.
 * @return {string} The css style text.
 */
ClusterIcon.prototype.createCss = function(pos) {
    var style = [];
    style.push('background-image:url(' + this.url_ + ');');
    var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
    style.push('background-position:' + backgroundPosition + ';');

    if (typeof this.anchor_ === 'object') {
        if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
            this.anchor_[0] < this.height_) {
            style.push('height:' + (this.height_ - this.anchor_[0]) +
                'px; padding-top:' + this.anchor_[0] + 'px;');
        } else if (typeof this.anchor_[0] === 'number' && this.anchor_[0] < 0 &&
            -this.anchor_[0] < this.height_) {
            style.push('height:' + this.height_ + 'px; line-height:' + (this.height_ + this.anchor_[0]) +
                'px;');
        } else {
            style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
                'px;');
        }
        if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
            this.anchor_[1] < this.width_) {
            style.push('width:' + (this.width_ - this.anchor_[1]) +
                'px; padding-left:' + this.anchor_[1] + 'px;');
        } else {
            style.push('width:' + this.width_ + 'px; text-align:center;');
        }
    } else {
        style.push('height:' + this.height_ + 'px; line-height:' +
            this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
    }

    var txtColor = this.textColor_ ? this.textColor_ : 'black';
    var txtSize = this.textSize_ ? this.textSize_ : 11;

    style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
        pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
        txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
    return style.join('');
};


// Export Symbols for Closure
// If you are not going to compile with closure then you can remove the
// code below.
window['MarkerClusterer'] = MarkerClusterer;
MarkerClusterer.prototype['addMarker'] = MarkerClusterer.prototype.addMarker;
MarkerClusterer.prototype['addMarkers'] = MarkerClusterer.prototype.addMarkers;
MarkerClusterer.prototype['clearMarkers'] =
    MarkerClusterer.prototype.clearMarkers;
MarkerClusterer.prototype['fitMapToMarkers'] =
    MarkerClusterer.prototype.fitMapToMarkers;
MarkerClusterer.prototype['getCalculator'] =
    MarkerClusterer.prototype.getCalculator;
MarkerClusterer.prototype['getGridSize'] =
    MarkerClusterer.prototype.getGridSize;
MarkerClusterer.prototype['getExtendedBounds'] =
    MarkerClusterer.prototype.getExtendedBounds;
MarkerClusterer.prototype['getMap'] = MarkerClusterer.prototype.getMap;
MarkerClusterer.prototype['getMarkers'] = MarkerClusterer.prototype.getMarkers;
MarkerClusterer.prototype['getMaxZoom'] = MarkerClusterer.prototype.getMaxZoom;
MarkerClusterer.prototype['getStyles'] = MarkerClusterer.prototype.getStyles;
MarkerClusterer.prototype['getTotalClusters'] =
    MarkerClusterer.prototype.getTotalClusters;
MarkerClusterer.prototype['getTotalMarkers'] =
    MarkerClusterer.prototype.getTotalMarkers;
MarkerClusterer.prototype['redraw'] = MarkerClusterer.prototype.redraw;
MarkerClusterer.prototype['removeMarker'] =
    MarkerClusterer.prototype.removeMarker;
MarkerClusterer.prototype['removeMarkers'] =
    MarkerClusterer.prototype.removeMarkers;
MarkerClusterer.prototype['resetViewport'] =
    MarkerClusterer.prototype.resetViewport;
MarkerClusterer.prototype['repaint'] =
    MarkerClusterer.prototype.repaint;
MarkerClusterer.prototype['setCalculator'] =
    MarkerClusterer.prototype.setCalculator;
MarkerClusterer.prototype['setGridSize'] =
    MarkerClusterer.prototype.setGridSize;
MarkerClusterer.prototype['setMaxZoom'] =
    MarkerClusterer.prototype.setMaxZoom;
MarkerClusterer.prototype['onAdd'] = MarkerClusterer.prototype.onAdd;
MarkerClusterer.prototype['draw'] = MarkerClusterer.prototype.draw;

Cluster.prototype['getCenter'] = Cluster.prototype.getCenter;
Cluster.prototype['getSize'] = Cluster.prototype.getSize;
Cluster.prototype['getMarkers'] = Cluster.prototype.getMarkers;

ClusterIcon.prototype['onAdd'] = ClusterIcon.prototype.onAdd;
ClusterIcon.prototype['draw'] = ClusterIcon.prototype.draw;
ClusterIcon.prototype['onRemove'] = ClusterIcon.prototype.onRemove;
(function($) {
	'use strict';

	var listingArchive = {};
	qode.modules.listingArchive = listingArchive;

	listingArchive.qodeOnDocumentReady = qodeOnDocumentReady;

	$(document).ready(qodeOnDocumentReady);
	
	listingArchive.qodeInitArchiveSearch = qodeInitArchiveSearch;
	listingArchive.qodeRenderAmenities = qodeRenderAmenities;
	listingArchive.qodeGetArchiveSearchResponse = qodeGetArchiveSearchResponse;
	listingArchive.qodeUpdateListingsNumber = qodeUpdateListingsNumber;


	/*
	 All functions to be called on $(document).ready() should be in this function
	 */
	function qodeOnDocumentReady() {
		qodeInitArchiveSearch();
		qodeFindUserLocation();
		qodeInitRangeSlider();
	}	
	
	function qodeInitArchiveSearch(){
		var container = $('.qode-ls-archive-holder');

		if(container.length){
			container.each(function(){

				var thisContainer = $(this),
					keywordSearch = thisContainer.find('.qode-archive-keyword-search'),
					typeSearch = thisContainer.find('.qode-archive-type-search'),
					typeSearchVal = typeSearch.val(),
					addressSearch = document.getElementById('qode-archive-places-search'),
					amenitiesHolder = thisContainer.find('.qode-listing-type-amenities-holder'),
					submitButton = thisContainer.find('.qode-archive-submit-button'),
					loadMoreButton = thisContainer.find('.qode-listing-archive-load-more'),
					availableListings = qodeListingTitles.titles,
					currentVar = qodeListingArchiveVar.searchParams;

				qodeUpdateListingsNumber(thisContainer, currentVar['foundPosts']);

				keywordSearch.autocomplete({
					source: availableListings
				});

				//check if type is set on page load
				if(typeof typeSearchVal !== "undefined" && typeSearchVal !== false && typeSearchVal !== null){
					qodeRenderAmenities(amenitiesHolder, typeSearchVal);
				}
				typeSearch.on('change', function(){
					var typeValue = $(this).val();
					qodeRenderAmenities(amenitiesHolder, typeValue);
				});

				//get address and distance on address change
				qodeGetAddressFieldParams(addressSearch);


				submitButton.on('click', function(){
					qodeGetArchiveSearchResponse(thisContainer, false);
				});
				if( typeof loadMoreButton !== 'undefined' && loadMoreButton !== null){
					loadMoreButton.on('click', function(){
						qodeGetArchiveSearchResponse(thisContainer, true);
					});
				}

				qode.modules.listings.qodeShowHideButton(loadMoreButton, currentVar['nextPage'], currentVar['maxPage']);

			});
		}
	}
	
	function qodeUpdateListingsNumber(container, currentNumber){

		var holder = container.find('.qode-ls-archive-items-number span');
		holder.html(currentNumber);

	}

	function qodeRenderAmenities(holder, typeId){
		holder.fadeOut(300);
		holder.removeClass('qode-opened');
		if(typeof typeId !== 'undefined' && typeId !== false && typeId !== ''){
			var ajaxData = {
				typeId: typeId,
				action: 'qode_listing_get_listing_type_amenities_html'
			}
			$.ajax({
				type: "POST",
				url: QodeListingAjaxUrl,
				data: ajaxData,
				success: function (data) {
					if (data === 'error') {
						//error handler
					}else{
						var response = $.parseJSON(data);
						var responseHtml = response.html;
						if(responseHtml !== ''){
							holder.fadeIn(300, function(){
								holder.addClass('qode-opened');
								holder.html(responseHtml);
							});
						}
					}
				}
			});
		}
	}

	function qodeGetArchiveSearchResponse(container, loadMoreFlag){

		var	keywordSearch = container.find('.qode-archive-keyword-search'),
			typeSearch = container.find('.qode-archive-type-search'),
			amenitiesArray = container.find('.qode-amenity-field'),
			loadMoreButton = container.find('.qode-listing-archive-load-more'),
			addressInput = container.find('.qode-archive-places-search'),
			itemHolder = container.find('.qode-ls-archive-items-inner'),
			distance = container.find('.qode-rangle-slider-response'),
			dist = 5, //set default distance value
			currentVar = qodeListingArchiveVar.searchParams;


		currentVar['keyword'] = keywordSearch.val();
		currentVar['type'] = typeSearch.select2('val');
		currentVar['amenities'] = {};

		if(amenitiesArray.length){
			amenitiesArray.each(function(){

				var thisField = $(this);
				var fieldVal;
				var fieldNameAttr = thisField.attr('name');

				fieldVal = thisField.is(':checked');
				currentVar['amenities'][fieldNameAttr] = fieldVal;
			});
		}

		if(loadMoreFlag){
			currentVar['enableLoadMore'] = true;
		}else{
			currentVar['enableLoadMore'] = false;
			currentVar['nextPage'] = '2';
		}


		//take distance. Note that lat and long address params are set in qodeGetAddressFieldParams function

		if(qode.modules.listings.qodeIsValidObject(distance)){
			var distanceValue = distance.text();
			if(distanceValue !== ''){
				dist = distanceValue;
			}
		}

		currentVar['locationDist'] = dist;

		//reset locationObject if address input field is empty
		if(addressInput.val() === ''){
			if(currentVar['locationObject'] !== null && typeof currentVar['locationObject'] !== 'undefined'){
				currentVar['locationObject'] = {};
			}
		}

		var ajaxData = {
			action: 'qode_listing_get_archive_search_response',
			searchParams: currentVar
		}

		$.ajax({
			type: "POST",
			url: QodeListingAjaxUrl,
			data: ajaxData,
			success: function (data) {
				if (data === 'error') {
					//error handler
				}else{
					var response = $.parseJSON(data);

					//update current post number
					var foundPosts = response.foundPosts;
					qodeUpdateListingsNumber(container, foundPosts);

					var mapObjs = response.mapAddresses;
					var mapAddresses = '';
					if(mapObjs !== null){
						mapAddresses = mapObjs['addresses'];
					}

					//update maxNumPages after each ajax response
					currentVar['maxPage'] = response.maxNumPages;

					//if is clicked load more button
					if(loadMoreFlag){
						//update nextPage after each ajax response
						currentVar['nextPage']++;

						//if new map objects are sent via ajax, update global map objects
						if(mapAddresses !== ''){
							qode.modules.listings.qodeReinitMultipleGoogleMaps(mapAddresses, 'append');
						}
						itemHolder.append(response.html);
					}
					else{
						//update multiple map addressess object
						if(mapAddresses !== ''){
							qode.modules.listings.qodeReinitMultipleGoogleMaps(mapAddresses, 'replace');
						}

						//get new listings html
						itemHolder.html(response.html);
					}

					//reinit bindTitles function
					qode.modules.listings.qodeBindTitles();

					//show button
					qode.modules.listings.qodeShowHideButton(loadMoreButton, currentVar['nextPage'], currentVar['maxPage']);

					//reinit global archive var object
					qodeListingArchiveVar.searchParams = currentVar;
				}
			}
		});

	}
	
	function qodeGetAddressFieldParams(addressInput){

		if ( qode.modules.listings.qodeIsValidObject(addressInput) ) {

			//Init Places search
			var autocomplete = new google.maps.places.Autocomplete(addressInput);
			//take initial value

			autocomplete.addListener('place_changed', function(){
				//take value after change
				qodeGetAddressAutocompleteResponse(autocomplete);
			});
		}
	}

	function qodeGetAddressAutocompleteResponse(autocomplete){
		var place = autocomplete.getPlace(),
			location = place.geometry.location;

			if(qode.modules.listings.qodeIsValidObject(location)){

				if(qode.modules.listings.qodeIsValidObject(location.lat()) &&  qode.modules.listings.qodeIsValidObject(location.lng())){
					qodeSetListingAddressParams(location.lat(), location.lng());
				}

			}

	}
	
	function qodeSetListingAddressParams(latitude, longitude){

		var locationObject = {};
 		locationObject['lat'] = latitude;
		locationObject['long'] = longitude;

		qodeListingArchiveVar.searchParams['locationObject'] = locationObject;

	}

	function qodeInitRangeSlider(){

		var selectorHolder =  $('.qode-listing-places-dist-holder');
		var slider = selectorHolder.find('.qode-rangle-slider');
		var output = selectorHolder.find('.qode-rangle-slider-response');;

		// Basic rangeslider initialization
		slider.rangeslider({
			polyfill: false,
			onInit: function(position, value) {
				qodeListingSetCurrentDistance(value);
			},
			onSlide: function(position, value) {
				qodeListingSetCurrentDistance(value);
			}
		});

		function qodeListingSetCurrentDistance(value){
			output.text(value);
		}

	}
	
	function qodeFindUserLocation(){

		var location = $('.qode-archive-current-location');

		location.on('click', function(){

			if (!navigator.geolocation){
				alert('Geolocation is not supported by your browser');
				return;
			}

			var thisLocationField = $(this);
			var addressField = thisLocationField.next('.qode-archive-places-search');
			var address = '';

			function success(position) {

				var latitude = position.coords.latitude;
				var longitude = position.coords.longitude;
				

				var GEOCODING = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + '%2C' + longitude + '&language=en';

				$.getJSON(GEOCODING).done(function(location) {
					address = location.results[0].formatted_address;
					addressField.val(address);
				});

				qodeSetListingAddressParams(latitude, longitude);
			}

			function error(error) {

				if(error.code === 1 && error.message === 'Only secure origins are allowed (see: https://goo.gl/Y0ZkNV).'){

					$.getJSON("http://jsonip.com/?callback=?", function (data) {

						if(qode.modules.listings.qodeIsValidObject(data.ip)){

							$.getJSON('http://ip-api.com/json/'+data.ip, function(response) {
								
								if(qode.modules.listings.qodeIsValidObject(response.lat) && qode.modules.listings.qodeIsValidObject(response.lon)) {

									$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng='+response.lat+','+response.lon+'&sensor=true', function(response){
										address = response.results[0].formatted_address;
										addressField.val(address);
									});
									qodeSetListingAddressParams(response.lat, response.lon);
								}
							});

						}

					});

				}else {
					alert('ERROR(' + error.code + '): ' + error.message);
				}
			}

			navigator.geolocation.getCurrentPosition(success, error);

		});
	}
})(jQuery);
(function ($) {
    'use strict';

    var listingSingle = {};
    qode.modules.listingSingle = listingSingle;

    listingSingle.qodeOnDocumentReady = qodeOnDocumentReady;
    listingSingle.qodeOnWindowLoad = qodeOnWindowLoad;
    listingSingle.qodeOnWindowResize = qodeOnWindowResize;

    $(document).ready(qodeOnDocumentReady);
    $(window).load(qodeOnWindowLoad);
    $(window).resize(qodeOnWindowResize);

    listingSingle.qodeInitCommentRating = qodeInitCommentRating;
    listingSingle.qodeInitCommentSorting = qodeInitCommentSorting;
    listingSingle.qodeInitNewCommentShowHide = qodeInitNewCommentShowHide;
    listingSingle.qodeShowHideEnquiryForm = qodeShowHideEnquiryForm;
    listingSingle.qodeSubmitEnquiryForm = qodeSubmitEnquiryForm;
    listingSingle.qodeListingInitFitVids = qodeListingInitFitVids;

    /*
     All functions to be called on $(document).ready() should be in this function
     */
    function qodeOnDocumentReady() {
        qodeInitCommentRating();
        qodeInitCommentSorting();
        qodeInitNewCommentShowHide();
        qodeShowHideEnquiryForm();
        qodeSubmitEnquiryForm();
        qodeListingInitFitVids();
        qodeInitSingleListingSlider();
    }

    /*
     ** All functions to be called on $(window).load() should be in this function
     */
    function qodeOnWindowLoad() {
        qodeSingleListingSliderHeight();
    }

    /*
     ** All functions to be called on $(window).resize() should be in this function
     */
    function qodeOnWindowResize() {

    }

    function qodeInitCommentRating() {

        var article = $('.qode-listing-single-holder .qode-ls-single-item'),
            ratingInput = article.find('#qode-rating'),
            ratingValue = ratingInput.val(),
            stars = article.find('.qode-star-rating');

        var addActive = function () {
            for (var i = 0; i < stars.length; i++) {
                var star = stars[i];
                if (i < ratingValue) {
                    $(star).addClass('active');
                } else {
                    $(star).removeClass('active');
                }
            }
        };

        addActive();

        stars.click(function () {
            ratingInput.val($(this).data('value')).trigger('change');
        });

        ratingInput.change(function () {
            ratingValue = ratingInput.val();
            addActive();
        });

    }

    function qodeInitCommentSorting() {

        var articles = $('.qode-ls-single-item');

        if (articles.length) {
            articles.each(function () {
                var article = $(this),
                    postId = article.attr('id'),
                    selectButton = article.find('.qode-ls-single-comments .qode-ls-single-sort'),
                    holder = article.find('.qode-ls-single-comments .qode-comment-list');

                selectButton.on('change', function () {
                    var value = $(this).val();
                    if (qode.modules.listings.qodeIsValidObject(value)) {
                        holder.fadeOut(300);
                        var result = value.split('-'),
                            orderBy = result[0],
                            order = result[1],
                            ajaxData = {
                                action: 'qode_listing_get_post_reviews_ajax',
                                order: order,
                                orderBy: orderBy,
                                postId: postId
                            };

                        $.ajax({
                            type: "POST",
                            url: QodeListingAjaxUrl,
                            data: ajaxData,
                            success: function (data) {
                                if (data === 'error') {
                                    //error handler
                                } else {
                                    //set new item in global var
                                    var response = $.parseJSON(data);
                                    var responseHtml = response.html;
                                    holder.fadeIn(300, function () {
                                        holder.html(responseHtml);
                                    });
                                }
                            }
                        });
                    }
                });

            });
        }
    }

    function qodeInitNewCommentShowHide() {
        var articles = $('.qode-ls-single-item');

        if (articles.length) {
            articles.each(function () {
                var article = $(this),
                    panelHolderTrigger = article.find('.qode-rating-form-trigger'),
                    panelHolder = article.find('.qode-comment-form .comment-respond');

                panelHolderTrigger.on('click', function () {
                    panelHolder.slideToggle('slow');
                });
            });
        }
    }

    function qodeShowHideEnquiryForm() {
        var article = $('.qode-ls-single-item'),
            enquiryHolder = $('.qode-ls-enquiry-holder'),
            button = article.find('.qode-ls-single-contact-listing'),
            buttonClose = $('.qode-ls-enquiry-close');

        button.on('click', function () {
            enquiryHolder.fadeIn(300);
            enquiryHolder.addClass('opened');
        });

        enquiryHolder.add(buttonClose).on('click', function () {
            if (enquiryHolder.hasClass('opened')) {
                enquiryHolder.fadeOut(300);
                enquiryHolder.removeClass('opened');
            }
        });

        $(".qode-ls-enquiry-inner").click(function (e) {
            e.stopPropagation();
        });
        // on esc too
        $(window).on('keyup', function (e) {
            if (enquiryHolder.hasClass('opened') && e.keyCode == 27) {
                enquiryHolder.fadeOut(300);
                enquiryHolder.removeClass('opened');
            }
        });

    }

    function qodeSubmitEnquiryForm() {
        var enquiryHolder = $('.qode-ls-enquiry-holder'),
            enquiryMessageHolder = $('.qode-listing-enquiry-response'),
            enquiryForm = enquiryHolder.find('.qode-ls-enquiry-form');


        enquiryForm.on('submit', function () {
            enquiryMessageHolder.empty();
            var enquiryData = {
                name: enquiryForm.find('#enquiry-name').val(),
                email: enquiryForm.find('#enquiry-email').val(),
                message: enquiryForm.find('#enquiry-message').val(),
                itemId: enquiryForm.find('#enquiry-item-id').val(),
                nonce: enquiryForm.find('#qode_nonce_listing_item_enquiry').val()
            };

            var requestData = {
                action: 'qode_listing_send_listing_item_enquiry',
                data: enquiryData
            };

            $.ajax({
                type: "POST",
                url: QodeListingAjaxUrl,
                data: requestData,
                success: function (response) {
                    if (data === 'error') {
                        enquiryMessageHolder.html(response.data);
                        //error handler
                    } else {
                        enquiryMessageHolder.html(response.data);
                        enquiryForm.fadeOut(300);
                        setTimeout(function () {
                            enquiryForm.remove();
                        }, 300);
                    }
                }
            });
        });

    }

    function qodeListingInitFitVids() {

        $('.qode-ls-content-video-part').fitVids();
    }

    /*
     ** Init Single Listing Slider
     */

    function qodeInitSingleListingSlider() {
        var singleListingSlider = $('.qode-listing-single-holder .qode-ls-single-item .qode-ls-single-gallery-holder');

        if (singleListingSlider.length) {
            singleListingSlider.each(function () {
                var thisSlider = $(this),
                    numberOfItems = 3,
                    loop = true,
                    autoplay = true,
                    number = 0,
                    speed = 5000,
                    animationSpeed = 600,
                    center = true,
                    autoWidth = true,
                    navArrows = false,
                    navDots = false,
                    margin = 0;

                if (typeof singleListingSlider.data('number') !== 'undefined' && singleListingSlider.data('number') !== false) {
                    number = parseInt(singleListingSlider.data('number'));
                }

                if (typeof singleListingSlider.data('number-visible') !== 'undefined' && singleListingSlider.data('number-visible') !== false) {
                    numberOfItems = parseInt(singleListingSlider.data('number-visible'));
                }

                if (typeof singleListingSlider.data('speed') !== 'undefined' && singleListingSlider.data('speed') !== false) {
                    speed = singleListingSlider.data('speed');
                }

                if (typeof singleListingSlider.data('animation-speed') !== 'undefined' && singleListingSlider.data('animation-speed') !== false) {
                    animationSpeed = singleListingSlider.data('animation-speed');
                }

                if (typeof singleListingSlider.data('nav-arrows') !== 'undefined' && singleListingSlider.data('nav-arrows') !== false && singleListingSlider.data('nav-arrows') === 'no') {
                    navArrows = false;
                }

                if (typeof singleListingSlider.data('nav-dots') !== 'undefined' && singleListingSlider.data('nav-dots') !== false && singleListingSlider.data('nav-dots') === 'no') {
                    navDots = false;
                }

                if (number === 1) {
                    loop = false;
                    autoplay = false;
                    navArrows = false;
                    navDots = false;
                }

                var responsiveNumberOfItems1 = 1,
                    responsiveNumberOfItems2 = 2;

                if (numberOfItems < 3) {
                    responsiveNumberOfItems1 = numberOfItems;
                    responsiveNumberOfItems2 = numberOfItems;
                }

                singleListingSlider.owlCarousel({
                    items: numberOfItems,
                    loop: loop,
                    autoplay: autoplay,
                    autoplayTimeout: speed,
                    smartSpeed: animationSpeed,
                    margin: margin,
                    center: center,
                    autoWidth: autoWidth,
                    nav: navArrows,
                    dots: navDots,
                    responsive: {
                        0: {
                            items: responsiveNumberOfItems1,
                            margin: 0,
                            center: true,
                            autoWidth: true
                        },
                        769: {
                            items: responsiveNumberOfItems2
                        },
                        1025: {
                            items: numberOfItems
                        }
                    },
                    navText: [
                        '<span class="qode-prev-icon fa fa-angle-left"></span>',
                        '<span class="qode-next-icon fa fa-angle-right"></span>'
                    ]
                });
                thisSlider.css({'visibility': 'visible'});
            });
        }
    }

    /*
     ** Set Single Listing Slider Height
     */

    function qodeSingleListingSliderHeight() {
        var singleListingSlider = $('.qode-listing-single-holder .qode-ls-single-item .qode-ls-single-gallery-holder');

        //Set the responsive height of the slider

        if (singleListingSlider.length) {
            singleListingSlider.each(function () {
                var singleListingSlider = $(this),
                    sliderItem = singleListingSlider.find('.qode-ls-single-gallery-item img'),
                    maxHeight = singleListingSlider.outerHeight();

                qodeSingleListingSliderRecalculateHeight(singleListingSlider, maxHeight);

                $(window).resize(function () {
                    qodeSingleListingSliderRecalculateHeight(singleListingSlider, maxHeight);
                });

                if (singleListingSlider.data('enable-auto-width') === 'yes') {

                    sliderItem.each(function () {
                        var thisItem = $(this),
                            itemInitialHeight = thisItem[0].clientHeight;
                        qodeSingleListingSliderRecalculateItemsHeight(thisItem, itemInitialHeight);

                        $(window).resize(function () {
                            qodeSingleListingSliderRecalculateItemsHeight(thisItem, itemInitialHeight);
                        });
                    });

                }

                if (typeof singleListingSlider.data('owl.carousel') !== 'undefined') {
                    singleListingSlider.trigger('refresh.owl.carousel');
                }

            });
        }
    }

    function qodeSingleListingSliderRecalculateHeight(holder, height){
        var newHeight = qodeSingleListingSliderUpdateHeightCoefficient() * height;

        holder.css('height', newHeight)
    }

    function qodeSingleListingSliderRecalculateItemsHeight(item, height) {
        var newHeight = qodeSingleListingSliderUpdateHeightCoefficient() * height;

        item.css('height', newHeight);
    }

    function qodeSingleListingSliderUpdateHeightCoefficient() {

        var heightCoefficient = 1;

        if ($window_width < 481) {
            heightCoefficient = 0.667;
        } else if ($window_width < 600) {
            heightCoefficient =  0.87;
        } else if ($window_width < 769) {
            heightCoefficient =  0.968;
        } else if ($window_width < 1025) {
            heightCoefficient =  0.804;
        } else if ($window_width < 1281) {
            heightCoefficient = 0.779;
        } else if ($window_width < 1441) {
            heightCoefficient = 0.916;
        }

        return heightCoefficient;
    }

})(jQuery);
(function($) {
	'use strict';

	var listingAdvSearch = {};
	qode.modules.listingAdvSearch = listingAdvSearch;

	listingAdvSearch.qodeOnDocumentReady = qodeOnDocumentReady;

	$(document).ready(qodeOnDocumentReady);
	listingAdvSearch.qodeInitAdvSearch = qodeInitAdvSearch;
	listingAdvSearch.qodeGetAdvancedSearchResponse = qodeGetAdvancedSearchResponse;

	/*
	 All functions to be called on $(document).ready() should be in this function
	 */
	function qodeOnDocumentReady() {
		qodeInitAdvSearch();
	}
	
	function qodeInitAdvSearch(){

		var container = $('.qode-ls-adv-search-holder');

		if(container.length){
			container.each(function(){

				var thisContainer = $(this),
					typeID = thisContainer.data('type'),
					nextPage = thisContainer.data('next-page'),
					maxNumPages = thisContainer.data('max-num-pages'),
				 	submitButton = thisContainer.find('.qode-adv-search-submit'),
					keywordSubmitButton = thisContainer.find('.qode-ls-adv-search-keyword-button'),
					keywordField = thisContainer.find('.qode-ls-adv-search-keyword'),
					availableListings = qodeListingTitles.titles,
					loadMoreButton = thisContainer.find('.qode-ls-adv-search-load-more');
					
				if(qode.modules.listings.qodeIsValidObject(keywordField)){
				    keywordField.autocomplete({
					    source: availableListings
				    });
				}
				
				if(qode.modules.listings.qodeIsValidObject(keywordField)){
				    keywordSubmitButton.on('click', function(){
					    qodeGetAdvancedSearchResponse(typeID, thisContainer, false);
				    });
				}
				

				submitButton.on('click', function(){
					qodeGetAdvancedSearchResponse(typeID, thisContainer, false);
				});
				
				

				if(typeof loadMoreButton !== 'undefined' && loadMoreButton !=='false'){
					qode.modules.listings.qodeShowHideButton(loadMoreButton, nextPage, maxNumPages);
					
					loadMoreButton.on('click', function(){
						qodeGetAdvancedSearchResponse(typeID, thisContainer, true);
					});
				}

			});
		}

	}

	function qodeGetAdvancedSearchResponse(typeId, container, loadMoreFlag){

		if(typeof typeId !== 'undefined' && typeId !== false && typeId !== ''){
		    
		    
			var number = container.data('number'),
			    searchFields = container.find('.qode-ls-adv-search-input'),
			    itemsHolder = container.find('.qode-ls-adv-search-items-holder-inner'),
			    googleMap = container.data('enable-map'),
			    mapFlag = false,
			    loadMoreData,
			    loadMoreButton = container.find('.qode-ls-adv-search-load-more'),
			    keywordField = container.find('.qode-ls-adv-search-keyword'),
			    keyword = '',
			    defaultSearchParams = {},
			    checkBoxSearchParams  = {},
			    categoryParams  = {},
			    nextPage,
			    data = {};
			    
			if(qode.modules.listings.qodeIsValidObject(googleMap))    {
			    if(googleMap === 'yes'){
				mapFlag = true;
			    }
			}
			

			if(searchFields.length){
				searchFields.each(function(){

					var thisField = $(this);
					var fieldNameAttr = thisField.attr('name');
					var fieldType = thisField.attr('type');
					var fieldID;
					var fieldVal;

					if(fieldNameAttr === 'job_type_categories'){
						//generate category params
						fieldVal = thisField.is(':checked');
						fieldID = thisField.attr('id');
						categoryParams[fieldID] = fieldVal;
					}else{
						//generate params for all other fields
						switch (fieldType) {
							case 'checkbox':
								fieldVal = thisField.is(':checked');
								checkBoxSearchParams[fieldNameAttr] = fieldVal;
								break;
							default :
								fieldVal = thisField.val();
								defaultSearchParams[fieldNameAttr] = fieldVal;
								break;
						}
					}
				});
			}
			
			if(qode.modules.listings.qodeIsValidObject(keywordField))    {
			    keyword = keywordField.val();
			}
			
			
			if(loadMoreFlag){
				loadMoreData = qode.modules.common.getLoadMoreData(container);
			}else{
				container.data('next-page', '2');
			}			
			
			
			//always get value from holder
			nextPage = container.data('next-page');
			
			data = {
				action: 'qode_listing_advanced_search_response',
				typeId : typeId,
				postPerPage : number,
				defaultSearchParams: defaultSearchParams,
				checkBoxSearchParams: checkBoxSearchParams,
				catParams: categoryParams,		
				keyword: keyword,
				enableLoadMore: loadMoreFlag,
				loadMoreData: loadMoreData,
				enableMap: mapFlag
			};
			
			$.ajax({
				type: "POST",
				url: QodeListingAjaxUrl,
				data: data,
				success: function (data) {
					if (data === 'error') {

					}else{
						var response = $.parseJSON(data);
						var responseHtml = response.html;
						var maxNumPages = response.maxNumPages;
						
						if(typeof maxNumPages !== 'undefined' && maxNumPages !== 'false'){
							container.data('max-num-pages', maxNumPages);
						}
						
						if(mapFlag){
						    
						    var mapObjs = response.mapAddresses;
						    var mapAddresses = '';
						   
						   
						    if(qode.modules.listings.qodeIsValidObject(mapObjs)){
							    mapAddresses = mapObjs['addresses'];
						    }
						    
						    if(loadMoreFlag){
							nextPage++;
							container.data('next-page', nextPage);
							//if new map objects are sent via ajax, update global map objects
							
							qode.modules.listings.qodeReinitMultipleGoogleMaps(mapAddresses, 'append');
							
							setTimeout(function(){
								itemsHolder.append(responseHtml);
							},300);
						    }else{
							//update multiple map addressess object
							
							qode.modules.listings.qodeReinitMultipleGoogleMaps(mapAddresses, 'replace');
							
							setTimeout(function(){
								itemsHolder.html(responseHtml);
							},300);
						    }						    
							
						    qode.modules.listings.qodeBindTitles();
						}
						else{
						    
						    if(loadMoreFlag){
							nextPage++;
							container.data('next-page', nextPage);
							
							setTimeout(function(){
								itemsHolder.append(responseHtml);
							},300);
						    }
						    else{
							setTimeout(function(){
								itemsHolder.html(responseHtml);
							},300);
						    }
						    
						}
						
						//show button
						qode.modules.listings.qodeShowHideButton(loadMoreButton, nextPage, maxNumPages);
					}

				}
			});
		}

	}

})(jQuery);
(function($) {
	'use strict';

	var listingGallery = {};
	qode.modules.listingGallery = listingGallery;

	listingGallery.qodeIniListingGallery = qodeIniListingGallery;

	listingGallery.qodeOnDocumentReady = qodeOnDocumentReady;

	$(document).ready(qodeOnDocumentReady);

	/*
	 All functions to be called on $(document).ready() should be in this function
	 */
	function qodeOnDocumentReady() {
		qodeIniListingGallery();
	}

	/**
	 * Masonry gallery, init masonry and resize pictures in grid
	 */
	function qodeIniListingGallery(){

		var galleryHolder = $('.qode-ls-category-gallery'),
			gallery = galleryHolder.children('.qode-ls-gallery-inner'),
			gallerySizer = gallery.children('.qode-ls-gallery-sizer');

		resizeListingGallery(gallerySizer.outerWidth(), gallery);

		if(galleryHolder.length){
			galleryHolder.each(function(){
				var holder = $(this),
					holderGallery = holder.children('.qode-ls-gallery-inner');

				holderGallery.waitForImages(function(){
					holderGallery.animate({opacity:1});

					holderGallery.isotope({
						layoutMode: 'packery',
						itemSelector: '.qode-ls-gallery-item',
						percentPosition: true,
						packery: {
							columnWidth: '.qode-ls-gallery-sizer'
						}
					});
				});
			});

			$(window).resize(function(){
				resizeListingGallery(gallerySizer.outerWidth(), gallery);
				gallery.isotope('reloadItems');
			});
		}
	}

	function resizeListingGallery(size, holder){
		var rectangle_portrait = holder.find('.qode-ls-gallery-rec-portrait'),
			rectangle_landscape = holder.find('.qode-ls-gallery-rec-landscape'),
			square_big = holder.find('.qode-ls-gallery-square-big'),
			square_small = holder.find('.qode-ls-gallery-square-small');

		
		rectangle_landscape.css('height', size);
		square_small.css('height', 'size');
		
		
		rectangle_portrait.css('height', 2*size);
		

		if (window.innerWidth <= 680) {
			rectangle_landscape.css('height', size/2);
		} else {
			rectangle_landscape.css('height', size);
		}

		square_big.css('height', 2*size);

		if (window.innerWidth <= 680) {
			square_big.css('height', square_big.width());
		}

		square_small.css('height', size);
	}

})(jQuery);
(function($) {
	'use strict';

	var listingGallery = {};
	qode.modules.listingGallery = listingGallery;

	listingGallery.qodeOnDocumentReady = qodeOnDocumentReady;

	$(document).ready(qodeOnDocumentReady);

	/*
	 All functions to be called on $(document).ready() should be in this function
	 */
	function qodeOnDocumentReady() {

	}



})(jQuery);
(function($) {
	'use strict';

	var listingSearch = {};
	qode.modules.listingSearch = listingSearch;

	listingSearch.qodeListingSearchPriceSlider = qodeListingSearchPriceSlider;

	listingSearch.qodeOnDocumentReady = qodeOnDocumentReady;

	$(document).ready(qodeOnDocumentReady);

	/*
	 All functions to be called on $(document).ready() should be in this function
	 */
	function qodeOnDocumentReady() {
		qodeListingSearchPriceSlider();
	}
    
	function qodeListingSearchPriceSlider(){
        var holder = $('.qode-ls-main-search-holder-part.price'),
            slider = holder.find('.qode-price-slider'),
            maxValue = slider.attr('max'),
            response = holder.find('.qode-price-slider-response'),
            hiddenValue = holder.find('.qode-price-slider-value');
    
        // Basic rangeslider initialization
		slider.rangeslider({
			polyfill: false,
			onInit: function(position, value) {
				qodeSetListingSearchPricePosition(maxValue, value);
			},
			onSlide: function(position, value) {
                qodeSetListingSearchPriceAmount(value);
                qodeSetListingSearchPricePosition(maxValue, value);
			}
		});

		function qodeSetListingSearchPriceAmount(value){
			response.text("$"+value);
            hiddenValue.val(value);
		}
		
		function qodeSetListingSearchPricePosition(maxValue, currentValue) {

			if(qode.modules.listings.qodeIsValidObject(maxValue) && qode.modules.listings.qodeIsValidObject(currentValue) ){
                var percent = (currentValue/maxValue) * 100;
                response.css('left', percent+'%');
			}

        }
        
	}
})(jQuery);