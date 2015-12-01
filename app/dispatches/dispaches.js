'use strict';

angular.module('myApp.dispatches', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/dispatches', {
            templateUrl: 'dispatches/dispatches.html',
            controller: 'DispatchesCtrl'
        });
    }])

    .controller('DispatchesCtrl', ['$scope','kalapatruService',function($scope,kalapatruService) {
        $scope.dispacthes = []

        $scope.getDispatches = function(fromDate,toDate){
            showLoadingBar()
            kalapatruService.getDispatches(fromDate,toDate,function(res){
                hideLoadingBar()
                $scope.dispacthes = res

            },function(err){
                showMessage(err)
                hideLoadingBar()
            })
        }

        $scope.getFormattedDate = function(date){
            if(date instanceof Date){
                return date.toDateString()
            }
            return getFormatedDate(date)

        }

        $scope.showDispatch = function(dis){

            $scope.isDispatchView = true
            $scope.currentDispatch  = dis
        }

        $scope.closeDispatch = function(dis){

            $scope.isDispatchView = false
            $scope.currentDispatch  = {}
        }

        $scope.print = function(){
            $('#print_btn_id').hide()
            $('#close_btn_id').hide()
            html2canvas([ document.getElementById('vanDetails_id') ], {
                onrendered: function (canvas) {
                    var myImage = canvas.toDataURL("image/png");
                    var printWin = window.open();
                    //printWin.moveTo(200, 100);
                    printWin.document.write('<img src="' + myImage + '"/>');
                    printWin.focus();
                    printWin.print();
                    printWin.close();
                    $('#print_btn_id').show()
                    $('#close_btn_id').show()
                    return
                }

            })
        }


    }])