import React from "react";
import './App.css';

import ContextMain from "./ContextMain";
import LoadingIndicatorModal from "./LoadingIndicatorModal";
import ErrorDialog from "./ErrorDialog";
import LoadCollabs from "./LoadCollabs";
import SwitchMultiWay from "./SwitchMultiWay";
import ResultDialog from "./ResultDialog";
import { baseUrl, driveAPI_v2, driveGUI, jupyterGUI, corsProxy } from "./globals";
// import { baseUrl, driveAPI_v2, driveAPI_v2 } from "./globals";

import axios from "axios";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

class App extends React.Component {
  signal = axios.CancelToken.source();
  static contextType = ContextMain;

  constructor(props, context) {
    super(props, context);

    this.state = {
      collabListOpen: false,
      resultDialogOpen: false,
      token: props.token || null,
      error: null,
      loading: false,
      loadFile: false,
      source_file: "",
      source_file_obj: null,
      collab_id: null,
      collab_lab_name: null,
      dest_collab: "",
      dest_dir: "/",
      dest_filename: "",
      file_overwrite: false,
      auto_run: false,
      open_drive: false,
      open_lab: false
    };

    this.loadFileRef = React.createRef();
    this.handleFieldChange = this.handleFieldChange.bind(this);
    this.handleOverwriteChange = this.handleOverwriteChange.bind(this);
    this.handleErrorDialogClose = this.handleErrorDialogClose.bind(this);
    this.handleResultDialogClose = this.handleResultDialogClose.bind(this);
    this.browseFile = this.browseFile.bind(this);
    this.cancelBrowseFile = this.cancelBrowseFile.bind(this);
    this.onFileSelect = this.onFileSelect.bind(this);
    this.getCollabList = this.getCollabList.bind(this);
    this.handleLoadCollabsClose = this.handleLoadCollabsClose.bind(this);
    this.cloneFile = this.cloneFile.bind(this);
    this.formatDriveUrl = this.formatDriveUrl.bind(this);
    this.getDriveFileName = this.getDriveFileName.bind(this);
  }

  async componentDidMount() {
    // console.log("Token: ", this.props.token);
    const [, setTokenContext] = this.context.token;
    setTokenContext(this.props.token);

    if (window.location.hash) {
      var hash = window.location.hash.substr(1);
      var params = hash.split('&').reduce(function (res, item) {
        var parts = item.split('=');
        res[parts[0]] = parts.slice(1).join("=");
        return res;
      }, {});

      function setBoolean(param) {
        // valid values = yes / true / no / false - case insensitive
        if (param && (param.toLowerCase() === "true" || param.toLowerCase() === "yes")) {
          return true;
        } else {
          return false;
        }
      }

      console.log(params)

      // new feature: handle multiple source file URLs
      let soure_items = params["source_file"].split(',').map(x => x.trim());
      soure_items.forEach((item, index) => {
        soure_items[index] = this.formatDriveUrl(item);
      });
      params["source_file"] = soure_items.join();
      // single source file: params["source_file"] = this.formatDriveUrl(params["source_file"]);

      if (!params["dest_filename"] && params["source_file"]) {
        if (params["source_file"].includes("drive.ebrains.eu") && params["source_file"].endsWith("?dl=1")) {
          // new feature: handle multiple source file URLs
          let dest_items_names = []; 
          soure_items.forEach(async (item, index) => {
            dest_items_names.push(await this.getDriveFileName(item.split("?dl=1")[0]));
          });
          params["dest_filename"] = dest_items_names.join();
          // single source file: params["dest_filename"] = await this.getDriveFileName(params["source_file"].split("?dl=1")[0]);
        } else {
          params["dest_filename"] = params["source_file"].split("/").pop().split("?")[0];
        }
      }

      this.setState({
        source_file: params["source_file"] || "",
        dest_collab: params["dest_collab"] || null,
        dest_dir: params["dest_dir"] || "/",
        dest_filename: params["dest_filename"] || null,
        file_overwrite: setBoolean(params["file_overwrite"]),
        auto_run: setBoolean(params["auto_run"]),
        open_drive: setBoolean(params["open_drive"]),
        open_lab: setBoolean(params["open_lab"]),
      }, () => {
        if (this.state.auto_run) {
          this.cloneFile("query");
        }
      });
    }
  }

  formatDriveUrl(url) {
    if (url.includes("drive.ebrains.eu")) {
      // handle Drive download URLs; direct download should have suffix /?dl=1
      if (!url.endsWith("/?dl=1")) {
        url = url.endsWith("/") ? url + "?dl=1" : url + "/?dl=1";
      }
    }
    return url;
  }

  async getDriveFileName(url) {
    // get file name from Drive download link of file
    let fileName = null;
    await axios
      .get(corsProxy + url)
      .then((res) => {
        if (res.status === 200) {
          const parser = new DOMParser();
          const document = parser.parseFromString(res.data, "text/html");
          fileName = document.querySelector("meta[property='og:title']").getAttribute("content");
        }
      });
    console.log(fileName);
    return fileName;
  }

  // ------------------------------------------------

  handleFieldChange(event) {
    // console.log(event);
    const target = event.target;
    const name = target.name;
    let value = target.value;
    if (name === "dest_dir" && value[0] !== "/") {
      value = "/" + value;
    }
    if (name === "source_file") {
      // value = this.formatDriveUrl(value);
      this.setState({
        [name]: value,
        dest_filename: value.split("/").pop().split("?")[0]
      })
    } else {
      this.setState({ [name]: value })
    }
  }

  handleOverwriteChange(value) {
    // console.log(value);
    this.setState({
      file_overwrite: value === "Yes" ? true : false,
    });
  }

  handleErrorDialogClose() {
    this.setState({ error: null });
  }

  handleResultDialogClose() {
    this.setState({ resultDialogOpen: false });
  }

  browseFile() {
    this.setState({ loadFile: true }, () => {
      this.loadFileRef.current.click();
    });
  }

  cancelBrowseFile() {
    this.loadFileRef.current.value = "";
    this.setState({
      loadFile: false
    });
  }

  onFileSelect(event) {
    // console.log(event.target.files[0]);
    this.setState({
      source_file: event.target.files[0].name,
      source_file_obj: event.target.files[0],
      dest_filename: event.target.files[0].name
    })
  }

  getCollabList(attempt = 0) {
    if (!this.context.collabList[0]) {
      this.setState({ loading: true }, () => {
        console.log("attempt: ", attempt);
        const url = baseUrl + "/projects";
        let config = {
          cancelToken: this.signal.token,
          headers: {
            Authorization: "Bearer " + this.context.token[0],
          },
        };
        axios
          .get(url, config)
          .then((res) => {
            if (res.data.length === 0 && attempt < 3) {
              // API Workaround: due to erratic API behavior
              this.getCollabList(attempt + 1);
            } else {
              let editableProjects = [];
              res.data.forEach((proj) => {
                if (proj.permissions.UPDATE) {
                  // console.log(proj);
                  editableProjects.push({ 'id': proj.project_id });
                }
              });
              editableProjects.sort();
              const [, setCollabList] = this.context.collabList;
              // console.log(editableProjects);
              setCollabList(editableProjects);
              this.setState({
                error: null,
                loading: false,
                collabListOpen: true,
              });
              // console.log(editableProjects);
              console.log(editableProjects.length);
            }
          })
          .catch((err) => {
            if (axios.isCancel(err)) {
              console.log("error: ", err.message);
            } else {
              // Something went wrong. Save the error in state and re-render.
              let error_message = "";
              try {
                error_message = err.response.data.detail;
              } catch {
                error_message = err;
              }
              this.setState({
                error: error_message,
              });
            }
            this.setState({
              loading: false,
            });
          });
      });
    } else {
      this.setState({
        error: null,
        loading: false,
        collabListOpen: true,
      });
    }
  }

  handleLoadCollabsClose() {
    this.setState({
      collabListOpen: false,
      loading: false,
    });
    window.scroll({
      top: document.body.offsetHeight,
      left: 0,
      behavior: 'smooth',
    });
  }

  cloneFile(workflow = "gui") {
    console.log("Clone File!");

    // ***** Basic checks ***** 
    if (!this.state.source_file) {
      this.setState({
        error: "Source file has not been specified!",
      });
      return
    }
    if (!this.state.dest_collab) {
      if (workflow !== "gui") {
        // workflow = query
        this.getCollabList()
        // this.setState({
        //   error: null,
        //   loading: false,
        //   collabListOpen: true,
        // });
      } else {
        this.setState({
          error: "Target Collab has not been specified!",
        });
      }
      return
    }
    if (!this.state.dest_dir) {
      this.setState({
        dest_dir: "/",
      });
      return
    }
    if (!this.state.dest_filename) {
      this.setState({
        error: "Destination filename has not been specified!",
      });
      return
    }

    // ***** Helper Functions ***** 

    let config = {
      cancelToken: this.signal.token,
      headers: {
        Authorization: "Bearer " + this.context.token[0],
      },
    };

    // ------------------------------------------------

    const getCollabID = async (config, dest_collab) => {
      // to get repo ID for use in other API calls
      // only retrieving those with edit privileges
      console.log("Get Collab listing");
      let url = driveAPI_v2 + "repos/";
      let match_collab = null;
      await axios
        .get(url, config)
        .then((res) => {
          // console.log(res);
          for (let item of res.data) {
            // console.log(item);
            if (item.hasOwnProperty("owner")
              && (item["owner"] === "collab-" + dest_collab + "-administrator"
                || item["owner"] === "collab-" + dest_collab + "-editor")) {
              match_collab = item;
              break;
            }
          }

        });
      console.log(match_collab);
      // returns null if no suitable Collab found
      return [match_collab["id"] || match_collab, match_collab["name"] || match_collab];
    }

    // ------------------------------------------------

    // const checkDirExists = async(config, repo_id, dir_path) => {
    //   // check if the specified directory exists
    //   console.log("Checking if directory exists");
    //   if (dir_path === "/") {
    //     return true;
    //   }
    //   let url = driveAPI_v2 + `repos/${repo_id}/dir/detail/?path=${dir_path}`;
    //   await axios
    //   .get(url, config)
    //   .then((res) => {
    //     console.log(`Directory: ${dir_path} exists!`);
    //     console.log(res);
    //     return true
    //   })
    //   .catch((err) => {
    //     if (err.response.status === 404) {
    //       // indicates directory not found
    //       return false
    //     }
    //     return err;
    //   });
    // }

    // ------------------------------------------------

    // const createDir = async(config, repo_id, dir_path) => {
    //   // create directory
    //   console.log("Creating directory");
    //   var data = new FormData();
    //   data.append('operation', 'mkdir');
    //   let url = driveAPI_v2 + `repos/${repo_id}/dir/?p=${dir_path}`
    //   await axios
    //   .post(url, data, config)
    //   .then((res) => {
    //     console.log(`Directory: ${dir_path} created!`);
    //   })
    // }

    // ------------------------------------------------

    // const createDestDir = async(config, repo_id, dest_dir_path) => {
    //   // create the destination directory
    //   console.log("Creating the destination directory");
    //   for(var i = 2; i <= dest_dir_path.split("/").slice(1).length+1; i++){
    //     let req_dir = "/"+dest_dir_path.split("/").slice(1,i).join("/");
    //     if (!(await checkDirExists(config, repo_id, req_dir))) {
    //       await createDir(config, repo_id, req_dir)
    //     }
    //   }
    // }

    // ------------------------------------------------

    const checkFileExists = async (config, repo_id, file_path) => {
      // check if the specified file exists
      console.log("Checking if file exists");
      let url = driveAPI_v2 + `repos/${repo_id}/file/detail/?p=${file_path}`;
      let status = null;
      await axios
        .get(url, config)
        .then((res) => {
          console.log(`File: ${file_path} exists!`);
          // console.log(res);
          status = true;
        })
        .catch((err) => {
          if (err.response.status === 404) {
            // indicates file not found
            status = false;
          }
        });
      return status;
    }

    // ------------------------------------------------

    const getUploadLink = async (config, repo_id) => {
      // get upload link for uploading file
      console.log("Getting upload link");
      let url = driveAPI_v2 + `repos/${repo_id}/upload-link/?p=${"/"}`;
      let upload_link = null;
      await axios
        .get(url, config)
        .then((res) => {
          upload_link = res.data
          console.log(`Upload link received: ${upload_link}`);
        });
      return upload_link;
    }

    // ------------------------------------------------

    // const readUploadedFileAsText = (inputFile) => {
    //   // return contents of file object
    //   const temporaryFileReader = new FileReader();

    //   return new Promise((resolve, reject) => {
    //     temporaryFileReader.onerror = () => {
    //       temporaryFileReader.abort();
    //       reject(new DOMException("Problem parsing input file."));
    //     };

    //     temporaryFileReader.onload = () => {
    //       resolve(temporaryFileReader.result);
    //     };
    //     temporaryFileReader.readAsText(inputFile);
    //   });
    // };

    // ------------------------------------------------

    const getFileFromUrl = async (url, name, defaultType = 'image/jpeg') => {
      // read data from file at URL and return file object
      const response = await fetch(corsProxy + url);
      const data = await response.blob();
      return new File([data], name, {
        type: data.type || defaultType,
      });
    }

    // ------------------------------------------------

    const uploadFile = async (config, repo_id, dest_dir_path, dest_filename, source_file, source_file_obj, file_overwrite) => 
    {
      // new feature: handle multiple source file URLs
      let soure_items = source_file.split(',').map(x => x.trim());
      let dest_items_names = dest_filename.split(',').map(x => x.trim());
      let result = null;

      soure_items.forEach(async (src_item, index) => {
        // for each file, get upload link and then upload file
        try {
          const upload_link = await getUploadLink(config, repo_id)
          var file_obj = null;
          if (source_file_obj && source_file_obj.name === src_item) {
            // source file is local file
            console.log("Source file: Local File");
            file_obj = source_file_obj;
          } else {
            // source file is at URL
            console.log("Source file: URL");
            file_obj = await getFileFromUrl(src_item, dest_items_names[index]);
          }

          // rename the file if demanded
          let file_obj_new = null;
          if (src_item.split("/").pop() !== dest_items_names[index]) {
            console.log("Setting new file name");
            file_obj_new = new File([file_obj], dest_items_names[index], { type: file_obj.type });
          }

          var data = new FormData();
          data.append('file', file_obj_new ? file_obj_new : file_obj);
          data.append('parent_dir', "/");
          data.append('relative_path', dest_dir_path.slice(1));
          data.append('replace', file_overwrite ? '1' : '0');
          await axios
            .post(upload_link + "?ret-json=1", data)
            .then((res) => {
              // console.log(res);
              result = "success"
            });
        } catch (e) {
          console.warn(e.message);
          result = e.message;
        }
        if (result != "success") {
          return result;
        }
      });
      return result;
    }

    // ------------------------------------------------

    // const renameFile = async(config, repo_id, dest_dir_path, dest_filename) => {
    //   // rename a file in the Collab storage
    //   console.log("Renaming file in Collab storage");
    //   let url = driveAPI_v2`_1 + `repos/${repo_id}/file/?p=${dest_dir_path + "/" + this.state.source_file.split("/").pop()}`;
    //   var data = new FormData();
    //   data.append('operation', 'rename');
    //   data.append('newname', dest_filename);
    //   await axios
    //   .post(url, data, config)
    //   .then((res) => {
    //     console.log(`File renamed!`);
    //   });
    // }

    // ------------------------------------------------

    this.setState({
      loading: true,
    }, async () => {
      try {
        // get list of all Collabs
        const [collab_id, collab_lab_name] = await getCollabID(config, this.state.dest_collab);
        // console.log(collab_id);
        // console.log(collab_lab_name);
        if (!collab_id) {
          throw new Error("Specified Collab does not exist or is inaccessible!");
        }

        let result = null;
        if (!this.state.file_overwrite) {
          // if overwrite not set, then check if a file already exists at destination
          let file_exists = null;
          let dest_items_names = this.state.dest_filename.split(',').map(x => x.trim());
          for (item in dest_items_names) {
            file_exists = await checkFileExists(config, collab_id, this.state.dest_dir + "/" + item);
            if (file_exists) {
              result = "overwrite";
              break;
            }
          }
        }

        if (result === null) {
          // check and create destination directory in selected Collab
          // NOT REQUIRED - using 'relative_path' attribute of upload file
          // see: https://download.seafile.com/published/web-api/v2.1/file-upload.md
          // await createDestDir(config, collab_id, this.state.dest_dir);

          // get upload link and upload file
          result = await uploadFile(config,
            collab_id,
            this.state.dest_dir,
            this.state.dest_filename,
            this.state.source_file,
            this.state.source_file_obj,
            this.state.file_overwrite);
          console.log(result);
        }

        if (result !== "success" && result !== "overwrite") {
          throw new Error(result);
        }

        if (result === "success" && this.state.open_drive) {
          window.location.href = driveGUI + collab_id + "/file" + this.state.dest_dir + "/" + this.state.dest_filename;
        }

        if (result === "success" && this.state.open_lab) {
          window.location.href = jupyterGUI + collab_lab_name + this.state.dest_dir + "/" + this.state.dest_filename;
        }

        this.setState({
          collab_id: collab_id,
          collab_lab_name: collab_lab_name,
          resultDialogOpen: result,
        })

        // rename file at destination
        // NOT REQUIRED - changing file name in local memory before upload above
        // if (this.state.source_file.split("/").pop() !== this.state.dest_filename) {
        //   result = await renameFile(config, collab_id, this.state.dest_dir, this.state.dest_filename)
        // }
      } catch (err) {
        console.log("Error!");
        if (axios.isCancel(err)) {
          console.log("error: ", err.message);
        } else {
          // Something went wrong. Save the error in state and re-render.
          let error_message = "";
          try {
            error_message = err.response.data.detail;
          } catch {
            error_message = err;
          }
          this.setState({
            error: error_message,
          });
        }
        this.setState({
          loading: false,
        });
      } finally {
        this.setState({
          loading: false,
        });
      }
    });
  }

  render() {
    console.log(this.state);
    var collabListContent = "";
    if (this.state.collabListOpen) {
      collabListContent = (
        <LoadCollabs
          open={this.state.collabListOpen}
          onClose={this.handleLoadCollabsClose}
          dest_dir={this.state.dest_dir}
          dest_collab={this.state.dest_collab}
          handleFieldChange={this.handleFieldChange}
        />
      );
    }

    var errorModal = "";
    if (this.state.error) {
      errorModal = (
        <ErrorDialog
          open={Boolean(this.state.error)}
          handleErrorDialogClose={this.handleErrorDialogClose}
          error={this.state.error}
        />
      );
    }

    var fileExplorer = "";
    if (this.state.loadFile) {
      fileExplorer = (
        <input
          id="fileInput"
          type="file"
          ref={this.loadFileRef}
          style={{ display: "none" }}
          onChange={this.onFileSelect}
        />
      );
    }

    var resultDialog = "";
    if (this.state.resultDialogOpen) {
      resultDialog = (
        <ResultDialog
          open={Boolean(this.state.resultDialogOpen)}
          result={this.state.resultDialogOpen}
          onClose={this.handleResultDialogClose}
          collab_name={this.state.collab_lab_name}
          collab_id={this.state.collab_id}
          dest_file={this.state.dest_dir + "/" + this.state.dest_filename}
        />
      );
    }

    return (
      <div className="container" style={{ textAlign: "left", width: "80%", maxWidth: "850px" }}>
        <LoadingIndicatorModal open={this.state.loading} />
        <div className="box rounded centered"
          style={{ marginTop: "25px", paddingTop: "0.25em", paddingBottom: "0.25em", marginBottom: "1em" }}>
          <div style={{ display: "flex" }}>
            <div style={{ flex: 1, textAlign: "center", paddingLeft: "25px", alignSelf: "center" }}>
              <a href="https://ebrains.eu/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textAlign: "center" }}
              >
                <img
                  src="./imgs/General_logo_Landscape_White.svg"
                  alt="EBRAINS logo"
                  style={{ height: "70px", cursor: "pointer" }}
                />
              </a>
            </div>
          </div>
        </div>
        <div
          style={{
            paddingLeft: "5%",
            paddingRight: "5%",
            textAlign: "justify",
            fontSize: 16,
            lineHeight: 1.75,
            paddingBottom: "20px",
          }}
        >
          <div className="title-solid-style" style={{ fontSize: 44 }}>Collab File Cloner</div>
          <div className="title-solid-style" style={{ fontSize: 32, color: "#00A595" }}>Simple tool for copying files to Collab Drive</div>
        </div>
        <div style={{ marginBottom: "40px", }}>
          <div className="rainbow-row">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <div
          style={{
            paddingLeft: "5%",
            paddingRight: "5%",
            textAlign: "justify",
          }}
        >
          This tool will allow you to clone a file into Collab storage.
          The destination can be the storage associated with any Collab
          where you have write privileges. The tool can be used either
          via manually loading the file below, or via specifying query
          parameters (see below for more details).
        </div>
        <br />
        <div
          style={{
            paddingLeft: "2.5%",
            paddingRight: "2.5%",
            textAlign: "justify",
          }}
        >
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{
                backgroundColor: "#DCEDC8"
              }}
            >
              <strong>Usage via URL query parameters</strong>&nbsp;- click for more info
            </AccordionSummary>
            <AccordionDetails>
              <div style={{ paddingTop: "10px" }}><strong>Base URL:</strong> <code>https://collab-file-cloner.netlify.app/</code></div>
              <br />
              <strong>Query parameters:</strong>
              <table>
                <colgroup>
                  <col style={{ width: "175px" }} />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <td><code>source_file</code></td>
                    <td>URL of source file (e.g. <code>http://website.com/sample.ipynb</code>)</td>
                  </tr>
                  <tr>
                    <td><code>dest_collab</code></td>
                    <td>
                      Path of destination Collab
                      <br />e.g. for Collab at https://wiki.ebrains.eu/bin/view/Collabs/shailesh-testing/ <br />
                      just specify '<code>shailesh-testing</code>'
                      <br />If not specified, and <code>auto_run</code> parameter (see below) set to <code>true/yes</code>,
                      the app will open with the Collab selection panel.
                    </td>
                  </tr>
                  <tr>
                    <td><code>dest_dir</code></td>
                    <td>
                      Directory path in destination Collab where file is to be created specified.
                      <br />Should start with '/', e.g. <code>/dir1/dir1_2</code>
                      <br />Optional parameter. Default value = <code>/</code> (root directory)
                    </td>
                  </tr>
                  <tr>
                    <td><code>dest_filename</code></td>
                    <td>
                      Indicate the file name (with extension) to be used for the cloned file at the destination.
                      <br />Optional parameter. As default it would retain the original file name with extension.
                    </td>
                  </tr>
                  <tr>
                    <td><code>file_overwrite</code></td>
                    <td>
                      Indicate if the file is to be overwritten if one already exists at specified destination.
                      <br />Valid values = <code>yes</code> / <code>no</code> / <code>true</code> / <code>false</code>
                      <br />Optional parameter. Default value = <code>false</code> (i.e. do not overwrite)
                    </td>
                  </tr>
                  <tr>
                    <td><code>auto_run</code></td>
                    <td>
                      Indicate if the app should auto launch the cloning process if all mandatory fields are specified,&nbsp;
                      i.e. <code>source_file</code> and <code>dest_collab</code>.
                      <br />Valid values = <code>yes</code> / <code>no</code> / <code>true</code> / <code>false</code>
                      <br />Optional parameter. Default value = <code>false</code> (i.e. will not run automatically, and requires
                      user to click on 'Clone File' button to launch cloning process)
                    </td>
                  </tr>
                  <tr>
                    <td><code>open_drive</code></td>
                    <td>
                      Indicate if user should be redirected to the cloned file in Collaboratory drive,&nbsp;
                      <strong>if cloning is successful</strong>.
                      <br />Valid values = <code>yes</code> / <code>no</code> / <code>true</code> / <code>false</code>
                      <br />Optional parameter. Default value = <code>false</code> (i.e. no redirection)
                    </td>
                  </tr>
                  <tr>
                    <td><code>open_lab</code></td>
                    <td>
                      Indicate if user should be redirected to the cloned file in Collaboratory's JupyterLab,&nbsp;
                      <strong>if cloning is successful</strong>.
                      <br />Valid values = <code>yes</code> / <code>no</code> / <code>true</code> / <code>false</code>
                      <br />Optional parameter. Default value = <code>false</code> (i.e. no redirection)
                      <br /><strong>Note: </strong><code>open_drive</code> takes priority. So if both set to yes/true,&nbsp;
                      <code>open_lab</code> would be ignored.
                    </td>
                  </tr>
                </tbody>
              </table>
              <br />
              <strong>Example usage:</strong><br />
              <div style={{
                paddingTop: "10px",
                paddingBottom: "20px",
                overflow: "auto",
                whiteSpace: "nowrap"
              }}>
                <span style={{ fontFamily: "monospace" }}>
                  <span style={{ fontWeight: "bolder" }}>https://collab-file-cloner.netlify.app/</span>
                  <span style={{ color: "red" }}>#</span>
                  <span style={{ color: "darkgreen" }}>
                    <span style={{ fontWeight: "bolder" }}>source_file</span>
                    =http://website.com/sample.ipynb
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkblue" }}>
                    <span style={{ fontWeight: "bolder" }}>dest_collab</span>
                    =my-test-collab
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkgreen" }}>
                    <span style={{ fontWeight: "bolder" }}>dest_dir</span>
                    =/dir1/dir1_2
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkblue" }}>
                    <span style={{ fontWeight: "bolder" }}>dest_filename</span>
                    =sample_new.ipynb
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkgreen" }}>
                    <span style={{ fontWeight: "bolder" }}>file_overwrite</span>
                    =yes
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkblue" }}>
                    <span style={{ fontWeight: "bolder" }}>auto_run</span>
                    =yes
                  </span>
                  <span style={{ color: "red" }}>&</span>
                  <span style={{ color: "darkgreen" }}>
                    <span style={{ fontWeight: "bolder" }}>open_drive</span>
                    =yes
                  </span>
                </span>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
        <br />
        <div
          style={{
            paddingLeft: "2.5%",
            paddingRight: "2.5%",
            textAlign: "justify",
          }}
        >
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
              sx={{
                backgroundColor: "#DCEDC8"
              }}
            >
              <strong>Cloning files from Collab storage</strong>&nbsp;- click for more info
            </AccordionSummary>
            <AccordionDetails>
              <div style={{ paddingTop: "10px" }}>
                Both Collab <strong>Drive</strong> & <strong>Lab</strong> offer a "Download Link" for individual files.
                It should be noted that the <strong>Lab</strong> generated download link <u>does not</u> allow non-members
                of the associated Collab to download the file. You are therefore required to use the download link
                obtained via the Collab <strong>Drive</strong>! This can be obtained, for example, as follows:
                <br />
                <img
                  className="ebrains-icon-small"
                  src="./imgs/collab_download_link.gif"
                  alt="Get Collab Drive file download link"
                  width="100%"
                  style={{ width: "100%", paddingTop: "10px", paddingBottom: "10px" }}
                />
                <br />
                The app will try to auto-retrieve the name of the file corresponding to the Collab Drive download link,
                and set this as the destination file name.
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "10px"
          }}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#4DC26D",
              color: "#000000",
              fontWeight: "bold",
              border: "solid",
              borderColor: "#000000",
              borderWidth: "1px",
            }}
            onClick={this.browseFile}
          >
            Browse File
          </Button>
        </div>
        <br />
        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <TextField
            label="Source File (specify URL or browse for local file)"
            variant="outlined"
            fullWidth={true}
            name="source_file"
            value={this.state.source_file}
            onChange={this.handleFieldChange}
            InputProps={{
              style: {
                padding: "5px 15px",
              },
            }}
          />
        </div>
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "10px"
          }}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#4DC26D",
              color: "#000000",
              fontWeight: "bold",
              border: "solid",
              borderColor: "#000000",
              borderWidth: "1px",
            }}
            onClick={this.getCollabList}
          >
            Choose Collab
          </Button>
        </div>
        <br />
        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <TextField
            // disabled
            label="Destination Collab"
            variant="outlined"
            fullWidth={true}
            name="dest_collab"
            value={this.state.dest_collab || ""}
            onChange={this.handleFieldChange}
            InputProps={{
              style: {
                padding: "5px 15px",
              },
            }}
          />
        </div>
        <br />
        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <TextField
            // disabled
            label="Destination Directory In Collab ( / : root )"
            variant="outlined"
            fullWidth={true}
            name="dest_dir"
            value={this.state.dest_dir}
            onChange={this.handleFieldChange}
            InputProps={{
              style: {
                padding: "5px 15px",
              },
            }}
          />
        </div>
        <br />
        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <TextField
            // disabled
            label="Destination File Name"
            variant="outlined"
            fullWidth={true}
            name="dest_filename"
            value={this.state.dest_filename}
            onChange={this.handleFieldChange}
            InputProps={{
              style: {
                padding: "5px 15px",
              },
            }}
          />
        </div>
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px"
          }}
        >
          Overwrite file if already exists at destination?
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "5px"
          }}
        >
          <form style={{ paddingTop: "5px", paddingBottom: "5px" }}>
            <SwitchMultiWay
              values={["Yes", "No"]}
              selected={
                this.state.file_overwrite
                  ? "Yes"
                  : "No"
              }
              onChange={this.handleOverwriteChange}
            />
          </form>
        </div>
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "10px"
          }}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#4DC26D",
              color: "#000000",
              fontWeight: "bold",
              border: "solid",
              borderColor: "#000000",
              borderWidth: "1px",
            }}
            onClick={this.cloneFile}
          >
            Clone File
          </Button>
        </div>
        <br />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "10px"
          }}
        >
          Please report any issues by creating a ticket&nbsp;
          <a href="https://github.com/appukuttan-shailesh/collab-file-cloner/issues/new"
            target="_blank" rel="noopener noreferrer"> here</a>.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop: "0px"
          }}
        >
          For known issues/limitations, take a look at the tickets&nbsp;
          <a href="https://github.com/appukuttan-shailesh/collab-file-cloner/issues/"
            target="_blank" rel="noopener noreferrer"> here</a>.
        </div>
        <br />
        <div className="rainbow-row">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <br />
        <br />
        {fileExplorer}
        {collabListContent}
        {resultDialog}
        {errorModal}
      </div>
    );
  }
}

export default App;