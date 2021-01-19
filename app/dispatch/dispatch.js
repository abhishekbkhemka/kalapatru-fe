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
  $scope.viewName  = 'grid'

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
  var initVanAutoComplete = function(){
    $("#t_van_id").autocomplete({
          minLength: 1,
          source: $scope.vans,
          focus: function (event, ui) {
            return true;
          },
          select: function (ev, ui) {
            $scope.vanData.vanNo = ui.item.vanNo
            $scope.vanData.name = ui.item.name
            $scope.$apply()
            return false
          }
        })
        .autocomplete("instance")._renderItem = function (ul, item) {
      $(ul).addClass('autoCompTxtmine')
      $(ul).addClass('autoCompDis')
      return $("<li class='autoCompTxtouter'>")
          .append("<a class='autoCompTxt'>" + item.label + "</a>")
          .appendTo(ul);
    };

  }


    $scope.initData = function(){
      $scope.getForwardingNotes()
      var obj = $location.search()
      if(obj.id>0){
        $scope.getDispatch(obj.id)
      }
      kalapatruService.getVans(function(res){
        $scope.vans = res
        console.log($scope.vans)
        initVanAutoComplete()
      })
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

    $scope.printFn = function(eve,fn)
    {

        var divToPrint=document.getElementById('forwardingNote_id');
        $('#id_company_name').html(fn.company.name)
        $('#id_company_code').html('('+fn.company.code+')')
        $('#id_add_div').html(getCompleteAddress(fn.company))
        $('#id_tax').html("VAT :"+ fn.company.vat+ "   GST :"+fn.company.cst_or_tin)
        $('#id_serial').html(fn.id)
        $('#id_fd').html(new Date(fn.fnDate).toDateString())
        $('#id_trans').html(fn.transporter.name)
        $('#id_trans_station').html(fn.transporterStation)
        $('#id_customer_name').html(fn.customer.name)
        $('#id_customer_city').html(fn.customer.city)
        $('#id_billno').html(fn.billNo)
        $('#id_bill_value').html(getBillValues(fn.billValues))
        $('#id_bill_date').html(fn.billDates)
        if(fn.regularCases  && fn.bigCases)
        $('#id_cases').html(fn.cases+ '(R-'+fn.regularCases +' B-'+fn.bigCases+')')
        else if (fn.regularCases)
            $('#id_cases').html(fn.cases+ '(R-'+fn.regularCases+')')
        else if (fn.bigCases)
            $('#id_cases').html(fn.cases+ '(B-'+fn.bigCases+')')
        else
            $('#id_cases').html(fn.cases)
        $('#id_marka').html(fn.marka)
        $('#id_permit').html(fn.permitNo)
        $('#id_commodity').html(fn.commodity)

        var newWin=window.open('','Print-Window');

        newWin.document.open();

        newWin.document.write('<head> <link rel="stylesheet" href="/com/css/style.css"></head><html><body onload="window.print()">'+divToPrint.innerHTML+'</body></html>');

        newWin.document.close();

        setTimeout(function(){newWin.close();},10);
        // $scope.currentFn = {billDates:[]}
        // $scope.$apply()

    }


  $scope.printFna = function(eve,fn){

    $scope.currentFn = fn;
    console.log(fn)
    $('#pforwardingNote_id').show()
    var t =  setTimeout(function(){
      clearTimeout(t)
      html2canvas([ document.getElementById('forwardingNote_id') ], {
	useCORS: true,
	allowTaint: false,
	letterRendering: true,
	logging:true,
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
    },1000)
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

  $scope.showMe = function(viewName){
    $scope.viewName = viewName
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
