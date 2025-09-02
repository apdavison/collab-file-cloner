import React from "react";

const ContextMain = React.createContext();

const ContextMainProvider = (props) => {
  // Context state
  const [token, setToken] = React.useState({});
  const [collabList, setCollabList] = React.useState(null);

  return (
    <ContextMain.Provider
      value={{
        token: [token, setToken],
        collabList: [collabList, setCollabList],
      }}
    >
      {props.children}
    </ContextMain.Provider>
  );
};

export default ContextMain;

export { ContextMainProvider };
