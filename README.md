ES-Client
=========

Elastic search client tool for easy search, edit and delete Index documents.

This tool works with Lucene queries and not Query DSL.
The resuls are presented in tabular format instead of JSON for easy reading.

###Configuration:

Configuraiton is done in the file **config.js** found in the root folder
Default config. looks like below

{</br>
   *'SERVER_URL':'http://localhost:9200',*</br>
   *'Theme':'Blitzer'*</br>
}

You can change the location of your Elastic Search node and port and you are good to go.
The value for Theme is just the jQuery theme roller theme name.

The tool uses several other wonderful open source projects like Datatable and Multiselect etc.

I really hope the tool is very intutive to use, if not, below steps should get you started.

After configuration follow below steps

1) Click connect to connect to your elastic search cluster
2) All the available Index in your cluster would be populated in the Index drop down, select one
3) Then select the Type and fields you want to search on
4) Enter the Lucene query (Not DSL) you want to use for searching.
4) Hit search to see the results. 

###Sorting:

1) Select the field you want to sort and click search

###Deleting records:

1) click on the row(s) you want to delete and hit delete button and confirm your selection to delete rows.

###Delete by Query:

You can delete multiple rows by query using the "Delete By Query" button. The query entered in the search box would be used for deleting the rows.

###Edit:

1) Double click the row you want to edit. You should see the raw json in the window. Click the edit
   button to edit the document.
  
###Known Issues:

The tool does not use routing and if you have routing keys, pretty much cannot use the tool.



   








