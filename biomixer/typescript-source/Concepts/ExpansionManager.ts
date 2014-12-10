///<reference path="headers/require.d.ts" />

///<amd-dependency path="Concepts/ConceptGraph" />
///<amd-dependency path="UndoRedo/UndoRedoManager" />
///<amd-dependency path="GraphModifierCommand" />
///<amd-dependency path="ExpansionSets" />

import ConceptGraph = require("./ConceptGraph");
import UndoRedoManager = require("../UndoRedo/UndoRedoManager");
import GraphModifierCommand = require("../GraphModifierCommand");
import ExpansionSets = require("../ExpansionSets");

export class ExpansionManager{
    
    public edgeRegistry: EdgeRegistry;
    
    constructor(
        private undoBoss: UndoRedoManager.UndoRedoManager
    ){
        this.edgeRegistry = new EdgeRegistry();
    }
    
    public purgeInaccessibleNode(conceptUri: ConceptGraph.ConceptURI){
        this.edgeRegistry.purgeInaccessibleNode(conceptUri);
    }
    
     /**
     * Some nodes result in 403, 404 or other errors when REST calls re amde, and they will not be available.
     * We have to account for this nodes to offer the user accurate (and non-confusing) expansion estimates.
     */
    public nodeIsInaccessible(conceptUri: ConceptGraph.ConceptURI){
        return this.edgeRegistry.nodeIsInaccessible(conceptUri);
    }
    
    /**
     * This is used to determine things like if a given mapping arc is to be fully rendered,
     * or if the neighbors of a term we are processing should be fetched. That depends on hwo
     * we got the term to begin with. That context is available in the undo stack of expansions,
     * which works well when we have undone or redone them, and works better than a previous
     * system of explicit whitelisting for expansions.
     *
     * If this returns true, the node in question is allowed to fetch and add related nodes within the expansion
     * type specified. Those nodes do not (normally) inherit this property.
     * 
     * If the paths to root functionality were not fulfilled via a special REST call, that system would allow
     * expanded parent nodes to inherit this privelege and pass it on to their parents.
     * 
     * The optional flag should really only be used internally by the class, but change the method semantics to
     * determine if the expansion set associated with the node is currently fully loaded into the graph.
     */
     wasConceptClearedForExpansion(conceptUri: ConceptGraph.ConceptURI, expansionType: ConceptGraph.PathOption): boolean{
        // Not willing to remove the more elaborate command status approach yet.
        // It might become relevant again. Otherwise...I prefer this simple obolean version of the method.
        // return this.findConceptExpansionSetInHistory(conceptUri, expansionType).cleared;
        var returnVal = false;
        var crumbTrail = this.undoBoss.getCrumbHistory();
        var conceptUriForIds: string = String(conceptUri);
        for(var i = crumbTrail.length - 1; i >= 0; i--){
            var command = crumbTrail[i];
            var nodeInteractions = command.nodeInteraction(conceptUriForIds);
            if(null == nodeInteractions){
                return returnVal;
            } else if(nodeInteractions.indexOf(expansionType) !== -1){
                returnVal = true;
                return returnVal;
            } else if(nodeInteractions.indexOf(GraphModifierCommand.GraphRemoveNodesCommand.deletionNodeInteraction) !== -1){
                returnVal = false;
                return returnVal;
            }
        }
        return returnVal;
    }
        
    /**
     * Collect all expansion sets that are from the current undo level backwards.
     * Do not return ones that are empty (expansions that resulted in no nodes being added),
     * and do not return expansion sets for which no node is rendered currently.
     */
    getActiveExpansionSets(): Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>{
        var expansionSets = new Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>();
        var history = this.undoBoss.getCrumbHistory();
        this.recursiveExpansionSets(history, expansionSets);
        return expansionSets;
    }
    
    private recursiveExpansionSets(commands: Array<UndoRedoManager.ICommand>, expansionSets: Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>){
        for(var i = commands.length -1; i >= 0; i--){
            var command = commands[i];
            if(command instanceof GraphModifierCommand.GraphAddNodesCommand){
                var expansionSet = (<GraphModifierCommand.GraphAddNodesCommand<any>>command).expansionSet
                if(expansionSet.nodes.length > 0 && expansionSet.getNumberOfNodesCurrentlyInGraph() > 0){
                    expansionSets.push(expansionSet);
                }
            } else if(command instanceof GraphModifierCommand.GraphCompositeNodeCommand){
                var moreCommands = (<GraphModifierCommand.GraphCompositeNodeCommand<any>>command).commands;
                this.recursiveExpansionSets(moreCommands, expansionSets);
            }
        }
    }
    
    getExpansionSetsThatNodeIsParentOf(node: ConceptGraph.Node): Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>{
        var parentageSets = new Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>();
        var allSets = this.getActiveExpansionSets();
        for(var i = 0; i < allSets.length; i++){
            var parentSet = allSets[i];
            if(parentSet.parentNode === node){
               parentageSets.push(parentSet);
            }
        }
        return parentageSets;
    }
    
    getExpansionSetsThatNodeIsChildOf(node: ConceptGraph.Node){
        var childSets = new Array<ExpansionSets.ExpansionSet<ConceptGraph.Node>>();
        var allSets = this.getActiveExpansionSets();
        for(var i = 0; i < allSets.length; i++){
            var childSet = allSets[i];
            if(childSet.nodes.indexOf(node) != -1){
               childSets.push(childSet);
            }
        }
        return childSets;
    }
    
}

export class EdgeRegistry {
    
    // NB We cannot simplify this away by adding edges directly to node objects, since node objects are not instantiated when
    // edges are discovered, but we can associate them with node ids.
    // Maps conceptIds not present in the graph to concept ids in the graph for which an edge exists.
    // To track edges that we know about that haven't yet been added to the graph (by node not yet in graph and node in graph and type).
    // Edges must be tracked before they are valid, or else a superfluous amount of REST calls would be needed.
    // Need to always keep these edges, and to map by both source and target. We only get them when parsing, and we don't re-parse
    // when we have stored objects encapsulating previous data.
    
    // Made registry flat; used to be more structured, but it complicated without fulfilled requirements for said structure.
    private twoWayEdgeRegistry: {[oneNodeId: string]: ConceptGraph.Link[] } = {};
    private inaccessibleNodes: Array<ConceptGraph.ConceptURI> = [];
    
    /**
     * If the edge is already represented in the registry, it is returned, and the instance passed in will
     * not be added to the registry.
     */
    addEdgeToRegistry(edge: ConceptGraph.Link, graph: ConceptGraph.ConceptGraph): ConceptGraph.Link{
        // Assumes only mapping edge types. Change that if things change, right? ;)
        var sourceStr = String(edge.sourceId);
        var targetStr = String(edge.targetId);
        
        // Should have guarded before, but I'll guard here too
        if(!graph.nodeIsAccessible(edge.sourceId) || !graph.nodeIsAccessible(edge.targetId)){
            return null; // same as if the edge provided was newly registered??? Hmm...
        }
        
        // Source oriented
        if(!(sourceStr in this.twoWayEdgeRegistry)){
            this.twoWayEdgeRegistry[sourceStr] = [];
        }
        
        // Target oriented
        if(!(targetStr in this.twoWayEdgeRegistry)){
            this.twoWayEdgeRegistry[targetStr] = [];
        }
        
        // Need type as an index as well because some ontologies could have multiple edge types between entities.
        var existingEdges = $.grep(this.twoWayEdgeRegistry[sourceStr],
            function(e: ConceptGraph.Link, i: number): boolean{
                return e.targetId === edge.targetId && e.sourceId === edge.sourceId && e.relationType === edge.relationType;
            }
        );
        
        if(existingEdges.length > 0){
            return existingEdges[0];
        } else {
            this.twoWayEdgeRegistry[sourceStr].push(edge);
            this.twoWayEdgeRegistry[targetStr].push(edge);
            return null;
        }
        
        
    }
    
    getEdgesFor(nodeId: string):  ConceptGraph.Link[] {
        if(undefined === this.twoWayEdgeRegistry[nodeId]){
            return [];
        }
        return this.twoWayEdgeRegistry[nodeId];
    }
    
    public purgeInaccessibleNode(conceptUri: ConceptGraph.ConceptURI){
        // Although I wanted to purge these invalid edges, they will be created
        // again due to re-parsing of data as necessary, so really I need to tag
        // them and not use them.
        // Wait...the caller is creating an edge and registering it, not just getting the edge from here...
        // when the edge is registered, it means we use the one passed in...
        var sourceIdStr = String(conceptUri);
                
        for(var oneIdStr in this.twoWayEdgeRegistry){
            var edges: Array<ConceptGraph.Link> = this.twoWayEdgeRegistry[oneIdStr];

            this.twoWayEdgeRegistry[oneIdStr] = $.grep(edges,
                (edge)=>{
                    return !(edge.sourceId === conceptUri || edge.targetId === conceptUri);
                }
            );
            
            // Clean out map entries that have no array within them
            if(this.twoWayEdgeRegistry[oneIdStr].length === 0){
                delete this.twoWayEdgeRegistry[oneIdStr];
            }
        }
        
        this.inaccessibleNodes.push(conceptUri);
    }
    
    public nodeIsInaccessible(conceptUri: ConceptGraph.ConceptURI){
        return this.inaccessibleNodes.indexOf(conceptUri) !== -1;
    }

}