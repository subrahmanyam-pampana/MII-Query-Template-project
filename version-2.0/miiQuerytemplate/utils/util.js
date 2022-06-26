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
