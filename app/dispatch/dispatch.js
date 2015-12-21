'use strict';

angular.module('myApp.dispatch', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dispatch', {
    templateUrl: 'dispatch/dispatch.html',
    controller: 'DispatchCtrl'
  });
}])

.controller('DispatchCtrl', ['$scope','$location','kalapatruService',function($scope,$location,kalapatruService) {

  $scope.forwardingNotes = []
  $scope.filter = {transporterName:''}
  var today = new Date()
  $scope.vanData = {fns:[],date:today}
  $scope.visibleForDisplay = true

    $scope.getForwardingNotes = function(){

      kalapatruService.getForwardingNotesList($scope.filter.toDate,$scope.filter.fromDate,$scope.filter.transporterName,function(res){
        $scope.forwardingNotes = res
        console.log(res)
      },function(err){
        showMessage(err,'error')
      })
    }

  $scope.getDispatch = function(id){
    kalapatruService.getDispatch(id,function(res){
      $scope.vanData = res
      $scope.vanData.fns = res.forwardingNote

      console.log(res)
    },function(err){
      showMessage(err,'error')
    })

  }


    $scope.initData = function(){
      $scope.getForwardingNotes()
      var obj = $location.search()
      if(obj.id>0){
        $scope.getDispatch(obj.id)
      }
    }

  $scope.getDisplayNameforFn = function(fns){
    if(isBlank(fns.customer)){
      fns.customer = {}
    }
    return fns.id+ '  --' +fns.transporter.name +' - '+fns.customer.name+' - '+fns.customer.city+' - '+fns.marka
  }

  $scope.addToVanData = function(data){
    if(!$scope.vanData.name){
      data.isDisabled = false
      showMessage('Please enter Van Details first','error')
      return
    }
    if(isBlank($scope.vanData.vanNo)){
      data.isDisabled = false
      showMessage('Please enter Van Details first','error')
      return
    }

  if(data.isDisabled){
    $scope.vanData.fns.splice($scope.vanData.fns.indexOf(data),1)
    data.isDisabled = false
  }else{
    $scope.vanData.fns.splice(0,0,data)
    data.isDisabled = true
    }



  }

  $scope.showVanDataPopUp = function(){
    $scope.vanDataPopUP = true
    if(!$scope.vanData){
      $scope.vanData = {fns:[],date:today}
    }

    $scope.closeVanDataPopUp = function(){
      $scope.vanDataPopUP = false
    }
  }

  $scope.getFormattedDate = function(date){
    if(date instanceof Date){
      return date.toDateString()
    }
      return getFormatedDate(date)

  }

  var printVanData = function() {
    $scope.visibleForDisplay = false
    setTimeout(function(){
      html2canvas([ document.getElementById('vanDetails_id') ], {
        onrendered: function (canvas) {
          var myImage = canvas.toDataURL("image/png");
          var printWin = window.open('', '', 'width=340,height=260');
          printWin.moveTo(200, 100);
          printWin.document.write('<img src="' + myImage + '"/>');
          printWin.focus();
          printWin.print();
          printWin.close();
          $scope.visibleForDisplay = true
          return
        }

      })
    },500)

  }

  $scope.getBillValues = function(values){
    if(values == undefined){return 0}
    var values =values.split('+')
    var totalBillValue = 0;
    for(var i =0 ;i<values.length;i++){

      totalBillValue += parseInt(values[i])
    }
    return totalBillValue
  }

  $scope.getCompleteAddress = function(location){
    return getCompleteAddress(location)
  }


  $scope.printFn = function(eve,fn){

    $scope.currentFn = fn;
    console.log(fn)
    $('#pforwardingNote_id').show()
    var t =  setTimeout(function(){
      clearTimeout(t)
      html2canvas([ document.getElementById('forwardingNote_id') ], {
        onrendered: function (canvas) {
          var myImage = canvas.toDataURL("image/png");
          var printWin = window.open('', '', 'width=340,height=260');
          printWin.moveTo(200, 100);
          printWin.document.write('<img src="' + myImage + '"/>');
          printWin.focus();
          printWin.print();
          printWin.close();
          $('#pforwardingNote_id').hide()
          $scope.currentFn = {billDates:[]}
          $scope.$apply()
          return
        }

      })
    },500)
    return true
  }

  $scope.removeFN = function(fn){

    $scope.vanData.fns.splice($scope.vanData.fns.indexOf(fn),1)
    fn.isDisabled = false
    if($scope.vanData.id>0 && fn.id>0){
      for(var i=0;i<$scope.forwardingNotes.length;i++){
        var oFn = $scope.forwardingNotes[i]
        if(oFn.id == fn.id){
          //$scope.forwardingNotes.splice($scope.forwardingNotes.indexOf(oFn),1)
          oFn.isDispatched = false
          return

        }
      }
    }

  }

  $scope.getForwardingNote = function(){
    showLoadingBar()
    kalapatruService.getForwardingNote($scope.fnId,function(res){
      $scope.forwardingNotes = []
      $scope.forwardingNotes.push(res)
      hideLoadingBar()
    },function(er){

      showMessage(er,'error')
      hideLoadingBar()

    })
  }

  $scope.reset = function(){
    $scope.getForwardingNotes()
  }


  $scope.save = function(isPrint) {
    if(!$scope.vanData){
      showMessage('Please enter Van Details first','error')
      return
    }
    if(isBlank($scope.vanData.vanNo)){
      showMessage('Please enter Van Details first','error')
      return
    }



  showLoadingBar()
    var fNotes = []
    for (var i = 0; i < $scope.vanData.fns.length; i++) {
      fNotes.push($scope.vanData.fns[i].id)
    }
    kalapatruService.addOrUpdateDispatch(fNotes, $scope.vanData.vanNo, $scope.vanData.name, $scope.vanData.date, $scope.vanData.remarks,$scope.vanData.id, function (res) {
      hideLoadingBar()
      if (isPrint) {
        showMessage('Data Saved, Print preview is processing ', 'success')
        printVanData()


      }else{
        showMessage('Data Saved', 'success')
      }

      $scope.vanData = {fns:[],date:today}
      $scope.getForwardingNotes()
    }, function (err) {
      hideLoadingBar()
      showMessage('Could not save data , Please conatct admin', 'error')
    })

  }

}]);