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
        $scope.visibleForDisplay = true

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
            $scope.visibleForDisplay = false
            //$("#dischsTblouter").removeAttr("style")
            $('#print_btn_id').hide()
            $('#close_btn_id').hide()

            setTimeout(function(){
                //var scaledElement = $("#vanDetails_id").clone().css({
                //    'transform': 'scale(3,3)',
                //    '-ms-transform': 'scale(3,3)',
                //    '-webkit-transform': 'scale(3,3)'
                //});
                //var oldWidth = scaledElement.width();
                //var oldHeight = scaledElement.height();
                //
                //var newWidth = 1000// oldWidth * (1/3);
                //var newHeight = 1000//oldHeight * (1/3);
                //html2canvas(document.getElementById('vanDetails_id'), {
                //    onrendered: function(canvasq) {
                //        var w=window.open();
                //        //w.document.write("<h3 style='text-align:center;'>"+ReportTitle+"</h3>");
                //        w.document.write("<img width='"+newWidth+"' height='"+newHeight+"' src='"+canvasq.toDataURL()+"' />");
                //        w.print();
                //    }
                //});

                //console.log(oldHeight)
                //console.log(newWidth)

                html2canvas([ document.getElementById('vanDetails_id') ], {
                    onrendered: function (canvas) {
                        var myImage = canvas.toDataURL("image/png");
                        var printWin = window.open();
                        //printWin.moveTo(200, 100);
                        printWin.document.write("<img  src='" + myImage + "'/>");
                        printWin.focus();
                        printWin.print();
                        printWin.close();
                        $('#print_btn_id').show()
                        $('#close_btn_id').show()
                        $scope.visibleForDisplay = true
                        $scope.$apply()
                        return
                    }

                })
            },500)

        }


    }])