'use strict';

angular.module('myApp.forwardingNote', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/forwardingNote', {
    templateUrl: 'forwardingNote/forwardigNote.html',
    controller: 'ForwardingNoteCtrl'
  });
}])

.controller('ForwardingNoteCtrl', ['$scope','kalapatruService',function($scope,kalapatruService) {
  $scope.transporters = []
  $scope.transportersStations = []
  $scope.customers = []
  $scope.totalBillValue = 0;
    var today = new Date()
    $scope.currentFn = {fnDate:today,billDates:[],billDate:today}
    $scope.billDates = []

    var transporterStationAutoComplete = function(){
        $("#t_station_id").autocomplete({
                minLength: 1,
                source: $scope.transportersStations,
                focus: function (event, ui) {
                    return true;
                },
                select: function (ev, ui) {
                    $scope.currentFn.transporterStation = ui.item.city
                    $scope.$apply()
                    return false
                }
            })
            .autocomplete("instance")._renderItem = function (ul, item) {
            $(ul).addClass('autoCompTxtmine')
            return $("<li class='autoCompTxtouter'>")
                .append("<a class='autoCompTxt'>" + item.label + "</a>")
                .appendTo(ul);
        };
    }

    $scope.addBillDate = function(){
        if($scope.currentFn.billDate == undefined){
            showMessage('Please select date','error')
            return
        }
        $scope.currentFn.billDates.push(serverDate($scope.currentFn.billDate))
        $scope.currentFn.billDate = undefined
    }

var initTransporter = function(){


  //$("#transporter_name_id").autocomplete({
  //      minLength: 1,
  //      source: $scope.transporters,
  //      focus: function (event, ui) {
  //        return true;
  //      },
  //      select: function (ev, ui) {
  //        $scope.currentFn.transporter = ui.item
  //          $scope.isTransporterDisabled = true
  //
  //          $scope.transportersStations = $scope.currentFn.transporter.stations
  //          transporterStationAutoComplete()
  //        //$scope.selectedTransporter =ui.item
  //        $scope.$apply()
  //        return false
  //      }
  //    })
  //    .autocomplete("instance")._renderItem = function (ul, item) {
  //  $(ul).addClass('autoCompTxtmine')
  //  return $("<li class='autoCompTxtouter'>")
  //      .append("<a class='autoCompTxt'>" + item.label + "</a>")
  //      .appendTo(ul);
  //};


}



  var initCustomer = function(){


    $("#customer_name_id").autocomplete({
          minLength: 1,
          source: $scope.customers,
          focus: function (event, ui) {
            return true;
          },
          select: function (ev, ui) {
            $scope.currentFn.customer = ui.item
              $scope.isCustomerDisabled = true
            //$scope.selectedTransporter =ui.item
            $scope.$apply()
            return false
          }
        })
        .autocomplete("instance")._renderItem = function (ul, item) {
      $(ul).addClass('autoCompTxtmine')
      return $("<li class='autoCompTxtouter'>")
          .append("<a class='autoCompTxt'>" + item.label + "</a>")
          .appendTo(ul);
    };
  }

    $scope.initData  = function(){
        kalapatruService.getTrasporterList(function(res){
            $scope.transporters = res
            initTransporter()
        },function(err){

        })

        kalapatruService.getCustomersList(function(res){
            $scope.customers = res
            initCustomer()
        },function(err){

        })

        kalapatruService.getSettings(function(res){
            $scope.companies = res.companies
            $scope.commodities = res.commodities
            $scope.transportersStations = res.stations
        },function(err){

        })
    }



  $scope.calculateBillValue = function(){
      if($scope.currentFn.billValues == undefined){return 0}
    var values = $scope.currentFn.billValues.split('+')
    $scope.totalBillValue = 0;
    for(var i =0 ;i<values.length;i++){

      $scope.totalBillValue += parseInt(values[i])
    }
      return $scope.totalBillValue
  }

    var printFNData = function() {
        $('#pforwardingNote_id').show()

       var t =  setTimeout(function(){
           $scope.$apply()
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
                   $scope.currentFn = {fnDate:today,billDates:[],billDate:today}
                   $scope.$apply()
                   return
               }

           })
        },500)

    }

    $scope.clearTransporter = function(){
        $scope.isTransporterDisabled = false
        $scope.currentFn.transporter = {}
    }

    $scope.clearCustomer = function(){
        $scope.isCustomerDisabled = false
        $scope.currentFn.customer = {}
    }
    $scope.removeBillDates = function(dt){
        $scope.currentFn.billDates.splice($scope.currentFn.billDates.indexOf(dt),1)
    }

  $scope.addForwardingNote = function(isPrint){
      if(isBlank($scope.currentFn.fnDate)){
          showMessage('Please enter forwarding date ','error')

          $scope.isNotFnDate = true
          return
      }
      if(isBlank($scope.currentFn.transporter)){
          showMessage('Please enter transporter details','error')
          $scope.isNotTransporter = true
          return
      }

      if(isBlank($scope.currentFn.transporter.id)){
          showMessage('Please enter transporter name','error')
          $scope.isNotTransporter = true
          return
      }
      if(isBlank($scope.currentFn.transporterStation)){
          showMessage('Please enter transporter city','error')
          $scope.isNotTransporter = true
          return
      }

      if(isBlank($scope.currentFn.customer)){
          showMessage('Please enter party details','error')
          $scope.isNotCustomer = true
          return
      }

      if(isBlank($scope.currentFn.customer.name)){
          showMessage('Please enter party name','error')
          $scope.isNotCustomer = true
          return
      }

      if(isBlank($scope.currentFn.customer.city)){
          showMessage('Please enter party station','error')
          $scope.isNotCustomer = true
          return
      }
      if(isBlank($scope.currentFn.billValues)){
          showMessage('Please enter bill value ','error')
          $scope.isNotBillValue = true
          return
      }

      if(isBlank($scope.currentFn.cases)){
          showMessage('Please enter cases  ','error')
          $scope.isNotCases = true
          return
      }
      if(isBlank($scope.currentFn.marka)){
          showMessage('Please enter private marka  ','error')
          $scope.isNotMarka = true
          return
      }
    showLoadingBar()
    kalapatruService.addForwardingNote($scope.currentFn,function(res){
        if(isPrint){
            $scope.currentFn = res

            printFNData()
        }else{
            $scope.currentFn = {fnDate:today,billDates:[],billDate:today}

        }
        $scope.totalBillValue = 0
        showMessage('Forwarding Note Saved','success')
        $scope.afterSaveMessage = "Your last forwarding save with id: "+res.id

      hideLoadingBar()
    },function(err){
      showMessage(err,'error')
        hideLoadingBar()
    })
  }

    $scope.getCompleteAddress = function(location){
       return getCompleteAddress(location)
    }

}]);