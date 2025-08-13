jQuery(document).ready(function ($) {
    $(document).on('elementor/popup/show', function(event, id, instance) {
        window.fluentform_gmap_callback();
    });

    window.fluentform_gmap_callback = function (){
        $('.ff_map_autocomplete').each((index, item) => {
            const $container = $(item);
            const elementId = $container.find("input[data-key_name='address_line_1']").attr('id');
            const input = $container.find('#'+elementId)[0];

            const autoLocateType = (typeof $container.data('ff_with_auto_locate') !== 'undefined') ? $container.data('ff_with_auto_locate') : false ;

            const options = {
                fields: ["formatted_address", "name", 'address_components','geometry', 'icon']
            };
            let autocomplete = new google.maps.places.Autocomplete(input, options);

            $country = $container.find("select[data-key_name='country']");
            if ($country.length) {

                const restrictedCountries = $country.data('autocomplete_restrictions');
                let formattedCountries = [];
                for (const country in restrictedCountries) {
                    formattedCountries.push(restrictedCountries[country])
                }
                if (formattedCountries.length > 0) {
                    autocomplete.setComponentRestrictions({
                        country: formattedCountries,
                    });
                }
            }
            if(autoLocateType && autoLocateType != 'no'){
                if (autoLocateType == 'on_load'){
                    locateUser(input, $container);
                }

                let bttn = $(input).parent().find('.ff_input-group-append');
                bttn.on('click', function() {
                    $(input).val('Please wait ..') //translate
                    locateUser(input, $container);
                });
            }
            autocomplete.addListener("place_changed",  () => {
                const place = autocomplete.getPlace();
                place.latLng = place.geometry.location;

                maybeGenerateMap(input, place, $container)
                setAddress(place, $container);

            });
        });

    }

    function setAddress(place, $container) {
        const address = {
            address_line_1: '',
            address_line_2: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        };

        for (const component of place.address_components) {
            const componentType = component.types[0];
            switch (componentType) {
                case "street_number": {
                    if (ifAlreadyInPlaceName(place.name, component.long_name)) {
                        break;
                    }
                    address.address_line_1 = `${component.long_name} ${address.address_line_1}`.trim();
                    break;
                }

                case "route": {
                    if (ifAlreadyInPlaceName(place.name, component.short_name)) {
                        break;
                    }
                    if (address.address_line_1) {
                        address.address_line_1 += " " + component.short_name;
                    } else {
                        address.address_line_1 = component.short_name;
                    }
                    break;
                }

                case "postal_code": {
                    address.zip = `${component.long_name}${address.zip}`;
                    break;
                }

                case "postal_code_suffix": {
                    address.zip = `${address.zip}-${component.long_name}`;
                    break;
                }
                case "locality":
                case "postal_town":
                    address.city = component.long_name;
                    break;
                case "administrative_area_level_1":
                    if (!address.state && !address.country) {
                        address.state = component.long_name;
                    } else if (!address.state && address.country) {
                        // Likely a country in this case, skip assigning to state
                    }
                    break;

                case "administrative_area_level_2":
                    if (!address.state && address.country) {
                        address.state = component.long_name;
                    }
                    break;
                case "administrative_area_level_3":
                case "administrative_area_level_4":
                    if (address.address_line_2) {
                        address.address_line_2 = " " + component.short_name;
                    } else {
                        address.address_line_2 = component.short_name;
                    }
                case "country":
                    address.country = component.short_name;
                    break;
            }
        }

        if (!address.address_line_1) {
            address.address_line_1 = place.name;
        }

        if (place.name != address.address_line_1 &&  typeof place.name != "undefined") {
            if ($container.find("input[data-key_name='address_line_2']").length) {
                address.address_line_2 = address.address_line_1;
                address.address_line_1 = place.name;
            } else {
                address.address_line_1 = place.name + " " + address.address_line_1;
            }
        }

        $container.find(':input').val('').trigger('change');

        $.each(address, (key, value) => {
            if (value) {
                if (key == 'country') {
                    $container.find("select[data-key_name='" + key + "']").val(value).trigger('change');
                } else {
                    $container.find("input[data-key_name='" + key + "']").val(value).trigger('change');
                }
            }
        });
    }

    function maybeGenerateMap(input ,place, $container){
        const showMapEnabled = typeof $container.data('ff_with_g_map') !== 'undefined';

        if(!showMapEnabled){
            return;
        }
        let isDragable = true; //another option or maybe a filter
        let $addressElm = $(input).closest('.ff_map_autocomplete');
        $mapDom =  $addressElm.find('.ff_g_map');
        if(!$mapDom.length){
            $('<div/>',{
                class:'ff_g_map',
                id:'ff_map_elm_'+$(input).attr('id'),
                style:'height:300px'
            }).appendTo( $addressElm);
            $mapDom =  $addressElm.find('.ff_g_map');
        }

        if (document.getElementById($mapDom.attr('id'))) {
            const map = new google.maps.Map(document.getElementById($mapDom.attr('id')), {
                center: { lat: 50.064192, lng: -130.605469 }, //add filter maybe
                zoom: 3,
            });

            const marker = new google.maps.Marker({
                map,
                draggable: isDragable,
                anchorPoint: new google.maps.Point(0, -29),
            });

            marker.setVisible(false);

            if (!place.geometry || !place.geometry.location) {
                return;
            }

            google.maps.event.addListener(marker, "dragend", function(event){
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'latLng': event.latLng
                }, (places, status) => {
                    if (status == google.maps.GeocoderStatus.OK && places[0]) {
                        places[0].latLng = event.latLng
                        setAddress(places[0], $container);
                    }
                });
            });

            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
            }
            marker.setPosition(place.geometry.location);
            marker.setVisible(true);
        }
    }

    function locateUser(input, $container) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latlng = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({
                        'latLng': latlng
                    }, (places, status) => {
                        if (status == google.maps.GeocoderStatus.OK && places[0]) {
                             places[0].latLng = latlng
                            setAddress(places[0],$container);
                            maybeGenerateMap(input, places[0], $container)
                        }
                    });
                },
                () => {
                    $(input).val('');
                }
            );
        }else{
            $(input).val('');
        }
    }

    function ifAlreadyInPlaceName(placeName, val) {
        return placeName && placeName.includes(val);
    }
}(jQuery));
