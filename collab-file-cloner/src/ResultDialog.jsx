import React from "react";
import PropTypes from "prop-types";
import Dialog from '@mui/material/Dialog';
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box";
import { driveGUI, jupyterGUI } from "./globals";

export default class ResultDialog extends React.Component {
  constructor(props) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
  }

  handleClose() {
    this.props.onClose(false);
  }

  render() {
    console.log(this.props.result);
    let result = this.props.result === "success"
    return (
      <Dialog
        onClose={this.handleClose}
        aria-labelledby="simple-dialog-title"
        open={this.props.open}
        fullWidth={true}
        maxWidth="md"
      >
        <DialogTitle style={{ backgroundColor: result ? "#81C784" : "#FF8A65" }}>
          <span style={{ fontWeight: "bolder", fontSize: 18 }}>
            {
              result
              ? "Success - File Cloned!"
              : "Error - File Already Exists!"
            }
          </span>
        </DialogTitle>
        <DialogContent>
          {
            result
            ?
            <div>
              <Box my={2}>
                The file has been sucessfully cloned at the specified location.
                <br /><br />
                To open the cloned file in the <strong>Collaboratory Drive</strong>, click on 'Open Drive'.
                <br />
                To open the file in the <strong>Collaboratory's JupyterLab</strong> environment, click on 'Open JupyterLab'.
                <br /><br />
                <strong>Note:</strong> The JupyterLab environment requires, at times, a small delay 
                (10-30 seconds) before the file is accessible. During this delay, attempts to access the 
                file could throw an error saying <i>"Could not find path..."</i>. You are requested to re-attempt
                after the above mentioned delay in such cases.
              </Box>
            </div>
            :
            <div>
              <Box my={2}>
                A file with the same name already exists at the destination, 
                and therefore the source file could not be cloned!
                <br />
                To overwrite this file, click <strong>Close</strong> below, 
                set <strong>overwrite</strong> to <strong>Yes</strong> on the main page and redo this request.
                <br />Alternatively, you can also specify a different <strong>destination file name</strong>.
                <br /><br />
                To open the <strong>existing file</strong> in the <strong>Collaboratory Drive</strong>, click on 'Open Drive'.
                <br />
                To open the <strong>existing file</strong> in the <strong>Collaboratory's JupyterLab</strong> environment, 
                click on 'Open JupyterLab'. 
              </Box>
            </div>
          }
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              paddingLeft: "2.5%",
              paddingRight: "2.5%",
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              style={{
                width: "22%",
                backgroundColor: "#00A595",
                color: "#000000",
                fontWeight: "bold",
                border: "solid",
                borderColor: "#000000",
                borderWidth: "1px",
              }}
              onClick={(e) => {
                  e.preventDefault();
                  window.open(driveGUI + this.props.collab_id + "/file" + this.props.dest_file, "_blank")
                }}
            >
              Open Drive
            </Button>
            <Button
              variant="contained"
              color="primary"
              style={{
                width: "22%",
                backgroundColor: "#4DC26D",
                color: "#000000",
                fontWeight: "bold",
                border: "solid",
                borderColor: "#000000",
                borderWidth: "1px",
              }}
              onClick={(e) => {
                e.preventDefault();
                window.open(jupyterGUI + this.props.collab_name + this.props.dest_file, "_blank")
              }}
            >
              Open JupyterLab
            </Button>
            <Button
              variant="contained"
              color="primary"
              style={{
                width: "22%",
                backgroundColor: "#9CE142",
                color: "#000000",
                fontWeight: "bold",
                border: "solid",
                borderColor: "#000000",
                borderWidth: "1px",
              }}
              onClick={this.handleClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}

ResultDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
