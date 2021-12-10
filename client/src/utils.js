import {
  isNode,
  isEdge,
  removeElements,
  addEdge,
  getOutgoers,
  updateEdge,
  getConnectedEdges
} from 'react-flow-renderer';
import {
  getCourse,
  updateUserFlowElements,
  updateUserFlow,
  createUserFlow,
  deleteUser,
  // fetchCurrentUser,
  // signUp,
  // signIn,
  getAllUserFlows,
  fetchAllCourses,
  removeFlow,
  getFlowInfo
} from './api';

import createEdge from './components/GraphPage/customEdges/createEdge';
import dagre from 'dagre';

class Exception {
  /**
   * Custom exception class
   * @param {String} name Error to throw
   * @param {String} message Extra info to return
   */
  constructor(name, message = '') {
    this.name = name;
    this.message = message;
  }
}

/**
 * Genereates a Node from raw course data
 * @param {Object} courseData The exact course object retrieved from the DB
 * @throws InvalidCourseNum
 * @returns a Node object ready to be inserted to the Flow
 */
export const generateNode = async (courseNum, options) => {
  const courseData = (await getCourse(courseNum)).data;
  if (!courseData) {
    throw new Exception('InvalidCourseNum', courseNum);
  }

  const { info, courseNumber, prerequisites } = courseData;

  return {
    id       : courseNumber,
    position : { x: 0, y: 0 },
    type     : options.type,
    data     : { label: courseNumber, prerequisites, ...info }
  };
};

/**
 * Removes a user from the database
 * @param {String} userGoogleId The google id associated with a user
 */
export const deleteUserObj = async userGoogleId => {
  await deleteUser(userGoogleId);
};
/**
 * Function to call each time to save the current state of the flow's elements
 * @param {String} flowID the autogenerated id from mongodb for each flow
 * @param {[Object]} elements Elements array containing all nodes and edges
 */
export const autosave = async (flowID, elements) => {
  // TODO: need to check valid input
  await updateUserFlowElements(flowID, elements);
};

/**
 * Adds edges between a course node and its prereqs (if they exist in the graph)
 * @param {object} node A node that represents a course in the graph
 * @param {[Object]} elements Elements array containing all nodes and edges
 */
export const connectPrereqs = (node, elements) => {
  //Get id and prereqs for the course that is being added
  const { id: targetId, type: targetType, data: { prerequisites: prereqs } } = node;
  console.log('new node');
  console.log(`${targetId}: ${prereqs}`);

  //Naive approach: Checks if incoming node's prereqs are already in the flow
  elements.map(sourceNode => {
    // checks if any existing node should point to the new node
    if (prereqs.includes(sourceNode.id)) {
      const newEdge = createEdge(sourceNode.id, sourceNode.type, targetId, targetType);
      elements.push(newEdge); //Add the new edge to the list
    }

    // checks if the new node should connect to the existing nodes
    if (
      sourceNode.data &&
      sourceNode.data.prerequisites &&
      sourceNode.data.prerequisites.includes(targetId)
    ) {
      const newEdge = createEdge(targetId, targetType, sourceNode.id, sourceNode.type);
      elements.push(newEdge); //Add the new edge to the list
    }
  });
  return elements;
};

// export const getUserFlowNames = async(googleId) => {
//   await getAllUserFlows(googleId);
// }

/**
 * Determines if a node is able to be taken based on the types of its prereqs in the graph
 * @param {object} node A node that represents a course in the graph
 * @param {[Object]} elements Elements array containing all nodes and edges
 */
export const determineType = (course, elements) => {
  //Todo: find a solution to accomodate optional prereqs.
  //This solution assumes that a course cannot be taken until all its prereqs are taken
  const prereqs = course['data'].prerequisites;

  //If a single prereq is not fulfilled, the course cannot be taken
  let type = 'courseCanTake';
  if (elements) {
    elements.map(el => {
      if (prereqs.includes(el.id) && el.type !== 'courseTaken') {
        type = 'courseCannotTake';
      }
    });
  }
  return type;
};

/**
 * Function to call to update a flows information
 * @param {String} flowID the autogenerated id from mongodb for each flow
 * @param {{Object}} changes in the json form (name and major keys)
 */
export const updateFlow = async (flowID, changes) => {
  await updateUserFlow(flowID, changes);
};

/**
 * Function to call to create new flow
 * @param {String} userGoogleId user's googleId
 * @param {String} name name of the flow
 * @param {String} major major of the flow
 */
export const createNewFlow = async (googleId, name, major, elements = []) => {
  await createUserFlow(googleId, name, major, elements);
};

export const deleteFlow = async flowID => {
  await removeFlow(flowID);
};

/**
 * Function to call when trying to find current user data
 * @param {String} userID the google ID
 */
// export const currentUser = async userID => {
//   return await fetchCurrentUser(userID);
// };

export const getUserFlowNames = async userID => {
  // TODO: need to check valid input
  return await getAllUserFlows(userID);
};

/**
 * Function to call when signing a user up
 * @param {[Object]} profileObject object of user information
 */
// export const signup = async profileObject => {
//   await signUp(profileObject);
// };

/**
 * Function to call when signing up
 * @param {String} userID the google ID
 */
// export const signin = async userID => {
//   await signIn(userID);
// };

/**
 * Gets a list of courses with revalent information for displaying as search results
 * @returns List of course information
 */
export const getAllCourses = async () => {
  // TODO: need to check valid input
  const allCourses = await fetchAllCourses();
  const listing = allCourses.map(course => ({
    label      : course.courseNumber,
    courseInfo : course.info.description,
    courseID   : course._id
  }));
  return listing;
};

/**
 * For getting the elements array of any given flow
 * @param {String} flowID Id of Flow
 * @returns The elements array associated with a Flow
 */
export const getFlowElements = async flowID => {
  const elements = (await getFlowInfo(flowID)).data.elements;
  // console.log(elements);
  return elements;
};

/**
 *! Experimenting with debounce function for limiting autosave occurances
 * NOT working
 * @param {Function} func
 * @param {number} timeout timeout in miliseconds
 */
export const debounce = (func, timeout = 300) => {
  console.log(func);
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

export const addCourse = async (currentCourse, elements, saveForUndo, taken) => {
  const courseNum = currentCourse;

  // Determines what type of node to add
  const type = taken ? 'courseTaken' : 'courseCannotTake';

  const newCourse = await generateNode(courseNum, { type });

  //Check if course is already present in the flow
  if (elements && elements.filter(el => el.id === newCourse.id).length !== 0) {
    throw newCourse.id + ' already present in the flow, it cannot be added!';
  }

  //If the course is not taken, it is either courseCannotTake or courseCanTake
  if (!taken) {
    newCourse.type = determineType(newCourse, elements);
  }

  // Makes sure elements isn't empty
  let newElements;
  if (!elements) {
    newElements = [ newCourse ];
  } else {
    newElements = [ ...elements, newCourse ];
  }

  //Connect the new course to its prereqs, save element state, and change layout
  let connectedElements = connectPrereqs(newCourse, newElements);
  connectedElements = getLayoutedElements(connectedElements);
  connectedElements = traverseBFS(newCourse, connectedElements);
  saveForUndo(connectedElements);
  return connectedElements;
};

export const changeOutgoerType = (node, targetList, elements) => {
  let numTargets = targetList.length;
  let newType = null;

  //Iterate through, determine the correct type, and modify the outgoing node
  for (let i = 0; i < numTargets; i++) {
    newType = determineType(targetList[i], elements);
    elements = elements.map(el => {
      if (el.id === targetList[i].id) {
        el.type = newType;
      }
      return el;
    });

    /**
     * The portion of code below works for updating node edges;
     * For some reason putting it into its own function updateNodeEdges was
     * not updating the elements array correctly
     */
    let sourceNode = node;
    let targetNode = targetList[i];
    let targetType = newType;
    let edgeId = sourceNode.id + '-' + targetNode.id;
    elements = elements.map(el => {
      if (el.id === edgeId) {
        el = createEdge(el.source, sourceNode.type, el.target, targetType);
      }
      return el;
    });
  }
  return elements;
};

//WARNING: not working yet
export const updateNodeEdges = (sourceNode, targetNode, targetType, elements) => {
  let edgeId = sourceNode.id + '-' + targetNode.id;
  elements = elements.map(el => {
    if (el.id === edgeId) {
      el = createEdge(el.source, sourceNode.type, el.target, targetType);
    }
    return el;
  });
  /*
  let nodeList = [ node ];
  let connectedEdges = getConnectedEdges(nodeList, elements);
  connectedEdges.map(edge => {
    if (edge.source == node.id) {
      //console.log(node.type);
      //console.log(targetType);
      let newEdge = createEdge(edge.source, node.type, edge.target, targetType);
      //console.log(edge)
      console.log(newEdge);
      console.log(edge.id);

      updateEdge(edge, newEdge, elements);
      //console.log(elements);
    }
  });
*/
};

/**
 * Generates all prereqs of a given course
 * TODO: implement topological sort to include all prereqs
 *
 * @param {Object} data data field of a course node
 * @param {[Object]} elements elements array
 * @param {function} saveForUndo call with updated elements array
 * @param {Boolean} taken whether the given course has been taken or not
 */
export const generatePrereq = async (data, elements, saveForUndo) => {
  console.log(data);
  console.log('generate req');
  if (!data.prerequisites) {
    console.log('Course has no prereqs');
    return;
  }

  let prereqArray = data.prerequisites;
  for (let prereq of prereqArray) {
    try {
      elements = await addCourse(prereq, elements, saveForUndo, false);
    } catch (e) {
      console.error(e);
    }
  }
};

/**
 * Function to change the layout of the elements
 * @param @param {[Object]} elements elements array
 */
export const getLayoutedElements = elements => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 105;
  const nodeHeight = 45;

  const isHorizontal = false;
  dagreGraph.setGraph({ rankdir: 'TB' });

  elements.forEach(el => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
    } else {
      dagreGraph.setEdge(el.source, el.target);
    }
  });

  dagre.layout(dagreGraph);

  return elements.map(el => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id);
      el.targetPosition = isHorizontal ? 'left' : 'top';
      el.sourcePosition = isHorizontal ? 'right' : 'bottom';

      // Unfortunately we need this little hack to pass a slightly different position
      // to notify react flow about the change. Moreover we are shifting the dagre node position
      // (anchor=center center) to the top left so it matches the react flow node anchor point (top left).
      el.position = {
        x : nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y : nodeWithPosition.y - nodeHeight / 2
      };
    }

    return el;
  });
};

export const traverseBFS = (root, elements) => {
  //Initialize queue with root
  let queue = [ root ];

  //Set of elements that were visited
  const visited = new Set();

  //Run until queue is empty
  while (queue.length) {
    let curr = queue.shift(); //Add current node to queue
    let children = getOutgoers(curr, elements); //Get current node's children

    if (children.length) {
      //Change children's type based on current and modify the elements list
      elements = changeOutgoerType(curr, children, elements);
      for (const child of children) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }
    }
  }

  return elements;
};
