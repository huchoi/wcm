wcm.controller("ProfileController", function($scope, $state, $http, AuthService, $window, $ionicPopup, $ionicHistory,$ionicLoading, $timeout) {

	var user = JSON.parse(window.localStorage['user'] || '{}');

	console.log('ProfileController user ' + user);
	console.log('ProfileController user.isAuthenticated ' + user.isAuthenticated);
	
	if (user.isAuthenticated === true) {
		$scope.userCheck = true;
		$scope.user = user;

		$scope.cards = [];
		$scope.changes = [];
		$scope.watch = true;
		$scope.message1 = '';
		$scope.message2 = '';
		//dmjor 페이스북으로 로그인한 경우는 adminUser true
		$scope.adminUser = user.userid == "1826451354247937";

		// User가 Change Supporters로 참여중인 Change List 가져오기
		var request1 = $http({
	    method: "get",
	    url: mServerAPI + "/change/" + user.userid,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request1.success(function(data) {
	  	for (var i = 0; i < data.changes.length; i++) {
	  		if(data.changes[i].post.length > 0 ){	//add by tjhan 151007
		  		if (data.changes[i].post[0].status === PROGRESS_START) {
	          data.changes[i].post[0].statusDescription = PROGRESS_START_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-alert-circled";
	        } else if (data.changes[i].post[0].status === PROGRESS_ONGOING) {
	          data.changes[i].post[0].statusDescription = PROGRESS_ONGOING_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-gear-b";
	        } else {
	          data.changes[i].post[0].statusDescription = PROGRESS_COMPLETED_TEXT;
	          data.changes[i].post[0].statusIcon = "ion-happy-outline";
	        }

		  		var change = data.changes[i].post[0];
		  		$scope.changes.push(change);
		  	}
	  	}

	  	if(data.changes.length === 0) {
	  		$scope.message1 = "Change Supporters로 참여중인 프로젝트가 없습니다."
	  	}
	  });


	  // User가 작성한 Card List 가져오기
		var request2 = $http({
	    method: "get",
	    url: mServerAPI + "/cards/" + user.userid,
	    crossDomain : true,
	    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
	    cache: false
	  });

	  request2.success(function(data) {

	  	for (var i = 0; i < data.cards.length; i++) {
	  		if (data.cards[i].status === PROGRESS_START) {
          data.cards[i].statusDescription = PROGRESS_START_TEXT;
          data.cards[i].statusIcon = "ion-alert-circled";
        } else if (data.cards[i].status === PROGRESS_ONGOING) {
          data.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
          data.cards[i].statusIcon = "ion-gear-b";
        } else {
          data.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
          data.cards[i].statusIcon = "ion-happy-outline";
        }

	  		var card = data.cards[i];
	  		$scope.cards.push(card);	
	  	}
	  	
	  	if(data.cards.length === 0) {
	  		$scope.message2 = "작성한 글이 없습니다."
	  	}
	  });


	  var statusPost = function(card) {
	  	var status = card.status;

      var formData = { status: status };
      var postData = 'statusData='+JSON.stringify(formData);

      var request = $http({
          method: "post",
          url: mServerAPI + "/cardDetail/" + card.id + "/status",
          crossDomain : true,
          data: postData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
          cache: false
      });

      request.success(function(data) {

        var i = 0;
        while( i < $scope.cards.length) {

          if ($scope.cards[i].id === card.id) {
            
            if (card.status === PROGRESS_START) {
		          $scope.cards[i].statusDescription = PROGRESS_START_TEXT;
		          $scope.cards[i].statusIcon = "ion-alert-circled";
		        } else if (card.status === PROGRESS_ONGOING) {
		          $scope.cards[i].statusDescription = PROGRESS_ONGOING_TEXT;
		          $scope.cards[i].statusIcon = "ion-gear-b";
		        } else {
		          $scope.cards[i].statusDescription = PROGRESS_COMPLETED_TEXT;
		          $scope.cards[i].statusIcon = "ion-happy-outline";
		        }
            break;
          } 
          i ++;
        }
      });
	  };

	  $scope.idea = function(card) {
	  	card.status = PROGRESS_START;
	  	statusPost(card);
	  }

	  $scope.doing = function(card) {
	  	card.status = PROGRESS_ONGOING;
	  	statusPost(card);
	  }

	  $scope.done =function(card) {
	  	card.status = PROGRESS_COMPLETED;
	  	statusPost(card);
	  }

	} else {
		$scope.userCheck = false;
	}



	$scope.cancelChanger = function(change) {
		var confirmPopup = $ionicPopup.confirm({
	    title: 'We Change Makers',
	    template: 'Change Supporters 활동을 취소하시겠습니까?'
	  });

	  confirmPopup.then(function(res) {
	    if(res) {
	      var userId = parseInt(user.userid);
	      var postId = change.id;
	      var formData = { user_id: userId,
	                        post_id: postId
	                      };
	      var postData = 'changeData='+JSON.stringify(formData);

	      var request = $http({
	          method: "post",
	          url: mServerAPI + "/change/delete/" + userId + "/" + postId,
	          crossDomain : true,
	          data: postData,
	          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
	          cache: false
	      });

	      request.success(function() {
	      	// Change List에서 Card 삭제
	      	var changeIndex = $scope.changes.indexOf(change);
          $scope.changes.splice(changeIndex, 1); 

          console.log(user.changes);
          // User가 local storage에서 가지고 있는 change card id 삭제
          var postIndex = user.changes.indexOf(change.id);
          user.changes.splice(postIndex, 1);
          console.log(user.changes);
	      });
	    }
	  });
	}


	$scope.goLogin = function() {
		$state.go('fblogin');
	}

	$scope.logOut = function() {
		AuthService.logout();

		window.localStorage['user'] = null;
		if(mIsWebView){
			Preferences.put('loginId', null); 
		}

		$state.go('fblogin');
	}

	$scope.editProfile = function() {
		$state.go("tabs.editProfile");
	}
	
	$scope.showChanges = function() {
		$scope.watch = true;
	}

	$scope.showActivities = function() {
		$scope.watch = false;
	}

	$scope.config = function() {
    $state.go("tabs.config");
  }

  $scope.terms = function() {
    $state.go("tabs.terms");
  }

  $scope.termsGps = function() {
    $state.go("tabs.terms_gps");
  }

  $scope.privacy = function() {
    $state.go("tabs.privacy");
  }

  $scope.inquire = function() {
    $state.go("tabs.inquire");
  }
  
  $scope.editDone = function() {
  	var edit_name = document.getElementById("edit-name").value;
  	var formData = { username: edit_name };
    var postData = 'userData='+JSON.stringify(formData);

    var request = $http({
        method: "post",
        url: mServerAPI + "/user/" + user.userid,
        crossDomain : true,
        data: postData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        cache: false
    });

    request.success(function() {
    	user.username = edit_name;
    	window.localStorage['user'] = JSON.stringify(user);
    	console.log(user);
    });

  	var myPopup = $ionicPopup.show({
      template: "변경이 완료되었습니다.",
      title: 'We Change Makers',
    
      buttons: [
        {
          text: '<b>OK</b>',
          type: 'button-positive',
          onTap: function(e) {
            $ionicHistory.goBack();
          }
        }
      ]
    });
  }

  /*
  * message를 입력하면 push를 보냅니다
  *	wcm db에서 device token을 받아와 해당 device들에게 push를 보냅니다
  */
  $scope.sendPushNotification = function(){

		$scope.push = {}
		// An elaborate, custom popup
		var myPopup = $ionicPopup.show({
		  template: '<input type="text" ng-model="push.message">',
		  title: '메세지를 입력하세요',
		  subTitle: 'wcm사용자에게 push를 보냅니다',
		  scope: $scope,
		  buttons: [
		    { text: 'Cancel' },
		    {
		      text: '<b>Send</b>',
		      type: 'button-positive',
		      onTap: function(e) {
		        if ($scope.push.message) {
		          //don't allow the user to close unless he enters wifi password
		          // e.preventDefault();
		          return $scope.push.message;
		        }else{
		         // e.preventDefault();
		        }
		      }
		    },
		  ]
		});

		// confirm창
		myPopup.then(function(message) {

			if(message == null ) return;

			var confirmPopup = $ionicPopup.confirm({
			title: 'Push 메세지를 보냅니다',
			template: message
			});
			confirmPopup.then(function(res) {
				if(res) {
					console.log('START SEND PUSH MESSAGE');
					// Define relevant info
					var privateKey = '624387cf842c14a8ceb263e8119cdb747e8104fa698492e6';
					var tokens = [];
					var appId = 'e02f6eed';

			  		var request = $http({
			         method: "get",
			         url: mServerAPI + "/devices",
			         crossDomain : true,
			         headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
			         cache: false
			     });

			  		//DB에 저장된 TOKEN을 가져오면 push 메세지를 보낸다
			     request.success(function(data) {
			       $ionicLoading.hide();
			       console.log('Push Device Number : ' + data.devices.length);
			       for (var i = 0; i < data.devices.length; i++) {
			       	tokens.push(data.devices[i].device_token);
			       }
			       // Encode your key
						var auth = btoa(privateKey + ':');
						// Build the request object
						var req = {
						  method: 'POST',
						  url: 'https://push.ionic.io/api/v1/push',
						  headers: {
						    'Content-Type': 'application/json',
						    'X-Ionic-Application-Id': appId,
						    'Authorization': 'basic ' + auth
						  },
						  data: {
						    "tokens": tokens,
						    "notification": {
						      "alert": message
						    }
						  }
						};
						// Make the API call
						$http(req).success(function(resp){
						  // Handle success
						  console.log("Ionic Push: Push success!");
						}).error(function(error){
						  // Handle error 
						  console.log("Ionic Push: Push error...");
						});
			     });

			     request.error(function(error){
			       $ionicLoading.hide();
			       console.log('error : ' + JSON.stringify(error))
			     });
				} else {
					console.log('CANCEL SEND PUSH MESSAGE');
				}
			});
		});
	}
  

  /*
  *	push를 받을지 안받을지 toggle합니다.
  * 현재 device uuid와 on/off를 보내서 device 테이블의 push를 수정합니다
  * 초기값은 true로 푸시를 받습니다
  */
  $scope.pushNotification = { checked: true };
	$scope.pushNotificationChange = function() {
    console.log('Push Notification Change', $scope.pushNotification.checked);
    if(mIsWebView){
		var pushStatus ;
		if($scope.pushNotification.checked) pushStatus = 1;
		else pushStatus = 0;

		var deviceUuid = ionic.Platform.device().uuid;
		var request = $http({
		  method: "post",
		  url: mServerAPI + "/push/" + deviceUuid + '/' + pushStatus,
		  crossDomain : true,
		  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		});
		request.error(function(error){
		   console.log('error : ' + JSON.stringify(error));
		 })
		 request.success(function(data) {
		   console.log('success : ' + JSON.stringify(data));
		 });
    }
  };
 
});
