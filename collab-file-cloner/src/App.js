import React from "react";
import './App.css';

import ContextMain from "./ContextMain";
import LoadingIndicatorModal from "./LoadingIndicatorModal";
import ErrorDialog from "./ErrorDialog";
import LoadCollabs from "./LoadCollabs";
import SwitchMultiWay from "./SwitchMultiWay";
import ResultDialog from "./ResultDialog";
import { baseUrl, driveAPI_v2 } from "./globals";
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
      auth: props.auth || null,
      error: null,
      loading: false,
      loadFile: false,
      source_file: "https://brian2.readthedocs.io/en/stable/_downloads/d7b13492f17ebfd4a976a5406d818bae/1-intro-to-brian-neurons.ipynb",
      source_file_obj: null,
      collab_id: null,
      collab_lab_name: null,
      dest_collab: null,
      dest_dir: "/",
      dest_filename: null,
      file_overwrite: false
    };

    this.loadFileRef = React.createRef();
    this.handleURLRequest = this.handleURLRequest.bind(this);
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
  }

  componentDidMount() {
    console.log("Token: ", this.props.auth.token);
    const [, setAuthContext] = this.context.auth;
    setAuthContext(this.props.auth);

    if (window.location.hash) {
      var hash = window.location.hash.substr(1);
      var params = hash.split('&').reduce(function (res, item) {
          var parts = item.split('=');
          res[parts[0]] = parts[1];
          return res;
      }, {});

      console.log(params["source_file"]);
      console.log(params["dest_collab"]);
      console.log(params["dest_dir"]);
      console.log(params["dest_filename"]);
      console.log(params["file_overwrite"]);
      this.setState({
        source_file: params["source_file"] || "",
        dest_collab: params["dest_collab"] || null,
        dest_dir: params["dest_dir"] || "/",
        dest_filename: params["dest_filename"] || params["source_file"].split("/").pop() || null,
        file_overwrite: params["file_overwrite"].toLowerCase() === "true" || params["file_overwrite"].toLowerCase() === "yes" || false,
      }, () => {
        this.handleURLRequest();
      })
    }
  }

  handleURLRequest() {
    console.log(this.state.source_file);
    console.log(this.state.dest_collab);
    console.log(this.state.dest_dir);
    console.log(this.state.dest_filename);
    console.log(this.state.file_overwrite);
  }

  handleFieldChange(event) {
    console.log(event);
    const target = event.target;
    const name = target.name;
    let value = target.value;
    if(name === "dest_dir" && value[0]!=="/") {
      value = "/" + value
    }
    if (name === "source_file") {
      this.setState({
        [name]: value,
        dest_filename: value.split("/").pop()
      })
    } else {
      this.setState({[name]: value})
    }
  }

  handleOverwriteChange(value) {
    console.log(value);
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
    console.log(event.target.files[0]);
    this.setState({
      source_file: event.target.files[0].name,
      source_file_obj: event.target.files[0],
      dest_filename: event.target.files[0].name
    })
  }

  getCollabList(attempt = 0) {
    if(!this.context.collabList[0]) {
      this.setState({ loading: true }, () => {
        console.log("attempt: ", attempt);
        const url = baseUrl + "/projects";
        let config = {
          cancelToken: this.signal.token,
          headers: {
            Authorization: "Bearer " + this.context.auth[0].token,
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
                  editableProjects.push({'collab_path': proj.project_id});
                }
              });
              editableProjects.sort();
              const [, setCollabList] = this.context.collabList;
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
  }

  cloneFile() {
    console.log("Clone File!");

    // ***** Basic checks ***** 
    if (!this.state.source_file) {
      this.setState({
        error: "Source file has not been specified!",
      });
      return
    }
    if (!this.state.dest_collab) {
      this.setState({
        error: "Target Collab has not been specified!",
      });
      return
    }
    if (!this.state.dest_dir) {
      this.setState({
        dest_dir: "/",
      });
      return
    }
    // if (!this.state.dest_filename) {
    //   this.setState({
    //     error: "Destination filename has not been specified!",
    //   });
    //   return
    // }

    // ***** Helper Functions ***** 

    let config = {
      cancelToken: this.signal.token,
      headers: {
        Authorization: "Bearer " + this.context.auth[0].token,
      },
    };

    // ------------------------------------------------

    const getCollabID = async(config, dest_collab) => {
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
          console.log(item);
          if ( item.hasOwnProperty("owner") 
              && ( item["owner"] === "collab-" + dest_collab + "-administrator"
                || item["owner"] === "collab-" + dest_collab + "-editor")) {
                  match_collab = item;
                  break;
                }
        }
        
      });
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

    // const checkFileExists = async(config, repo_id, file_path) => {
    //   // check if the specified file exists
    //   console.log("Checking if file exists");
    //   let url = driveAPI_v2 + `repos/${repo_id}/file/detail/?path=${file_path}`;
    //   await axios
    //   .get(url, config)
    //   .then((res) => {
    //     console.log(`File: ${file_path} exists!`);
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

    const getUploadLink = async(config, repo_id) => {
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

    const readUploadedFileAsText = (inputFile) => {
      // return contents of file 
      const temporaryFileReader = new FileReader();
    
      return new Promise((resolve, reject) => {
        temporaryFileReader.onerror = () => {
          temporaryFileReader.abort();
          reject(new DOMException("Problem parsing input file."));
        };
    
        temporaryFileReader.onload = () => {
          resolve(temporaryFileReader.result);
        };
        temporaryFileReader.readAsText(inputFile);
      });
    };

    // ------------------------------------------------

    const uploadFile = async(config, repo_id, dest_dir_path, dest_filename, source_file, source_file_obj, file_overwrite) => {
      // get upload link and then upload file
      const upload_link = await getUploadLink(config, repo_id)
      let result = null;

      if (source_file_obj 
          && source_file_obj.name === source_file) {
        // get contents: local file
        console.log("Source file: Local File");
        var file_obj = this.state.source_file_obj;

        // rename if the file if demanded
        let file_obj_new = null;
        if (source_file.split("/").pop() !== dest_filename) {
          console.log("Setting new file name");
          file_obj_new = new File([file_obj], dest_filename, {type: file_obj.type});
        }

        try {
          const fileContents = await readUploadedFileAsText(source_file_obj)  
          console.log(fileContents);
          var data = new FormData();
          data.append('file', file_obj_new ? file_obj_new : file_obj);
          data.append('parent_dir', "/");
          data.append('relative_path', dest_dir_path.slice(1));
          data.append('replace', '0');
          await axios
          .post(upload_link+"?ret-json=1", data)
          .then((res) => {
            console.log(res);
            result = "success"
          });
        } catch (e) {
          console.warn(e.message)
        }
      } else {
        console.log("Source file: URL");
      }
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
        if (!collab_id) {
          throw new Error("Specified Collab does not exist or is inaccessible!");  
        }

        // check and create destination directory in selected Collab
        // NOT REQUIRED - using 'relative_path' attribute of upload file
        // see: https://download.seafile.com/published/web-api/v2.1/file-upload.md
        // await createDestDir(config, collab_id, this.state.dest_dir);

        // get upload link and upload file
        let result = await uploadFile(config, 
                                      collab_id, 
                                      this.state.dest_dir, 
                                      this.state.dest_filename,
                                      this.state.source_file, 
                                      this.state.source_file_obj,
                                      this.state.file_overwrite);
        console.log(result);

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
        <br/>
        <br/>
        <div className="box rounded centered"
          style={{ marginTop: "5px", paddingTop: "0.75em", paddingBottom: "0.75em" }}>
          <a
            href="https://ebrains.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="waves-effect waves-light"
            style={{ textAlign: "center", color: "black" }}
          >
            <table>
              <tbody>
                <tr>
                  <td
                    style={{ paddingTop: "0px",
                             paddingBottom: "0px" }}>
                    <img
                      className="ebrains-icon-small"
                      src="./imgs/ebrains_logo.svg"
                      alt="EBRAINS logo"
                      style={{ height: "60px" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </a>
          <h5 className="title-style">Collab File Cloner</h5>
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
          where you have write privileges.
          <br/><br/>
          The tool can be used either via manually loading the file below,
          or via specifying query parameters (see below for more details).
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
                backgroundColor: "#fff8e1"
              }}
            >
              <strong>Usage via URL query parameters</strong>&nbsp;- (click for more info)
            </AccordionSummary>
            <AccordionDetails>              
              <div style={{paddingTop:"10px"}}><strong>Base URL:</strong> <code>https://collab-file-cloner.netlify.app/</code></div>
              <br />
              <strong>Query parameters:</strong>
              <table>
                <colgroup>
                  <col style={{ width:"175px"}} />
                  <col />
                </colgroup>  
                <tr>
                  <td><code>source_file</code></td>
                  <td>URL of source file (e.g. <code>http://website.com/sample.ipynb</code>)</td>
                </tr>
                <tr>
                  <td><code>dest_collab</code></td>
                  <td>
                    Path of target Collab
                    <br />e.g. for Collab at https://wiki.ebrains.eu/bin/view/Collabs/shailesh-testing/ <br />just specify '<code>shailesh-testing</code>'</td>
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
              </table>
              <br />
              <strong>Example usage:</strong><br />
              <div style={{paddingTop:"10px", paddingBottom: "20px"}}>
                <code>https://collab-file-cloner.netlify.app/#source_file=http://website.com/sample.ipynb&dest_collab=my-test-collab&dest_dir=/dir1/dir1_2&dest_filename=sample_new.ipynb&file_overwrite=yes</code>
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
            paddingTop:"10px"}}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#FF9800",
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
            paddingTop:"10px"}}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#FF9800",
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
            value={this.state.dest_collab || " "}
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
            label="Target File Name"
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
            paddingRight: "20px"}}
        >
          Overwrite file if already exists at destination?
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "right",
            paddingRight: "20px",
            paddingTop:"5px"}}
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
            paddingTop:"10px"}}
        >
          <Button
            variant="contained"
            color="primary"
            style={{
              width: "27.5%",
              backgroundColor: "#8BC34A",
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
