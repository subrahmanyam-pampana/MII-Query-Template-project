sap.ui.define(
  [
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
  ],
  function (JSONModel, Dialog, exportLibrary, Spreadsheet,MessageBox,MessageToast) {
    var EdmType = exportLibrary.EdmType;
    return {
      showCellDetails: function (oEvent) {
        var that = this;
        var cellText = oEvent.getParameters().cellDomRef.innerText;
        if(cellText=="" || cellText===undefined){
          return;
        }

        var cellTextModel = new JSONModel({ text: cellText });
        var textarea = new sap.m.TextArea({
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
                      var formatedXml = cellText;
                      if (
                        cellText[0] == "<" ||
                        cellText.slice(0, 4) == "&lt;"
                      ) {
                        if (cellText.slice(0, 4) == "&lt;") {
                          formatedXml = cellText.replaceAll("&lt;", "<");
                          formatedXml = formatedXml.replaceAll("&gt;", ">");
                        }
                        formatedXml = that.prettifyXml(formatedXml);
                      }
                      textarea.setValue(formatedXml);
                    },
                  }),
                  new sap.m.Button({
                    icon: "sap-icon://copy",
                    press: function () {
                      $(`#${textarea.sId}`).find("textarea").select();
                      if (document.execCommand("Copy")) {
                        MessageToast.show("text copied");
                      }
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
      setVisibleRowCount: function (oEvent) {
        var oTable = oEvent.getSource().getParent().getParent();
        var selectedItem = oEvent.getParameters("selectedItem");
        oTable.setVisibleRowCount(
          parseInt(selectedItem.selectedItem.getText())
        );
      },

      exportToExcel: function (oEvent) {
        var aCols, oRowBinding, oSettings, oSheet, oTable;
        aCols = [];
        oTable = oEvent.getSource().getParent().getParent();
        if (!oTable.getModel()) {
          MessageBox.error("Can't Export without Data");
          return;
        }
        var aColumnsData = oTable.getModel().getData().Columns.Column;
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
    };
  }
);
