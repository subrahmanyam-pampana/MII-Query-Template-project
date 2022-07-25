# SAP MII Web Query Template
Web Query template application is used to Query the SAP MII data sources right from the Browser. 

**Use case 01**
Some times developers need to write completex queries in order to to meet the requirements, as a part of it we usually want to execute  the part of the query by selecting to check the data but this is not possible directly from MII Workbench Query template. This application helps you to write complex queries and it also gives auto suggestions while typing the Quries.

**Use case 02**
During the Monitoring the Application if any issue occurs, Operations people generally wants to check weather data is available in the data base or not to analyze the issue. Analysizing the data dirctly from the MII Queries is bit dificult. So this application helps to filtering, sorting and seracrching the data after retrieving from the data base. 

## Versions
|  version | description  | source code link   | Project Setup document |
| ------------ | ------------ | ------------- | -------------- |
| initial version  |  It has only limited features. don't supports the MDO Queries |[link](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/tree/main/QuerytemplateUi5Project "link")| [View](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/blob/45ca204532226fa0d876e2869727f24b1a99a45b/QuerytemplateUi5Project/proect%20setup%20guide.md)|
|   version 0.1|  this is the latest version. we recomends this |[link](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/tree/main/miiQueryTemplate%400.1 "link")| [Download](https://github.com/subrahmanyam-pampana/MII-Query-Template-project/blob/main/miiQueryTemplate%400.1/setupGuide.docx)

## Featurs
1. `Auto Suggestions` While Writing the Queries in the Query text area you will get Auto suggestion of tables/ colums.
   After every `from `  key word you will get Available tables suggestions.
   After every `space` key you will get Column suggestions of selected table.
2. `Drag and Drop` all the required lists enabled with drag and drop feature. we can drag required items and drop to Query text area.
3. `Export to Excel` we can export the retrievd data to Excel file by clicking `Export` button
4. `XML formating` we can format the xml by click on format button in data popup dialog.
5. `Paramters support` while wring the Query use [Param.1] ....[Param.15] to dynamically assign values. assign values in the parameter table.
6. `Saving Queries in the Browser` you can save the Queries in the Browser local storage. these Quries persists until you clear local stoarage.
7. `MDO Query support` We can query the Available MDO's from MDO Query template tab.
8. `Multi server Support`, with simple configuration we can the query the data bases of multiple servers using single application.

## Prerequasites
1. User must have access to SAP MII application
2. User must have required roles to query the data base.
3. Single signon should be enabled for multi server access.

