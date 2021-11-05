import { isNode, isEdge, removeElements, addEdge } from 'react-flow-renderer';
import { getCourse, updateUserFlowElements, currentUser, signUp, signIn } from './api';

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
 * Function to call each time to save the current state of the flow's elements
 * @param {String} flowID the autogenerated id from mongodb for each flow
 * @param {[Object]} elements Elements array containing all nodes and edges
 */
export const autosave = async (flowID, elements) => {
  // TODO: need to check valid input
  await updateUserFlowElements(flowID, elements);
};

/**
 * Function to call when trying to find current user data
 * @param {String} userID the google ID
 */
export const currentuser = async (userID) => {
  // TODO: need to check valid input
  const c = await currentUser(userID)
  return(c);
};

/**
 * Function to call when signing a user up
 * @param {[Object]} profileObject object of user information
 */
export const signup = async (profileObject) => {
  // TODO: need to check valid input
  await signUp(profileObject);
};

/**
 * Function to call when signing up
 * @param {String} userID the google ID
 */
export const signin = async (userID) => {
  // TODO: need to check valid input
  await signIn(userID);
};
