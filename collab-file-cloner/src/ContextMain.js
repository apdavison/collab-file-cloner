import React from "react";

const ContextMain = React.createContext();

const ContextMainProvider = (props) => {
  // Context state
  const [auth, setAuth] = React.useState({});
  const [collabList, setCollabList] = React.useState(null);

  return (
    <ContextMain.Provider
      value={{
        auth: [auth, setAuth],
        collabList: [collabList, setCollabList],
      }}
    >
      {props.children}
    </ContextMain.Provider>
  );
};

export default ContextMain;

export { ContextMainProvider };
