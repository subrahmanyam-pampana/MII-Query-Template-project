sap.ui.define([
    "sap/m/Text",
    "sap/ui/core/mvc/XMLView"
], function(Text,XMLView) {
    'use strict';
    
   XMLView.create({
       viewName:"app.view.App"
   }).then(function(oview){
       oview.placeAt("content")
   })
});
