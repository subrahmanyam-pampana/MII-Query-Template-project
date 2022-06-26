sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/MessageBox",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/ui/table/Table",
    "app/utils/uiTable",
  ],
  function (
    Controller,
    MessageToast,
    JSONModel,
    Filter,
    FilterOperator,
    Dialog,
    MessageBox,
    exportLibrary,
    Spreadsheet,
    Table,
    uiTableUtil
  ) {
    "use strict";
    var EdmType = exportLibrary.EdmType;
    return Controller.extend("app.controller.sqltemplate", {
      onInit: function () {
        /*--------------------global properties------------------------------------------------*/
        var that = this;
        this.serversList = this.loadResource("./model/servers.json");
        this.BLSTransactions = this.loadResource(
          "./model/BLSTransactions.json"
        );
        this.defaultSettings = this.loadResource("./model/defaultSettings.json");
        this.restricetedQueries = this.defaultSettings["restrictedQueries"]
        this.dataServer = this.defaultSettings["defaultDataServer"] //default data server
        var credentilasModel = new JSONModel({ userName: "", password: "" });
        this.server = {
          serverName: that.serversList.servers[0].url,
          Alias: that.serversList.servers[0].name,
        };
        this.credentialsString = "";
        this.webServices = {
          dataServersList:
            "/XMII/Illuminator?service=SystemInfo&mode=ServerList&Mask=Enabled",
        };
        this.savedQueriesDataModel = new JSONModel();
        this.byId("idServersList").setModel(new JSONModel(this.serversList));

        
        /*--------------------------LOGIN USER DIALOG BOX---------------------------------*/
        var LoginDialog = new Dialog({
          title: "Login",
          content: new sap.m.VBox({
            items: [
              new sap.m.Input("userid", {
                placeholder: "Enter UserName",
                value: "{/userName}",
                width: "90%",
              }).addStyleClass("sapUiSmallMarginBeginEnd"),
              new sap.m.Input("pswd", {
                placeholder: "Enter password",
                type: "Password",
                value: "{/password}",
                width: "90%",
              }).addStyleClass("sapUiSmallMarginBeginEnd"),
            ],
          }),
          buttons: [
            new sap.m.Button({
              text: "Login",
              press: function () {
                let data = LoginDialog.getModel().getData();
                var autherised = that.verifyUser(data.userName, data.password);

                if (autherised) {
                  LoginDialog.close();
                  that.credentialsString = `IllumLoginName=${
                    credentilasModel.getData().userName
                  }&IllumLoginPassword=${credentilasModel.getData().password}`;
                  localStorage["userCredentials"] = JSON.stringify(
                    credentilasModel.getData()
                  );
                  that.setDefaults();
                }
              },
            }),
          ],
        });
        LoginDialog.setModel(credentilasModel);

        if (localStorage["userCredentials"] !== undefined) {
          var userData = JSON.parse(localStorage["userCredentials"]);
          Promise.resolve(
            that.verifyUser(userData.userName, userData.password)
          ).then(function (autherised) {
            if (autherised) {
              that.credentialsString = `IllumLoginName=${userData.userName}&IllumLoginPassword=${userData.password}`;
              that.setDefaults();
            } else {
              LoginDialog.open();
            }
          });
        } else {
          LoginDialog.open();
        }
      },
      onAfterRendering: function () {
        this.enableAutoComplete();
      },
      setDefaults: function () {
        var that = this;

        /* 
        1.getting the data servers data
        2.setting the default server and firing the selection change
        3.selection change gets the table data and sets the default table and fires the table selection change event
        4.tables selection change gets the column data and enables the auto completed feature
        flow: setDataServersList --> setDataServer --> setTableData --> onTableSelect
        */
        that.setDataServersList();

        //getting the saved Queries from local storage
        var savedQuries = localStorage["savedQueries"];
        if (savedQuries !== undefined) {
          savedQuries = JSON.parse(savedQuries);
          that.savedQueriesDataModel.setData(savedQuries);
          that.byId("idSavedQuriesList").setModel(that.savedQueriesDataModel);
        }
      },
      setServerName: function (oEvent) {
        var selectedItem = oEvent.getSource().getSelectedItem();
        var serverName = selectedItem.getKey(),
          Alias = selectedItem.getText();
        this.server.serverName = serverName;
        this.server.Alias = Alias;
        this.setDataServersList();
      },
      loadResource: function (resoursePath) {
        var data;
        $.ajax({
          url: resoursePath,
          async: false,
          success: function (oData) {
            data = oData;
          },
          error: function (error) {
            MessageBox.error(error.statusText);
          },
        });

        return data;
      },
      setDataServersList: function () {
        var that = this;
        var dataServerView = that.byId("idDataServers");
        //reset data
        this.resetLists();
        var setDefaultDataserver = () => {
          //Setting data server field
          if (that.defaultSettings["defaultDataServer"]) {
            this.byId("idDataServersSearch").setValue(
              that.defaultSettings["defaultDataServer"]
            );
            this.byId("idDataServersSearch").fireLiveChange();
            dataServerView.setSelection(
              dataServerView.getItemByKey(
                that.defaultSettings["defaultDataServer"]
              )
            );
            dataServerView.fireSelectionChange();
          }
        };

        if (localStorage[`${that.server.Alias}_dataServers`] !== undefined) {
          console.log(that.server.Alias + ": loading server list from cache");
          var oData = JSON.parse(
            localStorage[`${that.server.Alias}_dataServers`]
          );
          dataServerView.setModel(new JSONModel(oData));
          setDefaultDataserver()
        } else {
          dataServerView.setBusy(true);
          try {
            $.ajax({
              url: `${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
              method: "POST",
              async: false,
              data: {
                url: `${that.server.serverName}${that.webServices.dataServersList}&Content-Type=text/json&${that.credentialsString}`,
                data: "",
              },
              success: function (oData) {
                //caching the data into local storage
                localStorage[`${that.server.Alias}_dataServers`] =
                  JSON.stringify(oData);
                dataServerView.setModel(new JSONModel(oData));
                dataServerView.setBusy(false);
                setDefaultDataserver()
              },
              error: function (error) {
                MessageBox.error(`Error might be due to server unavailability.
              status Text: ${error.statusText}, response Text: ${error.responseText}`);
                dataServerView.setBusy(false);
              },
            });
          } catch (error) {
            MessageBox.error(error.message);
            dataServerView.setBusy(false);
          }
        }
      },
      resetLists: function () {
        this.byId("idDataServers").setModel(new JSONModel({}));
        this.byId("idTableList").setModel(new JSONModel({}));
        this.byId("idColumnList").setModel(new JSONModel({}), "columnModel");
      },
      verifyUser: function (userNmae, password) {
        var authorizationFlag = false;
        var that = this;
        try {
          password = encodeURIComponent(password);
          $.ajax({
            type: "GET",
            async: false,
            cache: false,
            url:
              that.server.serverName +
              "/XMII/Illuminator?service=Audit&mode=Verify&IllumLoginName=" +
              userNmae +
              "&IllumLoginPassword=" +
              password +
              "&Content-Type=text/xml",
            success: function (data) {
              if ($(data).find("FatalError").length > 0) {
                authorizationFlag = false;
                sap.m.MessageBox.error("Login Failed");
              } else {
                authorizationFlag = true;
              }
            },
            error: function (error) {
              MessageBox.error("Invalid user Name or Password");
            },
          });
        } catch (E) {
          sap.m.MessageBox.error("Error in login : " + E.message);
        }
        return authorizationFlag;
      },
      setDataServer: function (oEvent) {
        var selectedItem = oEvent.getSource().getSelectedItem();
        var dataServerName = selectedItem.getKey();
        this.dataServer = dataServerName;
        this.setTableData();
      },
      setTableData: function () {
        var that = this;
        var tablesView = that.byId("idTableList");
        //reset table and column data
        this.byId("idTableList").setModel(new JSONModel({}));
        this.byId("idColumnList").setModel(new JSONModel({}), "columnModel");

        var setDefaultTable =()=>{
          if(that.defaultSettings[that.dataServer]){
            var defaultTable = tablesView.getItemByKey(
              that.defaultSettings[that.dataServer]
            );
            if (defaultTable) {
              tablesView.setSelection(defaultTable);
              tablesView.fireSelectionChange();
              this.byId("idTableSearch").setValue(
                that.defaultSettings[that.dataServer]
              );
              this.byId("idTableSearch").fireLiveChange();
            }else{
              this.byId("idTableSearch").setValue("");
              this.byId("idTableSearch").fireLiveChange();
            }
          }
        }

        if (
          localStorage[`${that.server.Alias}_${that.dataServer}_tableData`] !==
          undefined
        ) {
          console.log("loading table data from cache");
          var oData = JSON.parse(
            localStorage[`${that.server.Alias}_${that.dataServer}_tableData`]
          );
          tablesView.setModel(new JSONModel(oData));
          setDefaultTable()

        } else {
          console.log("loading table data from server");
          tablesView.setBusy(true);
          try {
            $.ajax({
              url: `${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
              method: "POST",
              async: false,
              data: {
                url: `${that.server.serverName}/XMII/Illuminator?Server=${that.dataServer}&Mode=TableList&${that.credentialsString}&Content-Type=text/json`,
              },
              success: function (oData) {
                if (oData.Rowsets.FatalError !== undefined) {
                  MessageBox.error(oData.Rowsets.FatalError);
                  return;
                }
                tablesView.setModel(new JSONModel(oData.Rowsets.Rowset[0]));
                tablesView.setBusy(false);
                setDefaultTable()

                //caching the results
                localStorage[
                  `${that.server.Alias}_${that.dataServer}_tableData`
                ] = JSON.stringify(oData.Rowsets.Rowset[0]);
              },
              error: function (error) {
                MessageBox.error(error.statusText);
                tablesView.setBusy(false);
              },
            });
          } catch (error) {
            MessageBox.error(error.message);
            tablesView.setBusy(false);
          }
        }
      },
      onTableSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter("TableName", FilterOperator.Contains, sQuery);
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idTableList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      pasteSelectedTable: function (oEvent) {
        var tableView = this.byId("idTableList");
        var queryTextArea = this.byId("idQueryTextArea");
        var selectedKey = tableView.getSelectedKey();

        if (selectedKey == "") {
          MessageToast.show("Please Select table");
          return;
        }
        var cursorPos = $("#" + queryTextArea.getId())
          .find("textarea")
          .prop("selectionStart");
        var query = queryTextArea.getValue();
        query =
          query.slice(0, cursorPos) +
          " " +
          selectedKey +
          " " +
          query.slice(cursorPos);
        queryTextArea.setValue(query);
      },
      onDataServerSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter("Name", FilterOperator.Contains, sQuery);
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idDataServers");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      onColumnSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter(
            "ColumnName",
            FilterOperator.Contains,
            sQuery
          );
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idColumnList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      onSavedQuerySearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter("name", FilterOperator.Contains, sQuery);
          aFilters.push(filter);
        }

        // update list binding
        var oList = this.byId("idSavedQuriesList");
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilters, "Application");
      },
      onTableSelect: function (oEvent) {
        var that = this;
        var selectedItem = oEvent.getSource().getSelectedItem();
        if (!selectedItem) {
          return;
        }
        var tableName = selectedItem.getKey();
        //reset the column data
        that.byId("idColumnList").setModel(new JSONModel({}), "columnModel");

        var setColumnModel = (oData) => {
          that
            .getView()
            .byId("idColumnList")
            .setModel(new JSONModel(oData), "columnModel");
        };

        if (
          localStorage[
            `columnData_${that.server.Alias}_${that.dataServer}_${tableName}`
          ] !== undefined
        ) {
          var oData = JSON.parse(
            localStorage[
              `columnData_${that.server.Alias}_${that.dataServer}_${tableName}`
            ]
          );
          setColumnModel(oData);
        } else {
          try {
            $.ajax({
              url: `${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
              method: "POST",
              async: false,
              data: {
                url: `${this.server.serverName}/XMII/Illuminator?Server=${that.dataServer}&Group=${tableName}&Mode=ColumnList&Content-Type=text/json&${this.credentialsString}`,
              },
              success: function (oData) {
                oData = oData.Rowsets.Rowset[0];
                localStorage[
                  `columnData_${that.server.Alias}_${that.dataServer}_${tableName}`
                ] = JSON.stringify(oData);
                setColumnModel(oData);
              },
              error: function (error) {
                MessageBox.error(error.statusText);
              },
            });
          } catch (error) {
            MessageBox.error(error.message);
          }
        }
      },
      enableAutoComplete: function () {
        var that = this;
        var oQueryView = this.getView().byId("idQueryTextArea");
        var jQueryTextArea = jQuery("#" + oQueryView.getId()).find("Textarea");
        jQueryTextArea.textcomplete([
          {
            // #1 - Regular experession used to trigger search
            match: /FROM (\b(\w+))$/i, // --> triggers search for every char typed

            // #2 - Function called at every new key stroke
            search: function (query, fnCallback) {
              var oResult = that.byId("idTableList").getModel().getData();
              fnCallback(
                oResult.Row.filter(function (oRecord) {
                  // filter results based on query

                  return oRecord.TableName.toUpperCase().includes(
                    query.toUpperCase()
                  );
                })
              );
            },

            // #3 - Template used to display each result (also supports HTML tags)
            template: function (hit) {
              // Returns the highlighted version of the name attribute
              return hit.TableName;
            },

            // #4 - Template used to display the selected result in the textarea
            replace: function (hit) {
              var tablesView = that.byId("idTableList");
              if (tablesView.getItemByKey(hit.TableName)) {
                tablesView.setSelection(tablesView.getItemByKey(hit.TableName));
                tablesView.fireSelectionChange();
              }
              return "FROM " + hit.TableName;
            },
          },
          {
            // #1 - Regular experession used to trigger search
            match: / (\b(\w+))$/, // --> triggers search for every char typed

            // #2 - Function called at every new key stroke
            search: function (query, fnCallback) {
              var oResult = that.byId("idColumnList").getModel("columnModel");
              if (oResult === undefined) {
                return;
              }
              oResult = oResult.getData();

              fnCallback(
                oResult.Row.filter(function (oRecord) {
                  // filter results based on query
                  return oRecord.ColumnName.toUpperCase().startsWith(
                    query.toUpperCase()
                  );
                })
              );
            },

            // #3 - Template used to display each result (also supports HTML tags)
            template: function (hit) {
              // Returns the highlighted version of the name attribute
              return hit.ColumnName;
            },

            // #4 - Template used to display the selected result in the textarea
            replace: function (hit) {
              return " " + hit.ColumnName;
            },
          },
        ]);
      },
      pasteSelectedColumns: function () {
        var columnListView = this.byId("idColumnList");
        var selectedItems = columnListView.getSelectedItems();
        var selectedColumnNames = [];
        selectedItems.forEach((item) => {
          selectedColumnNames.push(item.getTitle());
        });

        selectedColumnNames = selectedColumnNames.join();
        if (selectedColumnNames == "") {
          MessageToast.show("Please Select Columns");
          return;
        }

        this.insertQueryToTextArea(selectedColumnNames);
      },

      insertQueryToTextArea: function (newQuery) {
        var queryTextArea = this.byId("idQueryTextArea");
        var query = queryTextArea.getValue();

        var cursorPos = $("#" + queryTextArea.getId())
          .find("textarea")
          .prop("selectionStart");

        query = `${query.slice(0, cursorPos)} ${newQuery} ${query.slice(
          cursorPos
        )}`;
        queryTextArea.setValue(query);
      },
      executeQuery: function (oEvent) {
        var that = this;
        var vBox = that.byId("tablesVbox");
        var queryTextAreaView = this.byId("idQueryTextArea");
        var rowCount = this.byId("idRowCount").getValue();
        var curserStartPosition = $("#" + queryTextAreaView.getId())
          .find("textarea")
          .prop("selectionStart");
        var curserEndPosition = $("#" + queryTextAreaView.getId())
          .find("textarea")
          .prop("selectionEnd");
        var query = queryTextAreaView.getValue();
        if (curserStartPosition != curserEndPosition) {
          query = query.slice(curserStartPosition, curserEndPosition);
        }
        var validQuery = true;
        that.restricetedQueries.forEach((item) => {
          if (query.toUpperCase().includes(item.toUpperCase())) {
            MessageBox.error(`${item} query not allowd`);
            validQuery = false;
            return;
          }
        });
        //checking query valid or not
        if (validQuery == false) {
          return;
        }

        if (query.length === 0) {
          MessageBox.alert("Please Write Query");
          return;
        }
        vBox.setBusy(true);
        try {
          $.ajax({
            url: `${that.serversList.servers[0].url}/XMII/Runner?Transaction=${that.BLSTransactions.executeTransactionPath}&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
            method: "POST",
            data: {
              url: `${that.server.serverName}/XMII/Illuminator?QueryTemplate=${that.BLSTransactions.executeQueryPath}&Server=${that.dataServer}&RowCount=${rowCount}&Content-Type=text/json&${that.credentialsString}`,
              data: encodeURIComponent(query),
            },
            success: function (oData) {
              if (oData.Rowsets.FatalError !== undefined) {
                MessageBox.error(oData.Rowsets.FatalError);
                vBox.setBusy(false);
                return;
              }

              vBox.setBusy(false);
              vBox.setModel(new JSONModel(oData));
              MessageToast.show("Data fetched");
            },
            error: function (error) {
              MessageBox.error(error.statusText);
              vBox.setBusy(false);
            },
          });
        } catch (error) {
          MessageBox.error(error.message);
        }
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
      getNumOfRows: function (oRows) {
        return oRows && Array.isArray(oRows) ? oRows.length : 0;
      },
      showCellDetails: function (oEvent) {
        uiTableUtil.showCellDetails(oEvent);
      },
      pasteSelectedQueries: function () {
        var queryTextAreaView = this.byId("idQueryTextArea");
        var curPos = $("#" + queryTextAreaView.getId())
          .find("textarea")
          .prop("selectionStart");
        var curText = queryTextAreaView.getValue();

        var savedQueryListView = this.byId("idSavedQuriesList");
        var selectedItems = savedQueryListView.getSelectedItems();

        var selectedQuery = [];
        selectedItems.forEach((item) => {
          selectedQuery.push(item.getDescription());
        });

        curText =
          curText.slice(0, curPos) +
          ` ${selectedQuery.join()} ` +
          curText.slice(curPos);
        queryTextAreaView.setValue(curText);
      },
      deleteSavedQuery: function (oEvent) {
        var oList = oEvent.getSource(),
          oItem = oEvent.getParameter("listItem"),
          sPath = oItem.getBindingContext().getPath();

        // after deletion put the focus back to the list
        oList.attachEventOnce("updateFinished", oList.focus, oList);

        // send a delete request to the odata service
        this.savedQueriesDataModel.remove(sPath);
      },
      exportToExcel: function (oEvent) {
        var aCols, oRowBinding, oSettings, oSheet, oTable;
        aCols = [];
        oTable = oEvent.getSource().getParent().getParent();
        if (!oTable.getModel()) {
          MessageBox.error("Can't Export without Data");
          return;
        }
        var aColumnsData = oTable.getBindingContext().getObject()
          .Columns.Column;
        oRowBinding = oTable.getBinding("rows").oList;
        var oDataTypesMap = {
          4: EdmType["Number"],
          2: EdmType["Number"],
          12: EdmType["String"],
        };
        aColumnsData.forEach((col) => {
          aCols.push({
            label: col.Name,
            property: col.Name,
            type: oDataTypesMap[col.SQLDataType]
              ? oDataTypesMap[col.SQLDataType]
              : EdmType.String,
          });
        });

        oSettings = {
          workbook: {
            columns: aCols,
            hierarchyLevel: "Level",
            context: {
              sheetName: "dataSet1",
            },
          },

          dataSource: oRowBinding,
          fileName: "Table_export.xlsx",
          worker: false,
        };

        oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
        });
      },
      onSavedQueryDrop: function (oEvent) {
        var oDraggedItem = oEvent.getParameter("draggedControl");
        var oDraggedItemObject = oDraggedItem.getBindingContext().getObject();
        this.insertQueryToTextArea(oDraggedItemObject.query);
      },
      onColumnsDrop: function (oEvent) {
        var columnListView = this.byId("idColumnList");
        var selectedItems = columnListView.getSelectedItems();

        if (selectedItems.length > 0) {
          this.pasteSelectedColumns();
        } else {
          this.insertQueryToTextArea(
            oEvent.getParameter("draggedControl").getTitle()
          );
        }
      },
      setVisibleRowCount: function (oEvent) {
        var oTable = oEvent.getSource().getParent().getParent();
        var selectedItem = oEvent.getParameters("selectedItem");
        oTable.setVisibleRowCount(
          parseInt(selectedItem.selectedItem.getText())
        );
      },
      saveQueryLocally: function () {
        var that = this;
        var queryTextAreaView = this.byId("idQueryTextArea");
        if (this.byId("idQueryName").getValue() == "") {
          MessageBox.error("Please Enter Query Name");
          return;
        }

        var QueryName =
          this.server.Alias + "_" + this.byId("idQueryName").getValue();
        var queryText = queryTextAreaView.getValue();
        var newQuery = {
          name: QueryName,
          datetime: new Date().toDateString(),
          query: queryText.trim(),
        };
        var savedQueries = localStorage["savedQueries"];
        let message = "Saved";
        if (savedQueries !== undefined) {
          savedQueries = JSON.parse(savedQueries);

          var promise = new Promise((resolve, reject) => {
            let oldQueryFlag = false;
            let queryRef;
            for (let query of savedQueries.queries) {
              if (query.name === QueryName) {
                oldQueryFlag = true;
                queryRef = query;
                break;
              }
            }

            if (oldQueryFlag) {
              //existing query
              MessageBox.confirm(
                "Query Name Already Exiests, Do you want to update?",
                (oAction) => {
                  if (oAction === "OK") {
                    queryRef.query = newQuery.query;
                    resolve(true);
                  }
                }
              );
            } else {
              //new query
              resolve(false);
            }
          });
          promise.then((oldQueryFlag) => {
            if (oldQueryFlag) {
              //query already exist, updating

              that
                .byId("idSavedQuriesList")
                .setModel(new JSONModel(savedQueries));
              MessageToast.show(`Query ${message} Successfuly!`);

              //caching
              localStorage["savedQueries"] = JSON.stringify(savedQueries);
            } else {
              //new query, inserting
              savedQueries.queries.push(newQuery);
              that
                .byId("idSavedQuriesList")
                .setModel(new JSONModel(savedQueries));
              MessageToast.show(`Query saved Successfuly!`);

              //caching the results
              localStorage["savedQueries"] = JSON.stringify(savedQueries);
            }
          });
        } else {
          savedQueries = {
            queries: [newQuery],
          };

          that.byId("idSavedQuriesList").setModel(new JSONModel(savedQueries));
          MessageToast.show(`Query saved Successfuly!`);

          // cahing
          localStorage["savedQueries"] = JSON.stringify(savedQueries);
        }
      },
    });
  }
);
