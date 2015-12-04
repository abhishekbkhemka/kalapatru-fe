var app = angular.module('kalapatru.factory', [])

app.factory('kalapatruService', ['$http',function($http) {
    var obj = {}

    obj.getTrasporterList = function(successCB,failCB){
        $http.get(GET_TRASPORTERS).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.getCustomersList = function(successCB,failCB){
        $http.get(GET_CUSTOMERS).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.getForwardingNotesList = function(toDate,fromDate,transporterName,successCB,failCB){
        var params = '?transporterName='+transporterName
        if (toDate){
            params+='&toDate='+serverDate(toDate)
        }
        if (fromDate){
            params+='&fromDate='+serverDate(fromDate)
        }
        $http.get(FORWARDING_NOTES+params).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.getDispatch = function(id,successCB,failCB){
        var params = '?id='+id
        $http.get(DISPATCH+params).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.addForwardingNote = function(forwardinNote,successCB,failCB){
        var params = {fnDate:serverDate(forwardinNote.fnDate),billValues:forwardinNote.billValues,billNo:forwardinNote.billNumber
        ,cases:forwardinNote.cases,marka:forwardinNote.marka,permitNo:forwardinNote.permitNo,comments:forwardinNote.comments,company:forwardinNote.company,transporterStation:forwardinNote.transporterStation}
        if(forwardinNote.transporter.id){
            params.transporter_id = forwardinNote.transporter.id
        }else{
            params.transporter = forwardinNote.transporter
        }

        if(forwardinNote.customer.id){
            params.customer_id = forwardinNote.customer.id
        }else{
            params.customer = forwardinNote.customer
        }
        if(forwardinNote.billDates){
           params.billDates = forwardinNote.billDates
        }
        $http.post(FORWARDING_NOTE,params).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.addOrUpdateDispatch = function(forwardinNotes,vanNo,vanDriver,vanDate,vanRemarks,id,successCB,failCB){
        if(vanDate){
            vanDate = serverDate(vanDate)
        }else{
            vanDate = new Date()
            vanDate = serverDate(vanDate.toDateString())
        }
        var params = {date:vanDate,vanNo:vanNo,name:vanDriver,remarks:vanRemarks,forwardingNotes:forwardinNotes}
        var httpCall = $http.post
        if(id){
            params.id = id
            httpCall = $http.put
        }

        httpCall(DISPATCH,params).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }

    obj.getDispatches = function(fromDate,toDate,successCB,failCB){
           var  params ='?fromDate='+serverDate(fromDate)
        if (toDate){
            params +='&toDate='+serverDate(toDate)
        }

        $http.get(DISPATCHES+params).success(function(response){
            successCB(response);

        }).error(function(err,code){
            var errMessage = 'Server Error'
            if(code == HTTP_401 || code == HTTP_403){
                errMessage = err
            }

            if(failCB){
                failCB(errMessage)
            }
        })
    }



    return obj


}])