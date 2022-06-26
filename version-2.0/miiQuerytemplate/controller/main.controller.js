sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function(Controller,JSONModel) {
    'use strict';
    return Controller.extend("app.controller.main",{
        onInit:function(){
            var oModel = new JSONModel(sap.ui.require.toUrl("app/model/pageHeaderTab.json"));
			this.getView().setModel(oModel);
        },
        onItemSelect: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
		}
    })
    
});