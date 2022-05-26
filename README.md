# MII-Query-Template-project
Web based Query template used to Query the MII data sources

## Project Set up
1. Download the Project or clone the project
2. go to [QuerytemplateUi5Project/controller/App.controller.js](QuerytemplateUi5Project/controller/App.controller.js) file and add your server configurations as shown in the image below

![image](https://user-images.githubusercontent.com/79074273/170458381-64921d03-52bd-4a2f-9402-9bcf14e6ad35.png)

Example:
```js
 this.serversList = {
          servers: [
            { name: "my development server", url: "https://myDevserver:50010" },
            { name: "my Quality server", url: "https://myQaserver:50010" }
          ],
        };

```
3.set up the default server in the same file at below shown image

![image](https://user-images.githubusercontent.com/79074273/170459288-98cb450b-53a5-4149-8392-862af31480e1.png)

example:
```js
this.server = {
          serverName: that.serversList.servers[0].url,  //here first server selected as default server
          Alias: "my dev server", //specify the custom name for your server that will apear in the ui or set it as  that.serversList.servers[0].name
        };
```
4.Configure the BLS Query path to execute the Query at below part in the code

![image](https://user-images.githubusercontent.com/79074273/170461398-ab14c35d-74bb-4543-ae7b-d7b425f5870d.png)
example:
```js
this.BLSTransactions = {
          executeQueryPath: "DefaultProject/myQuery", //put your Query path here
          devTransactionPath:"devProject/queryExecuteTrx"
        };
```
*Note:* Mainatain same executeQuery in all the servers with same path
devTransactionPath only need to be maintained in dev server


5.

