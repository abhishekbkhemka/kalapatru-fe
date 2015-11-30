'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('myApp', [
  'ngRoute',
  'myApp.forwardingNote',
  'myApp.dispatch','kalapatru.factory',
  'myApp.version'
])

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/forwardingNote'});
}]);

app.filter('daterange', function ()
{
  return function(conversations, start_date, end_date)
  {
    var result = [];

    // date filters
    var start_date = (start_date && !isNaN(Date.parse(start_date))) ? Date.parse(start_date) : 0;
    var end_date = (end_date && !isNaN(Date.parse(end_date))) ? Date.parse(end_date) : new Date().getTime();
    console.log(end_date)
    // if the conversations are loaded
    if (conversations && conversations.length > 0)
    {
      $.each(conversations, function (index, conversation)
      {
        var conversationDate = new Date(conversation.fnDate);
        if (conversationDate >= start_date && conversationDate <= end_date)
        {
          result.push(conversation);
        }
      });

      return result;
    }
  };
});