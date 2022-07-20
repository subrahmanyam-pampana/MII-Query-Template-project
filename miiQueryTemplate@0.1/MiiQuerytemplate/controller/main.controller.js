sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"app/utils/util"

], function(Controller,JSONModel,Fragment,utiljs) {
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
,
   		onInfoButtonPress:function(oEvent){
			var oButton = oEvent.getSource(),
				oView = this.getView();
			 //alert("btn pressed")

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "app.view.InfoPopOver",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					var oDocData = loadLocalResource("./model/documentation.json")
					var docModel = new JSONModel(oDocData)
					oPopover.setModel(docModel)
					return oPopover;
				});
			}
			this._pPopover.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
}
//code ends here
    })
    
});
