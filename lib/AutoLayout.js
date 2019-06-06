var BpmnModdle = require('bpmn-moddle'),
  DiFactory = require('./DiFactory'),
  assign = require('lodash/object/assign'),
   fs = require('fs'),
 emptyDi = '<bpmndi:BPMNDiagram id="BPMNDiagram_1">' +
  '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">' +
  '</bpmndi:BPMNPlane>' +
  '</bpmndi:BPMNDiagram>' +
  '</bpmn:definitions>';
var STDDIST = 50;
var padding = 10;

function AutoLayout() {
  this.moddle = new BpmnModdle();
  this.DiFactory = new DiFactory(this.moddle);
}
module.exports = AutoLayout;
AutoLayout.prototype.layoutProcess = function (xmlStr,uniqueFileName, callback) {
  self = this;
  var moddle = this.moddle;
  var tempmoddle = this.moddle;

  // create empty di section
  xmlStr = xmlStr.replace('</bpmn:definitions>', emptyDi);
  tempmoddle.fromXML(xmlStr, function (err, moddleWithoutDi,pc) {
    var errorflag = false;
    pc.warnings.some(e=>{
      if (typeof e.error !=='undefined')
      {
        errorflag=true;
        callback(e.error);
        return false;
      }
    });
    if (errorflag === true)
    {
      return false;
    }
    if (typeof err !=='undefined')
   {
    callback(err);
     return false;
   }
    var root = moddleWithoutDi.get('rootElements')[0];
    var rootDi = moddleWithoutDi.get('diagrams')[0].get('plane');
    // create di
    maximaly = 0;
    maxsuby = 0;
    maximalx = 0;
    subprocessanchors = new Map();
    laneMap = new Map();
    maxYmap = new Map();
    try {
      self._breadFirstSearch(root, rootDi);
    } catch (e) {
      callback("error");
    }
    maprdy = true;
  });
  moddle.fromXML(xmlStr, function (err, moddleWithoutDi,pc) {
    var errorflag = false;
    pc.warnings.some(e=>{
      if (typeof e.error !=='undefined')
      {
        errorflag=true;
        return false;
      }
    });
    if (errorflag === true)
    {
      return false;
    }
    if (typeof err !=='undefined')
   {
     return false;
   }
    if (typeof moddleWithoutDi ==='undefined')
    {
      return false;
    }
    var root = moddleWithoutDi.get('rootElements')[0];
    var rootDi = moddleWithoutDi.get('diagrams')[0].get('plane');
    // create di
    try {
      self._breadFirstSearch(root, rootDi);
    } catch (e) {
     console.log(e);
     return false;
    }
    maprdy = false;
    moddle.toXML(moddleWithoutDi, function (err, xmlWithDi) {
       fs.writeFileSync(nconf.get('bpmndi_filestorage') +'/'+ 'auto_layouted_bpmn_di_'+uniqueFileName+'.xml',xmlWithDi);
      callback(true);
    });
  });
};
AutoLayout.prototype._breadFirstSearch = function (parentFlowElement, parentDi) {
  var laneHeightMap = new Map();
  var movePaddingMap = new Map();
  if (typeof parentFlowElement.laneSets !== 'undefined' && typeof maprdy !== 'undefined' && maprdy == true && typeof parentFlowElement.laneSets[0].lanes !== 'undefined') {
    parentFlowElement.laneSets[0].lanes.forEach(function (lane) {
      var groupElementsYCoordinates = [];
      lane.get('flowNodeRef').forEach(function (ref) {
        if (typeof maxYmap.get(ref.id) !== 'undefined') {
          groupElementsYCoordinates.push(maxYmap.get(ref.id));
        }
      });
      var tempmin = Math.min(...groupElementsYCoordinates);
      var tempmax = Math.max(...groupElementsYCoordinates);
      var tempabs = Math.abs(tempmin - tempmax);
      var movepadding = Math.abs(Math.min.apply(null, groupElementsYCoordinates));
      laneHeightMap.set(lane.id, tempabs);
      if (!Number.isNaN(movepadding)) {
        movePaddingMap.set(lane.id, movepadding);
      } else {
        movePaddingMap.set(lane.id, 0);
      }
    });
  }
  var pos = {
    x: 0,
    y: 0,
  };
  if (typeof parentFlowElement.laneSets !== 'undefined' && typeof parentFlowElement.laneSets[0].lanes !== 'undefined') {
    parentFlowElement.laneSets[0].lanes.forEach(function (lane) {
      lane.get('flowNodeRef').forEach(function (ref) {
        ref.laneanchor = pos.y;
        ref.offset = movePaddingMap.get(lane.id);
      });
      laneMap.set(lane.name, lane.id);
      var createDi = self.DiFactory.createBpmnElementDi.bind(self.DiFactory);
      var getDefaultSize = self.DiFactory._getDefaultSize.bind(self.DiFactory);
      var childrenDi = parentDi.get('planeElement'),
        elementDi;
      size = getDefaultSize(lane.$type);
      size.width = maximalx + 2 * STDDIST;
      size.height = laneHeightMap.get(lane.id) + 80 + 2 * padding; // 80 = max height of object eg. Task

      if (typeof maprdy !== 'undefined' && maprdy == true) {
        lane.bounds = assign({}, pos, size);
        elementDi = createDi('shape', lane, pos);
        childrenDi.push(elementDi);
      }
      pos.y = pos.y + laneHeightMap.get(lane.id) + 80 + 2 * padding; // 80 = max height of object eg. Task
    });
  }
  var children = parentFlowElement.flowElements;
  var aStartEvent = getStartEvent(children);
  // groups are elements with the same distance
  var startingY = 0;
  if (typeof parentFlowElement.laneSets !== 'undefined' && typeof parentFlowElement.laneSets[0].lanes === 'undefined' && typeof maprdy !== 'undefined' && maprdy == true) {
    if (!Number.isNaN(Math.abs(Math.min(...maxYmap.values())))) {
      startingY = Math.abs(Math.min(...maxYmap.values()));
    }
  }
  var group = {
    elements: [],
    connections: [],
    anchor: {
      x: 100,
      y: startingY
    },
    distance: 0
  };
  aStartEvent.marked = true;
  aStartEvent.dist = 0;
  // queue holds visited elements
  var queue = [aStartEvent];
  var elementOrConnection,
    outgoings;
  while (queue.length !== 0) {
    // get first
    elementOrConnection = queue.shift();
    // insert element into group
    group = this._groupElement(elementOrConnection, group, parentDi);
    if (elementOrConnection.$type !== 'bpmn:SequenceFlow') {
      // only if source is an element
      outgoings = getOutgoingConnection(elementOrConnection, children);
      if (outgoings.length) {
        outgoings.forEach(function (connection) {
          // for layouting the connection
          if (!connection.marked) {
            connection.marked = true;
            connection.dist = elementOrConnection.dist + 1;
            queue.push(connection);
          }
          var target = connection.get('targetRef');
          if (!target.marked) {
            target.marked = true;
            target.dist = elementOrConnection.dist + 1;
            queue.push(target);
          }
        });
      }
      // do if subprocess found
      if (elementOrConnection.flowElements) {
        handleLayoutingSubprocesses(elementOrConnection.flowElements, parentDi, this);
      }
    }
  }
  this._layoutGroup(group, parentDi);
};
AutoLayout.prototype._groupElement = function (elementOrConnection, group, parentDi) {
  if (elementOrConnection.dist === group.distance) {
    if (elementOrConnection.$type === 'bpmn:SequenceFlow') {
      group.connections.push(elementOrConnection);
    } else {
      group.elements.push(elementOrConnection);
    }
  } else {
    var newAnchor = this._layoutGroup(group, parentDi);
    group = {
      elements: elementOrConnection.$type === 'bpmn:SequenceFlow' ? [] : [elementOrConnection],
      connections: elementOrConnection.$type === 'bpmn:SequenceFlow' ? [elementOrConnection] : [],
      anchor: newAnchor,
      distance: elementOrConnection.dist
    };
  }
  return group;
};
AutoLayout.prototype._layoutGroup = function (group, parentDi) {
  var newAnchor = this._layoutElements(group, parentDi);
  var connections = group.connections;
  this._layoutConnections(connections, parentDi);
  return newAnchor;
};
AutoLayout.prototype._layoutElements = function (group, parentDi) {

  var createDi = this.DiFactory.createBpmnElementDi.bind(this.DiFactory);
  var getDefaultSize = this.DiFactory._getDefaultSize.bind(this.DiFactory);
  var elements = group.elements,
    anchor = group.anchor;
  var bottom,
    top;
  bottom = top = anchor.y;
  var childrenDi = parentDi.get('planeElement'),
    elementDi;
  var pos = {
    x: anchor.x
  };
  var size,
    height;
  var maxWidth = 0;
  elements.forEach(function (element) {
    size = getDefaultSize(element.$type);
    height = size.height;
    maxWidth = Math.max(maxWidth, size.width);
    if (top === bottom) {
      bottom += height / 2;
      top -= height / 2;
      pos.y = top;
    } else {
      if ((anchor.y - top) < (bottom - anchor.y)) {
        // move to top
        top -= (height + STDDIST);
        pos.y = top;
      } else {
        // move to bottom
        bottom += STDDIST + height;
        pos.y = bottom;
      }
    }
    if (maximaly < Math.abs(pos.y) && !anchor.issubanchor) {
      maximaly = Math.abs(pos.y);
    }
    // set maximal y coordinate of line group elements
    if (typeof maxYmap.get(element.id) === 'undefined') {
      maxYmap.set(element.id, pos.y);
    }
    // move elements if they are elements of a line
    if (typeof element.laneanchor !== 'undefined' && !anchor.issubanchor) {
      pos.y = pos.y + element.laneanchor + element.offset + padding;
    }
    element.bounds = assign({}, pos, size);
    elementDi = createDi('shape', element, pos);
    childrenDi.push(elementDi);
    if ((typeof submaxy != "undefined") && submaxy < Math.abs(pos.y) && anchor.issubanchor) {
      submaxy = Math.abs(pos.y);
      subprocessanchors.set(group.anchor.start, submaxy);
    }
  });
  maximalx = pos.x;
  return {
    x: anchor.x + maxWidth + 2 * STDDIST,
    y: anchor.y,
    issubanchor: anchor.issubanchor,
    start: anchor.start
  };

};
AutoLayout.prototype._layoutConnections = function (connections, parentDi) {
  var createDi = this.DiFactory.createBpmnElementDi.bind(this.DiFactory);
  var childrenDi = parentDi.get('planeElement');
  connections.forEach(function (connection) {
    var connectionDi = createDi('connection', connection);
    childrenDi.push(connectionDi);
  });
};
/////// helpers //////////////////////////////////
function getStartEvent(flowElements) {
  return flowElements.filter(function (e) {
    return e.$type === 'bpmn:StartEvent';
  })[0];
}

function getOutgoingConnection(source, flowElements) {
  return flowElements.filter(function (e) {
    return e.$type === 'bpmn:SequenceFlow' && e.get('sourceRef').id === source.id;
  });
}

function handleLayoutingSubprocesses(flowElements, parentDi, dis) {
  submaxy = 0;
  var aSubprocessFlowElements = flowElements.slice();
  if (aSubprocessFlowElements.length > 0) {
    var aStartEvent_sub = getStartEvent(aSubprocessFlowElements);
    aStartEvent_sub.marked = true;
    aStartEvent_sub.dist = 0;
    maxsuby = subprocessanchors.get(aStartEvent_sub.id);
    var finaly;
    if (typeof maprdy !== 'undefined' && maprdy == true) {
      finaly = maxsuby;
    } else {
      finaly = 0;
    }
    var subProcessGroup = {
      elements: [],
      connections: [],
      anchor: {
        x: 100,
        y: finaly,
        issubanchor: true,
        start: aStartEvent_sub.id
      },
      distance: 0,
    };
    // queue holds visited sub process elements
    var subProcessQueue = [aStartEvent_sub];
    var subProcessElementOrConnection,
      subProcessOutgoings;
    while (subProcessQueue.length !== 0) {
      // get first
      subProcessElementOrConnection = subProcessQueue.shift();
      // insert element into group
      subProcessGroup = dis._groupElement(subProcessElementOrConnection, subProcessGroup, parentDi);
      // only if source is an element
      subProcessOutgoings = getOutgoingConnection(subProcessElementOrConnection, aSubprocessFlowElements);
      if (subProcessOutgoings.length) {
        subProcessOutgoings.forEach(function (subProcessConnection) {
          // for layouting the connection
          if (!subProcessConnection.marked) {
            subProcessConnection.marked = true;
            subProcessConnection.dist = subProcessElementOrConnection.dist + 1;
            subProcessQueue.push(subProcessConnection);
          }
          var subProcessTarget = subProcessConnection.get('targetRef');
          if (!subProcessTarget.marked) {
            subProcessTarget.marked = true;
            subProcessTarget.dist = subProcessElementOrConnection.dist + 1;
            subProcessQueue.push(subProcessTarget);
          }
        });
        if (subProcessElementOrConnection.flowElements) {
          handleLayoutingSubprocesses(subProcessElementOrConnection.flowElements, parentDi, dis);
        }
      }
    }
    dis._layoutGroup(subProcessGroup, parentDi);
  }
}