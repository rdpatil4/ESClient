var Config = {
   'CLUSTER_URL':'http://localhost:9200', 
   'AUTH_USER':null,
   'AUTH_PASSWORD':null,
   'THEME':'Pepper Grinder',
   'SEARCH_TYPE':'query_then_fetch',
   'FROM':0,
   'DEFAULT_OPERATOR':'OR',

   // result size
   'SIZE':50,   
   
   //Control lowercasing of search terms when running wildcard searches on non-analyzed fields
   'EXPAND_LOWERCASE_TERMS':true,
   
   //Control wildcard and prefix queries to be analyzed or not
   'ANALYZE_WILDCARD':false,
   
   //Query format to use while searching or delete by query. defaults to Lucene
   'USE_LUCENE_QUERY_TYPE':true,
   
   //Set to true if you want capability of dropping the index or mapping.
   'ENABLE_INDEX_DROP':false,
   
   //Enable displaying JSON results. This will slow down the response time. Result size recommended is 10 results
   'SHOW_JSON_RESULS':false,
   
   //Enable inspecting the mapping for index type
   'SHOW_MAPPING_INFO':false
};
