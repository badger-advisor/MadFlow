import React, { useState, useEffect, useContext } from 'react';

// server
import { currentUser, getUserFlowNames } from '../utils.js';

// components
import NavBar from '../components/NavBar/NavBar';
import FlowCardGrid from '../components/DashboardPage/FlowCardGrid';
import UserProvider from '../contexts/UserProvider';

const TEST_ID = 'tempgenelee'; // TODO: connect backend to get actual userID

const Dashboard = () => {
  const [ userFlows, setUserFlows ] = useState([]);
  const [ refresh, setRefresh ] = useState(false);
  const { user, loggedIn } = useContext(UserProvider.context);
  const USER_ID = user.googleId;

  useEffect(
    async () => {
      setUserFlows(await getUserFlowNames(user.googleId));
    },
    [ refresh ]
  );

  return (
    <div>
      <NavBar user={user} refresh={refresh} setRefresh={setRefresh} />
      <FlowCardGrid
        userID={USER_ID}
        userFlows={userFlows}
        refresh={refresh}
        setRefresh={setRefresh}
      />
    </div>
  );
};

export default Dashboard;
