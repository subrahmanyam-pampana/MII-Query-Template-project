sap.ui.define([ "app/utils/util",],function(utiljs){
    "use strict"
    return {
        onTypedParamEnable: function (oEvent) {
            var selected = oEvent.getParameter("selected");
            var oParamTable = oEvent.getSource().getParent().getParent();
            if (selected) {
              oParamTable.getColumns()[2].setVisible(true);
            } else {
              oParamTable.getColumns()[2].setVisible(false);
            }
          },
          getParameterString:function(data,isTypedParams){
            var selectedParamData = "";
            var paramModel = data;
            paramModel.forEach((param, idx) => {
              if (param.value != "") {
                selectedParamData += `${param.parameter}=${param.value}&`;
                if (isTypedParams) {
                  var paramIdx = idx + 1;
                  selectedParamData += `ParamType.${paramIdx}=${param.datatype}&`;
                }
              }
            });
            selectedParamData = selectedParamData.slice(0, -1);
            return selectedParamData;
          },
         replaceParameters:function(paramData,query){
             paramData.forEach((param,idx)=>{
                 if (param.value != "") {
                     query = query.replaceAll(`[Param.${idx+1}]`, param.value)
                 }
             })

             return query;
             
         },
       onParameterDrop: function (oEvent) {
        var draggedItem = oEvent.getParameter("draggedControl");
        var droppedArea = oEvent.getParameter("droppedControl");
        var parameterName = `[${
          draggedItem.getBindingContext().getObject().parameter
        }]`;
        insertToTextArea(parameterName, droppedArea);
      }
    }

})