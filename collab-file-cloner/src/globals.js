// To access certain APIs that give CORS related issues
export const corsProxy = "http://corsproxy.apps.ebrains.eu/";
export const baseUrl = "https://model-validation-api.apps.ebrains.eu";
export const driveAPI_v2 = corsProxy + "https://drive.ebrains.eu/api2/"
export const driveAPI_v2_1 = corsProxy + "https://drive.ebrains.eu/api/v2.1/"
export const driveGUI = "https://drive.ebrains.eu/lib/"
export const jupyterGUI = "https://lab.ch.ebrains.eu/hub/user-redirect/lab/tree/shared/"

export const isParent = window.opener == null;
export const isIframe = window !== window.parent;
export const isFramedApp = isIframe && isParent;
export const collaboratoryOrigin = "https://wiki.ebrains.eu";
export const hashChangedTopic = "/clb/community-app/hashchange";
export const updateHash = (value) => {
  window.location.hash = value;
  if (isFramedApp) {
    window.parent.postMessage(
      {
        topic: hashChangedTopic,
        data: value,
      },
      collaboratoryOrigin
    );
  }
};
