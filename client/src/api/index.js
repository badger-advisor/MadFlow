import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080' });

// User
const signIn = id =>
  axios({ method: 'post', url: `http://localhost:8080/user/signIn?id=${id}`, header: {} })
    .then(res => {
      const { user } = res.data;
      localStorage.setItem('google_id', id);
      return user;
    })
    .catch(error => {
      console.log(error);
      return '';
    });

const signUp = userObject =>
  axios({
    method : 'post',
    url    : `http://localhost:8080/user/signup?id=${userObject.googleId}&displayName=${userObject.name}&email=${userObject.email}&profilePicture=${userObject.imageUrl}`,
    header : {}
  })
    .then(res => {
      const { user } = res.data;
      localStorage.setItem('google_id', userObject.googleId);
      return user;
    })
    .catch(error => {
      console.log(error);
      return null;
    });

const currentUser = id =>
  axios({ method: 'post', url: `http://localhost:8080/user/signIn?id=${id}`, header: {} })
    .then(res => {
      const { user } = res.data;
      localStorage.setItem('google_id', id);
      return user;
    })
    .catch(error => {
      console.log(error);
      return '';
    });

const deleteUser = userID => API.delete(`/user/${userID}`);

// Flow
const getAllUserFlows = userID => API.get(`/flow/${userID}`);
const getUserFlow = (userID, flowID) => API.get(`/flow/${userID}/${flowID}`);
const deleteUserFlow = (userID, flowID) => API.delete(`/flow/${userID}/${flowID}`);
const createUserFlow = (userID, flow) =>
  API.post(`/flow/newFlow`, {
    googleId : userID,
    elements : [],
    name     : flow.name,
    major    : flow.major
  }).then(res => {
    console.log(res);
  });
const updateUserFlowElements = (flowID, updatedUserFlow) =>
  API.post(`/flow/updateElements`, {
    id       : flowID,
    elements : updatedUserFlow
  }).then(res => {
    console.log(res);
  });

const getPrefilledFlow = majorID => API.get(`/flow/prefilled/${majorID}`);

const updateUserFlow = (flowID, updatedUserFlow) =>
  API.post(`/flow/update`, {
    id      : flowID,
    changes : updatedUserFlow
  }).then(res => {
    console.log(res);
  });

// Course
const getCourse = courseNumber => API.get(`/course/${courseNumber}`);

export {
  signIn,
  signUp,
  currentUser,
  deleteUser,
  getAllUserFlows,
  getUserFlow,
  deleteUserFlow,
  createUserFlow,
  updateUserFlowElements,
  getPrefilledFlow,
  getCourse,
  updateUserFlow
};
