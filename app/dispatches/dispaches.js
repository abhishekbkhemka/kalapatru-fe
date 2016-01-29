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
                $scope.dispacthes = res.reverse()

            },function(err){
                showMessage(err)
                hideLoadingBar()
            })
        }
        $scope.filterFromDate = new Date()
        $scope.filterToDate = new Date()

        $scope.getFormattedDate = function(date){
            if(date instanceof Date){
                return date.toDateString()
            }
            return getFormatedDate(date)

        }
        $scope.initData = function(){
            $scope.getDispatches($scope.filterFromDate,$scope.filterToDate)
        }

        $scope.showDispatch = function(dis){
            $scope.arangeDataForPrint(dis)
            $scope.isDispatchView = true
            $scope.currentDispatch  = dis
        }

        $scope.closeDispatch = function(dis){

            $scope.isDispatchView = false
            $scope.currentDispatch  = {}
        }

        $scope.getTotalCase = function(cd){
            var fns = cd.forwardingNote
            var tc = 0
            for(var i=0;i<fns.length;i++){
                var cases = parseInt(fns[i].cases)
                if(!isNaN(cases))
                tc +=cases
            }
            return tc
        }


        $scope.arangeDataForPrint = function(dispatch){
            if(dispatch.isRendered){
                return
            }
            var fnMap = {}
            var fns =[]
            for(var i=0;i<dispatch.forwardingNote.length;i++){
                var fn = dispatch.forwardingNote[i]

                if(fnMap[fn.transporter.name]==undefined){
                    fnMap[fn.transporter.name] = {ar:[fn,],totalCases:parseInt(fn.cases)}
                    //fns.push(fn)
                }else{
                    fnMap[fn.transporter.name].ar.push(fn)
                    fnMap[fn.transporter.name].totalCases +=parseInt(fn.cases)
                }
            }
            console.log(fnMap)

            for(var obj in fnMap ){
                //console.log(obj)
                var fn=fnMap[obj]
                console.log(fn)
                fn.ar.push({isCases:true,totalCases: fn.totalCases,receiver:"RECEIVER :"})
                fns = fns.concat(fn.ar)
            }

            console.log(fns)

            dispatch.forwardingNote=fns
            dispatch.isRendered = true
        }

        $scope.print = function(){
            $("#dischsTblouter").removeAttr("style")


            //$("#dischsTblouter").addClass("printClass")

            $('#print_btn_id').hide()
            $('#close_btn_id').hide()

            $('.id_date_th').hide()
            $('.id_date_td').hide()

            $('.id_bill_th').hide()
            $('.id_bill_td').hide()

            $('.id_bdate_th').hide()
            $('.id_bdate_td').hide()

            $('.id_value_th').hide()
            $('.id_value_td').hide()

            $('.id_permit_th').hide()
            $('.id_permit_td').hide()

            $('.id_id_th').hide()
            $('.id_id_td').hide()

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
                        //printWin.document.write("<img class='printClass'  src='" + myImage + "'/>");
                        var div = '<head><link rel="stylesheet" href="/com/css/style.css"></head><body><div>'
                        div +=document.getElementById('vanDetails_id').innerHTML+'</div></body>'
                        printWin.document.write(div)
                        printWin.focus();
                        printWin.print();
                        printWin.close();
                        $('#dischsTblouter').css({'overflow-y':'auto', 'height':'240px'})
                        $('#print_btn_id').show()
                        $('#close_btn_id').show()
                        $('.id_date_th').show()
                        $('.id_date_td').show()
                        $('.id_bill_th').show()
                        $('.id_bill_td').show()
                        $('.id_bdate_th').show()
                        $('.id_bdate_td').show()
                        $('.id_value_th').show()
                        $('.id_value_td').show()
                        $('.id_permit_th').show()
                        $('.id_permit_td').show()
                        $('.id_id_th').show()
                        $('.id_id_td').show()
                        $scope.$apply()
                        return
                    }

                })
            },500)

        }


    }])