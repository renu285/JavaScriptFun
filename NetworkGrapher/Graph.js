function startNetwork() {
  // create an array with nodes
  nodesArray = [];
  nodes = new vis.DataSet(nodesArray);

  // create an array with edges
  edgesArray = [ ];
  edges = new vis.DataSet(edgesArray);

  // create a network
  var container = document.getElementById("NetworkGraph");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    nodes: {
      shape: "dot",
      size: 10,
    },
    physics: {
      hierarchicalRepulsion: {
        nodeDistance: 140
      },
    }
  };
  network = new vis.Network(container, data, options);
}


function changeNodeColor(ChangeColorObj){
  console.log("Changing color for : " + ChangeColorObj.Id + " " + String(ChangeColorObj.Color))
  var Id = ChangeColorObj.Id;
  nodes.update([{ id: Id, color: { background: ChangeColorObj.Color } }]);
}

function addNode(NewNodeObj) {
  var nodeLabel = String(NewNodeObj.Id)
  nodes.add({ id: NewNodeObj.Id, label: nodeLabel,color: NewNodeObj.Color});
}



function DoesEdgeExist(From,To,existingEdges){
  var isConnected = false;
  existingEdges.forEach((item, i) => {
      var edge = edges.get( item )
      //console.log(edge)
      if(edge.from == From && edge.to == To){
        console.log("Edge already exists" + From + " "  + To)
        isConnected = true;
      }
  });
  return isConnected;
}

function addEdges(LinkStatusObj) {

  var srcId = LinkStatusObj.Id;
  var NeighborArray = LinkStatusObj.Neighbors;
  var existingEdges = network.getConnectedEdges(srcId);
  NeighborArray.forEach((member, i) => {
    var edgeExists = DoesEdgeExist(srcId,member,existingEdges)
    if(edgeExists == false){
      console.log("Adding edge From " + srcId + " To " + member)
      edges.add({from:srcId, to:member,color:'black', arrows: "to"})
    }
  });
}
