'use strict'

var PROD = 'http://ec2-54-169-108-233.ap-southeast-1.compute.amazonaws.com:8000/'
var DEV = 'http://127.0.0.1:8080/'
var CURRENT = DEV;
var GET_TRASPORTERS = CURRENT+'api/transporters/'
var GET_CUSTOMERS = CURRENT+'api/customers/'
var FORWARDING_NOTE = CURRENT+'api/forwardingNote/'
var FORWARDING_NOTES = CURRENT+'api/forwardingNotes/'
var DISPATCH = CURRENT+'api/dispatch/'
var HTTP_401 = 401
var HTTP_403 = 403