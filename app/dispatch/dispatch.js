'use strict';

angular.module('myApp.dispatch', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dispatch', {
    templateUrl: 'dispatch/dispatch.html',
    controller: 'DispatchCtrl'
  });
}])

.controller('DispatchCtrl', ['$scope','kalapatruService',function($scope,kalapatruService) {

  $scope.forwardingNotes = []
  $scope.filter = {transporterName:''}
  $scope.vanData = undefined

    $scope.getForwardingNotes = function(){

      kalapatruService.getForwardingNotesList($scope.filter.toDate,$scope.filter.fromDate,$scope.filter.transporterName,function(res){
        $scope.forwardingNotes = res
        console.log(res)
      },function(err){
        showMessage(err,'error')
      })
    }

    $scope.initData = function(){
      $scope.getForwardingNotes()
    }

  $scope.getDisplayNameforFn = function(fns){
    return fns.transporter.name +' - '+fns.customer.name+' - '+fns.customer.city+' - '+fns.marka//+' - '+getFormatedDate(fns.fnDate)
  }

  $scope.addToVanData = function(data){
    if(!$scope.vanData){
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
      $scope.vanData = {fns:[]}
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
    html2canvas([ document.getElementById('vanDetails_id') ], {
      onrendered: function (canvas) {
        var myImage = canvas.toDataURL("image/png");
        var printWin = window.open('', '', 'width=340,height=260');
        printWin.moveTo(200, 100);
        printWin.document.write('<img src="' + myImage + '"/>');
        printWin.focus();
        printWin.print();
        printWin.close();
        return
      }

    })
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
    kalapatruService.addDispatch(fNotes, $scope.vanData.vanNo, $scope.vanData.vanDriverName, $scope.vanData.vanDate, $scope.vanData.vanRemarks, function (res) {
      hideLoadingBar()
      if (isPrint) {
        showMessage('Data Saved, Print preview is processing ', 'success')
        printVanData()


      }else{
        showMessage('Data Saved', 'success')
      }

      $scope.vanData = {fns:[]}
      $scope.getForwardingNotes()
    }, function (err) {
      hideLoadingBar()
      showMessage('Could not save data , Please conatct admin', 'error')
    })

  }

}]);