///<amd-dependency path="Ontologies/OntologyMappingOverview" />
///<amd-dependency path="FetchFromApi" />
define(["require", "exports", './OntologyMappingOverview', '../FetchFromApi', "Ontologies/OntologyMappingOverview", "FetchFromApi"], function (require, exports, Overview, FetchFromApi) {
    // This is using the new API that is stable in September 2013.
    // I eventually came across the post that sort of discusses our update problem, of
    // having new attributes for nodes from late coming JSON:
    // https://groups.google.com/forum/#!msg/d3-js/ENMlOyUGGjk/YiPc8AUKCOwJ
    // http://grokbase.com/t/gg/d3-js/12cjmqc2cx/dynamically-updating-nodes-links-in-a-force-layout-diagram
    // Bostock confirms that we shouldn't bind things that aren't truly new, and instead we must
    // update element properties without binding.
    // Some ontologies now have bad names with dots in them. May need to change out id matching with:
    // '[id="node_g_'+centralOntologyAcronym+'"]'
    // This cap only affects API dispatch and rendering for nodes past the cap. It is used during
    // initialization only. Set to 0 means all nodes will be used.
    var softNodeCap = 19;
    var centralOntologyAcronym = purl().param("ontology_acronym");
    var userapikey = purl().param("userapikey");
    FetchFromApi.RetryingJsonFetcher.userapikey = userapikey;
    // Run the graph! Don't need the json really, though...
    // d3.json("force_files/set_data.json", initAndPopulateGraph);
    var graphView = new Overview.OntologyMappingOverview(centralOntologyAcronym, softNodeCap);
    graphView.initAndPopulateGraph();
});
