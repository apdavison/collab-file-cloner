import React from "react";
import PropTypes from "prop-types";
import Dialog from '@mui/material/Dialog';
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from "@mui/material/Box";
import ErrorDialog from "./ErrorDialog";

export default class ConfirmOverwrite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      loading: false,
    };

    this.handleClose = this.handleClose.bind(this);
    this.handleErrorDialogClose = this.handleErrorDialogClose.bind(this);
  }

  handleClose() {
    this.props.onClose(false);
  }

  handleErrorDialogClose() {
    this.setState({ error: false });
  }

  render() {
    // console.log(this.state);
    // console.log(this.context.collabList[0]);
    console.log(this.props.target_collab);
    if (this.state.error) {
      console.log(this.state.error);
      console.log(typeof this.state.error);
      console.log(JSON.stringify(this.state.error, null, 4));
      return (
        <ErrorDialog
          open={Boolean(this.state.error)}
          handleErrorDialogClose={this.handleErrorDialogClose}
          error={
            Array.isArray(this.state.error)
              ? this.state.error[0].msg
              : this.state.error.message || this.state.error
          }
        />
      );
    } else {
      return (
        <Dialog
          onClose={this.handleClose}
          aria-labelledby="simple-dialog-title"
          open={this.props.open}
          fullWidth={true}
          maxWidth="md"
        >
          <DialogTitle style={{ backgroundColor: "#ffd180" }}>
            <span style={{ fontWeight: "bolder", fontSize: 18 }}>
              Clone File to Collab
            </span>
          </DialogTitle>
          <DialogContent>
            <Box my={2}>
              To have edit permissions for a Collab, you must be an 'adminstrator'
              or 'editor' of that Collab. You currrently have permissions to
              edit the following Collabs on the Collaboratory.
            </Box>
            <Box my={2}>
              Please specify the destination directory in the Collab:
            </Box>
            <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
              <TextField
                label="Destination Directory In Collab ( / : root )"
                variant="outlined"
                fullWidth={true}
                name="dest_dir"
                value={this.props.dest_dir}
                onChange={this.props.handleFieldChange}
                InputProps={{
                  style: {
                      padding: "5px 15px",
                  },
                }}
              />
            </div>
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
                  width: "20%",
                  backgroundColor: "#8BC34A",
                  color: "#000000",
                  fontWeight: "bold",
                  border: "solid",
                  borderColor: "#000000",
                  borderWidth: "1px",
                }}
                onClick={this.handleClose}
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  }
}

ConfirmOverwrite.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
