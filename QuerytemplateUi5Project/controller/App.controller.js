sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/MessageBox",
  ],
  function (
    Controller,
    MessageToast,
    JSONModel,
    Filter,
    FilterOperator,
    Dialog,
    MessageBox
  ) {
    "use strict";
    return Controller.extend("app.controller.App", {
      onInit: function () {
        /*--------------------global properties------------------------------------------------*/

        var that = this;
        this.serversList = {
          servers: [
            { name: "<server Name>", url: "<server url>" }
          ],
        };
        this.byId("idServersList").setModel(new JSONModel(this.serversList));

        this.restricetedQueries = ["delete", "insert", "update"];
        this.server = {
          serverName: that.serversList.servers[0].url,
          Alias: "<server name>",
        };
        this.credentialsString = "";

        this.BLSTransactions = {
          executeQueryPath: "<Query path>",
        };
        this.webServices = {
          dataServersList:
            "/XMII/Illuminator?service=SystemInfo&mode=ServerList&Mask=Enabled",
        };

        var credentilasModel = new JSONModel({ userName: "", password: "" });
        this.dataServer = "MII_APP";
        this.savedQueriesDataModel = new JSONModel();
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
                // console.log(autherised);
                if (autherised) {
                  LoginDialog.close();
                  that.credentialsString = `IllumLoginName=${
                    credentilasModel.getData().userName
                  }&IllumLoginPassword=${credentilasModel.getData().password}`;
                  localStorage["userCredentials"] = JSON.stringify(
                    credentilasModel.getData()
                  );
                that.setDefaults()
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
            console.log("auth " + autherised);
            if (autherised) {
              that.credentialsString = `IllumLoginName=${userData.userName}&IllumLoginPassword=${userData.password}`;
              that.setDefaults()
            } else {
              LoginDialog.open();
            }
          });
        } else {
          LoginDialog.open();
          
        }
      },
      setDefaults:function(){
        var that = this
        that.setDataServersList();
        var savedQuries = localStorage["savedQueries"];
        if (savedQuries !== undefined) {
          savedQuries = JSON.parse(savedQuries);
          that.savedQueriesDataModel.setData(savedQuries);
          that
            .byId("idSavedQuriesList")
            .setModel(that.savedQueriesDataModel);
        }
        that.getView().byId("idQueryTextArea").onAfterRendering = function () {that.enableAutoComplete()};
      },
      setServerName: function (oEvent) {
        var selectedItem = oEvent.getSource().getSelectedItem();
        var serverName = selectedItem.getKey(),
          Alias = selectedItem.getText();
        this.server.serverName = serverName;
        this.server.Alias = Alias;
        this.setDataServersList();
      },
      setDataServersList: function () {
        var that = this;
        if (localStorage[`${that.server.Alias}_dataServers`] !== undefined) {
          console.log(that.server.Alias + ": loading server list from cache");
          var oData = JSON.parse(
            localStorage[`${that.server.Alias}_dataServers`]
          );
          var dataServerView = that.byId("idDataServers");
          dataServerView.setModel(new JSONModel(oData));
          dataServerView.setSelection(
            dataServerView.getItemByKey(that.dataServer)
          );
          dataServerView.fireSelectionChange();
        } else {
          $.ajax({
            url:`${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
            method: "POST",
            data:{
              url:`${that.server.serverName}${that.webServices.dataServersList}&Content-Type=text/json&${that.credentialsString}`,
              data:""
            },
            success: function (oData) {
              // console.log(oData)
              localStorage[`${that.server.Alias}_dataServers`] =
                JSON.stringify(oData);
              var dataServerView = that.byId("idDataServers");
              dataServerView.setModel(new JSONModel(oData));
              dataServerView.setSelection(
                dataServerView.getItemByKey(that.dataServer)
              );
              dataServerView.fireSelectionChange();
            },
            error: function (error) {
              MessageBox.error(error.statusText);
            },
          });
        }
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
             url: that.server.serverName +"/XMII/Illuminator?service=Audit&mode=Verify&IllumLoginName=" +userNmae +"&IllumLoginPassword=" +password +"&Content-Type=text/xml",
            success: function (data) {
              if ($(data).find("FatalError").length > 0) {
                authorizationFlag = false;
                sap.m.MessageBox.error("Login Failed");
              } else {
                console.log("login success");
                authorizationFlag = true;
              }
            },
            error: function (error) {
              MessageBox.error(error.statusText);
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
        if (
          localStorage[`${that.server.Alias}_${that.dataServer}_tableData`] !==
          undefined
        ) {
          console.log("loading table data from cache");
          var oData = JSON.parse(
            localStorage[`${that.server.Alias}_${that.dataServer}_tableData`]
          );
          var tablesView = that.byId("idTableList");
          tablesView.setModel(new JSONModel(oData));
          if (tablesView.getItemByKey("LABOR_DIR_OFF")) {
            tablesView.setSelection(tablesView.getItemByKey("LABOR_DIR_OFF"));
            tablesView.fireSelectionChange();
          }
        } else {
          console.log("loading table data from server");
          try {
            $.ajax({
              url:`${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
              method: "POST",
              data:{
                url: `${that.server.serverName}/XMII/Illuminator?Server=${that.dataServer}&Mode=TableList&${that.credentialsString}&Content-Type=text/json`,
              },
              success: function (oData) {
                if (oData.Rowsets.FatalError !== undefined) {
                  MessageBox.error(oData.Rowsets.FatalError);
                  return;
                }

                var tablesView = that.byId("idTableList");
                tablesView.setModel(new JSONModel(oData.Rowsets.Rowset[0]));
                tablesView.setSelection(
                  tablesView.getItemByKey("LABOR_DIR_OFF")
                );
                tablesView.fireSelectionChange();

                localStorage[
                  `${that.server.Alias}_${that.dataServer}_tableData`
                ] = JSON.stringify(oData.Rowsets.Rowset[0]);
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
        // console.log(selectedItem);
        if (!selectedItem) {
          return;
        }
        var tableName = selectedItem.getKey();

        var setColumnModel = (oData) => {
          that
            .getView()
            .byId("idColumnList")
            .setModel(new JSONModel(oData), "columnModel");
        };

        if (localStorage[`columnData_${that.server.Alias}_${that.dataServer}_${tableName}`] !== undefined) {
          var oData = JSON.parse(localStorage["columnData_" + tableName]);
          setColumnModel(oData);
        } else {
          $.ajax({
            url:`${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
            method: "POST",
            data:{
              url: `${this.server.serverName}/XMII/Illuminator?Server=${that.dataServer}&Group=${tableName}&Mode=ColumnList&Content-Type=text/json&${this.credentialsString}`,
            },
            success: function (oData) {
              oData = oData.Rowsets.Rowset[0];
              localStorage[`columnData_${that.server.Alias}_${that.dataServer}_${tableName}`] = JSON.stringify(oData);
              setColumnModel(oData);
            },
          });
        }
      },
      enableAutoComplete: function () {
        var that = this;
        var oQueryView = this.getView().byId("idQueryTextArea");
        var jQueryTextArea = jQuery("#" + oQueryView.getId()).find("Textarea");
        jQueryTextArea.textcomplete([
          {
            // #1 - Regular experession used to trigger search
            match: /FROM (\b(\w+))$/, // --> triggers search for every char typed

            // #2 - Function called at every new key stroke
            search: function (query, fnCallback) {
              var oResult = that.byId("idTableList").getModel().getData();
              // console.log(oResult)
              fnCallback(
                oResult.Row.filter(function (oRecord) {
                  // filter results based on query

                  return oRecord.TableName.toUpperCase().startsWith(
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
              //that.byId('idTableList').getI
              //that.byId('idTableList').setSelection()
              //setSelection
              //debugger
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
                  // console.log(oRecord.ColumnName, query.toUpperCase());
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
      pasteSelectedColumns: function (oEvent) {
        var columnListView = this.byId("idColumnList");
        var queryTextArea = this.byId("idQueryTextArea");
        var selectedItems = columnListView.getSelectedItems();

        var selectedColumnNames = [];
        selectedItems.forEach((item) => {
          selectedColumnNames.push(item.getTitle());
        });
        // console.log(selectedColumnNames);

        selectedColumnNames = selectedColumnNames.join();
        if (selectedColumnNames == "") {
          MessageToast.show("Please Select Columns");
          return;
        }
        var query = queryTextArea.getValue();
        var cursorPos = $("#" + queryTextArea.getId())
          .find("textarea")
          .prop("selectionStart");
        query = `${query.slice(
          0,
          cursorPos
        )} ${selectedColumnNames} ${query.slice(cursorPos)}`;
        queryTextArea.setValue(query);
      },
      executeQuery: function (oEvent) {
        var that = this;
        var queryTextAreaView = this.byId("idQueryTextArea");
        var rowCount = this.byId("idRowCount").getValue();
        var curserStartPosition = $("#" + queryTextAreaView.getId())
          .find("textarea")
          .prop("selectionStart");
        var curserEndPosition = $("#" + queryTextAreaView.getId())
          .find("textarea")
          .prop("selectionEnd");
        var query = queryTextAreaView.getValue();
        // console.log(curserStartPosition,curserEndPosition)
        if (curserStartPosition != curserEndPosition) {
          query = query.slice(curserStartPosition, curserEndPosition);
        }

        that.restricetedQueries.forEach(item=>{
          if(query.toUpperCase().includes(item.toUpperCase())){
            MessageBox.error(`${item} query not allowd`)
          }
        })

        if(query.length===0){
          MessageBox.alert("Please Write Query")
          return
        }
  
        $.ajax({
          url:`${that.serversList.servers[0].url}/XMII/Runner?Transaction=Default/commons/QueryTemplate&OutputParameter=*&Content-Type=text/json&${that.credentialsString}`,
          method: "POST",
          data: { 
            url: `${that.server.serverName}/XMII/Illuminator?QueryTemplate=${that.BLSTransactions.executeQueryPath}&Server=${that.dataServer}&RowCount=${rowCount}&Content-Type=text/json&${that.credentialsString}`,
            "data": query },
          success: function (oData) {
            // console.log(oData);
            if (oData.Rowsets.FatalError !== undefined) {
              MessageBox.error(oData.Rowsets.FatalError);
              return;
            }

            if(!oData.Rowsets.Rowset[0].Row){
              MessageToast.show(`your Query returns No data`);
              return
            }

            var displayTableView = that.byId("idDisplayTable");
            displayTableView.setModel(new JSONModel(oData));
            console.log(oData)
            MessageToast.show(
              `fetched ${oData.Rowsets.Rowset[0].Row.length} records`
            );

            displayTableView.bindColumns(
              "/Rowsets/Rowset/0/Columns/Column",
              function (sId, oContext) {
                var columnName = oContext.getObject().Name;
                return new sap.ui.table.Column({
                  width: "11rem",
                  filterProperty: columnName,
                  label: columnName,
                  template: columnName,
                  sortProperty: columnName,
                });
              }
            );

            displayTableView.bindRows("/Rowsets/Rowset/0/Row");
          },
          error:function(error){
            MessageBox.error(error.statusText);
          }
        });
      },
      showCellDetails: function (oEvent) {
        var that = this;
        var cellText = oEvent.getParameters().cellDomRef.innerText;
        
        var cellTextModel = new JSONModel({ text: cellText });
        var textarea  = new sap.m.TextArea({
          editable: false,
          width: "100%",
          height: "100%",
          growing: true,
          value: "{/text}",
        });

        var dialogBox = new Dialog({
          title: "Details",
          draggable: true,
          resizable: true,
          content: new sap.m.VBox({
            items: [
              new sap.m.Toolbar({
                content: [
                  new sap.m.ToolbarSpacer(),
                  new sap.m.Button({
                    icon: "sap-icon://full-screen",
                    press: function (oEvent) {
                      if (dialogBox.getStretch()) {
                        dialogBox.setStretch(false);
                        oEvent.getSource().setIcon("sap-icon://full-screen");
                      } else {
                        dialogBox.setStretch(true);
                        oEvent
                          .getSource()
                          .setIcon("sap-icon://exit-full-screen");
                      }
                    },
                  }),
                  new sap.m.Button({
                    icon: "sap-icon://text-align-center",
                    press: function () {
                      var formatedXml = cellText
                      if (cellText[0] == "<" || cellText.slice(0, 4) == "&lt;") {
                        if (cellText.slice(0, 4) == "&lt;") {
                          formatedXml = cellText.replaceAll("&lt;", "<");
                          formatedXml = formatedXml.replaceAll("&gt;", ">");
                        }
                        formatedXml = that.prettifyXml(formatedXml);
                      }
                      textarea.setValue(formatedXml)
                      // console.log(formatedXml);
                    },
                  }),
                  new sap.m.Button({
                    icon: "sap-icon://copy",
                    press: function () {
                      $(`#${textarea.sId}`).find("textarea").select()
                      if(document.execCommand("Copy")){
                        MessageToast.show("text copied");
                      }
                      // navigator.clipboard.writeText(cellText).then(
                      //   function () {
                      //     MessageToast.show("text copied");
                      //   },
                      //   function (err) {
                      //     console.error("Async: Could not copy text: ", err);
                      //   }
                      // );
                    },
                  }),
                ],
              }),
              textarea,
            ],
          }),
          buttons: [
            new sap.m.Button({
              text: "close",
              press: function () {
                dialogBox.close();
              },
            }),
          ],
        });
        dialogBox.setModel(cellTextModel);

        dialogBox.open();
      },
      prettifyXml: function (sourceXml) {
        var xmlDoc = new DOMParser().parseFromString(
          sourceXml,
          "application/xml"
        );
        var xsltDoc = new DOMParser().parseFromString(
          [
            // describes how we want to modify the XML - indent everything
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
            '  <xsl:strip-space elements="*"/>',
            '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
            '    <xsl:value-of select="normalize-space(.)"/>',
            "  </xsl:template>",
            '  <xsl:template match="node()|@*">',
            '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
            "  </xsl:template>",
            '  <xsl:output indent="yes"/>',
            "</xsl:stylesheet>",
          ].join("\n"),
          "application/xml"
        );

        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
        var resultXml = new XMLSerializer().serializeToString(resultDoc);
        return resultXml;
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
          let oldQueryFlag = false;
          savedQueries.queries.forEach((query) => {
            if (query.name === QueryName) {
              return MessageBox.confirm(
                "Query Name Already Exiests, Do you want to update?",
                (oAction) => {
                  if (oAction === "OK") {
                    query.query = newQuery.query;
                    oldQueryFlag = true;
                    message = "Updated";
                  }
                  return;
                }
              );
            }
          });

          if (!oldQueryFlag) savedQueries.queries.push(newQuery);
          localStorage["savedQueries"] = JSON.stringify(savedQueries);
        } else {
          localStorage["savedQueries"] = JSON.stringify({
            queries: [newQuery],
          });
        }

        that.byId("idSavedQuriesList").setModel(new JSONModel(savedQueries));
        MessageToast.show(`Query ${message} Successfuly!`);
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
    });
  }
);
