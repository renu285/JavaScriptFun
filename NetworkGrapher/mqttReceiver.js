// Create a client instance
client = new Paho.MQTT.Client("192.168.2.59", Number(9001), "JavaScriptClient");
client.startTrace();

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});
console.log("attempting to connect...")


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("NewNode");
  client.subscribe("ReceivedLinkStatus");
  client.subscribe("ChangeColor");
  client.subscribe("OnOffStatusChanged");
  client.subscribe("DataPacket");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("Topic: " + message.destinationName);
  console.log("onMessageArrived:"+message.payloadString);

  if(message.destinationName == "ReceivedLinkStatus"){
    var LinkStatusObj = JSON.parse(message.payloadString);
    addEdges(LinkStatusObj)
  }

  if(message.destinationName == "NewNode"){
    var NewNodeObj = JSON.parse(message.payloadString);
    addNode(NewNodeObj)
  }

  if(message.destinationName == "ChangeColor"){
    var ChangeColorObj = JSON.parse(message.payloadString);
    changeNodeColor(ChangeColorObj)
  }
}
