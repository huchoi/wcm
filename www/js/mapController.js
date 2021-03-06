wcm.controller('MapController', function($scope, $stateParams, $cordovaGeolocation, $ionicLoading, $compile, $ionicHistory, $rootScope, $ionicPopup) {

    var map , marker, infowindow;
    $scope.$on('$ionicView.afterEnter', function(){
      if($ionicHistory.backView() != null && $ionicHistory.backView().stateName == "tabs.post"){
        $scope.showLocation();
        document.getElementById('pac-input').setAttribute('style' , 'display:none');
      }else{
        $scope.showLocation();
        $scope.setMapFuntions();
      }
    }); 

    /*
    * 맵과 marker를 보여주고 클릭시 보여줄 info창을 세팅합니다
    */
    $scope.showLocation = function(){
      //받아온 위/경도로 맵을 생성
      console.log('$stateParams.latlng : ' + $stateParams.latlng);
      console.log('$stateParams.progress : ' + $stateParams.progress);
      var latlngStr = $stateParams.latlng.slice(1,-1).split(',',2);
      var currentLatlng;
      if(latlngStr != ''){
        currentLatlng = {lat: parseFloat(latlngStr[0]), lng: parseFloat(latlngStr[1])};
      }else{
        currentLatlng = {lat : 37.574515, lng : 126.976930};
      }
      var mapOptions = {
        'zoom': 16, //init
        'minZoom' : 4,
        'center': currentLatlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP,
        'mapTypeControl' : false,     //지도, 위성
        'streetViewControl' : false,   //거리뷰
        'panControl' : false,           //위치 조절 pan
        'zoomControl' : false,         //확대/축소 pan
      };
      map = new google.maps.Map(document.getElementById("map-find"), mapOptions);

      // 진행 상황에 따른 marker 색을 변경합니다
      var imageUrl;
      switch($stateParams.progress){
        case PROGRESS_REGISTER :
        case PROGRESS_START :
          imageUrl = 'img/location_r.png';
          break;
        case PROGRESS_ONGOING :
          imageUrl = 'img/location_y.png';
          break;
        case PROGRESS_COMPLETED :
          imageUrl = 'img/location_g.png';
          break;
        default : 
          imageUrl = 'img/location_r.png';
      }
      var markerImage = new google.maps.MarkerImage(imageUrl,
        new google.maps.Size(50, 50),
        new google.maps.Point(0, 0),
        new google.maps.Point(15, 25),
        new google.maps.Size(50, 50));

      //marker를 생성
      marker = new google.maps.Marker({
        position: currentLatlng,
        map: map,
        title: 'Uluru (Ayers Rock)',
        draggable: false,
        icon : markerImage
      });

       // Marker + infowindow + angularjs compiled ng-click
      var contentString = "<div><a ng-click='clickTest()'></a></div>";
      var compiled = $compile(contentString)($scope);

      infowindow = new google.maps.InfoWindow({
        content: compiled[0]
      });
      // google.maps.event.addListener(marker, 'click', function() {
      //   infowindow.open(map,marker);
      // });
      $scope.setLocationName(currentLatlng);
    }

    /*
    * map의 기능을 설정합니다. (marker dragend 리스너, 현재 위치, search box)
    */
    $scope.setMapFuntions = function(){

      //marker dragend 리스너
      marker.draggable = true;
      google.maps.event.addListener(marker, 'dragend', function() { 
        var latlng = marker.getPosition();

        //latlng.H로 나올때도 있고 latlng.lat()으로 나올때도 있다? -_-?
        var lat, lng;
        if(latlng.H != null){
          lat = latlng.H
          lng = latlng.L
        }else{
          lat = latlng.lat();
          lng = latlng.lng();
        }
        var movedLatlng = {lat: lat,  lng: lng};
        $scope.setLocationName(movedLatlng);
      });

      // find me 넣기
      var findMe = document.getElementById('find-me');
      map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(findMe);

       // serch 박스 넣기
      var input = document.getElementById('pac-input');
      var searchBox = new google.maps.places.SearchBox(input);
      var inputBox = document.getElementById('input-box-div');
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputBox);
      // Bias the SearchBox results towards current map's viewport.
      map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
      });
      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.
      searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
          return;
        }
        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
          // var icon = {
          //   url: place.icon,
          //   size: new google.maps.Size(71, 71),
          //   origin: new google.maps.Point(0, 0),
          //   anchor: new google.maps.Point(17, 34),
          //   scaledSize: new google.maps.Size(25, 25)
          // };
          marker.setOptions({
            map: map,
            // icon: icon,
            title: place.name,
            draggable: true,
            position: place.geometry.location,
            animation: google.maps.Animation.DROP,
          });

           //latlng.H로 나올때도 있고 latlng.lat()으로 나올때도 있다? -_-?
          var lat, lng;
          if(place.geometry.location.H != null){
            lat = place.geometry.location.H
            lng = place.geometry.location.L
          }else{
            lat = place.geometry.location.lat();
            lng = place.geometry.location.lng();
          }

          var searchedLatlng = {lat: lat , lng: lng};
          $scope.setLocationName(searchedLatlng);

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });
      $scope.map = map;
    }

    /*
    * 내 위치 찾기 (현재 내 위치로 marker를 변경합니다)
    */
    $scope.centerOnMe = function() {
        $ionicLoading.show({
            template: '<ion-spinner icon="bubbles"></ion-spinner><br/>위치를 찾고 있습니다',
            duration : 5000
        });
         
        var posOptions = {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 0
        };
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;
             
            var myLatlng = new google.maps.LatLng(lat, long);
             
            var mapOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            }; 

            marker.setOptions({
              position: myLatlng,
              animation: google.maps.Animation.DROP,
            });         
             
            map.setOptions(mapOptions);    

            $scope.setLocationName(myLatlng);

            $scope.map = map;   
            $ionicLoading.hide();           
             
        }, function(error) {
            console.log('error : ' + JSON.stringify(error));
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: mAppName,
              template: '위치 정보를 사용할 수 없습니다',
              cssClass: 'wcm-error'
             });
        });
    }

    /*
    * 마커 상단에 위치 이름 표시
    */
    $scope.setLocationName = function(latlng) {
      var geocoder = new google.maps.Geocoder;
      geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            map.setZoom(16);
            marker.setOptions({
              position: latlng,
              map: map
            });
            infowindow.setContent(results[1].formatted_address);
            infowindow.open(map, marker);
            console.log('lat : ' + latlng.lat);
            console.log('lng : ' + latlng.lng);

            $rootScope.cardLocation = results[1].formatted_address;
            $rootScope.cardLocationLat = latlng.lat;
            $rootScope.cardLocationLng = latlng.lng;
            
          } else {
            $ionicPopup.alert({
              title: mAppName,
              template: '결과가 없습니다',
              cssClass: 'wcm-negative'
             });
          }
        }else if(status == "OVER_QUERY_LIMIT"){   
            //너무 빠르게 시도하여 난 에러이므로 다시 시도 by tjhan 151117
            Thread.Sleep(200);
            $scope.setLocationName(latlng);
        }else if(status != "OK" && status != "ZERO_RESULTS"){ 
          $ionicPopup.alert({
            title: mAppName,
            template: 'Geocoder 실패 : ' + status,
            cssClass: 'wcm-error'
           });
        }
      });
    }
             
});
