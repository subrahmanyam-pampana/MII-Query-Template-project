function loadLocalResource(url) {
  var response;
  try {
    $.ajax({
      url: url,
      async: false,
      success: (oData) => {
        response = oData;
      },
      error: (error) => {
        response = error;
      },
    });
  } catch (error) {
    response = error.statusText;
  }

  return response;
}

function  insertToTextArea(newQuery, textArea) {
        var query = textArea.getValue();
        var cursorPos = $("#" + textArea.getId())
          .find("textarea")
          .prop("selectionStart");

        query = `${query.slice(0, cursorPos)}${newQuery}${query.slice(
          cursorPos
        )}`;
        textArea.setValue(query);
}
