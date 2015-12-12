'use strict'
var getCookie = function(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}



var toastrType = {}
toastrType['error'] = toastr.error
toastrType['success'] = toastr.success
toastrType['warning'] = toastr.warning
toastrType['info'] = toastr.info


var clearMessage = function(){
    toastr.clear()
}
var deleteCookie = function( name,path ) {
    if(path){

        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path='+path;
    }else{
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }


}

var serverDate = function(dateStr){
    var d = new Date(dateStr)
    return d.getDate()+'-'+(d.getMonth()+1)+'-'+ d.getFullYear()
}
var hideLoadingBar = function(){
    $('#loadingBar').remove()
}
var isBlank = function(val){
    if(val == undefined || val =='' || val==null){
        return true
    }
    return false
}

var showLoadingBar = function(){
    $('body').append('<div id="loadingBar" style="background:url(/com/images/whtTranspImg.png) repeat left top; width:100%; height:100%; position:fixed; top:0; left:0; z-index:9999; text-align:center;" ><img style="margin:300px 0 0;" src="/com/images/loadingImg.GIF" alt="" title="" /></div>')
}

var showMessage = function(mess,type,options){
    toastr.options = {hideDuration:0,showDuration:10,positionClass:'toast-top-full-width'}
    if(options){
        for( var key in options){
            toastr.options[key] = options[key]
        }

    }
    toastr.clear()
    toastrType[type](mess)
}

var getFormatedDate = function(dateStr){
    if(!dateStr)return ''
    var d = new Date(dateStr.replace(' ',"T"))
    return d.toDateString()
}

var  clone = function(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var getCompleteAddress = function(location){
    console.log(location)
    if(location == undefined){
        return 'NA'
    }
    var add = ""
    if(!isBlank(location.addressLine1)){
        add +=  location.addressLine1
    }
    if(!isBlank(location.addressLine2)){
        add +=  "," + location.addressLine2
    }
    if(!isBlank(location.city)){
        add +=  "-" + location.city
    }

    if(!isBlank(location.state)){
        add +=  "-" + location.state
    }
    if(!isBlank(location.country)){
        add +=  "-" + location.country
    }

    if(!isBlank(location.zipCode)){
        add +=  "-" + location.zipCode
    }
    if(isBlank(add)){
        return 'NA'
    }
    return add;
}