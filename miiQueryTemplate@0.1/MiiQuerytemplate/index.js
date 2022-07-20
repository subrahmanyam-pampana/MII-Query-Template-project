sap.ui.define([
    "sap/m/Text",
    "sap/ui/core/mvc/XMLView"
], function(Text,XMLView) {
    'use strict';

//clearing the cache when app version changes
$.ajax({
url: "./model/appVersion.json?" +"&__=" +new Date().getTime(),
method:"POST",
async:false,
success:function(data){
  function reloadPage() {
    var proxied = window.XMLHttpRequest.prototype.open
    window.XMLHttpRequest.prototype.open = function () {
      var url = arguments[1]
      if (url.indexOf("?") == -1) {
        url = url + "?"
      }
      arguments[1] = url + "&_TheAppVersion=" + data.appVersion
      return proxied.apply(this, [].slice.call(arguments))
    }
  }

  if(localStorage['QueryTemplate_appVersion']){
      if(localStorage['QueryTemplate_appVersion']!=data.appVersion){
 	localStorage['QueryTemplate_appVersion'] = data.appVersion
  	reloadPage()
	}
  }else{
    localStorage['QueryTemplate_appVersion'] = data.appVersion
    reloadPage()
  }
}

})

//creating root view
   XMLView.create({
       viewName:"app.view.main",
       id:"root"
   }).then(function(oview){
       oview.placeAt("content")
   })
});
