sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/xml/XMLModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/MessageBox",
    "app/utils/util",
    "app/utils/uiTable",
    "app/utils/parameterlogic",
  ],
  function (
    Controller,
    MessageToast,
    JSONModel,
    XMLModel,
    Filter,
    FilterOperator,
    Dialog,
    MessageBox,
    utiljs,
    uiTableUtil,
   parameterlogic
  ) {
    "use strict";
    var oviews;
    var mdoQT = loadLocalResource("./model/mdoBLSQueries.json");
    var userData ;
    var credentialsString;
    var serversList = loadLocalResource("./model/servers.json");

    return Controller.extend("app.controller.mdotemplate", {
      onInit: function () {
        var that = this;
        //if credetial exist then load from local storage
         if(localStorage["userCredentials"]!==undefined){
          userData = JSON.parse(localStorage["userCredentials"]);
          credentialsString = `IllumLoginName=${userData.userName}&IllumLoginPassword=${userData.password}`;
         }
        
        oviews = {
          serverView: that.byId("idServersList"),
          projectsListView: that.byId("idProjectsList"),
          mdoView: that.byId("idMdoList"),
          attributesView: that.byId("idAttributeList"),
          filterTextArea: that.byId("idFilterTextArea"),
          sortTextArea: that.byId("idSortTextArea"),
          parameterTable: that.byId("idParametersTable"),
          displayTableView: that.byId("idDisplayTable"),
          typedParamsCheckBox: that.byId("idUseTypedParamCheckBox"),
        };

        oviews.serverView.setModel(new JSONModel(serversList));
       //enabling parameters
        var parameterData = loadLocalResource("./model/parameterData.json");
        oviews.parameterTable.setModel(new JSONModel(parameterData));
      },
      onAfterRendering: function () {
        this.enableAutoComplete();
        this.setKeyboardShortcuts()
      },
      onServerSelectionChange: function (oEvent) {
        let selectedServer = oEvent.getSource().getSelectedItem().getKey();
        let that = this;

        if(localStorage["userCredentials"]!==undefined && userData===undefined){
          userData = JSON.parse(localStorage["userCredentials"]);
          credentialsString = `IllumLoginName=${userData.userName}&IllumLoginPassword=${userData.password}`;
         }
        //resetting lists
        oviews.projectsListView.setModel(new XMLModel());
        oviews.mdoView.setModel(new JSONModel({}),"mdoModel");
        oviews.attributesView.setModel(new JSONModel({}));

        oviews.projectsListView.setBusy(true);

        try {
          $.ajax({
            url: `${serversList.servers[0].url}/XMII/Runner?Transaction=${mdoQT.transactions.getFileListTransaction}&OutputParameter=*&Content-Type=text/xml`,
            method: "GET",
            data: {
              webService: `${selectedServer}${mdoQT.ws.projectList}&Content-Type=text/xml&${credentialsString}`,
            },
            success: function (oData) {
              oviews.projectsListView.setModel(new XMLModel(oData));
              oviews.projectsListView.setBusy(false);
            },
            error: function (error) {
              MessageBox.error(`Error might be due to server unavailability.
              status Text: ${error.statusText}, response Text: ${error.responseText}`);
              oviews.projectsListView.setBusy(false);
            },
          });
        } catch (error) {
          MessageBox.error(error.message)
          oviews.projectsListView.setBusy(false);
        }
      },
      onProjectSelectionChange: function (oEvent) {
        var that = this;
        let selectedServer = oviews.serverView.getSelectedItem().getKey();
        let selectedProject =
          oEvent.getParameters("item").item.getKey() + "/MIIOBJ";
        //reset the list models
        oviews.mdoView.setModel(new JSONModel({}),"mdoModel");
        oviews.attributesView.setModel(new JSONModel({}));
        oviews.mdoView.setBusy(true);
        try {
          $.ajax({
            url: `${serversList.servers[0].url}/XMII/Runner?Transaction=${mdoQT.transactions.getMDOList}&OutputParameter=*&Content-Type=text/json`,
            method: "GET",
            data: {
              server:selectedServer,
              I_folderPath:selectedProject,
              credentialString:credentialsString
            },

            success: function (oData) {
              oviews.mdoView.setModel(new JSONModel(oData.folders.folder),"mdoModel");
              oviews.mdoView.setBusy(false);
            },
            error: function (error) {
              MessageBox.error(error.statusText)
              oviews.mdoView.setBusy(false);
            },
          });
        } catch (error) {
          MessageBox.error(error.message)
          oviews.mdoView.setBusy(false);
        }
      },
      mdoListFactoryFunction:function(sId,oContext){
        var fileType = oContext.getProperty("type");
        var icon = "";
        if (fileType === "folder") {
          icon = "sap-icon://folder-blank"
        } else {
          icon = "sap-icon://database"
        }

        return new sap.m.StandardTreeItem({
          title: "{mdoModel>name}",
          icon: icon,
          type: "Active",
        });
      },
      loadMdoList: function (oEvent) {
        let selectedServer = oviews.serverView.getSelectedItem().getKey();
        var ctx = oEvent.getParameter("itemContext");
        var folderPath = ctx.getObject().path;
        var sPath = ctx.getPath();
        var tree = oEvent.getSource();
        var oModel = tree.getModel("mdoModel");
        var expanded = oEvent.getParameter("expanded");
        if (!expanded) {
          return;
        }
        

        tree.setBusy(true);
        $.ajax({
          url: `${serversList.servers[0].url}/XMII/Runner?Transaction=${mdoQT.transactions.getMDOList}&OutputParameter=*&Content-Type=text/json`,
          data:{
            server:selectedServer,
            I_folderPath:folderPath,
            credentialString:credentialsString
          },
          success: function (oData) {
            oModel.setProperty(sPath + "/folder", oData.folders.folder);
            tree.setBusy(false);
          },
          error: function (error) {
            MessageBox.error(error.statusText);
            tree.setBusy(false);
          },
        });
      },
      onMDOSelectChange: function (oEvent) {
        let that = this;
        let selectedServer = oviews.serverView.getSelectedItem().getKey();
       // let selecetedItem = oEvent.getParameters("item").item;
        let selecetedItem = oEvent.getParameter("listItem");
        var selectedObject = selecetedItem.getBindingContext("mdoModel").getObject();
        if(selectedObject.type=="folder"){
          return;
        }

        let mdoPath = selectedObject.path.replaceAll(".mdop", "");
        //reset to default
        oviews.attributesView.setModel(new JSONModel({}));
        oviews.attributesView.setBusy(true);
        try {
          $.ajax({
            url: `${serversList.servers[0].url}/XMII/Runner?Transaction=${mdoQT.transactions.MDOTransaction}&OutputParameter=*&Content-Type=text/json`,
            data: {
              MDO: mdoPath,
              url: `${selectedServer}/XMII/Illuminator?QueryTemplate=${mdoQT.queries.mdoQry}&Content-Type=text/json&${credentialsString}`,
              Mode: "AttributeList",
            },
            method: "GET",
            success: function (oData) {
              oviews.attributesView.setModel(new JSONModel(oData));
              oviews.attributesView.setBusy(false);
              that.enableAutoComplete();
            },
            error: function (error) {
              MessageBox.error(error.statusText);
              oviews.attributesView.setBusy(true);
            },
          });
        } catch (error) {
          MessageBox.error(error.message)
          oviews.attributesView.setBusy(true);
        }
      },
      onProjectSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter(
            "FolderName",
            FilterOperator.Contains,
            sQuery
          );
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idProjectsList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      onMDOSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter(
            "name",
            FilterOperator.Contains,
            sQuery
          );
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idMdoList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      onAttributeSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter("Name", FilterOperator.Contains, sQuery);
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idAttributeList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      getNumOfRows: function (oRows) {
        return oRows && Array.isArray(oRows) ? oRows.length : 0;
      },
      tableFactoryFunction: function (sId, oContext) {
        var columnName = oContext.getObject().Name;
        return new sap.ui.table.Column({
          width: "11rem",
          filterProperty: columnName,
          label: columnName,
          template: new sap.m.Text({
            text: `{${columnName}}`,
            wrapping: false,
          }),
          sortProperty: columnName,
        });
      },
      onAttributeDrop: function (oEvent) {
        var draggedItem = oEvent.getParameter("draggedControl");
        var droppedArea = oEvent.getParameter("droppedControl");
        var attributeName = `[${draggedItem
          .getContent()[0]
          .getAggregation("items")[0]
          .getText()}]`;
        this.insertToTextArea(attributeName, droppedArea);
      },
      insertToTextArea: function (newQuery, textArea) {
        var query = textArea.getValue();
        var cursorPos = $("#" + textArea.getId())
          .find("textarea")
          .prop("selectionStart");

        query = `${query.slice(0, cursorPos)}${newQuery}${query.slice(
          cursorPos
        )}`;
        textArea.setValue(query);
      },
      onParameterDrop: function (oEvent) {
        var draggedItem = oEvent.getParameter("draggedControl");
        var droppedArea = oEvent.getParameter("droppedControl");
        var parameterName = `[${
          draggedItem.getBindingContext().getObject().parameter
        }]`;
        this.insertToTextArea(parameterName, droppedArea);
      },
      enableAutoComplete: function () {
        var that = this;
        var oQueryView = oviews.filterTextArea;
        var jQueryTextArea = jQuery("#" + oQueryView.getId()).find("Textarea");
        jQueryTextArea.textcomplete([
          {
            // #1 - Regular experession used to trigger search
            match: /(\b(\w+))$/i, // --> triggers search for every char typed

            // #2 - Function called at every new key stroke
            search: function (query, fnCallback) {
              var oResult = oviews.attributesView.getModel().getData();
              fnCallback(
                oResult.Rowsets.Rowset[0].Row.filter(function (oRecord) {
                  // filter results based on query
                  return oRecord.Name.toUpperCase().includes(
                    query.toUpperCase()
                  );
                })
              );
            },

            // #3 - Template used to display each result (also supports HTML tags)
            template: function (hit) {
              // Returns the highlighted version of the name attribute
              return hit.Name;
            },

            // #4 - Template used to display the selected result in the textarea
            replace: function (hit) {
              return "[" + hit.Name + "]";
            },
          },
        ]);
      },
      executeQuery: function () {
        let that = this;
        let selectedServer = oviews.serverView.getSelectedItem().getKey();
        let selecetedmdo = oviews.mdoView.getSelectedItem();
        let selectedMdoObject  = selecetedmdo.getBindingContext("mdoModel").getObject()
        var attributes = [];

       
        var paramModel = oviews.parameterTable.getModel().getData();
       var selectedParamData = parameterlogic.getParameterString(paramModel,oviews.typedParamsCheckBox.getSelected())

        try {
          oviews.attributesView.getSelectedItems().forEach((item) => {
            attributes.push(
              `[${item.getContent()[0].getAggregation("items")[0].getText()}]`
            );
          });
        } catch (error) {
          MessageBox.error(error.statusText);
          return;
        }

        attributes = attributes.join();
        if (attributes == "" || attributes === undefined) {
          MessageBox.error("No Attributes Selected");
          return;
        }
        oviews.displayTableView.setBusy(true);
        var data = {
          MDO: selectedMdoObject.path.replaceAll(".mdop", ""),
          url: `${selectedServer}/XMII/Illuminator?QueryTemplate=${mdoQT.queries.mdoQry}&Content-Type=text/json&${credentialsString}`,
          Mode: "Select",
          Attributes: attributes,
          FilterExpr: oviews.filterTextArea.getValue(),
          SortExpr: oviews.sortTextArea.getValue(),
          RowCount: that.byId("idRowCount").getValue(),
          parameters: selectedParamData,
          UseTypedParams: oviews.typedParamsCheckBox.getSelected() ? "T" : "F",
        };

        try {
          $.ajax({
            url: `${serversList.servers[0].url}/XMII/Runner?Transaction=${mdoQT.transactions.MDOTransaction}&OutputParameter=*&Content-Type=text/json`,
            data: data,
            method: "POST",
            success: function (oData) {
              oviews.displayTableView.setBusy(false);

              if (oData.Rowsets.FatalError) {
                MessageBox.error(oData.Rowsets.FatalError);
                return;
              }

              oviews.displayTableView.setModel(
                new JSONModel(oData.Rowsets.Rowset[0])
              );
              MessageToast.show("Data fetched");
            },
            error: function (error) {
              oviews.displayTableView.setBusy(false);
              MessageBox.error(error.statusText);
            },
          });
        } catch (error) {
          oviews.displayTableView.setBusy(false);
          MessageBox.error(error.message)
        }
      },
      showCellDetails: function (oEvent) {
        uiTableUtil.showCellDetails(oEvent);
      },
      setVisibleRowCount: function (oEvent) {
        uiTableUtil.setVisibleRowCount(oEvent);
      },
      exportToExcel: function (oEvent) {
        uiTableUtil.exportToExcel(oEvent);
      },
      selectAllAttributes: function (oEvent) {
        oviews.attributesView.selectAll();
      },
      deselectAllAttributes: function (oEvent) {
        oviews.attributesView.removeSelections();
      },
      showKeyWords: function (oEvent) {},
      onTypedParamEnable: function (oEvent) {
       parameterlogic.onTypedParamEnable(oEvent)
      },
      setKeyboardShortcuts:function(){
	var viewDomref = this.getView().getDomRef()
	$(viewDomref).keydown((event=>{
         		if (event.keyCode==13 && event.ctrlKey) { //ctrl+enter to execute the query
         			   this.executeQuery()
        		}
	}))
	}
   
//code ends here
    });
  }
);
