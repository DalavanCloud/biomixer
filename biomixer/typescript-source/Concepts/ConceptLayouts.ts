///<reference path="headers/require.d.ts" />
///<reference path="headers/d3.d.ts" />

///<amd-dependency path="../JQueryExtension" />

///<amd-dependency path="GraphView" />
///<amd-dependency path="Concepts/ConceptGraph" />


import GraphView = require('../GraphView');
import ConceptGraphView = require('./ConceptPathsToRoot');
import ConceptGraph = require('./ConceptGraph');

export class ConceptLayouts {

    constructor(
        public forceLayout: D3.Layout.ForceLayout,
        public graph: ConceptGraph.ConceptGraph,
        public graphView: ConceptGraphView.ConceptPathsToRoot,
        public centralConceptUri: ConceptGraph.ConceptURI
    ){
        
    }
    
    
    addMenuComponents(menuSelector: string, softNodeCap: number){
        // Add the butttons to the pop-out panel
        $(menuSelector).append($("<input>")
                .attr("class", "layoutButton")
                .attr("id", "forceLayoutButton")
                .attr("type", "button")
                .attr("value", "Force-Directed Layout"));
        $(menuSelector).append($("<br>"));
        
        $(menuSelector).append($("<input>")
                .attr("class", "layoutButton")
                .attr("id", "circleLayoutButton")
                .attr("type", "button")
                .attr("value", "Circle Layout"));
        $(menuSelector).append($("<br>"));
        
        $(menuSelector).append($("<input>")
                .attr("class", "layoutButton")
                .attr("id", "centerLayoutButton")
                .attr("type", "button")
                .attr("value", "Center Layout"));
        $(menuSelector).append($("<br>"));
        
        $(menuSelector).append($("<input>")
            .attr("class", "layoutButton")
            .attr("id", "horizontalTreeLayoutButton")
            .attr("type", "button")
            .attr("value", "Horizontal Tree Layout"));
        $(menuSelector).append($("<br>"));
    
        $(menuSelector).append($("<input>")
            .attr("class", "layoutButton")
            .attr("id", "verticalTreeLayoutButton")
            .attr("type", "button")
            .attr("value", "Vertical Tree Layout"));
        $(menuSelector).append($("<br>"));
    
       $(menuSelector).append($("<input>")
            .attr("class", "layoutButton")
            .attr("id", "radialLayoutButton")
            .attr("type", "button")
            .attr("value", "Radial Layout"));
    
        
        d3.selectAll("#circleLayoutButton").on("click", this.runCircleLayoutLambda());
        d3.selectAll("#forceLayoutButton").on("click", this.runForceLayoutLambda());
        d3.selectAll("#centerLayoutButton").on("click", this.runCenterLayoutLambda());
        d3.selectAll("#horizontalTreeLayoutButton").on("click", this.runHorizontalTreeLayoutLambda());
        d3.selectAll("#verticalTreeLayoutButton").on("click", this.runVerticalTreeLayoutLambda());
        d3.selectAll("#radialLayoutButton").on("click", this.runRadialLayoutLambda());
    
    }
    
    
    transitionNodes(){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
        d3.selectAll("g.node_g")
            .transition()
            .duration(2500)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
           
        d3.selectAll(GraphView.BaseGraphView.linkSvgClass)
            .transition()
            .duration(2500)
            .attr("points", outerThis.graphView.computePolyLineLinkPointsFunc);
    }
    
    getOntologyAcronym(conceptUri){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
       // console.log(graphNodes);
        var ontologyAcronym;
        
        graphNodes.forEach(function(node){
            if(node.rawConceptUri===conceptUri){
                ontologyAcronym = node.ontologyAcronym;    
            }
        });
        
       // console.log(ontologyAcronym);
        return ontologyAcronym;
    }
    
    getRootIndex(ontologyAcronym){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
       // var centralUri = outerThis.graph.
        
        var index = 0;
        var rootId = null;
        var rootFound=false;
        // not the best algorithm. Need to look into improving it
       // console.log(graphLinks);
        
      //  var centralOntologyAcronym = outerThis.graph.graphD3Format.
        
        graphLinks.forEach(function(a){
            if((outerThis.getOntologyAcronym(a.sourceId)===ontologyAcronym)&&(outerThis.getOntologyAcronym(a.targetId)===ontologyAcronym)){
                if(rootFound==false){
                    rootFound=true;
                    graphLinks.forEach(function(b){
                        if(a.sourceId==b.targetId){
                            //rootId = b.sourceId;
                            rootFound = false;
                        }
                    });
                                        
                   if(rootFound==true){
                       rootId = a.sourceId;
                   }
                }
            }
            
        });
        
        graphNodes.forEach(function(n){
            var i = graphNodes.indexOf(n);
            if(n.rawConceptUri==rootId){
                index = i;
            }
        });
        return index;   
    }
    
  //old buildTree function  
  /*  buildTree(width, height){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
        var ontologyAcronym = outerThis.getOntologyAcronym(outerThis.centralConceptUri);
        
        var tree = d3.layout.tree()
            .size([width, height])
            .children(function(d){  
                var arrayOfNodes = []; 
                graphLinks.forEach(function(b){
                    if(b.sourceId==d.rawConceptUri&&b.relationType!="maps to"){
                        var targetNode= {};
                        graphNodes.forEach(function(c){
                           if(c.rawConceptUri==b.targetId){
                               //then check target node c has more than one parent
                               //if node has more than one parent
                               //compare depths of parents
                               //if d has a higher rank, make 
                               
                               
                               targetNode = c;
                           }
                        });
                        arrayOfNodes.push(targetNode);
                     }
                });
                     
                return arrayOfNodes;
            });
    
        tree.nodes(graphNodes[outerThis.getRootIndex(ontologyAcronym)]);
        return tree;
    }*/
    
    getChildren(rootIndex){
        var children = [];
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
        var rootNode = graphNodes[rootIndex];
        graphLinks.forEach(function(b){
            if(b.sourceId==rootNode.rawConceptUri&&b.relationType!="maps to"){
                var child= {};
                graphNodes.forEach(function(c){
                    if(c.rawConceptUri==b.targetId){
                        child = c;
                    }
                });
                children.push(child);
            }
        });
    
        return children;
    }
    
    calculateDepth(rootIndex){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
        var children = outerThis.getChildren(rootIndex);
        console.log(children);
        if(children.length<=0){
            return;
        }else{
            children.forEach(function(child){
                //child.depth = graphNodes[rootIndex].depth+1;
                
                console.log(child);
                //var index = outerThis.getIndex(child);
                outerThis.calculateDepth(graphNodes.indexOf(child));
            });
        }
    }
    
    buildTree(width, height){
        var outerThis = this;
        var graphNodes = outerThis.graph.graphD3Format.nodes;
        var graphLinks = outerThis.graph.graphD3Format.links;
        var ontologyAcronym = outerThis.getOntologyAcronym(outerThis.centralConceptUri);
        
        var index = outerThis.getRootIndex(ontologyAcronym);
        outerThis.calculateDepth(index);
        var tree = d3.layout.tree()
            .size([width, height])
            .children(function(d){  
                var arrayOfNodes = []; 
                graphLinks.forEach(function(b){
                    if(b.sourceId==d.rawConceptUri&&b.relationType!="maps to"){
                        var targetNode= {};
                        graphNodes.forEach(function(c){
                           if(c.rawConceptUri==b.targetId){
                               //then check target node c has more than one parent
                               //if node has more than one parent
                               //compare depths of parents
                               //if d has a higher rank, make 
                               
                               
                               targetNode = c;
                           }
                        });
                        arrayOfNodes.push(targetNode);
                     }
                });
                     
                return arrayOfNodes;
            });
    
        tree.nodes(graphNodes[index]);
        return tree;
    }
    
    runRadialLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.stop();
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
            var ontologyAcronym = outerThis.getOntologyAcronym(outerThis.centralConceptUri);
            var treeWidth = 360;
            var treeHeight = outerThis.graphView.visHeight()/2-100; 
            var tree = outerThis.buildTree(treeWidth, treeHeight);
  
            $.each(graphNodes.filter(function (d, i){return d.ontologyAcronym===ontologyAcronym}),
                function(index, element){
                    var radius = element.y;
                    var angle = element.x/180 * Math.PI;
                    graphNodes[index].x = outerThis.graphView.visWidth()/2 + radius*Math.cos(angle); 
                    graphNodes[index].y = outerThis.graphView.visHeight()/2 + radius*Math.sin(angle); 
                }
            );
            outerThis.transitionNodes();
        };
    }

    runVerticalTreeLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.stop();
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
            var ontologyAcronym = outerThis.getOntologyAcronym(outerThis.centralConceptUri);
            var treeWidth = outerThis.graphView.visWidth();
            var treeHeight = outerThis.graphView.visHeight()-300; 
            var tree = outerThis.buildTree(treeWidth, treeHeight);
            $.each(graphNodes.filter(function (d, i){return d.ontologyAcronym===ontologyAcronym}),
                  function(index, element){
                      graphNodes[index].x = element.x; 
                      graphNodes[index].y = element.y+150; 
                     // console.log(graphNodes[index]);
                     // console.log(graphNodes[index].depth);

                  }
            );
            outerThis.transitionNodes();
        };
    }
    
    runHorizontalTreeLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.stop();
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
            var treeWidth = outerThis.graphView.visHeight()-100;
            var treeHeight = outerThis.graphView.visWidth()-300;
            var tree = outerThis.buildTree(treeWidth, treeHeight);
            var ontologyAcronym = outerThis.getOntologyAcronym(outerThis.centralConceptUri);

            $.each(graphNodes.filter(function (d, i){return d.ontologyAcronym===ontologyAcronym}),
                  function(index, element){
                      var xValue = element.x
                      graphNodes[index].x = element.y+150; 
                      graphNodes[index].y = xValue; 
                  }
            );
            outerThis.transitionNodes();
        };
    }
    
    runCircleLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.stop();
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
                
            var numberOfConcepts = Object.keys(graphNodes).length;
    
            var anglePerNode =2*Math.PI / numberOfConcepts; // 360/numberOfMappedOntologies;
            var arcLength = outerThis.graphView.linkMaxDesiredLength();
            var i = 0;
            
            $.each(graphNodes,
                function(index, element){
                    var acronym = index;
    
                    if(typeof acronym === "undefined"){
                        console.log("Undefined concept entry");
                    }
                    
                    var angleForNode = i * anglePerNode; 
                    i++;
                    graphNodes[index].x = outerThis.graphView.visWidth()/2 + arcLength*Math.cos(angleForNode); // start in middle and let them fly outward
                    graphNodes[index].y = outerThis.graphView.visHeight()/2 + arcLength*Math.sin(angleForNode); // start in middle and let them fly outward
                }
            );
            
            outerThis.transitionNodes();
    
        };
    }
    
    runCenterLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.stop();
            var graphNodes = outerThis.graph.graphD3Format.nodes;
            var graphLinks = outerThis.graph.graphD3Format.links;
                
            var numberOfConcepts = Object.keys(graphNodes).length-1;
    
            var anglePerNode =2*Math.PI / numberOfConcepts; // 360/numberOfMappedOntologies;
            var arcLength = outerThis.graphView.linkMaxDesiredLength();
            var i = 0;
            
            $.each(graphNodes,
                function(acronym, node){
                    if(typeof acronym === "undefined"){
                        console.log("Undefined concept entry");
                    }
                    
                    if(node.rawConceptUri!=outerThis.centralConceptUri){
                        var angleForNode = i * anglePerNode; 
                        i++;
                        node.x = outerThis.graphView.visWidth()/2 + arcLength*Math.cos(angleForNode); // start in middle and let them fly outward
                        node.y = outerThis.graphView.visHeight()/2 + arcLength*Math.sin(angleForNode); // start in middle and let them fly outward
                    }else{
                        node.x = outerThis.graphView.visWidth()/2; 
                        node.y = outerThis.graphView.visHeight()/2;
                        
                        //alert(node.id+centralConceptUri);
                    }
                }
            );
            outerThis.transitionNodes();
        };
    }
    
    
    runForceLayoutLambda(){
        var outerThis = this;
        return function(){
            outerThis.forceLayout.friction(0.3) // use 0.2 friction to get a very circular layout
            .gravity(0.05) // 0.5
            .charge(-30); // -100
            
            outerThis.forceLayout.on("tick", outerThis.graphView.onLayoutTick());
            outerThis.forceLayout.start();
    
        };
    }
    
}